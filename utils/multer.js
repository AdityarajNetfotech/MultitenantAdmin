// utils/multer.js
import multer from 'multer';
import path from 'path';

// store in memory (buffer) if you want to upload directly to cloud
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept common file types; tweak as needed
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx'];
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File type not supported'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
