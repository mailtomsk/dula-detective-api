import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = './public/uploads/scan';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `scan_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
    fieldNameSize: 100, 
    files: 1, 
    parts: 10,
    headerPairs: 2000,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  preservePath: false,
});

export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'File upload error', 
      details: error.message 
    });
  } else if (error) {
    return res.status(400).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
  next();
};

export default upload;
