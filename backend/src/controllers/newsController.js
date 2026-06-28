const News = require('../models/News');
const { uploadFromBuffer, deleteFromCloudinary } = require('../services/cloudinaryService');

// Helper to convert text to URL safe slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
};

// Helper to make slug unique in database
const makeUniqueSlug = async (title, currentId = null) => {
  let baseSlug = slugify(title) || 'news-article';
  let slug = baseSlug;
  let matches = 1;
  
  while (true) {
    const query = { slug, isDeleted: false };
    if (currentId) {
      query._id = { $ne: currentId };
    }
    const existing = await News.findOne(query);
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${matches}`;
    matches++;
  }
  return slug;
};

// @desc    Get all news articles
// @route   GET /api/news
// @access  Public (Published only) / Admin (All)
const getNewsArticles = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    
    const query = { isDeleted: false };
    if (!isAdmin) {
      query.status = 'Published';
    }

    // Sort by pinned first (true is sorted higher than false), then publishDate desc, then createdAt desc
    const items = await News.find(query).sort({ pinned: -1, publishDate: -1, createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single news article by slug
// @route   GET /api/news/:slug
// @access  Public (Published only) / Admin (All)
const getNewsArticleBySlug = async (req, res, next) => {
  try {
    const item = await News.findOne({ slug: req.params.slug, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('News article not found');
    }

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin');
    if (item.status === 'Draft' && !isAdmin) {
      res.status(403);
      throw new Error('Not authorized to view this draft article');
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new news article
// @route   POST /api/news
// @access  Admin/Super Admin
const createNewsArticle = async (req, res, next) => {
  try {
    const { title, shortDescription, fullDescription, category, publishDate, status, featured, pinned } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Title is required');
    }
    if (!shortDescription) {
      res.status(400);
      throw new Error('Short description is required');
    }
    if (!fullDescription) {
      res.status(400);
      throw new Error('Full description is required');
    }
    if (!category) {
      res.status(400);
      throw new Error('Category is required');
    }

    if (!req.file) {
      res.status(400);
      throw new Error('Featured image file is required');
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
      throw new Error('Featured image size exceeds the 500 KB limit');
    }

    // Generate unique slug
    const slug = await makeUniqueSlug(title);

    // Upload to Cloudinary (Folder: bcar/news, transformation: compress and fit to 1200x630)
    let uploadResult;
    try {
      const filename = `news_${Date.now()}_${req.file.originalname}`;
      uploadResult = await uploadFromBuffer(req.file.buffer, 'bcar/news', filename, {
        transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
      });
    } catch (uploadErr) {
      res.status(500);
      throw new Error(`Cloudinary upload failed: ${uploadErr.message}`);
    }

    // Create record in MongoDB
    const newItem = await News.create({
      title,
      slug,
      shortDescription,
      fullDescription,
      featuredImage: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width || 1200,
        height: uploadResult.height || 630,
        format: uploadResult.format,
        bytes: uploadResult.file_size
      },
      category,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      status: status || 'Draft',
      featured: featured === 'true' || featured === true,
      pinned: pinned === 'true' || pinned === true
    });

    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a news article
// @route   PUT /api/news/:id
// @access  Admin/Super Admin
const updateNewsArticle = async (req, res, next) => {
  try {
    const item = await News.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('News article not found');
    }

    const { title, shortDescription, fullDescription, category, publishDate, status, featured, pinned } = req.body;

    if (title && title !== item.title) {
      item.title = title;
      item.slug = await makeUniqueSlug(title, item._id);
    }
    if (shortDescription) item.shortDescription = shortDescription;
    if (fullDescription) item.fullDescription = fullDescription;
    if (category) item.category = category;
    if (publishDate) item.publishDate = new Date(publishDate);
    if (status) item.status = status;
    if (featured !== undefined) item.featured = featured === 'true' || featured === true;
    if (pinned !== undefined) item.pinned = pinned === 'true' || pinned === true;

    // Check if new featured image is uploaded
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
        throw new Error('Featured image size exceeds the 500 KB limit');
      }

      // Upload new image to Cloudinary
      let uploadResult;
      try {
        const filename = `news_${Date.now()}_${req.file.originalname}`;
        uploadResult = await uploadFromBuffer(req.file.buffer, 'bcar/news', filename, {
          transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
        });
      } catch (uploadErr) {
        res.status(500);
        throw new Error(`Cloudinary upload failed: ${uploadErr.message}`);
      }

      // Delete old image from Cloudinary
      if (item.featuredImage && item.featuredImage.public_id) {
        try {
          await deleteFromCloudinary(item.featuredImage.public_id);
        } catch (delErr) {
          console.error(`[CLOUDINARY] Failed to delete old image ${item.featuredImage.public_id}: ${delErr.message}`);
        }
      }

      // Assign new image metadata
      item.featuredImage = {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width || 1200,
        height: uploadResult.height || 630,
        format: uploadResult.format,
        bytes: uploadResult.file_size
      };
    }

    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a news article
// @route   DELETE /api/news/:id
// @access  Admin/Super Admin
const deleteNewsArticle = async (req, res, next) => {
  try {
    const item = await News.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      res.status(404);
      throw new Error('News article not found');
    }

    // Soft delete in DB
    item.isDeleted = true;
    item.deletedAt = new Date();

    // Delete image from Cloudinary to clean up storage
    if (item.featuredImage && item.featuredImage.public_id) {
      try {
        await deleteFromCloudinary(item.featuredImage.public_id);
      } catch (delErr) {
        console.error(`[CLOUDINARY] Failed to delete image ${item.featuredImage.public_id}: ${delErr.message}`);
      }
    }

    await item.save();
    res.status(200).json({ message: 'News article deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNewsArticles,
  getNewsArticleBySlug,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle
};
