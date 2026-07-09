const nodemailer = require('nodemailer');
const { memberWelcomeTemplate, adminAlertTemplate } = require('../templates/emailTemplates');

// Setup Nodemailer Transporter
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('Nodemailer SMTP Transporter configured successfully.');
} else {
  // Mock transporter for local test fallbacks
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n=======================================');
      console.log('       MOCK EMAIL LOG SERVICE          ');
      console.log('=======================================');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('---------------------------------------');
      console.log('Content Summary:\n', mailOptions.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 300) + '...');
      console.log('=======================================\n');
      return { messageId: 'mock-' + Date.now() };
    }
  };
  console.log('Nodemailer SMTP details missing. Falling back to Mock Console logging.');
}

const sendMail = async (options) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log(`[EMAIL BYPASSED] To: ${options.to}, Subject: ${options.subject}`);
    return { messageId: 'disabled-mock-' + Date.now() };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"BCAR Admin" <info@bcarajasthan.org>',
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || []
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email log: Sent successfully. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Email log: Failed to send email to ${options.to}. Error: ${error.message}`);
    throw error; // Propagate error for proper JSON feedback
  }
};

/**
 * Send Generated Member Card via Email
 */
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

/**
 * 1. Email to Member: Welcome to BCAR
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
  
  return sendMail({
    to: memberEmail,
    subject: 'Welcome to BCAR - Registration Received',
    html
  });
};

/**
 * 2. Email to Admin: New Member Alert
 */
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

  return sendMail({
    to: adminEmail,
    subject: `New Member Registration Alert - ${member.registrationNumber}`,
    html
  });
};

/**
 * 3. Email to Member: Approved & Credentials
 */
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
        .btn { display: inline-block; background-color: #0B2D5C; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; margin-top: 15px; font-size: 14.5px; border-bottom: 2px solid #D4AF37; }
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

  return sendMail({
    to: memberEmail,
    subject: 'Congratulations! Your BCAR Membership has been Approved',
    html
  });
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

  return sendMail({
    to: recipient,
    subject: `New Contact Form Query from ${name}`,
    html
  });
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
  
  return sendMail({
    to: adminEmail,
    subject: 'New BCAR Membership Registration',
    html
  });
};

module.exports = {
  sendWelcomeEmail,
  sendAdminAlertEmail,
  sendApprovalEmail,
  sendContactQueryEmail,
  sendRegistrationWelcomeWithReceiptEmail,
  sendAdminAlertRegistrationEmail,
  sendCardImageEmail
};
