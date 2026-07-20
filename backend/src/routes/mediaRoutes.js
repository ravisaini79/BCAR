const express = require('express');
const router = express.Router();
const { getMedia } = require('../controllers/mediaController');

// Match any wildcard media path e.g. /api/media/gallery/filename.jpg
router.get('/*', getMedia);

module.exports = router;
