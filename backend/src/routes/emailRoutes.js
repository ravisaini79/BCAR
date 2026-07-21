const express = require('express');
const router = express.Router();
const { verifyTransporterHealth, sendMail } = require('../services/emailService');

/**
 * @route   GET /api/email-health
 * @desc    Get SMTP Health status and verify SMTP credentials / connection
 * @access  Public
 */
router.get('/email-health', async (req, res) => {
  try {
    const health = await verifyTransporterHealth();
    res.status(200).json({
      success: true,
      message: 'SMTP Email Service is healthy and connected.',
      health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'SMTP Connection verification failed',
      smtpCode: error.code || 'UNKNOWN',
      smtpResponse: error.response || 'No response details available',
      command: error.command || 'VERIFY'
    });
  }
});

/**
 * @route   GET /api/test-email
 * @desc    Send a simple test email to check SMTP delivery
 * @access  Public
 */
router.get('/test-email', async (req, res) => {
  try {
    // 1. Verify transporter health
    await verifyTransporterHealth();

    // 2. Determine target email (use ADMIN_EMAIL, contact receiver, or SMTP user)
    const targetEmail = req.query.to || process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'info@bcarajasthan.org';

    const testSubject = 'BCAR SMTP Test Email';
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BCAR SMTP Test</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; }
          .card { max-width: 500px; background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #0284c7; }
          h2 { color: #0284c7; margin-top: 0; }
          .timestamp { font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>BCAR SMTP Test Mail</h2>
          <p>This is a test email sent from the Business Correspondent Association Rajasthan (BCAR) portal to verify SMTP relay functionality.</p>
          <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>SMTP User:</strong> ${process.env.SMTP_USER}</p>
          <p class="timestamp">Sent on: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;

    const info = await sendMail({
      to: targetEmail,
      subject: testSubject,
      html: testHtml
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email',
      smtpCode: error.code || 'UNKNOWN',
      smtpResponse: error.response || 'No SMTP response available',
      command: error.command || 'SEND'
    });
  }
});

module.exports = router;
