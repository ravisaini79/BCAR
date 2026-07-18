const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  shortDescription: {
    type: String,
    required: [true, 'Please add a short description'],
    trim: true
  },
  fullDescription: {
    type: String,
    required: [true, 'Please add a full description']
  },
  featuredImage: {
    url: { type: String },
    key: { type: String },
    bucket: { type: String },
    public_id: { type: String, required: true },
    secure_url: { type: String, required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['circular', 'policy', 'event', 'alert'],
    default: 'circular'
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Published', 'Draft'],
    default: 'Draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  pinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('News', newsSchema, 'news');
