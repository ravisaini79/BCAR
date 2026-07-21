const nodemailer = require('nodemailer');
const { memberWelcomeTemplate, adminAlertTemplate } = require('../templates/emailTemplates');

// Structured Logger
const emailLogger = {
  info: (message, meta = {}) => {
    console.log(`[EMAIL INFO] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
  },
  error: (message, error = {}) => {
    console.error(`[EMAIL ERROR] [${new Date().toISOString()}] ${message}`, {
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
      stack: error.stack
    });
  },
  debug: (message, meta = {}) => {
    console.log(`[EMAIL DEBUG] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
  }
};

// Validate Environment Variables
const validateConfig = () => {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missing = [];
  required.forEach(key => {
    if (!process.env[key] || !process.env[key].trim()) {
      missing.push(key);
    }
  });
  if (missing.length > 0) {
    throw new Error(`SMTP Configuration Missing required keys: ${missing.join(', ')}`);
  }
};

// Validate Email Address Format
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// Helper to extract email address from "Name <email@domain.com>" format
const extractEmail = (emailStr) => {
  if (!emailStr) return '';
  const match = emailStr.match(/<([^>]+)>/);
  return match ? match[1].trim() : emailStr.trim();
};

// Validate Sender
const validateSender = (fromStr) => {
  const fromEmail = extractEmail(fromStr);
  const authEmail = extractEmail(process.env.SMTP_USER);
  if (fromEmail.toLowerCase() !== authEmail.toLowerCase()) {
    throw new Error(`Sender Validation Failed: FROM address (${fromEmail}) must match Authenticated SMTP User (${authEmail}) to prevent delivery rejection.`);
  }
};

// Validate Attachments
const validateAttachments = (attachments) => {
  if (!attachments || !Array.isArray(attachments)) return;
  attachments.forEach((att, idx) => {
    if (!att.filename) {
      throw new Error(`Attachment [Index ${idx}]: missing filename`);
    }
    if (!att.content && !att.path) {
      throw new Error(`Attachment [${att.filename}]: missing content or file path`);
    }
    // Check size if content is buffer
    if (att.content && Buffer.isBuffer(att.content)) {
      const sizeMB = att.content.length / (1024 * 1024);
      if (sizeMB > 10) {
        throw new Error(`Attachment [${att.filename}] exceeds 10MB size limit (Current: ${sizeMB.toFixed(2)} MB)`);
      }
      emailLogger.info(`Attachment validated: ${att.filename} (${sizeMB.toFixed(2)} MB)`);
    } else {
      emailLogger.info(`Attachment validated: ${att.filename}`);
    }
  });
};

// Sleep helper for retry backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is temporary (e.g. rate limit, connection timeout, network issue)
const isTemporarySmtpError = (error) => {
  const tempCodes = ['ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'EADDRINUSE', 'ECONNREFUSED'];
  if (tempCodes.includes(error.code)) return true;
  
  // SMTP Response Code check (4xx codes are temporary)
  if (error.responseCode) {
    const code = parseInt(error.responseCode, 10);
    if (code >= 400 && code < 500) return true;
  }
  return false;
};

// Setup Nodemailer Transporter cache
let transporterInstance = null;

const getTransporter = () => {
  if (transporterInstance) return transporterInstance;

  validateConfig();

  const host = process.env.SMTP_HOST.trim();
  const port = parseInt(process.env.SMTP_PORT.trim(), 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  emailLogger.info(`Initializing Nodemailer Transporter with host=${host}, port=${port}, secure=${secure}`);

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim()
    },
    logger: true, // Detailed SMTP logging
    debug: true,  // SMTP debug info
    tls: {
      rejectUnauthorized: false // GoDaddy/Titan Email STARTTLS compatibility
    }
  });

  return transporterInstance;
};

// Verify Connection Status
const verifyTransporterHealth = async () => {
  validateConfig();
  const transporter = getTransporter();
  try {
    await transporter.verify();
    emailLogger.info('SMTP Connected, Authentication Success, SMTP Ready.');
    return {
      connected: true,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      tls: process.env.SMTP_SECURE === 'true' ? 'SSL/TLS' : 'STARTTLS',
      user: process.env.SMTP_USER
    };
  } catch (error) {
    emailLogger.error('SMTP Verification Connection Failed', error);
    throw error;
  }
};

// Core Send Mail handler with Validations & retry logic
const sendMail = async (options) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    emailLogger.info(`[EMAIL BYPASSED] To: ${options.to}, Subject: ${options.subject}`);
    return {
      success: true,
      message: 'Email bypassed successfully (DISABLE_EMAIL=true)',
      messageId: `disabled-mock-${Date.now()}`,
      accepted: [options.to],
      rejected: []
    };
  }

  // 1. Validate Config & Inputs
  validateConfig();

  const fromAddress = process.env.SMTP_FROM || `"BCAR Support" <${process.env.SMTP_USER}>`;
  validateSender(fromAddress);

  if (!options.to || !isValidEmail(options.to)) {
    throw new Error(`Recipient Validation Failed: ${options.to || 'missing'} is not a valid email address.`);
  }

  validateAttachments(options.attachments);

  const mailOptions = {
    from: fromAddress,
    to: options.to.trim(),
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || []
  };

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const startTime = Date.now();
    try {
      emailLogger.info(`Sending email to ${options.to} (Attempt ${attempt}/${maxAttempts})`, { subject: options.subject });
      
      const transporter = getTransporter();
      const info = await transporter.sendMail(mailOptions);
      
      const duration = Date.now() - startTime;
      emailLogger.info(`Email sent successfully in ${duration}ms`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      emailLogger.error(`Attempt ${attempt}/${maxAttempts} failed in ${duration}ms to ${options.to}`, error);
      
      // If it's a temporary error and we have remaining attempts, retry with exponential backoff
      if (isTemporarySmtpError(error) && attempt < maxAttempts) {
        const backoffDelay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 200);
        emailLogger.info(`Temporary failure detected. Retrying in ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      } else {
        // Permanent failure or max attempts reached, propagate error
        throw error;
      }
    }
  }
};

/**
 * Business Logic templates wrapping
 */
const sendWelcomeEmail = async (memberEmail, name, regNumber) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to BCAR</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 20px; }
        .container { max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin: 0 auto; }
        .header { background-color: #0B2D5C; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .logo { width: 70px; height: 70px; border-radius: 50%; background: #ffffff; padding: 2px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
        .title { color: #0B2D5C; font-size: 22px; font-weight: 700; margin-top: 0; }
        .reg-box { background-color: #F8FAFC; border-left: 4px solid #D4AF37; padding: 15px 20px; margin: 25px 0; border-radius: 4px; }
        .reg-box p { margin: 6px 0; font-size: 14.5px; }
        .reg-box .reg-num { font-weight: bold; color: #0B2D5C; }
        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://bcarajasthan.org/images/bcar-logo.jpeg" onerror="this.src='https://placehold.co/100x100/0b2d5c/ffffff?text=BCAR'" class="logo" alt="BCAR Logo">
        </div>
        <div class="content">
          <h2 class="title">Welcome to BCAR</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for registering with the <strong>Business Correspondent Association Rajasthan (BCAR)</strong>.</p>
          <p>Your application has been successfully received and is currently under review by our executive committee.</p>
          
          <div class="reg-box">
            <p><strong>Registration Number:</strong> <span class="reg-num">${regNumber}</span></p>
            <p><strong>Current Status:</strong> <span style="color: #D4AF37; font-weight: bold;">Pending Approval</span></p>
          </div>

          <p>Our committee will verify your uploaded documents. You will receive another notification email once your membership status is approved.</p>
          <p>If you have any queries, please reach out to our Help Desk.</p>
          <br>
          <p>Regards,<br><strong>BCAR Executive Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Business Correspondent Association Rajasthan. All Rights Reserved.</p>
          <p>Harshita Communications, 24 Kishore Vihar-B, Gajsinghpura, Gopalpura Bypass, Jaipur, RJ</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendMail({ to: memberEmail, subject: 'Welcome to BCAR - Registration Received', html });
};

const sendAdminAlertEmail = async (adminEmail, member) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Member Registration Alert</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #F3F4F6; }
        .card { max-width: 600px; background: #fff; padding: 30px; border-radius: 8px; border-top: 5px solid #0B2D5C; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        h3 { color: #0B2D5C; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 14px; }
        th { color: #4B5563; font-weight: bold; width: 180px; }
        .btn { display: inline-block; background-color: #0B2D5C; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin-top: 15px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>New Member Registration Alert</h3>
        <p>A new member application has been submitted on the BCAR portal. Please review the details below:</p>
        <table>
          <tr><th>Member Name:</th><td>${member.name}</td></tr>
          <tr><th>Registration Number:</th><td><strong>${member.registrationNumber}</strong></td></tr>
          <tr><th>Mobile Number:</th><td>${member.phone}</td></tr>
          <tr><th>Email Address:</th><td>${member.email}</td></tr>
          <tr><th>Registration Date:</th><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
        </table>
        <a href="http://127.0.0.1:4200/dashboard" class="btn">View Member Profile</a>
      </div>
    </body>
    </html>
  `;
  return sendMail({ to: adminEmail, subject: `New Member Registration Alert - ${member.registrationNumber}`, html });
};

const sendApprovalEmail = async (memberEmail, name, regNumber, membershipNo, tempPassword) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Membership Approved - BCAR</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 20px; }
        .container { max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin: 0 auto; }
        .header { background-color: #0B2D5C; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .logo { width: 70px; height: 70px; border-radius: 50%; background: #ffffff; padding: 2px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
        .title { color: #16A34A; font-size: 22px; font-weight: 700; margin-top: 0; }
        .creds-box { background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 18px 20px; margin: 25px 0; border-radius: 6px; }
        .creds-box p { margin: 6px 0; font-size: 14px; }
        .creds-box strong { color: #1E293B; }
        .btn { display: inline-block; background-color: #0B2D5C; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; margin-top: 15px; font-size: 14.5px; border-bottom: 2px solid #D4AF37; transition: background 0.2s; }
        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://bcarajasthan.org/images/bcar-logo.jpeg" onerror="this.src='https://placehold.co/100x100/0b2d5c/ffffff?text=BCAR'" class="logo" alt="BCAR Logo">
        </div>
        <div class="content">
          <h2 class="title">Congratulations! Membership Approved</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>We are pleased to inform you that your application for membership in the <strong>Business Correspondent Association Rajasthan (BCAR)</strong> has been approved by the committee.</p>
          <p>Your official credentials and account access details are listed below:</p>
          
          <div class="creds-box">
            <p><strong>Registration Number:</strong> ${regNumber}</p>
            <p><strong>Official Membership ID:</strong> <span style="color: #0B2D5C; font-weight: bold;">${membershipNo}</span></p>
            <p><strong>Username (Login Email):</strong> ${memberEmail}</p>
            <p><strong>Temporary Login Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; background: #DBEAFE; padding: 2px 6px; border-radius: 4px; color: #1E40AF;">${tempPassword}</span></p>
          </div>

          <p>For security, please log in to the portal and change your password immediately after your first sign-in.</p>
          
          <center>
            <a href="http://127.0.0.1:4200/login" class="btn">Access Member Portal</a>
          </center>

          <br>
          <p>Regards,<br><strong>BCAR Executive Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Business Correspondent Association Rajasthan. All Rights Reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendMail({ to: memberEmail, subject: 'Congratulations! Your BCAR Membership has been Approved', html });
};

const sendContactQueryEmail = async (name, email, phone, message) => {
  const recipient = process.env.CONTACT_RECEIVER_EMAIL || process.env.ADMIN_EMAIL || 'info@bcarajasthan.org';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Query - BCAR</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #F3F4F6; }
        .card { max-width: 600px; background: #fff; padding: 30px; border-radius: 8px; border-top: 5px solid #D4AF37; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        h3 { color: #0B2D5C; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: left; font-size: 14px; }
        th { color: #4B5563; font-weight: bold; width: 150px; }
        .message-box { background: #F8FAFC; padding: 15px; border-radius: 6px; border: 1px solid #E2E8F0; font-style: italic; white-space: pre-line; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>New Contact Query Received</h3>
        <p>A user has submitted the contact form on the BCAR portal. Details are below:</p>
        <table>
          <tr><th>Name:</th><td>${name}</td></tr>
          <tr><th>Email:</th><td>${email}</td></tr>
          <tr><th>Phone:</th><td>${phone}</td></tr>
        </table>
        <h4>Message Details:</h4>
        <div class="message-box">${message}</div>
      </div>
    </body>
    </html>
  `;
  return sendMail({ to: recipient, subject: `New Contact Form Query from ${name}`, html });
};

const sendRegistrationWelcomeWithReceiptEmail = async (member, pdfBuffer) => {
  const html = memberWelcomeTemplate(member);
  const pdfName = `BCAR_Receipt_${member.registrationNumber || 'Registration'}.pdf`;
  return sendMail({
    to: member.email,
    subject: 'BCAR Membership Registration Successfully Submitted',
    html,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
};

const sendAdminAlertRegistrationEmail = async (member) => {
  const html = adminAlertTemplate(member);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bcarajasthan.org';
  return sendMail({ to: adminEmail, subject: 'New BCAR Membership Registration', html });
};

const sendCardImageEmail = async (email, name, membershipNo, imageBuffer) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your BCAR CSP Franchisee ID Card</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 20px; }
        .container { max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin: 0 auto; }
        .header { background-color: #0B2D5C; padding: 30px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
        .title { color: #0B2D5C; font-size: 22px; font-weight: 700; margin-top: 0; }
        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="color: #ffffff; margin: 0;">BCAR ID Card Issued</h2>
        </div>
        <div class="content">
          <h2 class="title">Digital ID Card Delivery</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your official <strong>BCAR CSP Franchisee ID Card</strong> has been generated and issued.</p>
          <p>We have attached the digital copy of your ID Card (Front and Back sides stacked) as a PNG image to this email. You can download, print, and laminate it for official use.</p>
          <p><strong>Membership Number:</strong> ${membershipNo}</p>
          <br>
          <p>Regards,<br><strong>BCAR Executive Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Business Correspondent Association Rajasthan. All Rights Reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendMail({
    to: email,
    subject: `Your BCAR CSP Franchisee ID Card - ${membershipNo}`,
    html,
    attachments: [
      {
        filename: `BCAR_ID_Card_${membershipNo}.png`,
        content: imageBuffer,
        contentType: 'image/png'
      }
    ]
  });
};

module.exports = {
  verifyTransporterHealth,
  sendMail,
  sendWelcomeEmail,
  sendAdminAlertEmail,
  sendApprovalEmail,
  sendContactQueryEmail,
  sendRegistrationWelcomeWithReceiptEmail,
  sendAdminAlertRegistrationEmail,
  sendCardImageEmail
};
