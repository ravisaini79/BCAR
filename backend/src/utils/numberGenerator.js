const User = require('../models/User');

/**
 * Generates the next sequential Registration Number in the format BCAR-YYYY-XXXXXX
 * @returns {Promise<string>}
 */
const generateRegistrationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPattern = new RegExp(`^BCAR-${currentYear}-`);
  
  const lastUser = await User.findOne({
    registrationNumber: yearPattern
  }).sort({ registrationNumber: -1 });

  let nextSeq = 1;
  if (lastUser && lastUser.registrationNumber) {
    const parts = lastUser.registrationNumber.split('-');
    // Expected format: BCAR-2026-000001
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(6, '0');
  return `BCAR-${currentYear}-${paddedSeq}`;
};

/**
 * Generates the next sequential Receipt Number in the format BCAR-RCP-YYYY-XXXXXX
 * @returns {Promise<string>}
 */
const generateReceiptNumber = async () => {
  const currentYear = new Date().getFullYear();
  const yearPattern = new RegExp(`^BCAR-RCP-${currentYear}-`);
  
  const lastUser = await User.findOne({
    receiptNumber: yearPattern
  }).sort({ receiptNumber: -1 });

  let nextSeq = 1;
  if (lastUser && lastUser.receiptNumber) {
    const parts = lastUser.receiptNumber.split('-');
    // Expected format: BCAR-RCP-2026-000001
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(6, '0');
  return `BCAR-RCP-${currentYear}-${paddedSeq}`;
};

module.exports = {
  generateRegistrationNumber,
  generateReceiptNumber
};
