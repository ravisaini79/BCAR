const memberWelcomeTemplate = (member) => {
  const regNumber = member.registrationNumber || 'Pending';
  const name = member.name || '';
  const dateStr = new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BCAR Membership Registration Successfully Submitted</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(11, 45, 92, 0.08); margin: 0 auto; border: 1px solid #E2E8F0; }
        .header { background-color: #0B2D5C; padding: 35px 20px; text-align: center; border-bottom: 4px solid #D4AF37; }
        .logo { width: 75px; height: 75px; border-radius: 50%; background: #ffffff; padding: 3px; border: 1px solid rgba(255,255,255,0.2); }
        .content { padding: 40px 35px; color: #334155; line-height: 1.7; }
        .title { color: #0B2D5C; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 20px; }
        .intro { font-size: 15px; margin-bottom: 25px; }
        .details-card { background-color: #F8FAFC; border: 1px solid #EEF2F6; border-radius: 12px; padding: 25px; margin: 25px 0; }
        .details-card h3 { color: #0B2D5C; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14.5px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #64748B; font-weight: 500; }
        .info-value { color: #0f172a; font-weight: 700; text-align: right; }
        .status-badge { display: inline-block; padding: 3px 10px; background-color: #FFF8E8; color: #D4AF37; border-radius: 50px; font-size: 12px; font-weight: 700; border: 1px solid rgba(212, 175, 55, 0.2); }
        .cta-container { text-align: center; margin: 35px 0; }
        .cta-btn { display: inline-block; background-color: #0B2D5C; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 700; font-size: 14.5px; border-bottom: 3px solid #D4AF37; transition: background 0.2s; }
        .help-box { background-color: #F1F5F9; border-left: 4px solid #0B2D5C; padding: 15px 20px; border-radius: 0 8px 8px 0; font-size: 13.5px; color: #475569; margin: 30px 0; }
        .footer { background-color: #0B2D5C; padding: 30px; text-align: center; font-size: 12px; color: #cbd5e1; border-top: 4px solid #D4AF37; }
        .footer-logo { width: 50px; height: 50px; border-radius: 50%; background: #ffffff; padding: 2px; margin-bottom: 15px; }
        .footer p { margin: 6px 0; }
        .footer a { color: #D4AF37; text-decoration: none; font-weight: 600; }
        .socials { margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="cid:bcarlogo" class="logo" alt="BCAR Logo">
        </div>
        <div class="content">
          <h2 class="title">Welcome to BCAR Association</h2>
          <p class="intro">Dear <strong>${name}</strong>,</p>
          <p>Thank you for registering with the <strong>Business Correspondent Association Rajasthan (BCAR)</strong>. Your application has been successfully submitted and is under verification by our executive committee.</p>
          <p>We have successfully received your registration fee of <strong>₹700</strong> (₹100 Registration + ₹600 Annual Membership). Your official receipt is generated and attached to this email for your records.</p>
          
          <div class="details-card">
            <h3>Registration Details</h3>
            <div class="info-row">
              <span class="info-label">Member Name</span>
              <span class="info-value">${name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration Number</span>
              <span class="info-value" style="color: #0B2D5C">${regNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Submission Date</span>
              <span class="info-value">${dateStr}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Registration Fee</span>
              <span class="info-value">₹700.00 (Paid)</span>
            </div>
            <div class="info-row" style="align-items: center;">
              <span class="info-label">Registration Status</span>
              <span class="info-value"><span class="status-badge">Pending Approval</span></span>
            </div>
          </div>

          <p>Our document verification team will review your application details shortly. Once approved, you will receive your login access credentials along with your digital BCAR Membership Identity Card.</p>

          <div class="cta-container">
            <a href="https://bcarajasthan.org" target="_blank" class="cta-btn">View BCAR Website</a>
          </div>

          <div class="help-box">
            <strong>Need Assistance?</strong><br>
            If you have any questions or did not receive your receipt, please feel free to reach out to our Help Desk at <a href="mailto:support@bcarbankmitra.com" style="color: #0B2D5C; font-weight: bold; text-decoration: none;">support@bcarbankmitra.com</a> or Call/WhatsApp us at <strong>+91 98297 15474</strong>.
          </div>
        </div>
        
        <div class="footer">
          <img src="cid:bcarlogo" class="footer-logo" alt="BCAR Logo">
          <p><strong>Business Correspondent Association Rajasthan</strong></p>
          <p>Registered under Trade Unions Act, 1926 | Reg No: TU/2026/14/132549</p>
          <p>24, Kishore Vihar B, Gopalpura Bypass, Ajmer Road, Jaipur, RJ - 302021</p>
          <p><a href="https://bcarajasthan.org">www.bcarajasthan.org</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const adminAlertTemplate = (member) => {
  const regNumber = member.registrationNumber || 'Pending';
  const name = member.name || '';
  const dateStr = new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN');
  const dashboardUrl = process.env.ADMIN_DASHBOARD_URL || 'https://bcarajasthan.org/dashboard';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New BCAR Membership Registration</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #F4F6F9; }
        .card { max-width: 600px; background: #ffffff; padding: 30px; border-radius: 12px; border-top: 6px solid #0B2D5C; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border-bottom: 2px solid #D4AF37; }
        h3 { color: #0B2D5C; margin-top: 0; font-size: 18px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px 10px; border-bottom: 1px solid #EEF2F6; text-align: left; font-size: 14px; }
        th { color: #64748B; font-weight: 600; width: 180px; }
        td { color: #1E293B; font-weight: 700; }
        .btn-container { text-align: center; margin-top: 25px; }
        .btn { display: inline-block; background-color: #0B2D5C; color: #ffffff !important; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; font-size: 14px; border-bottom: 2px solid #D4AF37; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>New BCAR Membership Registration Alert</h3>
        <p>A new membership application has been submitted on the BCAR web portal. Details are as follows:</p>
        <table>
          <tr><th>Member Name</th><td>${name}</td></tr>
          <tr><th>Registration Number</th><td>${regNumber}</td></tr>
          <tr><th>Mobile Number</th><td>${member.phone || ''}</td></tr>
          <tr><th>Email Address</th><td>${member.email || ''}</td></tr>
          <tr><th>District</th><td>${member.district || ''}</td></tr>
          <tr><th>Registration Date</th><td>${dateStr}</td></tr>
          <tr><th>Registration Fee</th><td>₹700 (Paid)</td></tr>
          <tr><th>Current Status</th><td><span style="color: #D4AF37;">Pending Approval</span></td></tr>
        </table>
        <div class="btn-container">
          <a href="${dashboardUrl}" class="btn">Open Admin Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  memberWelcomeTemplate,
  adminAlertTemplate
};
