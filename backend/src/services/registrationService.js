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
    memberData.registrationFee = 600;
    memberData.paymentStatus = 'Paid';
    memberData.paymentMode = 'Online / UPI';
    memberData.transactionId = 'BCAR-TXN-' + Date.now().toString().substring(5);
    memberData.status = 'Pending Approval';
    memberData.isActive = false;
    memberData.emailVerified = false;

    // 3. Save to database
    const user = await User.create(memberData);
    let receiptGenerated = false;
    let emailSent = false;
    let pdfBuffer = null;

    // 4. Generate PDF receipt (with retry)
    try {
      pdfBuffer = await retryAsync(async () => {
        return await receiptService.generateReceiptBuffer(user);
      }, 2, 1000);
      receiptGenerated = true;
      
      // Update receipt generated status
      await User.findByIdAndUpdate(user._id, { receiptGenerated: true });
      user.receiptGenerated = true;
    } catch (pdfErr) {
      console.error(`RegistrationService: PDF generation failed for ${user.email} after retries: ${pdfErr.message}`);
      // Member data is still saved, we proceed
    }

    // 5. Send welcome email with PDF (with retry)
    if (receiptGenerated && pdfBuffer) {
      try {
        await retryAsync(async () => {
          return await emailService.sendRegistrationWelcomeWithReceiptEmail(user, pdfBuffer);
        }, 2, 1500);
        emailSent = true;
        
        // Update email sent status
        await User.findByIdAndUpdate(user._id, { emailSent: true });
        user.emailSent = true;
      } catch (mailErr) {
        console.error(`RegistrationService: Welcome email sending failed for ${user.email} after retries: ${mailErr.message}`);
      }
    }

    // 6. Send admin alert email (with retry)
    try {
      await retryAsync(async () => {
        return await emailService.sendAdminAlertRegistrationEmail(user);
      }, 1, 1000);
    } catch (adminMailErr) {
      console.error(`RegistrationService: Admin alert email failed: ${adminMailErr.message}`);
    }

    return {
      user,
      receiptGenerated,
      emailSent,
      pdfBuffer
    };
  }
}

module.exports = new RegistrationService();
