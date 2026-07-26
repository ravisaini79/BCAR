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
      const blue = '#1055C8';
      const gold = '#D4AF37';
      const gray = '#4B5563';
      const lightGray = '#F8FAFC';

      // Watermark
      doc.save();
      doc.fillColor(navy)
         .opacity(0.035)
         .fontSize(90)
         .font('Helvetica-Bold')
         .text('BCAR', 140, doc.page.height / 2 - 50, { rotation: 45, width: 320, align: 'center' });
      doc.restore();

      // Top Header Block
      const logoPath = path.join(__dirname, '../../../frontend/public/images/bcar-logo-official.jpg');
      let logoExists = false;
      try {
        if (fs.existsSync(logoPath)) {
          logoExists = true;
        }
      } catch (err) {}

      // Logo on top left
      if (logoExists) {
        doc.image(logoPath, 42, 38, { width: 62 });
      }

      const textX = logoExists ? 116 : 42;

      // Organization Title - Line 1
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(15)
         .text('BUSINESS CORRESPONDENT ASSOCIATION', textX, 38, { align: 'left' });

      // Organization Title - Line 2 (State)
      doc.fillColor(blue)
         .font('Helvetica-Bold')
         .fontSize(15)
         .text('RAJASTHAN', textX, 57, { align: 'left' });

      // Registration & Trade Union Subtitle
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8.5)
         .text('Registered Trade Union under Trade Unions Act, 1926 | Reg No: TU/2026/14/132549', textX, 76, { align: 'left' });

      // Receipt Title
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('Official Registration Fee Receipt', textX, 92, { align: 'left' });

      // Gold Divider Line
      doc.strokeColor(gold)
         .lineWidth(2.5)
         .moveTo(40, 114)
         .lineTo(555, 114)
         .stroke();

      // Receipt Metadata Bar (Date & Receipt No)
      doc.fillColor(gray)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(`Receipt Date: ${new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 45, 124);
      
      const receiptNo = member.receiptNumber || 'BCAR-RCP-2026-XXXXXX';
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(`Receipt No: ${receiptNo}`, 330, 124, { align: 'right', width: 225 });

      // Table Top Border
      doc.strokeColor('#CBD5E1')
         .lineWidth(1)
         .moveTo(40, 140)
         .lineTo(555, 140)
         .stroke();

      // Table Heading
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('MEMBER & TRANSACTION DETAILS', 45, 150);

      const tableTop = 170;
      const rowHeight = 22;
      const leftColX = 45;
      const valueLeftX = 185;

      const rows = [
        { label: 'Registration Number', val: member.registrationNumber || 'Pending' },
        { label: 'Member Name', val: member.name || '' },
        { label: 'Aadhaar Number', val: member.aadhaarNumber || 'N/A' },
        { label: 'Father / Husband Name', val: member.fatherHusbandName || 'N/A' },
        { label: 'Mobile Number', val: member.phone || '' },
        { label: 'Email Address', val: member.email || '' },
        { label: 'District', val: member.district || '' },
        { label: 'Sub District / Tehsil', val: member.subDistrict || 'N/A' },
        { label: 'Membership Type', val: member.interestedToJoin === 'YES' ? 'Regular Member (Bank Mitra / CSP)' : 'Associate Member' },
        { label: 'Total Fee Paid', val: `Rs. ${member.registrationFee || 700}.00 (Rs. 100 Reg. + Rs. 600 Membership)` },
        { label: 'Payment Status', val: member.paymentStatus || 'Paid', isStatus: true },
        { label: 'Payment Mode', val: member.paymentMode || 'Online / UPI' },
        { label: 'Transaction ID', val: member.transactionId || 'BCAR-TXN-' + Date.now().toString().substring(5) }
      ];

      let currentY = tableTop;
      rows.forEach((r, idx) => {
        if (idx % 2 === 0) {
          doc.fillColor(lightGray)
             .rect(40, currentY - 5, 515, rowHeight)
             .fill();
        }

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(r.label, leftColX, currentY);

        if (r.isStatus) {
          doc.fillColor('#16A34A')
             .font('Helvetica-Bold')
             .fontSize(9)
             .text(r.val, valueLeftX, currentY);
        } else {
          doc.fillColor(gray)
             .font('Helvetica')
             .fontSize(9)
             .text(r.val, valueLeftX, currentY);
        }

        currentY += rowHeight;
      });

      // Bottom Instructions
      const bottomY = currentY + 24;

      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Note & Instructions:', 45, bottomY);
      
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8.5)
         .text('1. This receipt confirms the collection of BCAR Membership Registration Fee.', 45, bottomY + 14);
      doc.text('2. Your application is under verification. Status updates will be sent to your registered email.', 45, bottomY + 26);
      doc.text('3. For any disputes or queries, kindly contact the BCAR Help Desk with your Registration Number.', 45, bottomY + 38);

      // Signature/Authority Block
      const authY = bottomY + 16;
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('Authorized Signatory', 380, authY, { align: 'right', width: 170 });
      
      doc.fillColor(gray)
         .font('Helvetica-Oblique')
         .fontSize(8.5)
         .text('Business Correspondent Association Rajasthan', 320, authY + 14, { align: 'right', width: 235 });

      // Footer
      const footerY = doc.page.height - 65;
      
      doc.strokeColor(gold)
         .lineWidth(1)
         .moveTo(40, footerY)
         .lineTo(555, footerY)
         .stroke();

      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8)
         .text('This is an official computer-generated fee receipt of BCAR and does not require a physical signature.', 45, footerY + 8, { align: 'center', width: 515 });

      doc.text('Business Correspondent Association Rajasthan (BCAR)  |  Reg. under Trade Unions Act, 1926  |  www.bcarajasthan.org', 45, footerY + 20, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceiptPDF
};
