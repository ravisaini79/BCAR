const Notice = require('../models/Notice');
const User = require('../models/User');
const Grievance = require('../models/Grievance');
const { sendApprovalEmail } = require('../services/emailService');
const { logRegistration, logEmail, logError } = require('../utils/logger');
const crypto = require('crypto');


// @desc    Get all notices
// @route   GET /api/dashboard/notices
// @access  Private
const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find({}).sort({ publishedAt: -1 });
    res.json(notices);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new notice
// @route   POST /api/dashboard/notices
// @access  Private (Admin/Super Admin/Coordinator)
const createNotice = async (req, res, next) => {
  try {
    const { title, body, category } = req.body;
    const notice = await Notice.create({ title, body, category });
    res.status(201).json(notice);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a notice
// @route   PUT /api/dashboard/notices/:id
// @access  Private (Admin/Super Admin/Coordinator)
const updateNotice = async (req, res, next) => {
  try {
    const { title, body, category } = req.body;
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, body, category },
      { new: true, runValidators: true }
    );
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json(notice);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notice
// @route   DELETE /api/dashboard/notices/:id
// @access  Private (Admin/Super Admin/Coordinator)
const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private (Admin/Super Admin/Coordinator)
const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalMembers, activeMembers, pendingMembers, rejectedMembers, todayRegistrations, monthlyRegistrations] =
      await Promise.all([
        User.countDocuments({ role: 'member' }),
        User.countDocuments({ role: 'member', status: { $in: ['active', 'Approved'] } }),
        User.countDocuments({ role: 'member', status: { $in: ['pending', 'Pending Approval'] } }),
        User.countDocuments({ role: 'member', status: 'rejected' }),
        User.countDocuments({ role: 'member', createdAt: { $gte: today } }),
        User.countDocuments({ role: 'member', createdAt: { $gte: monthStart } }),
      ]);

    res.json({ totalMembers, activeMembers, pendingMembers, rejectedMembers, todayRegistrations, monthlyRegistrations });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all members (Server-Side Pagination, Filtering & Search for 100K+ Scale)
// @route   GET /api/dashboard/members
// @access  Private (Admin/Super Admin/Coordinator)
const getMembers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      district = '', 
      status = '', 
      sortBy = 'joinedAt', 
      sortOrder = 'desc',
      all = 'false'
    } = req.query;

    const query = { role: 'member' };

    // District filter
    if (district && district !== 'All') {
      query.district = district;
    }

    // Status filter
    if (status && status !== 'All') {
      if (status === 'Approved' || status === 'active') {
        query.status = { $in: ['active', 'Approved'] };
      } else if (status === 'pending' || status === 'Pending Approval') {
        query.status = { $in: ['pending', 'Pending Approval'] };
      } else {
        query.status = status;
      }
    }

    // Server-side Search across indexed fields
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { registrationNumber: searchRegex },
        { membershipNo: searchRegex },
        { bcCspIdNo: searchRegex },
        { aadhaarNumber: searchRegex },
        { district: searchRegex }
      ];
    }

    // Backward compatibility: If explicitly requested all=true (for export reports)
    if (all === 'true') {
      const members = await User.find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .lean();
      return res.json(members);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [members, totalCount] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        members,
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages
      },
      // Array top-level property for backward compatibility with Angular array iterations
      members,
      totalCount,
      page: pageNum,
      totalPages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member status
// @route   PUT /api/dashboard/members/:id/status
// @access  Private (Admin/Super Admin)
const updateMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const member = await User.findById(req.params.id);

    if (member) {
      const oldStatus = member.status;
      member.status = status;

      // Handle Admin Approval Flow
      if ((status === 'active' || status === 'Approved') && (oldStatus !== 'active' && oldStatus !== 'Approved')) {
        member.isActive = true;
        
        // Generate membership number if not already present
        if (!member.membershipNo) {
          const count = await User.countDocuments({ status: { $in: ['active', 'Approved'] }, role: 'member' });
          member.membershipNo = `BCAR/RJ/${String(count + 1).padStart(4, '0')}`;
        }

        // Generate temporary secure password (12 character alphanumeric string)
        const tempPassword = crypto.randomBytes(6).toString('hex');
        member.password = tempPassword; // hashed automatically pre-save
        
        // Save database record first to ensure validity
        await member.save();
        logRegistration(`Admin Approved member: ${member.name} (${member.email}). Generated membershipNo: ${member.membershipNo}`);

        // Dispatch Approval Email with temporary password credentials
        try {
          await sendApprovalEmail(member.email, member.name, member.registrationNumber || 'N/A', member.membershipNo, tempPassword);
          logEmail(`Approved credentials email sent to ${member.email}`);
        } catch (mailErr) {
          logError(`SMTP error sending approval email to ${member.email}: ${mailErr.message}`);
        }
      } else {
        // Suspend, reject, or other states
        if (status === 'suspended' || status === 'rejected') {
          member.isActive = false;
        }
        await member.save();
        logRegistration(`Admin updated member status to: ${status} for ${member.name}`);
      }

      res.json({ message: 'Member status updated successfully', member });
    } else {
      res.status(404);
      throw new Error('Member not found');
    }
  } catch (error) {
    logError(`updateMemberStatus exception: ${error.message}`);
    next(error);
  }
};

// @desc    Update member profile (Edit Profile)
// @route   PUT /api/dashboard/members/:id
// @access  Private (Member / Admin)
const updateMemberProfile = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      res.status(404);
      throw new Error('Member profile not found');
    }

    // Security check: member can only update own profile unless admin/super_admin
    if (req.user.role === 'member' && req.user._id.toString() !== member._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this profile');
    }

    const fieldsToUpdate = [
      'name', 'fatherHusbandName', 'dob', 'gender', 'maritalStatus', 'wifeHusbandName',
      'childrenSon', 'childrenDaughter', 'educationalQualification', 'bloodGroup', 'aadhaarNumber',
      'phone', 'email', 'homeAddressVill', 'po', 'ps', 'district', 'pin',
      'gramPanchayat', 'devBlock', 'subDistrict', 'bcCspIdNo', 'ssa', 'bankName',
      'linkBranchName', 'dateOfStartingCsp', 'photograph', 'profilePhoto'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        member[field] = req.body[field];
      }
    });

    const updatedUser = await member.save();
    logRegistration(`Profile updated for member: ${updatedUser.name} (${updatedUser.email})`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logError(`updateMemberProfile exception: ${error.message}`);
    next(error);
  }
};

// @desc    Delete a member
// @route   DELETE /api/dashboard/members/:id
// @access  Private (Admin/Super Admin)
const deleteMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (member) {
      const name = member.name;
      const email = member.email;

      // Delete member images and documents from S3 before DB deletion
      const documentFields = [
        'photograph', 'aadhaarCard', 'panCard', 'bankBcCertificate',
        'profilePhoto', 'aadhaarFront', 'aadhaarBack', 'bankPassbook',
        'signature', 'otherDocuments'
      ];

      for (const field of documentFields) {
        if (member[field] && (member[field].key || member[field].public_id)) {
          try {
            await deleteFile(member[field].key || member[field].public_id);
          } catch (delErr) {
            logError(`Failed to delete S3 file ${field} for member ${email}: ${delErr.message}`);
          }
        }
      }

      await member.deleteOne();
      logRegistration(`Admin deleted member: ${name} (${email})`);
      res.json({ message: 'Member deleted successfully' });
    } else {
      res.status(404);
      throw new Error('Member not found');
    }
  } catch (error) {
    logError(`deleteMember exception: ${error.message}`);
    next(error);
  }
};

// @desc    Get grievances
// @route   GET /api/dashboard/grievances
// @access  Private
const getGrievances = async (req, res, next) => {
  try {
    let grievances;
    if (req.user.role === 'member') {
      grievances = await Grievance.find({ memberId: req.user._id }).sort({ createdAt: -1 });
    } else {
      grievances = await Grievance.find({}).sort({ createdAt: -1 });
    }
    res.json(grievances);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all grievances (admin only)
// @route   GET /api/dashboard/all-grievances
// @access  Private (Admin/Super Admin/Coordinator)
const getAllGrievances = async (req, res, next) => {
  try {
    const grievances = await Grievance.find({}).sort({ createdAt: -1 });
    res.json(grievances);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new grievance
// @route   POST /api/dashboard/grievances
// @access  Private (Member only)
const createGrievance = async (req, res, next) => {
  try {
    const { subject, description } = req.body;
    const grievance = await Grievance.create({
      memberId: req.user._id,
      memberName: req.user.name,
      subject,
      description,
      status: 'open'
    });
    res.status(201).json(grievance);
  } catch (error) {
    next(error);
  }
};

// @desc    Update grievance status
// @route   PUT /api/dashboard/grievances/:id/status
// @access  Private (Admin/Super Admin/Coordinator)
const updateGrievanceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const grievance = await Grievance.findById(req.params.id);

    if (grievance) {
      grievance.status = status;
      await grievance.save();
      res.json({ message: 'Grievance status updated successfully', grievance });
    } else {
      res.status(404);
      throw new Error('Grievance not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getStats,
  getMembers,
  updateMemberStatus,
  updateMemberProfile,
  deleteMember,
  getGrievances,
  getAllGrievances,
  createGrievance,
  updateGrievanceStatus
};
