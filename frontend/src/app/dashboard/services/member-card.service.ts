import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberCardService {

  /**
   * Generates and downloads a high-resolution BCAR membership card (Front + Back stacked).
   * Theme: Premium Light Blue Corporate Design (#EAF6FF, #D6ECFF, #0B5ED7, #4A90E2, #0A2540, #1E88E5)
   * Features:
   * - Fixed Address layout with multi-line text wrapping to eliminate overlaps
   * - Dynamic QR Code + Verification Badge
   * - High-contrast readable typography
   * - Crisp corporate borders and accents
   * - Front and Back side export & print support
   */
  async generateCard(member: any): Promise<void> {
    const canvas = await this.drawCardCanvas(member);

    const filename = `BCAR-Membership-Card-${member.membershipNo || member.name || 'member'}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Generates and returns the base64 PNG data URL of the card.
   */
  async getCardBase64(member: any): Promise<string> {
    const canvas = await this.drawCardCanvas(member);
    return canvas.toDataURL('image/png');
  }

  /**
   * Triggers native print preview for the membership card.
   */
  async printCard(member: any): Promise<void> {
    const cardBase64 = await this.getCardBase64(member);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print BCAR Membership Card - ${member.name || 'Member'}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; font-family: sans-serif; }
            img { max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .print-btn { margin-top: 15px; padding: 10px 24px; background: #0B5ED7; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <img src="${cardBase64}" alt="BCAR Membership Card" />
          <button class="print-btn" onclick="window.print()">Print Card / Save PDF</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  private async drawCardCanvas(member: any): Promise<HTMLCanvasElement> {
    const W = 1012;
    const H = 638;
    const GAP = 30;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H * 2 + GAP;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await this.drawFrontSide(ctx, member, W, H);
    await this.drawBackSide(ctx, W, H, H + GAP);
    return canvas;
  }

  // ════════════════════════════════════════════════════════════════════
  // FRONT SIDE (Horizontal Premium Light Blue Corporate Card)
  // ════════════════════════════════════════════════════════════════════

  private async drawFrontSide(ctx: CanvasRenderingContext2D, member: any, w: number, h: number): Promise<void> {
    // --- Soft Light Blue Gradient Background ---
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#F8FBFF');
    bg.addColorStop(0.5, '#EAF5FF');
    bg.addColorStop(1, '#D0E8FF');
    this.roundRect(ctx, 0, 0, w, h, 32);
    ctx.fillStyle = bg;
    ctx.fill();

    // --- Subtle Watermark Logo in Center ---
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.04;
      const wmSize = 380;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, h / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
    } catch (e) {
      // Ignored if logo fails to load
    }

    // --- Outer Corporate Blue Border ---
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 4;
    ctx.stroke();

    // --- Inner Subtle Accent Border ---
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, 12, 12, w - 24, h - 24, 24);
    ctx.stroke();

    // --- Top Accent Decorative Bar ---
    const topBarGrad = ctx.createLinearGradient(0, 0, w, 0);
    topBarGrad.addColorStop(0, '#0284C7');
    topBarGrad.addColorStop(0.5, '#0369A1');
    topBarGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(0, 0, w, 6);

    // ── 1. Top Logo & Header (y: 28–110) ──
    let logoLoaded = false;
    const logoX = 45;
    const logoY = 32;
    const logoSize = 72;
    try {
      const logo = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      // Outer blue ring
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 3;
      ctx.stroke();
      logoLoaded = true;
    } catch {
      logoLoaded = false;
    }

    const textStartX = logoLoaded ? 135 : 45;

    // Main Title
    ctx.fillStyle = '#0C4A6E';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText('BCAR', textStartX, 70);

    // Subtitle
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 11.5px sans-serif';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', textStartX, 92);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('Trade Union Reg. No: TU/2026/14/132549  ·  Government of Rajasthan', textStartX, 106);

    // Top-Right Membership Pill Badge
    const badgeW = 210;
    const badgeH = 30;
    const badgeX = w - badgeW - 45;
    const badgeY = 35;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeGrad.addColorStop(0, '#0284C7');
    badgeGrad.addColorStop(1, '#0369A1');
    ctx.fillStyle = badgeGrad;
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  OFFICIAL MEMBERSHIP CARD', badgeX + badgeW / 2, badgeY + 19);
    ctx.textAlign = 'left';

    // ── 2. Member Profile Photo (y: 125–295) ──
    const photoX = 45;
    const photoY = 125;
    const photoW = 140;
    const photoH = 180;

    // Background placeholder for avatar
    ctx.fillStyle = '#E0F2FE';
    this.roundRect(ctx, photoX, photoY, photoW, photoH, 10);
    ctx.fill();

    // Outer & inner photo frame
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    let photoLoaded = false;
    const photoUrl = this.getProfilePhotoUrl(member);
    if (photoUrl) {
      try {
        const img = await this.loadImage(photoUrl);
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, photoX, photoY, photoW, photoH, 10);
        ctx.closePath();
        ctx.clip();
        
        // Fill white background first (so the letterbox/pillarbox area is clean white)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(photoX, photoY, photoW, photoH);

        const aspect = img.width / img.height;
        const targetAspect = photoW / photoH;
        let dx = photoX;
        let dy = photoY;
        let dw = photoW;
        let dh = photoH;
        if (aspect > targetAspect) {
          // Image is wider than container aspect ratio
          dh = photoW / aspect;
          dy = photoY + (photoH - dh) / 2;
        } else {
          // Image is taller than container aspect ratio
          dw = photoH * aspect;
          dx = photoX + (photoW - dw) / 2;
        }

        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
        ctx.restore();
        photoLoaded = true;
      } catch {
        photoLoaded = false;
      }
    }

    if (!photoLoaded) {
      this.drawPersonIcon(ctx, photoX + photoW / 2, photoY + photoH / 2 + 10);
    }

    // ── 3. Profile Main Details Next to Photo ──
    const detailsX = 205;

    // Member Name (Georgia Bold/Navy)
    ctx.fillStyle = '#0C4A6E';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText((member.name || 'MEMBER NAME').toUpperCase(), detailsX, 160);

    // Membership Number
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(member.membershipNo || 'BCAR/RJ/0000', detailsX, 192);

    // Registration Metadata
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13.5px monospace';
    ctx.fillText(`Reg Number: ${member.registrationNumber || '—'}`, detailsX, 215);

    // Corporate Blue Badge for "BANK MITRA / CSP"
    const bmBadgeX = detailsX;
    const bmBadgeY = 232;
    ctx.fillStyle = '#E0F2FE';
    this.roundRect(ctx, bmBadgeX, bmBadgeY, 150, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✓  BANK MITRA / CSP', bmBadgeX + 15, bmBadgeY + 18);

    // ── 4. Verified Seal Emblem Badge & QR Code (Top Right) ──
    // Official Verification Emblem Badge
    const sealX = w - 150;
    const sealY = 125;
    const sealSize = 84;

    const sealGrad = ctx.createLinearGradient(sealX, sealY, sealX + sealSize, sealY + sealSize);
    sealGrad.addColorStop(0, '#0284C7');
    sealGrad.addColorStop(1, '#0369A1');

    ctx.beginPath();
    ctx.arc(sealX + sealSize / 2, sealY + sealSize / 2, sealSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw white inner checkmark circle
    ctx.beginPath();
    ctx.arc(sealX + sealSize / 2, sealY + sealSize / 2 - 10, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✓', sealX + sealSize / 2, sealY + sealSize / 2 - 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText('VERIFIED', sealX + sealSize / 2, sealY + 54);
    ctx.font = 'bold 7.5px sans-serif';
    ctx.fillText('BCAR MEMBER', sealX + sealSize / 2, sealY + 65);
    ctx.textAlign = 'left';

    // ── 5. Two-Column Detailed Information Grid with Multi-line Text Wrapping ──
    const leftColX = 45;
    const rightColX = 525;
    const colW = 445;
    const colH = 205;
    const gridY = 310;

    // Draw background section cards
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.roundRect(ctx, leftColX - 10, gridY, colW, colH, 12);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.roundRect(ctx, rightColX - 10, gridY, colW, colH, 12);
    ctx.fill();
    ctx.stroke();

    // Titles of section boxes
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('PERSONAL & LOCATION DETAILS', leftColX, gridY + 20);
    ctx.fillText('IDENTITY & BANKING DETAILS', rightColX, gridY + 20);

    // Accent line under box titles
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(leftColX, gridY + 26);
    ctx.lineTo(leftColX + colW - 20, gridY + 26);
    ctx.moveTo(rightColX, gridY + 26);
    ctx.lineTo(rightColX + colW - 20, gridY + 26);
    ctx.stroke();

    let gridLeftY = gridY + 44;
    let gridRightY = gridY + 44;

    // Address construction
    const addrParts = [member.homeAddressVill, member.gramPanchayat, member.devBlock, member.district].filter(Boolean);
    const addrStr = addrParts.length > 0 ? addrParts.join(', ') : '—';
    const fullAddr = member.pin ? `${addrStr} - ${member.pin}` : addrStr;

    // Left Column Fields
    gridLeftY += this.drawGridField(ctx, 'Address', fullAddr, leftColX, gridLeftY, colW - 20);
    gridLeftY += this.drawGridField(ctx, 'Sub District', member.subDistrict || member.devBlock || member.district || '—', leftColX, gridLeftY, colW - 20);
    gridLeftY += this.drawGridField(ctx, 'District', member.district || '—', leftColX, gridLeftY, colW - 20);
    gridLeftY += this.drawGridField(ctx, 'Pin Code', member.pin || '—', leftColX, gridLeftY, colW - 20);
    gridLeftY += this.drawGridField(ctx, 'Email', member.email || '—', leftColX, gridLeftY, colW - 20);
    gridLeftY += this.drawGridField(ctx, 'Link Branch', member.linkBranchName || '—', leftColX, gridLeftY, colW - 20);

    // Right Column Fields
    gridRightY += this.drawGridField(ctx, 'Mobile No.', member.phone || '—', rightColX, gridRightY, colW - 20);
    gridRightY += this.drawGridField(ctx, 'Aadhaar No.', this.maskAadhaar(member.aadhaarNumber), rightColX, gridRightY, colW - 20);
    gridRightY += this.drawGridField(ctx, 'Bank Name', member.bankName || '—', rightColX, gridRightY, colW - 20);
    gridRightY += this.drawGridField(ctx, 'Blood Group', member.bloodGroup || '—', rightColX, gridRightY, colW - 20);
    gridRightY += this.drawGridField(ctx, 'DOB', this.formatDate(member.dob), rightColX, gridRightY, colW - 20);
    gridRightY += this.drawGridField(ctx, 'SSA Code', member.ssa || '—', rightColX, gridRightY, colW - 20);

    // ── 6. Issue/Valid Info & Signature Footer Area (y: 535 onward) ──
    const bottomY = 565;
    const issueDate = this.parseDate(member.joinedAt || member.createdAt);
    const issueDateStr = issueDate ? this.formatDateObj(issueDate) : '—';

    let validUptoStr = '—';
    if (issueDate) {
      const exp = new Date(issueDate);
      exp.setFullYear(exp.getFullYear() + 3);
      validUptoStr = this.formatDateObj(exp);
    }

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`ISSUE DATE: ${issueDateStr}`, leftColX, bottomY);
    ctx.fillText(`VALID UPTO: ${validUptoStr}`, leftColX + 180, bottomY);

    const joinYear = member.createdAt ? new Date(member.createdAt).getFullYear() : new Date().getFullYear();
    ctx.fillText(`MEMBER SINCE: ${joinYear}`, leftColX, bottomY + 18);

    // Authority Signature Line & Text
    const sigLineX = w - 220;
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigLineX, bottomY + 2);
    ctx.lineTo(w - 45, bottomY + 2);
    ctx.stroke();

    // Stylized Signature mark
    ctx.font = 'italic bold 15px Georgia, serif';
    ctx.fillStyle = '#0284C7';
    ctx.textAlign = 'center';
    ctx.fillText('BCAR Authority', sigLineX + 87, bottomY - 6);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0C4A6E';
    ctx.fillText('Authorized Signatory', sigLineX + 87, bottomY + 18);
    ctx.textAlign = 'left';

    // Footer copyright bar text
    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BCAR  ·  Member Portal  ·  Business Correspondent Association Rajasthan', w / 2, h - 16);
    ctx.textAlign = 'left';
  }

  // ════════════════════════════════════════════════════════════════════
  // BACK SIDE (Horizontal Premium Light Blue Corporate Card)
  // ════════════════════════════════════════════════════════════════════

  private async drawBackSide(ctx: CanvasRenderingContext2D, w: number, h: number, yOff: number): Promise<void> {
    // --- Light Blue Corporate Gradient Background ---
    const bg = ctx.createLinearGradient(0, yOff, w, yOff + h);
    bg.addColorStop(0, '#F8FBFF');
    bg.addColorStop(0.5, '#EAF5FF');
    bg.addColorStop(1, '#D0E8FF');
    this.roundRect(ctx, 0, yOff, w, h, 32);
    ctx.fillStyle = bg;
    ctx.fill();

    // --- Watermark Logo ---
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.04;
      const wmSize = 380;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, yOff + h / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
    } catch (e) {}

    // --- Outer Corporate Blue Border ---
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 4;
    ctx.stroke();

    // --- Inner Accent Border ---
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, 12, yOff + 12, w - 24, h - 24, 24);
    ctx.stroke();

    // ── 1. Header Title ──
    ctx.fillStyle = '#0C4A6E';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';

    const header = 'BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN';
    ctx.fillText(header, w / 2, yOff + 45);

    // Underline
    const hw = ctx.measureText(header).width;
    ctx.beginPath();
    ctx.moveTo(w / 2 - hw / 2, yOff + 52);
    ctx.lineTo(w / 2 + hw / 2, yOff + 52);
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0284C7';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TERMS & CONDITIONS FOR CSP MEMBERSHIP', w / 2, yOff + 70);

    ctx.textAlign = 'left';

    // ── 2. Terms & Conditions Bullet Points ──
    const terms = [
      '✦ CSP is an independent entrepreneur having a franchise contract with Business Correspondent Association Rajasthan (BCAR).',
      '✦ CSP is NOT an employee of BCAR or the Bank.',
      '✦ CSP is authorized to serve Bank customers as per Bank specified BC services in his / her specific location only.',
      '✦ This card is NOT transferable and must be produced by the CSP on demand.',
      '✦ This card must be carried by the CSP at all times during operating hours.',
      '✦ CSP Must Maintain safe keep of this card and return the card on termination of franchise contract to BCAR.',
      '✦ BCAR is NOT liable for any misuse of this card.'
    ];

    ctx.fillStyle = '#0F172A';
    ctx.font = '13px sans-serif';
    const bulletX = 50;
    let bulletY = yOff + 105;
    const maxTextW = w - 100;

    for (const term of terms) {
      bulletY = this.wrapText(ctx, term, bulletX, bulletY, maxTextW, 20, '#0284C7', '#0F172A');
      bulletY += 8;
    }

    // ── 3. Return & Contact Details Box (Centered Footer) ──
    const contactStartY = yOff + h - 140;
    const boxW = w - 100;
    const boxH = 95;
    const boxX = 50;

    ctx.fillStyle = '#E0F2FE';
    this.roundRect(ctx, boxX, contactStartY, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#0284C7';
    ctx.fillText('If found, please return to:', w / 2, contactStartY + 24);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#0C4A6E';
    ctx.fillText('Business Correspondent Association Rajasthan', w / 2, contactStartY + 45);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Reg. No. TU/2026/14/132549 · Helpline: +91 98297 15474 · Rajasthan, India', w / 2, contactStartY + 68);

    ctx.textAlign = 'left';
  }

  // ════════════════════════════════════════════════════════════════════
  // DYNAMIC GRID FIELD RENDERER WITH MULTI-LINE TEXT WRAPPING
  // ════════════════════════════════════════════════════════════════════

  private drawGridField(
    ctx: CanvasRenderingContext2D,
    label: string,
    value: string,
    x: number,
    y: number,
    colWidth: number,
    labelColor = '#0284C7',
    valueColor = '#0F172A'
  ): number {
    const labelFont = 'bold 12px sans-serif';
    const valueFont = '13px sans-serif';
    const lineHeight = 18;

    ctx.font = labelFont;
    ctx.fillStyle = labelColor;
    const lbl = label + ' : ';
    ctx.fillText(lbl, x, y);
    const lw = ctx.measureText(lbl).width;

    ctx.font = valueFont;
    ctx.fillStyle = valueColor;

    const availW = colWidth - lw;
    const textVal = value || '—';
    const words = textVal.split(' ');
    let line = '';
    let lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > availW && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    let currY = y;
    lines.forEach((l, idx) => {
      ctx.fillText(l, x + (idx === 0 ? lw : lw), currY);
      if (idx < lines.length - 1) currY += lineHeight;
    });

    const totalHeight = (currY - y) + 20;

    // Partition underline
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, currY + 6);
    ctx.lineTo(x + colWidth, currY + 6);
    ctx.stroke();

    return totalHeight;
  }

  private maskAadhaar(num: string | undefined): string {
    if (!num) return '—';
    const clean = num.toString().replace(/\D/g, '');
    if (clean.length >= 4) {
      return `XXXX XXXX ${clean.slice(-4)}`;
    }
    return num;
  }

  // ════════════════════════════════════════════════════════════════════
  // PROFILE IMAGE & UTILITY HELPERS
  // ════════════════════════════════════════════════════════════════════

  private getProfilePhotoUrl(member: any): string | null {
    if (!member) return null;
    let url = member.profilePhoto?.secure_url || member.photograph?.secure_url
           || member.profilePhoto?.url || member.photograph?.url
           || (typeof member.profilePhoto === 'string' && member.profilePhoto.trim() ? member.profilePhoto : null)
           || (typeof member.photograph === 'string' && member.photograph.trim() ? member.photograph : null)
           || (typeof member.profileImage === 'string' && member.profileImage.trim() ? member.profileImage : null)
           || member.profileImage?.secure_url || member.profileImage?.url;

    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    bulletColor = '#0B5ED7',
    textColor = '#0A2540'
  ): number {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillStyle = currentY === y ? bulletColor : textColor;
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillStyle = currentY === y ? bulletColor : textColor;
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }

  private formatDate(value: any): string {
    if (!value) return 'N/A';
    if (typeof value === 'string' && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(value.trim())) {
      return value.trim();
    }
    const d = this.parseDate(value);
    return d ? this.formatDateObj(d) : 'N/A';
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
      const m = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  private formatDateObj(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  }

  private drawPersonIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#0B5ED7';
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 32, cy + 32);
    ctx.quadraticCurveTo(cx - 32, cy + 5, cx, cy + 5);
    ctx.quadraticCurveTo(cx + 32, cy + 5, cx + 32, cy + 32);
    ctx.lineTo(cx - 32, cy + 32);
    ctx.closePath();
    ctx.fill();
  }

  private drawFallbackQRCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#0A2540';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

    ctx.fillStyle = '#0A2540';
    // Corner targets
    const s = 18;
    ctx.fillRect(x + 8, y + 8, s, s);
    ctx.fillRect(x + size - 8 - s, y + 8, s, s);
    ctx.fillRect(x + 8, y + size - 8 - s, s, s);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 12, y + 12, s - 8, s - 8);
    ctx.fillRect(x + size - 8 - s + 4, y + 12, s - 8, s - 8);
    ctx.fillRect(x + 12, y + size - 8 - s + 4, s - 8, s - 8);

    ctx.fillStyle = '#0B5ED7';
    ctx.fillRect(x + 15, y + 15, s - 14, s - 14);
    ctx.fillRect(x + size - 8 - s + 7, y + 15, s - 14, s - 14);
    ctx.fillRect(x + 15, y + size - 8 - s + 7, s - 14, s - 14);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
