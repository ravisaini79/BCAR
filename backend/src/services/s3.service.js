const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3Client, BUCKET_NAME, AWS_REGION } = require('../config/aws.config');

/**
 * Generate a unique filename using UUID v4 and sanitized original extension
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFileName = (originalName = 'file') => {
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
  return `${sanitized}_${uuidv4()}${ext}`;
};

/**
 * Upload file buffer to AWS S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Target folder path in S3 (e.g. 'members/profile')
 * @param {string} fileName - File name or original name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<object>} - Uploaded object metadata including url, key, bucket
 */
const uploadFile = async (fileBuffer, folder = 'temp', fileName = 'file', mimeType = 'application/octet-stream') => {
  try {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const uniqueName = generateUniqueFileName(fileName);
    const key = `${cleanFolder}/${uniqueName}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType
      }
    });

    await upload.done();

    const publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return {
      url: publicUrl,
      secure_url: publicUrl, // Backwards compatibility with existing frontend
      key: key,
      public_id: key, // Backwards compatibility alias
      bucket: BUCKET_NAME,
      original_filename: fileName,
      file_size: fileBuffer.length,
      uploaded_at: new Date()
    };
  } catch (error) {
    console.error(`[S3 SERVICE ERROR] Upload failed for folder '${folder}':`, error);
    throw new Error(`S3 Upload Failed: ${error.message}`);
  }
};

/**
 * Delete a file object from AWS S3 bucket
 * @param {string} key - S3 object key or public_id
 * @returns {Promise<object>} - Deletion outcome
 */
const deleteFile = async (key) => {
  if (!key) return { success: true, message: 'No key provided' };
  
  let objectKey = key;
  if (typeof objectKey === 'string' && (objectKey.startsWith('http://') || objectKey.startsWith('https://'))) {
    try {
      const urlObj = new URL(objectKey);
      objectKey = urlObj.pathname.replace(/^\//, '');
    } catch (e) {
      // Ignore URL parsing error
    }
  }

  if (typeof objectKey === 'string' && (
    objectKey.startsWith('local_uploads/') || 
    objectKey.startsWith('bcar/gallery/seed') || 
    objectKey.startsWith('bcar/news/seed')
  )) {
    console.log(`[S3 SERVICE] Skipping deletion for seed asset key: ${objectKey}`);
    return { success: true, message: 'Skipped seed asset deletion' };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey
    });

    await s3Client.send(command);
    console.log(`[S3 SERVICE] Successfully deleted file from S3: ${objectKey}`);
    return { success: true, key: objectKey };
  } catch (error) {
    console.error(`[S3 SERVICE ERROR] Deletion failed for key '${objectKey}':`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  generateUniqueFileName
};
