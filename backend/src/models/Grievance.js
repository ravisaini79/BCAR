const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  memberName: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-review', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Grievance', grievanceSchema);
