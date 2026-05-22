import nodemailer from 'nodemailer';

/**
 * Email Service
 * Sends emails using Nodemailer + SMTP
 * Configure SMTP credentials in .env
 */

// Initialize transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Verify connection on startup
transporter.verify((error: Error | null, success: boolean) => {
    if (error) {
        console.error('Email service error:', error);
    } else {
        console.log('✅ Email service ready');
    }
});

/**
 * Send plain text email
 */
export const sendEmail = async (
    to: string,
    subject: string,
    text: string,
    html?: string
): Promise<void> => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@synapse.app',
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>'),
        });

        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error);
        throw error;
    }
};

/**
 * Send collaboration invitation email
 */
export const sendCollaborationInvite = async (
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    ideaTitle: string,
    ideaId: string
): Promise<void> => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Collaboration Invitation</h2>
            <p>Hi ${recipientName},</p>
            <p><strong>${senderName}</strong> invited you to collaborate on:</p>
            <h3 style="color: #4f46e5;">${ideaTitle}</h3>
            <p>
                <a href="${process.env.APP_URL}/idea/${ideaId}" 
                   style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Collaboration Request
                </a>
            </p>
            <p>Best regards,<br>The Synapse Team</p>
        </div>
    `;

    await sendEmail(
        recipientEmail,
        `Collaboration invitation: ${ideaTitle}`,
        `${senderName} invited you to collaborate on "${ideaTitle}". Visit ${process.env.APP_URL}/idea/${ideaId} to respond.`,
        html
    );
};

/**
 * Send achievement unlock email
 */
export const sendAchievementEmail = async (
    userEmail: string,
    userName: string,
    achievementTitle: string,
    achievementIcon: string
): Promise<void> => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            <h2>🏆 Achievement Unlocked!</h2>
            <p style="font-size: 48px; margin: 20px 0;">${achievementIcon}</p>
            <h3 style="color: #4f46e5;">${achievementTitle}</h3>
            <p>Congratulations, ${userName}! You've earned a new achievement.</p>
            <p>Keep up the great work collaborating and sharing ideas on Synapse!</p>
            <p>Best regards,<br>The Synapse Team</p>
        </div>
    `;

    await sendEmail(
        userEmail,
        `Achievement Unlocked: ${achievementTitle}`,
        `Congratulations! You've unlocked the "${achievementTitle}" achievement.`,
        html
    );
};

/**
 * Send notification digest email
 */
export const sendNotificationDigest = async (
    userEmail: string,
    userName: string,
    notifications: Array<{
        title: string;
        message: string;
        link: string;
    }>
): Promise<void> => {
    const notificationHTML = notifications
        .map(
            (n) => `
        <div style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
            <h4 style="margin: 0 0 5px 0; color: #1f2937;">${n.title}</h4>
            <p style="margin: 0 0 10px 0; color: #4b5563;">${n.message}</p>
            <a href="${n.link}" style="color: #4f46e5; text-decoration: none;">View</a>
        </div>
    `
        )
        .join('');

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Synapse Notifications</h2>
            <p>Hi ${userName},</p>
            <p>Here's what's happening on Synapse:</p>
            <div style="background-color: #f9fafb; border-radius: 5px; margin: 20px 0;">
                ${notificationHTML}
            </div>
            <p>
                <a href="${process.env.APP_URL}/notifications" 
                   style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View All Notifications
                </a>
            </p>
            <p>Best regards,<br>The Synapse Team</p>
        </div>
    `;

    await sendEmail(
        userEmail,
        'Your Synapse Notifications',
        `You have ${notifications.length} new notification(s) on Synapse.`,
        html
    );
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (
    userEmail: string,
    userName: string
): Promise<void> => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Synapse! 🚀</h2>
            <p>Hi ${userName},</p>
            <p>We're excited to have you on Synapse, the collaborative innovation platform.</p>
            <h3>Get Started:</h3>
            <ul style="line-height: 1.8;">
                <li><strong>Create an Idea</strong> - Share your innovation with the community</li>
                <li><strong>Join a Collaboration</strong> - Work with others on exciting projects</li>
                <li><strong>Build Your Profile</strong> - Showcase your skills and interests</li>
                <li><strong>Connect with Collaborators</strong> - Find like-minded innovators</li>
            </ul>
            <p style="margin-top: 30px;">
                <a href="${process.env.APP_URL}/feed" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Explore Ideas
                </a>
            </p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                If you have any questions, feel free to reach out to support@synapse.app
            </p>
            <p>Best regards,<br>The Synapse Team</p>
        </div>
    `;

    await sendEmail(
        userEmail,
        'Welcome to Synapse!',
        `Welcome to Synapse, ${userName}! Start exploring and collaborating today.`,
        html
    );
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
    userEmail: string,
    resetToken: string
): Promise<void> => {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <p style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p style="color: #6b7280; font-size: 12px;">
                This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
            </p>
            <p>Best regards,<br>The Synapse Team</p>
        </div>
    `;

    await sendEmail(
        userEmail,
        'Reset Your Synapse Password',
        `Click here to reset your password: ${resetLink}`,
        html
    );
};

export default {
    sendEmail,
    sendCollaborationInvite,
    sendAchievementEmail,
    sendNotificationDigest,
    sendWelcomeEmail,
    sendPasswordResetEmail,
};
