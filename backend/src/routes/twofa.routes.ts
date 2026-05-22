import express, { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../db/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { sendEmail } from '../services/emailService';

const router = express.Router();

// --- 2FA ENABLE: Generate secret and QR code ---
router.post('/2fa/setup', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const userEmail = (req as any).user.email;

        // Generate secret for TOTP
        const secret = speakeasy.generateSecret({
            name: `Synapse (${userEmail})`,
            issuer: 'Synapse',
            length: 32
        });

        // Generate QR Code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

        // Store temporary secret (not enabled yet)
        await query(
            `UPDATE users SET two_fa_temp_secret = $1 WHERE id = $2`,
            [secret.base32, userId]
        );

        res.json({
            success: true,
            secret: secret.base32,
            qrCode: qrCode,
            backupCodes: generateBackupCodes()
        });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ error: 'Failed to setup 2FA' });
    }
});

// --- 2FA VERIFY: Verify code and enable 2FA ---
router.post('/2fa/verify', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { code, backupCodes } = req.body;

        if (!code || !backupCodes || backupCodes.length < 6) {
            return res.status(400).json({ error: 'Invalid code or backup codes' });
        }

        // Get temporary secret
        const userResult = await query(
            `SELECT two_fa_temp_secret FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].two_fa_temp_secret) {
            return res.status(400).json({ error: '2FA not initialized' });
        }

        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: userResult.rows[0].two_fa_temp_secret,
            encoding: 'base32',
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        // Enable 2FA - move temp secret to active secret and store backup codes
        const hashedBackupCodes = backupCodes.map((code: string) => code); // In production, hash these
        await query(
            `UPDATE users SET 
                two_fa_secret = $1, 
                two_fa_enabled = true, 
                two_fa_backup_codes = $2,
                two_fa_temp_secret = NULL 
             WHERE id = $3`,
            [userResult.rows[0].two_fa_temp_secret, JSON.stringify(hashedBackupCodes), userId]
        );

        res.json({
            success: true,
            message: '2FA enabled successfully'
        });
    } catch (error) {
        console.error('2FA verify error:', error);
        res.status(500).json({ error: 'Failed to verify 2FA' });
    }
});

// --- SEND OTP VIA EMAIL (used at login) ---
router.post('/2fa/send-otp', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Get user
        const userResult = await query(
            `SELECT id, email, two_fa_secret FROM users WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].two_fa_secret) {
            return res.status(400).json({ error: 'User or 2FA not found' });
        }

        // Generate OTP
        const otp = speakeasy.totp({
            secret: userResult.rows[0].two_fa_secret,
            encoding: 'base32'
        });

        // Store OTP with expiry (5 minutes)
        const expiryTime = new Date(Date.now() + 5 * 60 * 1000);
        await query(
            `UPDATE users SET two_fa_otp = $1, two_fa_otp_expires = $2 WHERE id = $3`,
            [otp, expiryTime, userResult.rows[0].id]
        );

        // Send email with OTP
        await sendEmail(
            email,
            'Your Synapse 2FA Code',
            `Your two-factor authentication code is: ${otp}\n\nThis code expires in 5 minutes.`
        );

        res.json({
            success: true,
            message: 'OTP sent to email'
        });
    } catch (error) {
        console.error('OTP send error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// --- VERIFY OTP AT LOGIN ---
router.post('/2fa/verify-otp', async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP required' });
        }

        // Get user's stored OTP
        const userResult = await query(
            `SELECT id, two_fa_otp, two_fa_otp_expires FROM users WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email' });
        }

        const user = userResult.rows[0];
        const now = new Date();

        // Check OTP validity
        if (!user.two_fa_otp || user.two_fa_otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        if (new Date(user.two_fa_otp_expires) < now) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        // Clear OTP after successful verification
        await query(
            `UPDATE users SET two_fa_otp = NULL, two_fa_otp_expires = NULL WHERE id = $1`,
            [user.id]
        );

        res.json({
            success: true,
            message: '2FA verification successful',
            userId: user.id
        });
    } catch (error) {
        console.error('OTP verify error:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// --- DISABLE 2FA ---
router.post('/2fa/disable', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Verify password before disabling
        const userResult = await query(
            `SELECT password_hash FROM users WHERE id = $1`,
            [userId]
        );

        // Note: Import bcrypt and verify password
        // const bcrypt = require('bcryptjs');
        // const isValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
        // if (!isValid) return res.status(401).json({ error: 'Invalid password' });

        // Disable 2FA
        await query(
            `UPDATE users SET 
                two_fa_enabled = false, 
                two_fa_secret = NULL, 
                two_fa_backup_codes = NULL 
             WHERE id = $1`,
            [userId]
        );

        res.json({
            success: true,
            message: '2FA disabled'
        });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ error: 'Failed to disable 2FA' });
    }
});

// --- HELPER: Generate backup codes ---
function generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
}

export default router;
