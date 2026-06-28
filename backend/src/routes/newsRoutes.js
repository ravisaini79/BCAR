const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');
const {
  getNewsArticles,
  getNewsArticleBySlug,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle
} = require('../controllers/newsController');

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB temporary limit; controller enforces 500KB
});

const singleUpload = upload.single('image');

router.route('/')
  .get(optionalProtect, getNewsArticles)
  .post(protect, authorize('super_admin', 'admin'), singleUpload, createNewsArticle);

router.route('/:slug')
  .get(optionalProtect, getNewsArticleBySlug);

router.route('/:id')
  .put(protect, authorize('super_admin', 'admin'), singleUpload, updateNewsArticle)
  .delete(protect, authorize('super_admin', 'admin'), deleteNewsArticle);

module.exports = router;
