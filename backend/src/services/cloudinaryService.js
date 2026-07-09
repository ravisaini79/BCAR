const fs = require('fs');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('[CLOUDINARY] Cloudinary service initialized and configured.');
} else {
  console.log('[CLOUDINARY] WARNING: Cloudinary credentials missing in .env. Local filesystem fallback will be used.');
}

/**
 * Uploads a file buffer directly to Cloudinary using streams
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Destination folder name (e.g. 'bcar/members/profile')
 * @param {string} filename - Original filename
 * @returns {Promise<object>} - Cloudinary metadata block
 */
const uploadFromBuffer = (buffer, folder, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      console.log(`[CLOUDINARY SERVICE - LOCAL FALLBACK] Saving buffer locally to uploads folder`);
      try {
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a clean unique filename (sanitize by replacing spaces and special characters with underscores)
        const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const extension = (filename.split('.').pop() || 'bin').toLowerCase();
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || 'file';
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        const cleanName = `${sanitizedName}_${uniqueSuffix}.${extension}`;
        
        const filePath = path.join(uploadsDir, cleanName);
        fs.writeFileSync(filePath, buffer);
        
        const mockResult = {
          public_id: `local_uploads/${cleanName}`,
          secure_url: `/uploads/${cleanName}`,
          original_filename: filename,
          resource_type: extension === 'pdf' ? 'raw' : 'image',
          format: extension,
          file_size: buffer.length,
          uploaded_at: new Date()
        };
        console.log(`[LOCAL UPLOAD SUCCESS] Saved at ${filePath}, returning URL: ${mockResult.secure_url}`);
        return resolve(mockResult);
      } catch (err) {
        console.error('[LOCAL UPLOAD ERROR] Failed to write file locally:', err);
        return reject(err);
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename.substring(0, filename.lastIndexOf('.')),
        resource_type: 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          console.error(`[CLOUDINARY] Stream upload failed: ${error.message}`);
          return reject(error);
        }
        
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          original_filename: filename.substring(0, filename.lastIndexOf('.')),
          resource_type: result.resource_type,
          format: result.format,
          file_size: result.bytes,
          uploaded_at: new Date(result.created_at || Date.now())
        });
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary using its public_id
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<object>} - Deletion result status
 */
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured || !publicId || publicId.startsWith('mock')) {
      console.log(`[CLOUDINARY] Mocking deletion of publicId: ${publicId}`);
      return resolve({ result: 'ok' });
    }

    // PDF files uploaded as 'raw' might need resource_type set, otherwise default is 'image'
    const isRaw = publicId.endsWith('.pdf') || publicId.includes('/documents/');
    const resourceType = isRaw ? 'raw' : 'image';

    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        console.error(`[CLOUDINARY] Asset deletion failed for ${publicId}: ${error.message}`);
        return reject(error);
      }
      resolve(result);
    });
  });
};

// Internal utility to generate prefix
function prefix() {
  return Date.now().toString();
}

module.exports = {
  uploadFromBuffer,
  deleteFromCloudinary,
  isConfigured
};
