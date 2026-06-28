const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getNotices,
  createNotice,
  getStats,
  getMembers,
  updateMemberStatus,
  deleteMember,
  getGrievances,
  getAllGrievances,
  createGrievance,
  updateGrievanceStatus
} = require('../controllers/dashboardController');

// All routes require protection
router.use(protect);

router.route('/notices')
  .get(getNotices)
  .post(authorize('super_admin', 'admin', 'coordinator'), createNotice);

router.route('/stats')
  .get(authorize('super_admin', 'admin', 'coordinator'), getStats);

router.route('/members')
  .get(authorize('super_admin', 'admin', 'coordinator'), getMembers);

router.route('/members/:id/status')
  .put(authorize('super_admin', 'admin'), updateMemberStatus);

router.route('/members/:id')
  .delete(authorize('super_admin', 'admin'), deleteMember);

router.route('/grievances')
  .get(getGrievances)
  .post(authorize('member'), createGrievance);

router.route('/all-grievances')
  .get(authorize('super_admin', 'admin', 'coordinator'), getAllGrievances);

router.route('/grievances/:id/status')
  .put(authorize('super_admin', 'admin', 'coordinator'), updateGrievanceStatus);

module.exports = router;
