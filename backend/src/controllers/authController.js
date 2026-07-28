const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail, sendAdminAlertEmail } = require('../services/emailService');
const { uploadFile, deleteFile } = require('../services/s3.service');
const { logRegistration, logEmail, logError } = require('../utils/logger');
const registrationService = require('../services/registrationService');
const receiptService = require('../services/receiptService');
const fs = require('fs');
const path = require('path');

// Helper to extract extension from mimeType
const getExt = (mimeType) => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  return 'bin';
};

// Helper to convert base64 to buffer
const getBufferFromBase64 = (base64Data) => {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 file format');
  }
  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  return { buffer, mimeType };
};

const validateDocument = (file, allowedExts, maxSizeKB, label) => {
  if (!file) return;
  const ext = file.filename.split('.').pop().toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw new Error(`${label} format must be one of: ${allowedExts.join(', ')}`);
  }
  if (file.buffer.length > maxSizeKB * 1024) {
    throw new Error(`${label} size exceeds the limit of ${maxSizeKB} KB (Current: ${Math.round(file.buffer.length / 1024)} KB)`);
  }
};

// Helper to generate next registration number
const generateRegNumber = async () => {
  const lastUser = await User.findOne({ 
    registrationNumber: /^BCAR-2026-/ 
  }).sort({ registrationNumber: -1 });

  let nextSeq = 1;
  if (lastUser && lastUser.registrationNumber) {
    const parts = lastUser.registrationNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(6, '0');
  return `BCAR-2026-${paddedSeq}`;
};

// @desc    Register a new user (member)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const uploadedFiles = []; // Track files to clean up on failure
  try {
    const { 
      name, fatherHusbandName, dob, gender, maritalStatus, wifeHusbandName, 
      childrenSon, childrenDaughter, educationalQualification, bloodGroup, email, phone, 
      homeAddressVill, po, ps, district, pin, gramPanchayat, devBlock, subDistrict,
      bcCspIdNo, ssa, bankName, linkBranchName, dateOfStartingCsp, 
      interestedToJoin, admissionFee, perMonthMembershipFee, password, declarationAccepted,
      // Base64 document attachments fallback from request body
      profileImage, aadhaarCard, panCard, photograph, bankBcCertificate,
      profilePhoto, aadhaarFront, aadhaarBack, bankPassbook, signature, otherDocuments
    } = req.body;

    // Helper to get buffer from file either in multipart files or body base64
    const getFileBuffer = (fieldName, bodyVal) => {
      if (req.files) {
        if (Array.isArray(req.files)) {
          const file = req.files.find(f => f.fieldname === fieldName);
          if (file) {
            return { buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype };
          }
        } else if (req.files[fieldName] && req.files[fieldName][0]) {
          const file = req.files[fieldName][0];
          return { buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype };
        }
      }
      if (bodyVal) {
        const { buffer, mimeType } = getBufferFromBase64(bodyVal);
        const filename = `${fieldName}_${email || 'member'}_${Date.now()}.${getExt(mimeType)}`;
        return { buffer, filename, mimetype: mimeType };
      }
      return null;
    };

    // Helper to check if file attachment exists in req.files or body
    const hasFileAttachment = (fieldName, bodyVal) => {
      if (req.files) {
        if (Array.isArray(req.files)) {
          if (req.files.some(f => f.fieldname === fieldName)) return true;
        } else if (req.files[fieldName] && req.files[fieldName][0]) {
          return true;
        }
      }
      return !!bodyVal;
    };

    // Core document validations (check files array or body properties)
    const hasPhoto = hasFileAttachment('photograph', photograph) || hasFileAttachment('profilePhoto', profilePhoto) || hasFileAttachment('profileImage', profileImage);
    const hasAadhaarFront = hasFileAttachment('aadhaarFront', aadhaarFront) || hasFileAttachment('aadhaarCard', aadhaarCard);
    const hasAadhaarBack = hasFileAttachment('aadhaarBack', aadhaarBack);
    const hasPan = hasFileAttachment('panCard', panCard);
    const hasBank = hasFileAttachment('bankBcCertificate', bankBcCertificate) || hasFileAttachment('bankPassbook', bankPassbook);

    // Step 1: Validate required fields & strong formats
    if (!name || name.trim().length < 3 || name.trim().length > 100) {
      res.status(400);
      throw new Error('Full Name is required (minimum 3, maximum 100 characters)');
    }

    const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      res.status(400);
      throw new Error('Valid 10-digit mobile number starting with 6-9 is required');
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400);
      throw new Error('Valid email address is required');
    }

    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password is required (minimum 6 characters)');
    }

    const aadhaarClean = req.body.aadhaarNumber ? req.body.aadhaarNumber.toString().replace(/\D/g, '') : '';
    if (!aadhaarClean || aadhaarClean.length !== 12) {
      res.status(400);
      throw new Error('Valid 12-digit numeric Aadhaar Number is required');
    }

    if (pin && !/^\d{6}$/.test(pin.toString())) {
      res.status(400);
      throw new Error('Valid 6-digit Pincode is required');
    }

    if (!homeAddressVill || homeAddressVill.trim().length < 3) {
      res.status(400);
      throw new Error('Home Address is required (minimum 3 characters)');
    }

    if (!district) {
      res.status(400);
      throw new Error('District selection is required');
    }

    if (declarationAccepted !== true && declarationAccepted !== 'true') {
      res.status(400);
      throw new Error('Declaration acceptance is required');
    }

    if (!hasPhoto) {
      res.status(400);
      throw new Error('Passport Size Photo (सदस्य का फोटो) is mandatory');
    }

    if (!hasAadhaarFront) {
      res.status(400);
      throw new Error('Aadhaar Card (Front Side) upload is mandatory');
    }

    if (!hasAadhaarBack) {
      res.status(400);
      throw new Error('Aadhaar Card (Back Side) upload is mandatory');
    }

    // Step 2: Individual Unique Checks for Aadhaar, Phone, and Email
    // For each field: if a record exists and is NOT deleted → block. If deleted → purge it and carry history forward.

    const collectedHistory = [];
    const seenIds = new Set(); // avoid duplicates when same account matches multiple fields

    /** Build a full snapshot of any deleted account document */
    const buildHistorySnapshot = (old, note) => ({
      // ── Identity & Personal ──
      previousName:                    old.name,
      previousFatherHusbandName:       old.fatherHusbandName,
      previousDob:                     old.dob,
      previousGender:                  old.gender,
      previousMaritalStatus:           old.maritalStatus,
      previousWifeHusbandName:         old.wifeHusbandName,
      previousBloodGroup:              old.bloodGroup,
      previousEducationalQualification: old.educationalQualification,
      previousAadhaar:                 old.aadhaarNumber,
      // ── Contact ──
      previousEmail:                   old.email,
      previousPhone:                   old.phone,
      // ── Address ──
      previousHomeAddressVill:         old.homeAddressVill,
      previousPo:                      old.po,
      previousPs:                      old.ps,
      previousDistrict:                old.district,
      previousPin:                     old.pin,
      previousGramPanchayat:           old.gramPanchayat,
      previousDevBlock:                old.devBlock,
      previousSubDistrict:             old.subDistrict,
      // ── Professional ──
      previousBcCspIdNo:               old.bcCspIdNo,
      previousSsa:                     old.ssa,
      previousBankName:                old.bankName,
      previousLinkBranchName:          old.linkBranchName,
      previousDateOfStartingCsp:       old.dateOfStartingCsp,
      previousInterestedToJoin:        old.interestedToJoin,
      // ── Membership / Payment ──
      previousStatus:                  old.status,
      previousMembershipNo:            old.membershipNo,
      previousRegistrationNumber:      old.registrationNumber,
      previousReceiptNumber:           old.receiptNumber,
      previousRegistrationFee:         old.registrationFee,
      previousPaymentStatus:           old.paymentStatus,
      previousPaymentMode:             old.paymentMode,
      previousTransactionId:           old.transactionId,
      previousAdmissionFee:            old.admissionFee,
      previousPerMonthMembershipFee:   old.perMonthMembershipFee,
      previousJoinedAt:                old.joinedAt,
      previousCreatedAt:               old.createdAt,
      // ── Documents (full S3 metadata objects) ──
      previousProfilePhoto:            old.photograph || old.profilePhoto || null,
      previousAadhaarCard:             old.aadhaarCard || old.aadhaarFront || null,
      previousAadhaarBack:             old.aadhaarBack || null,
      previousPanCard:                 old.panCard || null,
      previousBankBcCertificate:       old.bankBcCertificate || old.bankPassbook || null,
      previousSignature:               old.signature || null,
      previousOtherDocuments:          old.otherDocuments || null,
      // ── Deletion Metadata ──
      deletedAt:                       old.deletedAt,
      deletedBy:                       old.deletedBy,
      reRegisteredAt:                  new Date(),
      note
    });

    // ── Aadhaar Check ──
    const aadhaarExists = await User.findOne({ aadhaarNumber: aadhaarClean });
    if (aadhaarExists) {
      if (!aadhaarExists.isDeleted) {
        logRegistration(`Duplicate Aadhaar registration attempt blocked. Aadhaar: ${aadhaarClean}`);
        res.status(400);
        throw new Error('This Aadhaar Number is already registered.');
      }
      collectedHistory.push(buildHistorySnapshot(aadhaarExists, 'Previous account was soft-deleted; Aadhaar re-registered'));
      seenIds.add(String(aadhaarExists._id));
      await User.deleteOne({ _id: aadhaarExists._id });
      logRegistration(`Purged soft-deleted account for Aadhaar re-registration: ${aadhaarClean}`);
    }

    // ── Phone Check ──
    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) {
      if (!phoneExists.isDeleted) {
        logRegistration(`Duplicate Phone registration attempt blocked. Phone: ${cleanPhone}`);
        res.status(400);
        throw new Error('This Mobile Number is already registered.');
      }
      if (!seenIds.has(String(phoneExists._id))) {
        collectedHistory.push(buildHistorySnapshot(phoneExists, 'Previous account was soft-deleted; Phone re-registered'));
        seenIds.add(String(phoneExists._id));
        await User.deleteOne({ _id: phoneExists._id });
        logRegistration(`Purged soft-deleted account for Phone re-registration: ${cleanPhone}`);
      }
    }

    // ── Email Check ──
    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) {
      if (!emailExists.isDeleted) {
        logRegistration(`Duplicate Email registration attempt blocked. Email: ${cleanEmail}`);
        res.status(400);
        throw new Error('This Email address is already registered.');
      }
      if (!seenIds.has(String(emailExists._id))) {
        collectedHistory.push(buildHistorySnapshot(emailExists, 'Previous account was soft-deleted; Email re-registered'));
        seenIds.add(String(emailExists._id));
        await User.deleteOne({ _id: emailExists._id });
        logRegistration(`Purged soft-deleted account for Email re-registration: ${cleanEmail}`);
      }
    }

    // Step 3: Setup asynchronous S3 upload tasks
    const profileImageFile = getFileBuffer('profileImage', profileImage);
    const photoFile = getFileBuffer('photograph', photograph || profilePhoto);
    const aadhaarFile = getFileBuffer('aadhaarFront', aadhaarFront || aadhaarCard) || getFileBuffer('aadhaarCard', aadhaarCard);
    const aadhaarBackFile = getFileBuffer('aadhaarBack', aadhaarBack);
    const panFile = getFileBuffer('panCard', panCard);
    const bankFile = getFileBuffer('bankBcCertificate', bankBcCertificate || bankPassbook);
    const signatureFile = getFileBuffer('signature', signature);
    const otherFile = getFileBuffer('otherDocuments', otherDocuments);

    // Validate Profile Image & Passport Photo (Formats: JPG, JPEG, PNG; Size: Max 5 MB / 5120 KB)
    if (profileImageFile) {
      validateDocument(profileImageFile, ['jpg', 'jpeg', 'png'], 5120, 'Profile Image');
    }
    if (photoFile) {
      validateDocument(photoFile, ['jpg', 'jpeg', 'png'], 5120, 'Passport Size Photo');
    }

    // Validate Mandatory Documents (Formats: PDF, JPG, JPEG, PNG; Size: Max 5 MB / 5120 KB)
    const docExts = ['pdf', 'jpg', 'jpeg', 'png'];
    if (aadhaarFile) validateDocument(aadhaarFile, docExts, 5120, 'Aadhaar Card Front');
    if (aadhaarBackFile) validateDocument(aadhaarBackFile, docExts, 5120, 'Aadhaar Card Back');
    if (panFile) validateDocument(panFile, docExts, 5120, 'PAN Card');
    if (bankFile) validateDocument(bankFile, docExts, 5120, 'Bank BC Certificate');
    if (signatureFile) validateDocument(signatureFile, docExts, 5120, 'Signature');
    if (otherFile) validateDocument(otherFile, docExts, 5120, 'Other Documents');

    const paymentReceiptFile = getFileBuffer('paymentReceipt', req.body.paymentReceipt);
    if (paymentReceiptFile) {
      validateDocument(paymentReceiptFile, docExts, 5120, 'Payment Receipt');
    }

    const uploadTasks = [];
    const uploadKeys = [];

    // Profile Image & Photograph go to members/profile/
    if (profileImageFile) {
      uploadTasks.push(uploadFile(profileImageFile.buffer, 'members/profile', profileImageFile.filename, profileImageFile.mimetype));
      uploadKeys.push('profileImage');
    }

    if (photoFile) {
      uploadTasks.push(uploadFile(photoFile.buffer, 'members/profile', photoFile.filename, photoFile.mimetype));
      uploadKeys.push('photograph');
    }

    // Documents go to members/documents/
    if (aadhaarFile) {
      uploadTasks.push(uploadFile(aadhaarFile.buffer, 'members/documents', aadhaarFile.filename, aadhaarFile.mimetype));
      uploadKeys.push('aadhaarCard');
    }
    if (panFile) {
      uploadTasks.push(uploadFile(panFile.buffer, 'members/documents', panFile.filename, panFile.mimetype));
      uploadKeys.push('panCard');
    }
    if (bankFile) {
      uploadTasks.push(uploadFile(bankFile.buffer, 'members/documents', bankFile.filename, bankFile.mimetype));
      uploadKeys.push('bankBcCertificate');
    }
    if (aadhaarBackFile) {
      uploadTasks.push(uploadFile(aadhaarBackFile.buffer, 'members/documents', aadhaarBackFile.filename, aadhaarBackFile.mimetype));
      uploadKeys.push('aadhaarBack');
    }
    if (signatureFile) {
      uploadTasks.push(uploadFile(signatureFile.buffer, 'members/signatures', signatureFile.filename, signatureFile.mimetype));
      uploadKeys.push('signature');
    }
    if (otherFile) {
      uploadTasks.push(uploadFile(otherFile.buffer, 'members/documents', otherFile.filename, otherFile.mimetype));
      uploadKeys.push('otherDocuments');
    }
    if (paymentReceiptFile) {
      uploadTasks.push(uploadFile(paymentReceiptFile.buffer, 'members/receipts', paymentReceiptFile.filename, paymentReceiptFile.mimetype));
      uploadKeys.push('paymentReceipt');
    }

    // Execute uploads concurrently
    let results = [];
    try {
      results = await Promise.all(uploadTasks);
    } catch (uploadErr) {
      logError(`S3 Upload Error for ${email}: ${uploadErr.message}`);
      res.status(500);
      throw new Error(`Upload Error: Failed to upload files to Amazon S3: ${uploadErr.message}`);
    }

    // Keep track of successfully uploaded files for fallback cleanup
    results.forEach((resItem) => uploadedFiles.push(resItem));

    // Compile member record data
    const memberData = {
      name, fatherHusbandName, dob, gender, maritalStatus, wifeHusbandName, 
      childrenSon: childrenSon ? parseInt(childrenSon, 10) : 0, 
      childrenDaughter: childrenDaughter ? parseInt(childrenDaughter, 10) : 0, 
      educationalQualification, bloodGroup, email, phone, 
      aadhaarNumber: aadhaarClean,
      homeAddressVill, po, ps, district, pin, gramPanchayat, devBlock, subDistrict,
      bcCspIdNo, ssa, bankName, linkBranchName, dateOfStartingCsp, 
      interestedToJoin, password,
      declarationAccepted: (declarationAccepted === true || declarationAccepted === 'true'),
      
      // Payment & Verification Details
      paymentUtr: req.body.paymentUtr || req.body.transactionId || '',
      transactionId: req.body.paymentUtr || req.body.transactionId || '',
      paymentStatus: 'Pending Verification',
      paymentMode: 'UPI / Direct Bank Transfer',
      
      // System defaults
      role: 'member',
      status: 'Pending Approval',
      isActive: false,
      emailVerified: false,
      createdBy: 'Self Registration',

      // Carry over history from any previously deleted accounts with same phone/email/aadhaar
      registrationHistory: collectedHistory.length > 0 ? collectedHistory : []
    };

    // Assign S3 file metadata matching schema
    results.forEach((s3Meta, idx) => {
      const key = uploadKeys[idx];
      if (key !== 'profileImage') {
        memberData[key] = s3Meta;
      }
      
      // Sync duplicate fields for compatibility
      if (key === 'profileImage') memberData['profilePhoto'] = s3Meta;
      if (key === 'photograph' && !memberData['profilePhoto']) memberData['profilePhoto'] = s3Meta;
      if (key === 'aadhaarCard') memberData['aadhaarFront'] = s3Meta;
      if (key === 'bankBcCertificate') memberData['bankPassbook'] = s3Meta;
    });

    let regResult;
    try {
      regResult = await registrationService.registerNewMember(memberData);
    } catch (dbError) {
      logError(`Database save failed for ${email}. Triggering S3 cleanup: ${dbError.message}`);
      for (const file of uploadedFiles) {
        try {
          await deleteFile(file.key || file.public_id);
        } catch (cleanupErr) {
          logError(`Failed to clean up file ${file.key}: ${cleanupErr.message}`);
        }
      }
      throw dbError; // rethrow to errorHandler middleware
    }

    const { user, receiptGenerated, emailSent } = regResult;
    logRegistration(`Success: Registered user ${name} (${email}) with Registration No: ${user.registrationNumber}`);

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Your application is pending admin approval.',
      registrationNumber: user.registrationNumber,
      receiptNumber: user.receiptNumber,
      emailSent,
      receiptGenerated,
      data: {
        registrationNumber: user.registrationNumber,
        receiptNumber: user.receiptNumber,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        emailSent,
        receiptGenerated
      }
    });

  } catch (error) {
    logError(`Registration exception: ${error.message}`);
    next(error);
  }
};

// @desc    Update member profile with document changes
// @route   PUT /api/auth/profile/documents
// @access  Private
const updateMemberDocuments = async (req, res, next) => {
  try {
    const member = await User.findById(req.user._id);
    if (!member) {
      res.status(404);
      throw new Error('Member not found');
    }

    const { profileImage, photograph, aadhaarCard, panCard, bankBcCertificate } = req.body;
    const uploadTasks = [];
    const uploadKeys = [];

    // Setup tasks & delete old S3 objects
    if (profileImage) {
      if (member.profilePhoto && (member.profilePhoto.key || member.profilePhoto.public_id)) {
        await deleteFile(member.profilePhoto.key || member.profilePhoto.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(profileImage);
      const filename = `profile_photo_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFile(buffer, 'members/profile', filename, mimeType));
      uploadKeys.push('profileImage');
    }

    if (photograph) {
      if (member.photograph && (member.photograph.key || member.photograph.public_id)) {
        await deleteFile(member.photograph.key || member.photograph.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(photograph);
      const filename = `profile_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFile(buffer, 'members/profile', filename, mimeType));
      uploadKeys.push('photograph');
    }

    if (aadhaarCard) {
      if (member.aadhaarCard && (member.aadhaarCard.key || member.aadhaarCard.public_id)) {
        await deleteFile(member.aadhaarCard.key || member.aadhaarCard.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(aadhaarCard);
      const filename = `aadhaar_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFile(buffer, 'members/documents', filename, mimeType));
      uploadKeys.push('aadhaarCard');
    }

    if (panCard) {
      if (member.panCard && (member.panCard.key || member.panCard.public_id)) {
        await deleteFile(member.panCard.key || member.panCard.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(panCard);
      const filename = `pan_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFile(buffer, 'members/documents', filename, mimeType));
      uploadKeys.push('panCard');
    }

    if (bankBcCertificate) {
      if (member.bankBcCertificate && (member.bankBcCertificate.key || member.bankBcCertificate.public_id)) {
        await deleteFile(member.bankBcCertificate.key || member.bankBcCertificate.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(bankBcCertificate);
      const filename = `bank_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFile(buffer, 'members/documents', filename, mimeType));
      uploadKeys.push('bankBcCertificate');
    }

    const results = await Promise.all(uploadTasks);
    results.forEach((meta, idx) => {
      const key = uploadKeys[idx];
      if (key !== 'profileImage') {
        member[key] = meta;
      }
      
      // Sync duplicates
      if (key === 'profileImage') member['profilePhoto'] = meta;
      if (key === 'photograph' && !member['profilePhoto']) member['profilePhoto'] = meta;
      if (key === 'aadhaarCard') member['aadhaarFront'] = meta;
      if (key === 'bankBcCertificate') member['bankPassbook'] = meta;
    });

    await member.save();
    logRegistration(`User updated documents: ${member.email}`);
    res.json({ message: 'Documents updated successfully', member });

  } catch (error) {
    logError(`updateMemberDocuments exception: ${error.message}`);
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const identifier = email ? email.trim() : '';

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
        { registrationNumber: identifier },
        { membershipNo: identifier }
      ],
      isDeleted: { $ne: true }
    });

    if (user && (await user.matchPassword(password))) {
      // Check member status (admins / coordinators bypass pending check)
      if (user.role === 'member' && !['active', 'Approved'].includes(user.status)) {
        res.status(403);
        throw new Error(`Your account status is currently: ${user.status}. Please contact an administrator.`);
      }

      const token = generateToken(user._id, user.role);

      const userObj = user.toObject();
      delete userObj.password;

      res.json({
        success: true,
        message: 'Login successful',
        ...userObj,
        token,
        data: {
          ...userObj,
          token
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Basic Info
      user.name = req.body.name || user.name;
      user.fatherHusbandName = req.body.fatherHusbandName || user.fatherHusbandName;
      user.dob = req.body.dob || user.dob;
      user.gender = req.body.gender || user.gender;
      user.maritalStatus = req.body.maritalStatus || user.maritalStatus;
      user.wifeHusbandName = req.body.wifeHusbandName || user.wifeHusbandName;
      if (req.body.childrenSon !== undefined) user.childrenSon = req.body.childrenSon;
      if (req.body.childrenDaughter !== undefined) user.childrenDaughter = req.body.childrenDaughter;
      user.educationalQualification = req.body.educationalQualification || user.educationalQualification;
      user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
      user.subDistrict = req.body.subDistrict || user.subDistrict;

      // Contact Info
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;

      // Address Info
      user.homeAddressVill = req.body.homeAddressVill || user.homeAddressVill;
      user.po = req.body.po || user.po;
      user.ps = req.body.ps || user.ps;
      user.district = req.body.district || user.district;
      user.pin = req.body.pin || user.pin;
      user.gramPanchayat = req.body.gramPanchayat || user.gramPanchayat;
      user.devBlock = req.body.devBlock || user.devBlock;

      // Professional Details
      user.bcCspIdNo = req.body.bcCspIdNo || user.bcCspIdNo;
      user.ssa = req.body.ssa || user.ssa;
      user.bankName = req.body.bankName || user.bankName;
      user.linkBranchName = req.body.linkBranchName || user.linkBranchName;
      user.dateOfStartingCsp = req.body.dateOfStartingCsp || user.dateOfStartingCsp;

      const updatedUser = await user.save();
      const userRes = updatedUser.toObject();
      delete userRes.password;
      res.json(userRes);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please provide current password and new password');
    }

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(401);
      throw new Error('Invalid current password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send reset password via email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please provide email address');
    }

    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } });
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // Generate random 8-character password
    const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase() + '@bcar';
    user.password = tempPassword;
    await user.save();

    const { sendMail } = require('../services/emailService');

    // Send email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0d5c3a; margin-top: 10px;">BCAR Account Password Reset</h2>
        </div>
        <p>Dear ${user.name},</p>
        <p>Your password reset request was successful. We have generated a temporary password for your account.</p>
        <div style="background-color: #f7f7f7; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
          <span style="font-size: 14px; color: #555;">Temporary Password:</span>
          <br>
          <strong style="font-size: 22px; color: #0d5c3a; letter-spacing: 1px;">${tempPassword}</strong>
        </div>
        <p style="color: #666; font-size: 14px;">Please login using this temporary password and immediately change it from your Profile / Dashboard settings.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">This is an automated email. Please do not reply directly to this message. For help, contact support@bcarbankmitra.com.</p>
      </div>
    `;

    await sendMail({
      to: user.email,
      subject: 'Your Temporary Password - BCAR',
      html: emailHtml
    });

    res.json({ message: 'A temporary password has been sent to your email address.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download generated receipt PDF
 * @route   GET /api/auth/receipt/:regNum
 * @access  Public
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const { regNum } = req.params;
    const member = await User.findOne({ registrationNumber: regNum });
    if (!member) {
      res.status(404);
      throw new Error('Registration number not found');
    }

    const pdfBuffer = await receiptService.generateReceiptBuffer(member);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=BCAR_Receipt_${regNum}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send generated ID card to member via email
 * @route   POST /api/auth/send-card-email
 * @access  Public
 */
const sendCardEmail = async (req, res, next) => {
  try {
    const { email, name, membershipNo, cardImageBase64 } = req.body;
    if (!email || !cardImageBase64) {
      res.status(400);
      throw new Error('Email and card image base64 are required');
    }

    const { buffer } = getBufferFromBase64(cardImageBase64);
    const { sendCardImageEmail } = require('../services/emailService');

    await sendCardImageEmail(email, name || 'Member', membershipNo || 'N/A', buffer);

    res.json({ success: true, message: 'ID Card emailed successfully!' });
  } catch (error) {
    console.error('[sendCardEmail Error]:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to send ID Card email: ${error.message}`
    });
  }
};

module.exports = {
  registerUser,
  updateMemberDocuments,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  downloadReceipt,
  sendCardEmail
};
