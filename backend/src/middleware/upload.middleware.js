const multer = require('multer');

// Configure multer memory storage
const storage = multer.memoryStorage();

// Supported image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// Supported document & image MIME types for registration/documents
const ALLOWED_DOC_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

// File filter for strict image uploads
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image format (${file.mimetype}). Supported formats: JPG, JPEG, PNG, WEBP`), false);
  }
};

// File filter for member document uploads
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format (${file.mimetype}). Supported formats: JPG, JPEG, PNG, WEBP, PDF`), false);
  }
};

// Multer upload middleware for general images (5 MB limit)
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Multer upload middleware for member documents (5 MB limit)
const uploadDocument = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFileFilter
});

module.exports = {
  uploadImage,
  uploadDocument,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES
};
