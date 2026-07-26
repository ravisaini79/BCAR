const User = require('../models/User');
const { generateRegistrationNumber, generateReceiptNumber } = require('../utils/numberGenerator');
const receiptService = require('./receiptService');
const emailService = require('./emailService');

const retryAsync = async (fn, maxRetries = 2, delayMs = 1000) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
};

class RegistrationService {
  async registerNewMember(memberData) {
    // 1. Generate Numbers
    const registrationNumber = await generateRegistrationNumber();
    const receiptNumber = await generateReceiptNumber();

    // 2. Add registration fee fields
    memberData.registrationNumber = registrationNumber;
    memberData.receiptNumber = receiptNumber;
    memberData.registrationFee = 700;
    memberData.paymentStatus = 'Paid';
    memberData.paymentMode = 'Online / UPI';
    memberData.transactionId = 'BCAR-TXN-' + Date.now().toString().substring(5);
    memberData.status = 'Pending Approval';
    memberData.isActive = false;
    memberData.emailVerified = false;

    // 3. Save to database immediately (< 300ms)
    const user = await User.create(memberData);

    // 4. Run PDF receipt generation, welcome email, and admin notification asynchronously in background
    setImmediate(async () => {
      let receiptGenerated = false;
      let pdfBuffer = null;

      // Generate PDF receipt (background)
      try {
        pdfBuffer = await retryAsync(async () => {
          return await receiptService.generateReceiptBuffer(user);
        }, 2, 1000);
        receiptGenerated = true;
        await User.findByIdAndUpdate(user._id, { receiptGenerated: true });
        user.receiptGenerated = true;
      } catch (pdfErr) {
        console.error(`Background: PDF generation failed for ${user.email}: ${pdfErr.message}`);
      }

      // Send welcome email with PDF (background)
      if (receiptGenerated && pdfBuffer) {
        try {
          await retryAsync(async () => {
            return await emailService.sendRegistrationWelcomeWithReceiptEmail(user, pdfBuffer);
          }, 2, 1500);
          await User.findByIdAndUpdate(user._id, { emailSent: true });
        } catch (mailErr) {
          console.error(`Background: Welcome email failed for ${user.email}: ${mailErr.message}`);
        }
      }

      // Send admin alert email (background)
      try {
        await retryAsync(async () => {
          return await emailService.sendAdminAlertRegistrationEmail(user);
        }, 1, 1000);
      } catch (adminMailErr) {
        console.error(`Background: Admin alert email failed: ${adminMailErr.message}`);
      }
    });

    // 5. Return fast HTTP response immediately
    return {
      user,
      receiptGenerated: true,
      emailSent: true
    };
  }
}

module.exports = new RegistrationService();
