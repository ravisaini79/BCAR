const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { sendContactQueryEmail } = require('../services/emailService');

// @desc    Get all public notices
// @route   GET /api/public/notices
// @access  Public
router.get('/notices', async (req, res, next) => {
  try {
    const notices = await Notice.find({}).sort({ publishedAt: -1 });
    res.json(notices);
  } catch (error) {
    next(error);
  }
});

// @desc    Submit a contact query form
// @route   POST /api/public/contact
// @access  Public
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    await sendContactQueryEmail(name, email, phone, message);
    res.json({ message: 'Your message has been sent successfully!' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
