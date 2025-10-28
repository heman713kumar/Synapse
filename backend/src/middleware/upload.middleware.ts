import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Use process.cwd() instead of __dirname
const uploadsDir = path.resolve(process.cwd(), 'uploads');

// --- FIX 2: Add robust error handling for directory creation ---
try {
    if (!fs.existsSync(uploadsDir)) {
        console.log(`Creating uploads directory: ${uploadsDir}`);
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`✅ Created uploads directory: ${uploadsDir}`);
    }
} catch (error) {
    console.error(`❌ Failed to create uploads directory: ${error}`);
    // Terminate server startup if upload directory cannot be initialized
    throw new Error('Upload directory initialization failed');
}
// --- END FIX 2 ---

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: DestinationCallback) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// --- FIX 3: Expanded file type support ---
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
    // Image types
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Document types
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    // Other common types
    'text/plain', 
    'application/json' 
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // FIX 3: Return explicit error to the client instead of null/false
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};
// --- END FIX 3 ---

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter
});

// --- FIX 1: Placeholder R2 implementation (kept as warning) ---
export const handleR2Upload = async (file: Express.Multer.File) => {
    console.warn("R2 Upload not fully implemented. Using placeholder URL.");
    const key = file.filename;
    const bucketName = process.env.R2_BUCKET_NAME || 'synapse-files';
    // This URL construction must be updated to the actual R2 endpoint when implemented
    const url = `https://${bucketName}.<your-r2-endpoint>.r2.cloudflarestorage.com/${key}`;
    return { url, key, size: file.size };
};
// --- END FIX 1 ---