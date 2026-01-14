import express, { Request, Response, NextFunction, Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { query } from '../db/database.js';

const router: Router = express.Router();

// Upload single file
router.post('/', authenticateToken, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { purpose } = req.body; // 'avatar', 'idea_image', 'document'
    const userId = req.user!.userId;

    const fileUrl = `/uploads/${req.file.filename}`;

    // Store file metadata in database if needed
    if (purpose === 'avatar') {
      await query(
        'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
        [fileUrl, userId]
      );
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        purpose
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    const errMsg = error instanceof Error ? error.message : 'File upload failed';
    res.status(500).json({ error: errMsg });
  }
});

// Upload multiple files
router.post('/multiple', authenticateToken, upload.array('files', 5), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];

    for (const file of req.files as Express.Multer.File[]) {
      const fileUrl = `/uploads/${file.filename}`;

      uploadedFiles.push({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl
      });
    }

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    const errMsg = error instanceof Error ? error.message : 'File upload failed';
    res.status(500).json({ error: errMsg });
  }
});

// Get user uploads
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This would query your uploads table if you have one
    res.json([]);
  } catch (error) {
    console.error('Get uploads error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errMsg });
  }
});

export default router;