const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerUser, loginUser, getUserProfile, updateMemberDocuments, downloadReceipt } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Setup multer memory storage for multipart uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const cpUpload = upload.fields([
  { name: 'photograph', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'bankBcCertificate', maxCount: 1 }
]);

router.post('/register', cpUpload, registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile/documents', protect, updateMemberDocuments);
router.get('/receipt/:regNum', downloadReceipt);

module.exports = router;
