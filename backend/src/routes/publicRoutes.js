const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

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

module.exports = router;
