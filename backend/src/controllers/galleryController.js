const Gallery = require('../models/Gallery');
const { uploadFile, deleteFile } = require('../services/s3.service');

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public (Published only) / Admin (All)
const getGalleryItems = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    
    const query = { isDeleted: false };
    if (!isAdmin) {
      query.status = 'Published';
    }

    const items = await Gallery.find(query).sort({ createdAt: -1, displayOrder: 1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gallery item
// @route   GET /api/gallery/:id
// @access  Public
const getGalleryItemById = async (req, res, next) => {
  try {
    const item = await Gallery.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('Gallery item not found');
    }
    
    // Check if draft and user is not admin
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    if (item.status === 'Draft' && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized to view this draft item');
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new gallery item
// @route   POST /api/gallery
// @access  Admin/Super Admin
const createGalleryItem = async (req, res, next) => {
  try {
    const { title, category, description, displayOrder, status, featured } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Title is required');
    }
    if (!category) {
      res.status(400);
      throw new Error('Category is required');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Image file is required');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      res.status(400);
      throw new Error('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP');
    }

    // Validate size (500 KB limit)
    const maxSizeBytes = 500 * 1024;
    if (req.file.size > maxSizeBytes) {
      res.status(400);
      throw new Error('Image size exceeds the 500 KB limit');
    }

    // Upload to Amazon S3 (Folder: gallery/)
    let uploadResult;
    try {
      uploadResult = await uploadFile(req.file.buffer, 'gallery', req.file.originalname, req.file.mimetype);
    } catch (uploadErr) {
      res.status(500);
      throw new Error(`S3 upload failed: ${uploadErr.message}`);
    }

    // Create item in MongoDB
    const newItem = await Gallery.create({
      title,
      category,
      description,
      image: {
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: 1920,
        height: 1080,
        format: req.file.originalname ? req.file.originalname.split('.').pop() : 'jpg',
        bytes: req.file.size
      },
      displayOrder: Number(displayOrder || 0),
      status: status || 'Published',
      featured: featured === 'true' || featured === true
    });

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a gallery item
// @route   PUT /api/gallery/:id
// @access  Admin/Super Admin
const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('Gallery item not found');
    }

    const { title, category, description, displayOrder, status, featured } = req.body;

    if (title) item.title = title;
    if (category) item.category = category;
    if (description !== undefined) item.description = description;
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder);
    if (status) item.status = status;
    if (featured !== undefined) item.featured = featured === 'true' || featured === true;

    // Check if new image is uploaded
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400);
        throw new Error('Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP');
      }

      // Validate size (500 KB limit)
      const maxSizeBytes = 500 * 1024;
      if (req.file.size > maxSizeBytes) {
        res.status(400);
        throw new Error('Image size exceeds the 500 KB limit');
      }

      // Upload new image to S3
      let uploadResult;
      try {
        uploadResult = await uploadFile(req.file.buffer, 'gallery', req.file.originalname, req.file.mimetype);
      } catch (uploadErr) {
        res.status(500);
        throw new Error(`S3 upload failed: ${uploadErr.message}`);
      }

      // Delete old image from S3
      if (item.image && (item.image.key || item.image.public_id)) {
        try {
          await deleteFile(item.image.key || item.image.public_id);
        } catch (delErr) {
          console.error(`[S3] Failed to delete old image ${item.image.key || item.image.public_id}: ${delErr.message}`);
        }
      }

      // Assign new image metadata
      item.image = {
        url: uploadResult.url,
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: 1920,
        height: 1080,
        format: req.file.originalname ? req.file.originalname.split('.').pop() : 'jpg',
        bytes: req.file.size
      };
    }

    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a gallery item
// @route   DELETE /api/gallery/:id
// @access  Admin/Super Admin
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('Gallery item not found');
    }

    // Soft delete in DB
    item.isDeleted = true;
    item.deletedAt = new Date();

    // Delete image from S3 first to clean up storage
    if (item.image && (item.image.key || item.image.public_id)) {
      try {
        await deleteFile(item.image.key || item.image.public_id);
      } catch (delErr) {
        console.error(`[S3] Failed to delete image ${item.image.key || item.image.public_id}: ${delErr.message}`);
      }
    }

    await item.save();
    res.status(200).json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
};
