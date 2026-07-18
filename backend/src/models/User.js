const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  fatherHusbandName: String,
  dob: String,
  gender: String,
  maritalStatus: String,
  wifeHusbandName: String,
  childrenSon: String,
  childrenDaughter: String,
  educationalQualification: String,
  bloodGroup: String,
  aadhaarNumber: String,
  subDistrict: String,

  // Contact Info
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true },
  
  // Address Info
  homeAddressVill: String,
  po: String,
  ps: String,
  district: String,
  pin: String,
  gramPanchayat: String,
  devBlock: String,
  
  // Professional Details
  bcCspIdNo: String,
  ssa: String,
  bankName: String,
  linkBranchName: String,
  dateOfStartingCsp: String,
  
  // Association Details
  interestedToJoin: { type: String, enum: ['YES', 'NO'], default: 'YES' },
  admissionFee: String,
  perMonthMembershipFee: String,
  
  // Document Upload File Metadata (S3)
  photograph: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  aadhaarCard: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  panCard: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  bankBcCertificate: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  
  // Additional Document Fields
  profilePhoto: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  aadhaarFront: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  aadhaarBack: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  bankPassbook: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  signature: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  otherDocuments: {
    url: String,
    key: String,
    bucket: String,
    public_id: String,
    secure_url: String,
    original_filename: String,
    resource_type: String,
    format: String,
    file_size: Number,
    uploaded_at: Date
  },
  registrationNumber: { type: String, unique: true, sparse: true },
  receiptNumber: { type: String, unique: true, sparse: true },
  registrationFee: { type: Number, default: 600 },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Paid' },
  paymentMode: { type: String, default: 'Online / UPI' },
  transactionId: { type: String },
  emailSent: { type: Boolean, default: false },
  receiptGenerated: { type: Boolean, default: false },
  
  // System Fields
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'coordinator', 'member'], default: 'member' },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'Pending Approval', 'Approved', 'suspended'], default: 'pending' },
  membershipNo: String,
  joinedAt: { type: Date, default: Date.now },
  declarationAccepted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  createdBy: { type: String, default: 'Self Registration' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema, 'members');
