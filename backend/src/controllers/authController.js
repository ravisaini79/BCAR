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
      childrenSon, childrenDaughter, educationalQualification, email, phone, 
      homeAddressVill, po, ps, district, pin, gramPanchayat, devBlock, 
      bcCspIdNo, ssa, bankName, linkBranchName, dateOfStartingCsp, 
      interestedToJoin, admissionFee, perMonthMembershipFee, password, declarationAccepted,
      // Base64 document attachments fallback from request body
      profileImage, aadhaarCard, panCard, photograph, bankBcCertificate,
      profilePhoto, aadhaarFront, aadhaarBack, bankPassbook, signature, otherDocuments
    } = req.body;

    // Helper to get buffer from file either in multipart files or body base64
    const getFileBuffer = (fieldName, bodyVal) => {
      if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        const file = req.files[fieldName][0];
        return { buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype };
      }
      if (bodyVal) {
        const { buffer, mimeType } = getBufferFromBase64(bodyVal);
        const filename = `${fieldName}_${email || 'member'}_${Date.now()}.${getExt(mimeType)}`;
        return { buffer, filename, mimetype: mimeType };
      }
      return null;
    };

    // Core document validations (check files array or body properties)
    const hasPhoto = (req.files && req.files['photograph']) || photograph || profilePhoto;
    const hasAadhaar = (req.files && req.files['aadhaarCard']) || aadhaarCard || aadhaarFront;
    const hasPan = (req.files && req.files['panCard']) || panCard;
    const hasBank = (req.files && req.files['bankBcCertificate']) || bankBcCertificate || bankPassbook;

    // Step 1: Validate required fields
    if (!name) {
      res.status(400);
      throw new Error('Name is required');
    }
    if (!phone || phone.length !== 10) {
      res.status(400);
      throw new Error('Valid 10-digit mobile number is required');
    }
    if (!email || !email.includes('@')) {
      res.status(400);
      throw new Error('Valid email address is required');
    }
    if (!password) {
      res.status(400);
      throw new Error('Password is required');
    }
    if (!homeAddressVill) {
      res.status(400);
      throw new Error('Home Address is required');
    }
    if (!district) {
      res.status(400);
      throw new Error('District is required');
    }
    if (declarationAccepted !== true && declarationAccepted !== 'true') {
      res.status(400);
      throw new Error('Declaration acceptance is required');
    }

    // Step 2: Check whether Email or Mobile already exists
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      logRegistration(`Duplicate registration attempt blocked. Email: ${email}, Phone: ${phone}`);
      res.status(400);
      throw new Error('Member already registered.');
    }

    // Step 3: Setup asynchronous S3 upload tasks
    const profileImageFile = getFileBuffer('profileImage', profileImage);
    const photoFile = getFileBuffer('photograph', photograph || profilePhoto);
    const aadhaarFile = getFileBuffer('aadhaarCard', aadhaarCard || aadhaarFront);
    const panFile = getFileBuffer('panCard', panCard);
    const bankFile = getFileBuffer('bankBcCertificate', bankBcCertificate || bankPassbook);
    const aadhaarBackFile = getFileBuffer('aadhaarBack', aadhaarBack);
    const signatureFile = getFileBuffer('signature', signature);
    const otherFile = getFileBuffer('otherDocuments', otherDocuments);

    // Validate Profile Image (Formats: JPG, JPEG, PNG; Size: Max 300 KB)
    if (profileImageFile) {
      validateDocument(profileImageFile, ['jpg', 'jpeg', 'png'], 300, 'Profile Image');
    }

    // Validate Photograph (Formats: JPG, JPEG, PNG; Size: Max 300 KB)
    if (photoFile) {
      validateDocument(photoFile, ['jpg', 'jpeg', 'png'], 300, 'Passport Photograph');
    }

    // Validate Documents (Formats: PDF, JPG, JPEG, PNG; Size: Max 2 MB)
    const docExts = ['pdf', 'jpg', 'jpeg', 'png'];
    if (aadhaarFile) validateDocument(aadhaarFile, docExts, 2048, 'Aadhaar Card');
    if (panFile) validateDocument(panFile, docExts, 2048, 'PAN Card');
    if (bankFile) validateDocument(bankFile, docExts, 2048, 'Bank BC Certificate');
    if (aadhaarBackFile) validateDocument(aadhaarBackFile, docExts, 2048, 'Aadhaar Card Back');
    if (signatureFile) validateDocument(signatureFile, docExts, 2048, 'Signature');
    if (otherFile) validateDocument(otherFile, docExts, 2048, 'Other Documents');

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
      educationalQualification, email, phone, 
      homeAddressVill, po, ps, district, pin, gramPanchayat, devBlock, 
      bcCspIdNo, ssa, bankName, linkBranchName, dateOfStartingCsp, 
      interestedToJoin, password,
      declarationAccepted: (declarationAccepted === true || declarationAccepted === 'true'),
      
      // System defaults
      role: 'member',
      status: 'Pending Approval',
      isActive: false,
      emailVerified: false,
      createdBy: 'Self Registration'
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
      registrationNumber: user.registrationNumber,
      receiptNumber: user.receiptNumber,
      emailSent,
      receiptGenerated,
      message: 'Registration successful. Waiting for admin approval.',
      status: user.status,
      
      // File urls for frontend previews
      photograph: user.photograph ? user.photograph.secure_url || user.photograph.url : '',
      aadhaarCard: user.aadhaarCard ? user.aadhaarCard.secure_url || user.aadhaarCard.url : '',
      panCard: user.panCard ? user.panCard.secure_url || user.panCard.url : '',
      bankBcCertificate: user.bankBcCertificate ? user.bankBcCertificate.secure_url || user.bankBcCertificate.url : '',
      
      // Legacy compliance keys
      Success: true,
      'Registration Number': user.registrationNumber,
      Message: 'Registration successful. Waiting for admin approval.',
      Status: user.status
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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'active') {
        res.status(403);
        throw new Error(`Your account status is currently: ${user.status}. Please contact an administrator.`);
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
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
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
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
  downloadReceipt,
  sendCardEmail
};
