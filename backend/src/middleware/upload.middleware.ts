import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Use process.cwd() instead of __dirname
const uploadsDir = path.resolve(process.cwd(), 'uploads');

// Add robust error handling for directory creation
try {
    if (!fs.existsSync(uploadsDir)) {
        console.log(`Creating uploads directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }
} catch (error) {
    console.error(`❌ Failed to create uploads directory: ${error}`);
    throw new Error('Upload directory initialization failed');
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: DestinationCallback) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Expanded file type support
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 
    'application/json' 
  ];

  if (allowedMimes.includes(file.mimetype)) {
    // File accepted (error is null, accept is true)
    cb(null, true);
  } else {
    // File rejected (error is null, accept is false to satisfy the types)
    cb(null, false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

// Placeholder R2 implementation
export const handleR2Upload = async (file: Express.Multer.File) => {
    console.warn("R2 Upload not fully implemented. Using placeholder URL.");
    const key = file.filename;
    const bucketName = process.env.R2_BUCKET_NAME || 'synapse-files';
    const url = `https://${bucketName}.<your-r2-endpoint>.r2.cloudflarestorage.com/${key}`;
    return { url, key, size: file.size };
};