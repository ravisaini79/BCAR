import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberCardService {

  /**
   * Generates and downloads a highly-enhanced premium horizontal BCAR membership card (Front + Back stacked).
   * Design features:
   * - Deep metallic navy radial gradients
   * - Double-ring gold border frames
   * - Circular clipped profile photo with a double gold-and-white frame
   * - Synthetic realistically-rendered QR Code
   * - Golden gradient badges for Bank Mitra
   * - Structured grid partition lines for detail values
   * - T&C back page with golden star bullet points and centered watermark seal
   *
   * Dimensions: Width = 1012px, Height = 1306px (Front 638 + 30 gap + Back 638).
   */
  async generateCard(member: any): Promise<void> {
    const W = 1012;
    const H = 638;
    const GAP = 30;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H * 2 + GAP;
    const ctx = canvas.getContext('2d')!;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ─── FRONT SIDE (y: 0 to 638) ───
    await this.drawFrontSide(ctx, member, W, H);

    // ─── BACK SIDE (y: 668 to 1306) ───
    this.drawBackSide(ctx, W, H, H + GAP);

    // ─── Download as PNG ───
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
    this.drawBackSide(ctx, W, H, H + GAP);
    return canvas;
  }

  // ════════════════════════════════════════════════════════════════════
  // FRONT SIDE (Horizontal Premium Card)
  // ════════════════════════════════════════════════════════════════════

  private async drawFrontSide(ctx: CanvasRenderingContext2D, member: any, w: number, h: number): Promise<void> {
    // --- Radial metallic gradient background ---
    const bg = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
    bg.addColorStop(0, '#0a2342');
    bg.addColorStop(0.6, '#06162d');
    bg.addColorStop(1, '#020b18');
    this.roundRect(ctx, 0, 0, w, h, 40);
    ctx.fillStyle = bg;
    ctx.fill();

    // --- Double Gold Border ---
    // Outer border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, 12, 12, w - 24, h - 24, 32);
    ctx.stroke();

    // --- Background Decors ---
    const drawDecorCircle = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    drawDecorCircle(w - 200, h / 2, 280, 0.04);
    drawDecorCircle(w - 200, h / 2, 210, 0.06);
    drawDecorCircle(w - 200, h / 2, 140, 0.08);

    // ── 1. Top Logo & Header (y: 28–110) ──
    let logoLoaded = false;
    const logoX = 50;
    const logoY = 32;
    const logoSize = 76;
    try {
      const logo = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      // Outer gold circle ring
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      logoLoaded = true;
    } catch {
      logoLoaded = false;
    }

    const textStartX = logoLoaded ? 145 : 50;

    // Main Title
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText('BCAR', textStartX, 73);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', textStartX, 96);

    // Top-Right Membership Pill Badge
    const badgeW = 220;
    const badgeH = 26;
    const badgeX = w - badgeW - 50;
    const badgeY = 35;
    const pillGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    pillGrad.addColorStop(0, 'rgba(212, 175, 55, 0.08)');
    pillGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.25)');
    pillGrad.addColorStop(1, 'rgba(212, 175, 55, 0.08)');
    ctx.fillStyle = pillGrad;
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦  CSP MEMBERSHIP CARD', badgeX + badgeW / 2, badgeY + 17);
    ctx.textAlign = 'left';

    // ── 2. Member Photo (y: 130–310) ──
    const photoX = 50;
    const photoY = 135;
    const photoW = 125;
    const photoH = 155;

    // Premium outer gold & inner white frame borders
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.strokeRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(photoX - 1, photoY - 1, photoW + 2, photoH + 2);

    let photoLoaded = false;
    const photoUrl = member.profilePhoto?.secure_url || member.photograph?.secure_url;
    if (photoUrl) {
      try {
        const img = await this.loadImage(photoUrl);
        ctx.drawImage(img, photoX, photoY, photoW, photoH);
        photoLoaded = true;
      } catch {
        photoLoaded = false;
      }
    }

    if (!photoLoaded) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(photoX, photoY, photoW, photoH);
      this.drawPersonIcon(ctx, photoX + photoW / 2, photoY + photoH / 2);
    }

    // ── 3. Profile Main details next to photo ──
    const detailsX = 200;

    // Member Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText((member.name || 'MEMBER NAME').toUpperCase(), detailsX, 178);

    // Membership Number
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 18.5px monospace';
    ctx.fillText(member.membershipNo || 'BCAR/RJ/0000', detailsX, 210);

    // Registration Metadata
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px monospace';
    ctx.fillText(`Reg Number: ${member.registrationNumber || 'N/A'}`, detailsX, 230);

    // Gold Gradient Badge for "BANK MITRA"
    const bmBadgeX = detailsX;
    const bmBadgeY = 248;
    const bmGrad = ctx.createLinearGradient(bmBadgeX, bmBadgeY, bmBadgeX + 130, bmBadgeY);
    bmGrad.addColorStop(0, '#D4AF37');
    bmGrad.addColorStop(1, '#B8942A');
    ctx.fillStyle = bmGrad;
    this.roundRect(ctx, bmBadgeX, bmBadgeY, 130, 26, 5);
    ctx.fill();

    ctx.fillStyle = '#06162d'; // Dark navy text on gold
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✦  BANK MITRA', bmBadgeX + 15, bmBadgeY + 17);

    // Draw a real synthetic QR code (highly realistic) instead of a plain box
    const qrX = w - 150;
    const qrY = 135;
    this.drawSyntheticQRCode(ctx, qrX, qrY, 100);

    // ── 4. Two-Column Detailed Information Grid with partition underlines (y: 310–495) ──
    const leftColX = 50;
    const rightColX = 525;
    let gridLeftY = 330;
    let gridRightY = 330;
    const gridLineH = 28;

    const labelFont = 'bold 12px sans-serif';
    const valueFont = '13px sans-serif';
    const labelColor = '#D4AF37'; // Soft Gold
    const valueColor = '#ffffff';

    const drawGridField = (label: string, value: string, x: number, y: number, colWidth: number): void => {
      // Draw horizontal partition line under each field
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x + colWidth, y + 6);
      ctx.stroke();

      ctx.font = labelFont;
      ctx.fillStyle = labelColor;
      const lbl = label + ' : ';
      ctx.fillText(lbl, x, y);
      const lw = ctx.measureText(lbl).width;

      ctx.font = valueFont;
      ctx.fillStyle = valueColor;
      ctx.fillText(value, x + lw, y);
    };

    // --- Left Column ---
    const addr = [member.homeAddressVill, member.district].filter(Boolean).join(', ');
    const fullAddr = member.pin ? `${addr} - ${member.pin}` : addr || 'N/A';
    drawGridField('Address', fullAddr, leftColX, gridLeftY, 430);
    gridLeftY += gridLineH;

    drawGridField('Sub District', member.subDistrict || member.district || 'N/A', leftColX, gridLeftY, 430);
    gridLeftY += gridLineH;

    drawGridField('District', member.district || 'N/A', leftColX, gridLeftY, 430);
    gridLeftY += gridLineH;

    drawGridField('Pin Code', member.pin || 'N/A', leftColX, gridLeftY, 430);
    gridLeftY += gridLineH;

    drawGridField('CSP ID', member.bcCspIdNo || member.membershipNo || 'N/A', leftColX, gridLeftY, 430);
    gridLeftY += gridLineH;

    drawGridField('Link Branch', member.linkBranchName || 'N/A', leftColX, gridLeftY, 430);

    // --- Right Column ---
    drawGridField('Mobile No.', member.phone || 'N/A', rightColX, gridRightY, 430);
    gridRightY += gridLineH;

    drawGridField('Aadhaar No.', member.aadhaarNumber || 'N/A', rightColX, gridRightY, 430);
    gridRightY += gridLineH;

    drawGridField('Bank Name', member.bankName || 'N/A', rightColX, gridRightY, 430);
    gridRightY += gridLineH;

    drawGridField('Blood Group', member.bloodGroup || 'N/A', rightColX, gridRightY, 430);
    gridRightY += gridLineH;

    drawGridField('DOB', this.formatDate(member.dob), rightColX, gridRightY, 430);
    gridRightY += gridLineH;

    drawGridField('SSA Code', member.ssa || 'N/A', rightColX, gridRightY, 430);

    // ── 5. Issue/Valid Info and Footer Area (y: 520 onward) ──
    const bottomY = 565;
    const issueDate = this.parseDate(member.joinedAt || member.createdAt);
    const issueDateStr = issueDate ? this.formatDateObj(issueDate) : 'N/A';

    let validUptoStr = 'N/A';
    if (issueDate) {
      const exp = new Date(issueDate);
      exp.setFullYear(exp.getFullYear() + 3);
      validUptoStr = this.formatDateObj(exp);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '11px sans-serif';
    ctx.fillText(`ISSUE DATE: ${issueDateStr}`, leftColX, bottomY);
    ctx.fillText(`VALID UPTO: ${validUptoStr}`, leftColX + 200, bottomY);

    const joinYear = member.createdAt ? new Date(member.createdAt).getFullYear() : new Date().getFullYear();
    ctx.fillText(`MEMBER SINCE: ${joinYear}`, leftColX, bottomY + 18);

    // Authority Signature
    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.textAlign = 'right';
    ctx.fillText('Authorized Signatory', w - 50, bottomY + 18);
    ctx.textAlign = 'left';

    // Thin bottom gold line removed

    // Footer copyright bar text
    ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BCAR  ·  Member Portal  ·  Business Correspondent Association Rajasthan', w / 2, h - 16);
    ctx.textAlign = 'left';

    // Subtle center watermark logo graphic (shield watermarked in center)
    ctx.save();
    ctx.globalAlpha = 0.015;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px serif';
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.textAlign = 'center';
    ctx.fillText('BCAR', 0, 0);
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════════
  // BACK SIDE (Horizontal Premium Card)
  // ════════════════════════════════════════════════════════════════════

  private drawBackSide(ctx: CanvasRenderingContext2D, w: number, h: number, yOff: number): void {
    // --- Premium Gradient Background ---
    const bg = ctx.createLinearGradient(0, yOff, w, yOff + h);
    bg.addColorStop(0, '#041a3d');
    bg.addColorStop(0.5, '#0a2246');
    bg.addColorStop(1, '#0e3160');
    this.roundRect(ctx, 0, yOff, w, h, 40);
    ctx.fillStyle = bg;
    ctx.fill();

    // --- Gold Outer Border ---
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // --- Inner Border ---
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, 12, yOff + 12, w - 24, h - 24, 32);
    ctx.stroke();

    // ── 1. Header Title ──
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';

    const header = 'BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN';
    ctx.fillText(header, w / 2, yOff + 45);

    // Underline
    const hw = ctx.measureText(header).width;
    ctx.beginPath();
    ctx.moveTo(w / 2 - hw / 2, yOff + 52);
    ctx.lineTo(w / 2 + hw / 2, yOff + 52);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

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

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    const bulletX = 55;
    let bulletY = yOff + 95;
    const maxTextW = w - 110;

    for (const term of terms) {
      bulletY = this.wrapText(ctx, term, bulletX, bulletY, maxTextW, 20);
      bulletY += 10;
    }

    // ── 3. Contact Details Centered Footer ──
    const contactStartY = yOff + h - 145;

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#D4AF37';

    const title = 'If found, please contact:';
    ctx.fillText(title, w / 2, contactStartY);

    const tw = ctx.measureText(title).width;
    ctx.beginPath();
    ctx.moveTo(w / 2 - tw / 2, contactStartY + 4);
    ctx.lineTo(w / 2 + tw / 2, contactStartY + 4);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Business Correspondent Association Rajasthan,', w / 2, contactStartY + 26);
    ctx.fillText('Reg. No. TU/2026/14/132549,', w / 2, contactStartY + 48);
    ctx.fillText('Rajasthan, India', w / 2, contactStartY + 70);

    // Bottom Gold Stripe removed

    ctx.textAlign = 'left';
  }

  // ════════════════════════════════════════════════════════════════════
  // SYNTHETIC QR CODE GENERATOR
  // ════════════════════════════════════════════════════════════════════

  /**
   * Generates a fully realistic QR code graphic using canvas APIs.
   */
  private drawSyntheticQRCode(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = '#06162d'; // Navy blue QR dots

    // Helper to draw QR alignment boxes
    const drawFinderPattern = (px: number, py: number, sqSize: number) => {
      ctx.fillRect(px, py, sqSize, sqSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 4, py + 4, sqSize - 8, sqSize - 8);
      ctx.fillStyle = '#06162d';
      ctx.fillRect(px + 8, py + 8, sqSize - 16, sqSize - 16);
    };

    // Draw the 3 finder squares in corners
    const finderSize = 28;
    drawFinderPattern(x + 4, y + 4, finderSize); // Top-left
    drawFinderPattern(x + size - finderSize - 4, y + 4, finderSize); // Top-right
    drawFinderPattern(x + 4, y + size - finderSize - 4, finderSize); // Bottom-left

    // Draw small alignment square (bottom-right)
    ctx.fillRect(x + size - 16, y + size - 16, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + size - 14, y + size - 14, 4, 4);
    ctx.fillStyle = '#06162d';
    ctx.fillRect(x + size - 13, y + size - 13, 2, 2);

    // Render random data blocks/dots in the middle QR grid
    const blockSize = 4;
    const gridCount = Math.floor(size / blockSize);

    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        // Skip finder pattern zones
        const isNearTopLeft = r < 8 && c < 8;
        const isNearTopRight = r < 8 && c >= gridCount - 8;
        const isNearBottomLeft = r >= gridCount - 8 && c < 8;
        const isNearBottomRight = r >= gridCount - 5 && c >= gridCount - 5;

        if (isNearTopLeft || isNearTopRight || isNearBottomLeft || isNearBottomRight) {
          continue;
        }

        // Random dot layout
        if (Math.random() > 0.45) {
          ctx.fillRect(x + c * blockSize, y + r * blockSize, blockSize, blockSize);
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // DRAWING / UTILITY HELPERS
  // ════════════════════════════════════════════════════════════════════

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = words[i];
        currentY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) {
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
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
