const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/aws.config');

/**
 * Proxy controller to securely stream media files from AWS S3.
 * Eliminates S3 public access policy (HTTP 403 AccessDenied) issues.
 */
const getMedia = async (req, res, next) => {
  try {
    let key = req.params[0] || req.params.key;
    if (!key) {
      return res.status(400).send('Media key is required');
    }

    // Sanitize leading slashes
    key = key.replace(/^\/+/, '');

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);

    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }

    // Set aggressive caching for performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Stream S3 file object to response
    response.Body.pipe(res);
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).send('Media file not found');
    }
    console.error(`[MEDIA PROXY ERROR] Failed to stream S3 key '${req.params[0]}':`, error.message);
    res.status(500).send('Error retrieving media file');
  }
};

module.exports = { getMedia };
