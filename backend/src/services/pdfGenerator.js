const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates an official, strictly single-page (1/1) Registration Fee Receipt PDF.
 * @param {Object} member - The member details.
 * @returns {Promise<Buffer>} - Returns the PDF as a Buffer.
 */
const generateReceiptPDF = (member) => {
  return new Promise((resolve, reject) => {
    try {
      // Set margins with bottom: 0 to 100% prevent PDFKit auto page breaks
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 0, left: 25, right: 25 },
        autoFirstPage: true
      });

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

      // Background Watermark (Centered on single page)
      doc.save();
      doc.fillColor(navy)
         .opacity(0.03)
         .fontSize(90)
         .font('Helvetica-Bold')
         .text('BCAR', 135, 340, { rotation: 45, width: 320, align: 'center' });
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
        doc.image(logoPath, 35, 25, { width: 54 });
      }

      const textX = logoExists ? 100 : 35;

      // Organization Title - Line 1
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(13.5)
         .text('BUSINESS CORRESPONDENT ASSOCIATION', textX, 27, { align: 'left' });

      // Organization Title - Line 2 (State)
      doc.fillColor(blue)
         .font('Helvetica-Bold')
         .fontSize(13.5)
         .text('RAJASTHAN', textX, 44, { align: 'left' });

      // Registration & Trade Union Subtitle
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8)
         .text('Registered Trade Union under Trade Unions Act, 1926 | Reg No: TU/2026/14/132549', textX, 61, { align: 'left' });

      // Receipt Title Badge
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(10.5)
         .text('Official Registration Fee Receipt', textX, 75, { align: 'left' });

      // Gold Divider Line
      doc.strokeColor(gold)
         .lineWidth(2)
         .moveTo(35, 92)
         .lineTo(560, 92)
         .stroke();

      // Receipt Metadata Bar (Date & Receipt No)
      doc.fillColor(gray)
         .font('Helvetica-Bold')
         .fontSize(8.5)
         .text(`Receipt Date: ${new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 38, 100);
      
      const receiptNo = member.receiptNumber || 'BCAR-RCP-2026-XXXXXX';
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(8.5)
         .text(`Receipt No: ${receiptNo}`, 330, 100, { align: 'right', width: 225 });

      // Table Top Border
      doc.strokeColor('#CBD5E1')
         .lineWidth(1)
         .moveTo(35, 114)
         .lineTo(560, 114)
         .stroke();

      // Table Heading
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('MEMBER & TRANSACTION DETAILS', 38, 120);

      const tableTop = 135;
      const rowHeight = 18;
      const leftColX = 40;
      const valueLeftX = 180;

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
        { label: 'Transaction ID / UTR', val: member.paymentUtr || member.utrNumber || member.transactionId || ('BCAR-TXN-' + Date.now().toString().substring(5)) }
      ];

      let currentY = tableTop;
      rows.forEach((r, idx) => {
        if (idx % 2 === 0) {
          doc.fillColor(lightGray)
             .rect(35, currentY - 3, 525, rowHeight)
             .fill();
        }

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(r.label, leftColX, currentY, { width: 135, lineBreak: false });

        if (r.isStatus) {
          doc.fillColor('#16A34A')
             .font('Helvetica-Bold')
             .fontSize(8.5)
             .text(r.val, valueLeftX, currentY, { width: 370, lineBreak: false });
        } else {
          doc.fillColor(gray)
             .font('Helvetica')
             .fontSize(8.5)
             .text(r.val, valueLeftX, currentY, { width: 370, lineBreak: false });
        }

        currentY += rowHeight;
      });

      // Bottom Section Y Offset
      const bottomY = currentY + 14;

      // Left Column: Note & Instructions
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(8.5)
         .text('Note & Instructions:', 38, bottomY, { lineBreak: false });
      
      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(8)
         .text('1. This receipt confirms the collection of BCAR Membership Registration Fee.', 38, bottomY + 12, { lineBreak: false });
      doc.text('2. Your application is under verification. Status updates will be sent to your registered email.', 38, bottomY + 22, { lineBreak: false });
      doc.text('3. For any queries, contact BCAR Help Desk (+91 98297 15474) with your Registration Number.', 38, bottomY + 32, { lineBreak: false });

      // Right Column: Authorized Signatory Block
      doc.fillColor(navy)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Authorized Signatory', 350, bottomY + 8, { align: 'right', width: 205, lineBreak: false });
      
      doc.fillColor(gray)
         .font('Helvetica-Oblique')
         .fontSize(8)
         .text('Business Correspondent Association Rajasthan', 300, bottomY + 20, { align: 'right', width: 255, lineBreak: false });

      // Single-Page Footer
      const footerY = 730;
      
      doc.strokeColor(gold)
         .lineWidth(1)
         .moveTo(35, footerY)
         .lineTo(560, footerY)
         .stroke();

      doc.fillColor(gray)
         .font('Helvetica')
         .fontSize(7.5)
         .text('This is an official computer-generated fee receipt of BCAR and does not require a physical signature.', 35, footerY + 6, { align: 'center', width: 525, lineBreak: false });

      doc.text('Business Correspondent Association Rajasthan (BCAR)  |  Reg. under Trade Unions Act, 1926  |  www.bcarajasthan.org', 35, footerY + 16, { align: 'center', width: 525, lineBreak: false });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateReceiptPDF
};
