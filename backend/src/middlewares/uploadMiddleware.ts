import multer from 'multer';

// Tipos de arquivo permitidos para upload de imagens
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Use JPEG, PNG, WebP ou GIF.`));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Máximo 5MB por arquivo
    files: 1,                   // Máximo 1 arquivo por request
  },
  fileFilter,
});
