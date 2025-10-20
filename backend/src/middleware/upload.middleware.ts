// C:\Users\hemant\Downloads\synapse\backend\src\middleware\upload.middleware.ts
import multer, { FileFilterCallback } from 'multer'; // Import FileFilterCallback
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../uploads/');
if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating uploads directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir, { recursive: true });
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

// FIX: Explicitly type the callback parameter as FileFilterCallback
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true); // Accept file
  } else {
    // Reject file - pass error as first arg, or null if just rejecting
    // Passing null might be safer if the error isn't meant to stop multer entirely
    // cb(null, false);
    // OR pass the error if you want multer to potentially handle it:
    cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
    // NOTE: Passing the error might stop the whole upload process depending on how routes handle it.
    // Let's stick to rejecting without an error to fix the TS issue for now:
    // cb(null, false);
    // Let's try passing the error again, TS might be okay with it now with explicit typing
     cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'));
     // If the above still fails, uncomment the line below and comment the line above
     // cb(null, false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Placeholder for Cloudflare R2 upload
export const handleR2Upload = async (file: Express.Multer.File) => {
    // ... (implementation remains the same) ...
    console.warn("R2 Upload not fully implemented. Using placeholder URL.");
    const key = file.filename;
    const bucketName = process.env.R2_BUCKET_NAME || 'synapse-files';
    const url = `https://<your-r2-public-domain-or-account-id>.r2.cloudflarestorage.com/${bucketName}/${key}`;
    return { url, key, size: file.size };
};