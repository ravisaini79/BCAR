const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail, sendAdminAlertEmail } = require('../services/emailService');
const { uploadFromBuffer, deleteFromCloudinary } = require('../services/cloudinaryService');
const { logRegistration, logEmail, logError } = require('../utils/logger');
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
      aadhaarCard, panCard, photograph, bankBcCertificate,
      profilePhoto, aadhaarFront, aadhaarBack, bankPassbook, signature, otherDocuments
    } = req.body;

    // Helper to get buffer from file either in multipart files or body base64
    const getFileBuffer = (fieldName, bodyVal) => {
      if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
        const file = req.files[fieldName][0];
        return { buffer: file.buffer, filename: file.originalname };
      }
      if (bodyVal) {
        const { buffer, mimeType } = getBufferFromBase64(bodyVal);
        const filename = `${fieldName}_${email || 'member'}_${Date.now()}.${getExt(mimeType)}`;
        return { buffer, filename };
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
    // TODO: Re-enable document validations before going to production
    // if (!hasAadhaar) { res.status(400); throw new Error('Aadhaar Card document upload is required'); }
    // if (!hasPan)     { res.status(400); throw new Error('PAN Card document upload is required'); }
    // if (!hasPhoto)   { res.status(400); throw new Error('Photograph upload is required'); }
    // if (!hasBank)    { res.status(400); throw new Error('Bank Certificate or Passbook upload is required'); }
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

    // Step 3: Setup asynchronous Cloudinary upload tasks
    const uploadTasks = [];
    const uploadKeys = [];

    // Map photograph / profile photo
    const photoFile = getFileBuffer('photograph', photograph || profilePhoto);
    if (photoFile) {
      uploadTasks.push(uploadFromBuffer(photoFile.buffer, 'bcar/members/profile', photoFile.filename));
      uploadKeys.push('photograph'); // Current frontend key
    }

    // Map aadhaarCard / aadhaarFront
    const aadhaarFile = getFileBuffer('aadhaarCard', aadhaarCard || aadhaarFront);
    if (aadhaarFile) {
      uploadTasks.push(uploadFromBuffer(aadhaarFile.buffer, 'bcar/members/aadhaar', aadhaarFile.filename));
      uploadKeys.push('aadhaarCard'); // Current frontend key
    }

    // Map panCard
    const panFile = getFileBuffer('panCard', panCard);
    if (panFile) {
      uploadTasks.push(uploadFromBuffer(panFile.buffer, 'bcar/members/pan', panFile.filename));
      uploadKeys.push('panCard');
    }

    // Map bankBcCertificate / bankPassbook
    const bankFile = getFileBuffer('bankBcCertificate', bankBcCertificate || bankPassbook);
    if (bankFile) {
      uploadTasks.push(uploadFromBuffer(bankFile.buffer, 'bcar/members/documents', bankFile.filename));
      uploadKeys.push('bankBcCertificate'); // Current frontend key
    }

    // Additional requested fields
    const aadhaarBackFile = getFileBuffer('aadhaarBack', aadhaarBack);
    if (aadhaarBackFile) {
      uploadTasks.push(uploadFromBuffer(aadhaarBackFile.buffer, 'bcar/members/aadhaar', aadhaarBackFile.filename));
      uploadKeys.push('aadhaarBack');
    }
    const signatureFile = getFileBuffer('signature', signature);
    if (signatureFile) {
      uploadTasks.push(uploadFromBuffer(signatureFile.buffer, 'bcar/members/signature', signatureFile.filename));
      uploadKeys.push('signature');
    }
    const otherFile = getFileBuffer('otherDocuments', otherDocuments);
    if (otherFile) {
      uploadTasks.push(uploadFromBuffer(otherFile.buffer, 'bcar/members/documents', otherFile.filename));
      uploadKeys.push('otherDocuments');
    }

    // Execute uploads concurrently in buffer streams
    let results = [];
    try {
      results = await Promise.all(uploadTasks);
    } catch (uploadErr) {
      logError(`Cloudinary Upload Error for ${email}: ${uploadErr.message}`);
      res.status(500);
      throw new Error(`Upload Error: Failed to upload files to Cloudinary: ${uploadErr.message}`);
    }

    // Keep track of successfully uploaded files for fallback cleanup
    results.forEach((resItem) => uploadedFiles.push(resItem));

    // Step 4: Generate unique registration number
    let registrationNumber = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      registrationNumber = await generateRegNumber();
      const existingReg = await User.findOne({ registrationNumber });
      if (!existingReg) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      res.status(500);
      throw new Error('Database Error: Failed to generate a unique registration number');
    }

    // Compile member record data
    const memberData = {
      name, fatherHusbandName, dob, gender, maritalStatus, wifeHusbandName, 
      childrenSon: childrenSon ? parseInt(childrenSon, 10) : 0, 
      childrenDaughter: childrenDaughter ? parseInt(childrenDaughter, 10) : 0, 
      educationalQualification, email, phone, 
      homeAddressVill, po, ps, district, pin, gramPanchayat, devBlock, 
      bcCspIdNo, ssa, bankName, linkBranchName, dateOfStartingCsp, 
      interestedToJoin, admissionFee, perMonthMembershipFee, password,
      declarationAccepted: (declarationAccepted === true || declarationAccepted === 'true'),
      registrationNumber,
      
      // System defaults
      role: 'member',
      status: 'Pending Approval',
      isActive: false,
      emailVerified: false,
      createdBy: 'Self Registration'
    };

    // Assign Cloudinary file info matching the Mongoose schema structures
    results.forEach((cloudinaryMeta, idx) => {
      const key = uploadKeys[idx];
      memberData[key] = cloudinaryMeta;
      
      // Sync duplicate fields for compatibility (e.g. photograph -> profilePhoto)
      if (key === 'photograph') memberData['profilePhoto'] = cloudinaryMeta;
      if (key === 'aadhaarCard') memberData['aadhaarFront'] = cloudinaryMeta;
      if (key === 'bankBcCertificate') memberData['bankPassbook'] = cloudinaryMeta;
    });

    // Step 5: Save complete registration in MongoDB
    let user;
    try {
      user = await User.create(memberData);
    } catch (dbError) {
      // Step 6: If registration fails in DB, clean up uploaded files on Cloudinary
      logError(`Database save failed for ${email}. Triggering Cloudinary cleanup: ${dbError.message}`);
      for (const file of uploadedFiles) {
        try {
          await deleteFromCloudinary(file.public_id);
        } catch (cleanupErr) {
          logError(`Failed to clean up file ${file.public_id}: ${cleanupErr.message}`);
        }
      }
      throw dbError; // rethrow to errorHandler middleware
    }

    logRegistration(`Success: Registered user ${name} (${email}) with Registration No: ${registrationNumber}`);

    // Step 7: Send Welcome & Alert Emails
    try {
      await sendWelcomeEmail(email, name, registrationNumber);
      logEmail(`Welcome email dispatched to member: ${email}`);

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@bcarajasthan.org';
      await sendAdminAlertEmail(adminEmail, user);
      logEmail(`Admin alert email dispatched to admin: ${adminEmail}`);
    } catch (mailErr) {
      logError(`Nodemailer SMTP Error for ${email}: ${mailErr.message}`);
    }

    // Step 8: Return proper JSON responses containing Cloudinary secure URLs
    res.status(201).json({
      success: true,
      registrationNumber: user.registrationNumber,
      message: 'Registration successful. Waiting for admin approval.',
      status: user.status,
      
      // Cloudinary urls for frontend previews
      photograph: user.photograph ? user.photograph.secure_url : '',
      aadhaarCard: user.aadhaarCard ? user.aadhaarCard.secure_url : '',
      panCard: user.panCard ? user.panCard.secure_url : '',
      bankBcCertificate: user.bankBcCertificate ? user.bankBcCertificate.secure_url : '',
      
      // Compliance with exact capitalize/spaces keys
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

    const { photograph, aadhaarCard, panCard, bankBcCertificate } = req.body;
    const uploadTasks = [];
    const uploadKeys = [];

    // Setup tasks & delete old Cloudinary assets to avoid duplicate orphan files
    if (photograph) {
      if (member.photograph && member.photograph.public_id) {
        await deleteFromCloudinary(member.photograph.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(photograph);
      const filename = `profile_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFromBuffer(buffer, 'bcar/members/profile', filename));
      uploadKeys.push('photograph');
    }

    if (aadhaarCard) {
      if (member.aadhaarCard && member.aadhaarCard.public_id) {
        await deleteFromCloudinary(member.aadhaarCard.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(aadhaarCard);
      const filename = `aadhaar_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFromBuffer(buffer, 'bcar/members/aadhaar', filename));
      uploadKeys.push('aadhaarCard');
    }

    if (panCard) {
      if (member.panCard && member.panCard.public_id) {
        await deleteFromCloudinary(member.panCard.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(panCard);
      const filename = `pan_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFromBuffer(buffer, 'bcar/members/pan', filename));
      uploadKeys.push('panCard');
    }

    if (bankBcCertificate) {
      if (member.bankBcCertificate && member.bankBcCertificate.public_id) {
        await deleteFromCloudinary(member.bankBcCertificate.public_id);
      }
      const { buffer, mimeType } = getBufferFromBase64(bankBcCertificate);
      const filename = `bank_${member.email}_${Date.now()}.${getExt(mimeType)}`;
      uploadTasks.push(uploadFromBuffer(buffer, 'bcar/members/documents', filename));
      uploadKeys.push('bankBcCertificate');
    }

    const results = await Promise.all(uploadTasks);
    results.forEach((meta, idx) => {
      const key = uploadKeys[idx];
      member[key] = meta;
      
      // Sync duplicates
      if (key === 'photograph') member['profilePhoto'] = meta;
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

module.exports = {
  registerUser,
  updateMemberDocuments,
  loginUser,
  getUserProfile
};
