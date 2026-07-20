const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional Registration Fee Receipt PDF.
 * @param {Object} member - The member details.
 * @returns {Promise<Buffer>} - Returns the PDF as a Buffer.
 */
const generateReceiptPDF = (member) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const navy = '#0B2D5C';
      const gold = '#D4AF37';
      const gray = '#4B5563';
      const lightGray = '#F3F4F6';

      // Watermark
      doc.save();
      doc.fillColor(navy)
         .opacity(0.04)
         .fontSize(100)
         .font('Helvetica-Bold')
         .text('BCAR', 160, doc.page.height / 2 - 50, { rotation: 45, width: 300, align: 'center' });
      doc.restore();

      // Top Header Block (Government style banner)
      // Check if logo exists
      const logoPath = path.join(__dirname, '../../../frontend/public/images/bcar-logo.png');
      let logoExists = false;
      try {
        if (fs.existsSync(logoPath)) {
          logoExists = true;
        }
      } catch (err) {
        // ignore
      }

      if (logoExists) {
        doc.image(logoPath, 45, 45, { width: 55 });
      }

      // Title & Header details
      const textX = logoExists ? 115 : 45;
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', textX, 45, { align: 'left' });
         
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(9)
         .text('Registered Trade Union under Trade Unions Act, 1926 | Reg No: TU/2026/14/132549', textX, 68);

      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(13)
         .text('Official Registration Fee Receipt', textX, 85);

      // Gold Divider Line
      doc.strokeColor(gold)
         .lineWidth(2.5)
         .moveTo(40, 115)
         .lineTo(555, 115)
         .stroke();

      // Receipt Metadata Row
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(9)
         .text(`Receipt Date: ${new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 45, 128);
      
      const receiptNo = member.receiptNumber || 'BCAR-RCP-2026-XXXXXX';
      doc.text(`Receipt No: ${receiptNo}`, 350, 128, { align: 'right', width: 200 });

      // Table of Details
      doc.strokeColor('#E2E8F0')
         .lineWidth(1)
         .moveTo(40, 145)
         .lineTo(555, 145)
         .stroke();

      // Heading row
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('MEMBER & TRANSACTION DETAILS', 45, 155);

      const tableTop = 175;
      const rowHeight = 22;
      const leftColX = 45;
      const valueLeftX = 180;

      const rows = [
        { label: 'Registration Number', val: member.registrationNumber || 'Pending' },
        { label: 'Member Name', val: member.name || '' },
        { label: 'Aadhaar Number', val: member.aadhaarNumber || 'N/A' },
        { label: 'Father / Husband Name', val: member.fatherHusbandName || 'N/A' },
        { label: 'Mobile Number', val: member.phone || '' },
        { label: 'Email Address', val: member.email || '' },
        { label: 'District', val: member.district || '' },
        { label: 'Membership Type', val: member.interestedToJoin === 'YES' ? 'Regular Member' : 'Associate' },
        { label: 'Total Fee Paid', val: `Rs. ${member.registrationFee || 700}.00 (Rs. 100 Reg. + Rs. 600 Membership)` },
        { label: 'Payment Status', val: member.paymentStatus || 'Paid', isStatus: true },
        { label: 'Payment Mode', val: member.paymentMode || 'Online / UPI' },
        { label: 'Transaction ID', val: member.transactionId || 'BCAR-TXN-' + Date.now().toString().substring(5) }
      ];

      let currentY = tableTop;
      rows.forEach((r, idx) => {
        // Alternating row background for modern tabular format
        if (idx % 2 === 0) {
          doc.fillColor(lightGray)
             .rect(40, currentY - 5, 515, rowHeight)
             .fill();
        }

        // Draw Row Text
        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(9.5)
           .text(r.label, leftColX, currentY);

        if (r.isStatus) {
          doc.fillColor('#16A34A') // green for Paid status
             .font('Helvetica-Bold')
             .fontSize(9.5)
             .text(r.val, valueLeftX, currentY);
        } else {
          doc.fillColor(gray)
             .font('Helvetica')
             .fontSize(9.5)
             .text(r.val, valueLeftX, currentY);
        }

        currentY += rowHeight;
      });

      // Bottom Section
      const bottomY = currentY + 30;

      // Terms/Information block
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Note & Instructions:', 45, bottomY);
      
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8.5)
         .text('1. This receipt confirms the collection of the BCAR Membership Registration Fee.', 45, bottomY + 14);
      doc.text('2. Your application is under verification. Status updates will be sent to your registered email.', 45, bottomY + 26);
      doc.text('3. For any disputes or queries, kindly contact the BCAR Help Desk with your Registration Number.', 45, bottomY + 38);

      // Signature/Authority block
      const authY = bottomY + 20;
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('Authorized By:', 380, authY, { align: 'right', width: 170 });
      
      doc.fillColor(gray)
         .font('Helvetica-Oblique')
         .fontSize(9)
         .text('Business Correspondent Association Rajasthan', 330, authY + 16, { align: 'right', width: 220 });

      // Footer
      const footerY = doc.page.height - 70;
      
      // Footer Gold Divider
      doc.strokeColor(gold)
         .lineWidth(1)
         .moveTo(40, footerY)
         .lineTo(555, footerY)
         .stroke();

      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8)
         .text('This is a computer-generated receipt and does not require a signature.', 45, footerY + 8, { align: 'center', width: 515 });

      doc.text('Business Correspondent Association Rajasthan (BCAR) | Reg. under Trade Unions Act, 1926', 45, footerY + 20, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceiptPDF
};
