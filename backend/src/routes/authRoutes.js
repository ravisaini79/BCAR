const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerUser, loginUser, getUserProfile, updateUserProfile, changePassword, forgotPassword, updateMemberDocuments, downloadReceipt, sendCardEmail } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Setup multer memory storage for multipart uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const cpUpload = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'photograph', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'bankBcCertificate', maxCount: 1 },
  { name: 'bankPassbook', maxCount: 1 },
  { name: 'paymentReceipt', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 1 }
]);

router.post('/register', cpUpload, registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile/documents', protect, updateMemberDocuments);
router.get('/receipt/:regNum', downloadReceipt);
router.post('/send-card-email', sendCardEmail);

module.exports = router;
