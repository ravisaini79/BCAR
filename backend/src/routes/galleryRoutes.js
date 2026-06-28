const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
} = require('../controllers/galleryController');

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB temporary multer limit; controller enforces 500KB
});

const singleUpload = upload.single('image');

router.route('/')
  .get(optionalProtect, getGalleryItems)
  .post(protect, authorize('super_admin', 'admin'), singleUpload, createGalleryItem);

router.route('/:id')
  .get(optionalProtect, getGalleryItemById)
  .put(protect, authorize('super_admin', 'admin'), singleUpload, updateGalleryItem)
  .delete(protect, authorize('super_admin', 'admin'), deleteGalleryItem);

module.exports = router;
