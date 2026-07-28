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
  aadhaarNumber: { type: String, unique: true, sparse: true, trim: true },
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
  paymentReceipt: {
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
  registrationFee: { type: Number, default: 700 },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Pending Verification', 'Verified'], default: 'Paid' },
  paymentUtr: { type: String },
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
  createdBy: { type: String, default: 'Self Registration' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null },

  // Full snapshot of a previously deleted account that shared the same phone/email/aadhaar
  registrationHistory: [{
    // ── Identity & Personal ──
    previousName: String,
    previousFatherHusbandName: String,
    previousDob: String,
    previousGender: String,
    previousMaritalStatus: String,
    previousWifeHusbandName: String,
    previousBloodGroup: String,
    previousEducationalQualification: String,
    previousAadhaar: String,

    // ── Contact ──
    previousEmail: String,
    previousPhone: String,

    // ── Address ──
    previousHomeAddressVill: String,
    previousPo: String,
    previousPs: String,
    previousDistrict: String,
    previousPin: String,
    previousGramPanchayat: String,
    previousDevBlock: String,
    previousSubDistrict: String,

    // ── Professional ──
    previousBcCspIdNo: String,
    previousSsa: String,
    previousBankName: String,
    previousLinkBranchName: String,
    previousDateOfStartingCsp: String,
    previousInterestedToJoin: String,

    // ── Membership / Payment ──
    previousStatus: String,
    previousMembershipNo: String,
    previousRegistrationNumber: String,
    previousReceiptNumber: String,
    previousRegistrationFee: Number,
    previousPaymentStatus: String,
    previousPaymentMode: String,
    previousTransactionId: String,
    previousAdmissionFee: String,
    previousPerMonthMembershipFee: String,
    previousJoinedAt: Date,
    previousCreatedAt: Date,

    // ── Documents (full S3 metadata) ──
    previousProfilePhoto: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousAadhaarCard: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousAadhaarBack: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousPanCard: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousBankBcCertificate: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousSignature: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },
    previousOtherDocuments: {
      url: String, key: String, bucket: String, public_id: String,
      secure_url: String, original_filename: String, format: String,
      file_size: Number, uploaded_at: Date
    },

    // ── Deletion Metadata ──
    deletedAt: Date,
    deletedBy: String,
    reRegisteredAt: { type: Date, default: Date.now },
    note: { type: String, default: 'Account was deleted and re-registered' }
  }]
}, { timestamps: true });

// ── 100K+ MongoDB Performance Indexes ──────────────────────────────────────
userSchema.index({ district: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ bcCspIdNo: 1 });
userSchema.index({ membershipNo: 1 });
userSchema.index({ isDeleted: 1 });

// Compound Indexes for Server-Side Filtering & Admin Dashboards
userSchema.index({ status: 1, district: 1, createdAt: -1 });
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ district: 1, name: 1 });

// Text Search Index for Rapid Server-Side Member Lookup
userSchema.index({
  name: 'text',
  phone: 'text',
  membershipNo: 'text',
  registrationNumber: 'text',
  bcCspIdNo: 'text',
  aadhaarNumber: 'text'
});

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
