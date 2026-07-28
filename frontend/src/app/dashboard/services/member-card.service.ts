import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberCardService {

  /**
   * Generates and downloads a high-resolution BCAR membership card (Front + Back stacked).
   * Design replicates the official card image exactly: Circular profile, double blue rings,
   * two-column details grids with vector icons, checked list terms, and map pin return box.
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
    const W = 638;
    const H = 770;
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
  private async drawFrontSide(ctx: CanvasRenderingContext2D, member: any, w: number, h: number): Promise<void> {
    // 1. White Card Base Background
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, 0, 0, w, h, 24);
    ctx.fill();

    // 2. Watermark Logo (Center Background)
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.04;
      const wmSize = 330;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, h / 2 - wmSize / 2 + 10, wmSize, wmSize);
      ctx.restore();
    } catch (e) {}

    // ── 3. TOP BLUE HEADER STRIPE BANNER ──
    const headerH = 108;
    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, 0, 0, w, headerH, 24);
    ctx.clip();
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, 0, w, headerH);
    ctx.restore();

    // Fill bottom corners of header rectangle to keep sharp join with gold bar
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(0, headerH - 24, w, 24);

    // A. LOGO (Left side of header banner)
    const logoSize = 64;
    const logoX = 16;
    const logoY = 22;

    try {
      const logo = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(logoX, logoY, logoSize, logoSize);
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    } catch {}

    // B. HEADER TEXT (Left aligned next to logo)
    const textX = 92;
    ctx.textAlign = 'left';

    // BCAR Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 27px Arial, Helvetica, sans-serif';
    ctx.fillText('BCAR', textX, 42);

    // Organization Subtitle
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', textX, 61);

    // Hindi Tagline
    ctx.fillStyle = '#E0F2FE';
    ctx.font = 'bold 11px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillText('राजस्थान के बैंक मित्रों का सशक्त संगठन', textX, 80);

    // C. OFFICIAL MEMBERSHIP CARD PILL BADGE (Right side of header banner)
    const badgeW = 165;
    const badgeH = 28;
    const badgeX = w - badgeW - 14;
    const badgeY = 40;

    ctx.save();
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL MEMBERSHIP CARD', badgeX + badgeW / 2, badgeY + 18);

    // ── 4. GOLD ACCENT DIVIDER BAR ──
    const goldY = 108;
    const goldH = 3.5;
    ctx.fillStyle = '#F5C842';
    ctx.fillRect(0, goldY, w, goldH);

    // ── 5. MAIN CARD BODY (LEFT PHOTO COL + RIGHT DETAILS COL) ──

    // ── LEFT COLUMN (Photo, Name, ID Badge, Type Badge) ──
    const leftColX = 16;
    const photoW = 154;
    const photoH = 176;
    const photoY = 138;
    const photoRadius = 12;

    // Square Photo Frame with rounded corners & blue border
    ctx.beginPath();
    this.roundRect(ctx, leftColX - 3, photoY - 3, photoW + 6, photoH + 6, photoRadius + 2);
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    let photoLoaded = false;
    const photoUrl = this.getProfilePhotoUrl(member);
    if (photoUrl) {
      try {
        const img = await this.loadImage(photoUrl);
        ctx.save();
        ctx.beginPath();
        this.roundRect(ctx, leftColX, photoY, photoW, photoH, photoRadius);
        ctx.clip();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(leftColX, photoY, photoW, photoH);

        const aspect = img.width / img.height;
        let dw = photoW;
        let dh = photoH;
        let dx = leftColX;
        let dy = photoY;
        if (aspect > photoW / photoH) {
          dw = photoH * aspect;
          dx = leftColX - (dw - photoW) / 2;
        } else {
          dh = photoW / aspect;
          dy = photoY - (dh - photoH) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        photoLoaded = true;
      } catch (err) {
        photoLoaded = false;
      }
    }

    if (!photoLoaded) {
      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, leftColX, photoY, photoW, photoH, photoRadius);
      ctx.clip();
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(leftColX, photoY, photoW, photoH);
      this.drawPersonIcon(ctx, leftColX + photoW / 2, photoY + photoH / 2 + 8);
      ctx.restore();
    }

    // Verified Checkmark Badge (Top Right of Square Photo Box)
    const checkCx = leftColX + photoW - 2;
    const checkCy = photoY + 4;
    const checkRadius = 12;

    ctx.beginPath();
    ctx.arc(checkCx, checkCy, checkRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0D47A1';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Checkmark icon draw inside circle
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(checkCx - 4.5, checkCy);
    ctx.lineTo(checkCx - 1, checkCy + 3.5);
    ctx.lineTo(checkCx + 4.5, checkCy - 3.5);
    ctx.stroke();

    // Member Name (Centered under photo with dynamic font auto-scaling to prevent left/right clipping)
    const nameY = photoY + photoH + 26;
    const nameStr = (member.name || 'MEMBER NAME').toUpperCase();
    let nameFontSize = 16.5;
    ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    while (ctx.measureText(nameStr).width > photoW + 8 && nameFontSize > 10.5) {
      nameFontSize -= 0.5;
      ctx.font = `900 ${nameFontSize}px Arial, Helvetica, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0B2D5C';
    ctx.fillText(nameStr, leftColX + photoW / 2, nameY);

    // Membership ID Pill Badge
    const mNoBadgeW = 154;
    const mNoBadgeH = 28;
    const mNoBadgeY = nameY + 10;
    ctx.fillStyle = '#0D47A1';
    this.roundRect(ctx, leftColX, mNoBadgeY, mNoBadgeW, mNoBadgeH, 7);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13.5px monospace';
    ctx.fillText(member.membershipNo || 'BCAR/RJ/00001', leftColX + photoW / 2, mNoBadgeY + 19);

    // Membership Type Light Blue Badge
    const tBadgeW = 154;
    const tBadgeH = 26;
    const tBadgeY = mNoBadgeY + 34;
    ctx.fillStyle = '#E0F2FE';
    this.roundRect(ctx, leftColX, tBadgeY, tBadgeW, tBadgeH, 5);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
    ctx.fillText('BANK MITRA (BC/CSP)', leftColX + photoW / 2, tBadgeY + 17);

    // ── VERTICAL DIVIDER LINE ──
    const divX = 188;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(divX, 134);
    ctx.lineTo(divX, 665);
    ctx.stroke();

    // ── RIGHT COLUMN (DETAILS GRID LIST) ──
    const rightColX = 200;
    const rightColW = w - rightColX - 16;
    let gridY = 142; // Generous 30px top margin gap below gold accent bar!
    const lineH = 35;

    // Formatting Address
    const addrParts = [member.homeAddressVill, member.gramPanchayat, member.devBlock].filter(Boolean);
    const addrLine1 = addrParts.join(', ') || 'Jagatpura, Jaipur';
    const addrLine2 = `${member.district || 'Rajasthan'} - ${member.pin || ''}`.trim().replace(/ -\s*$/, '');
    const addressVal = `${addrLine1}, ${addrLine2}`;

    ctx.textAlign = 'left';

    // 1. Address Row (Dynamic word wrap without truncation!)
    this.drawCardDetailRow(ctx, 'ADDRESS', addressVal, rightColX, gridY, rightColW, true);
    gridY += lineH * 2.2;

    // 2. Bank Name Row
    this.drawCardDetailRow(ctx, 'BANK NAME', member.bankName || '—', rightColX, gridY, rightColW);
    gridY += lineH;

    // 3. District Row
    this.drawCardDetailRow(ctx, 'DISTRICT', member.district || '—', rightColX, gridY, rightColW);
    gridY += lineH;

    // 4. Pin Code Row
    this.drawCardDetailRow(ctx, 'PIN CODE', member.pin || '—', rightColX, gridY, rightColW, false, true);
    gridY += lineH;

    // 5. BCAR BC Code Row
    this.drawCardDetailRow(ctx, 'BCAR BC CODE', member.bcCspIdNo || '—', rightColX, gridY, rightColW, false, true);
    gridY += lineH;

    // 6. Link Branch Row
    this.drawCardDetailRow(ctx, 'LINK BRANCH', member.linkBranchName || '—', rightColX, gridY, rightColW);
    gridY += lineH;

    // 7. Mobile No Row
    this.drawCardDetailRow(ctx, 'MOBILE NO.', member.phone || '—', rightColX, gridY, rightColW, false, true);
    gridY += lineH;

    // 8. Aadhaar No Row
    this.drawCardDetailRow(ctx, 'AADHAAR NO.', this.maskAadhaar(member.aadhaarNumber), rightColX, gridY, rightColW, false, true);
    gridY += lineH;

    // 9. Blood Group Row
    this.drawCardDetailRow(ctx, 'BLOOD GROUP', member.bloodGroup || '—', rightColX, gridY, rightColW, false, false, true);
    gridY += lineH;

    // 10. Date of Birth Row
    this.drawCardDetailRow(ctx, 'DATE OF BIRTH', this.formatDate(member.dob), rightColX, gridY, rightColW, false, true);
    gridY += lineH + 6;

    // 11. Dates Divider Row (Issue Date & Valid Upto)
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rightColX, gridY);
    ctx.lineTo(rightColX + rightColW, gridY);
    ctx.stroke();

    gridY += 16;
    const issueDate = this.parseDate(member.joinedAt || member.createdAt);
    const issueDateStr = issueDate ? this.formatDateObj(issueDate) : '24/07/2025';

    const dateHalfW = rightColW / 2 - 8;

    // Left Date Block: Issue Date
    ctx.fillStyle = '#455A64';
    ctx.font = 'bold 9.5px Arial, Helvetica, sans-serif';
    ctx.fillText('ISSUE DATE', rightColX, gridY);
    ctx.fillStyle = '#0D47A1';
    ctx.font = 'bold 13.5px monospace';
    ctx.fillText(issueDateStr, rightColX, gridY + 18);

    // Date Divider Line
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rightColX + dateHalfW + 4, gridY - 2);
    ctx.lineTo(rightColX + dateHalfW + 4, gridY + 22);
    ctx.stroke();

    // Right Date Block: Valid Upto
    const rightDateX = rightColX + dateHalfW + 16;
    ctx.fillStyle = '#455A64';
    ctx.font = 'bold 9.5px Arial, Helvetica, sans-serif';
    ctx.fillText('VALID UPTO', rightDateX, gridY);
    ctx.fillStyle = '#0D47A1';
    ctx.font = 'bold 13.5px monospace';
    ctx.fillText('Lifetime', rightDateX, gridY + 17);

    // ── 6. FOOTER ROW (Reg No, Helpline & Pawan Kumar Signature) ──
    const footerY = 675;

    // Footer Top Border Line
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, footerY);
    ctx.lineTo(w, footerY);
    ctx.stroke();

    // Outer card bottom border stroke
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    this.roundRect(ctx, 0, 0, w, h, 24);
    ctx.stroke();

    // Left Footer Text (Reg No & Helpline)
    ctx.fillStyle = '#546E7A';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Reg. No.: TU/2026/14/132549   |   Helpline: +91 80948 26724', 16, footerY + 48);

    // Right Footer Signature Block (Pawan Kumar Actual Signature Image)
    const sigW = 125;
    const sigH = 46;
    const sigX = w - sigW - 20;
    const sigY = footerY + 2;

    // Draw Pawan Kumar Signature PNG with transparent background
    try {
      const sigImg = await this.loadImage('/images/authorised-signature.png');
      ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
    } catch (err) {}

    // Signature Line
    const sigLineY = footerY + 48;
    ctx.strokeStyle = '#0D47A1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sigX - 4, sigLineY);
    ctx.lineTo(sigX + sigW + 4, sigLineY);
    ctx.stroke();

    // Signature Labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0D47A1';
    ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
    ctx.fillText('Authorised Signatory', sigX + sigW / 2, sigLineY + 14);

    ctx.fillStyle = '#546E7A';
    ctx.font = 'bold 9.5px Arial, Helvetica, sans-serif';
    ctx.fillText('BCAR, Rajasthan', sigX + sigW / 2, sigLineY + 26);

    ctx.textAlign = 'left';
  }

  // Helper method to draw clean detail row with full multi-line word wrapping
  private drawCardDetailRow(
    ctx: CanvasRenderingContext2D,
    label: string,
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    isWrap: boolean = false,
    isMono: boolean = false,
    isRed: boolean = false
  ) {
    ctx.fillStyle = '#37474F';
    ctx.font = 'bold 12.5px Arial, Helvetica, sans-serif';
    ctx.fillText(label, x, y);

    const colonX = x + 110;
    ctx.fillStyle = '#0D47A1';
    ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
    ctx.fillText(':', colonX, y);

    const valX = colonX + 10;
    const availW = x + maxWidth - valX;

    if (isRed) {
      ctx.fillStyle = '#C62828';
      ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
      ctx.fillText(value || '—', valX, y);
    } else if (isMono) {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13.5px monospace';
      ctx.fillText(value || '—', valX, y);
    } else if (isWrap) {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12.5px Arial, Helvetica, sans-serif';
      const words = (value || '—').split(' ');
      let line1 = '';
      let line2 = '';
      let i = 0;

      // Build line 1 word by word cleanly without truncation
      while (i < words.length) {
        const testLine = line1 ? line1 + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width <= availW) {
          line1 = testLine;
          i++;
        } else {
          break;
        }
      }

      // Build line 2 word by word with remaining words
      while (i < words.length) {
        const testLine = line2 ? line2 + ' ' + words[i] : words[i];
        if (ctx.measureText(testLine).width <= availW) {
          line2 = testLine;
          i++;
        } else {
          line2 = this.truncateText(ctx, line2 + ' ' + words.slice(i).join(' '), availW);
          break;
        }
      }

      ctx.fillText(line1, valX, y);
      if (line2) {
        ctx.fillText(line2, valX, y + 18);
      }
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px Arial, Helvetica, sans-serif';
      const truncated = this.truncateText(ctx, value || '—', availW);
      ctx.fillText(truncated, valX, y);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // BACK SIDE (Vertical Premium Light Blue Corporate Card)
  // ════════════════════════════════════════════════════════════════════

  private async drawBackSide(ctx: CanvasRenderingContext2D, w: number, h: number, yOff: number): Promise<void> {
    // 1. Background
    ctx.fillStyle = '#F5FAFE';
    this.roundRect(ctx, 0, yOff, w, h, 24);
    ctx.fill();

    // 2. Watermark Logo
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.05;
      const wmSize = 320;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, yOff + h / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
    } catch (e) {}

    // 3. Thick Blue Outer Border
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    this.roundRect(ctx, 0, yOff, w, h, 24);
    ctx.stroke();

    // ── Header Title ──
    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', w / 2, yOff + 42);

    // T&C badge
    const tcBadgeW = 160;
    const tcBadgeH = 22;
    const tcBadgeX = w / 2 - tcBadgeW / 2;
    const tcBadgeY = yOff + 54;

    ctx.fillStyle = '#0B5ED7';
    this.roundRect(ctx, tcBadgeX, tcBadgeY, tcBadgeW, tcBadgeH, 5);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial, Helvetica, sans-serif';
    ctx.fillText('TERMS & CONDITIONS', w / 2, tcBadgeY + 15);
    ctx.textAlign = 'left';

    // ── Terms Container Box ──
    const tcBoxX = 24;
    const tcBoxY = yOff + 94;
    const tcBoxW = w - 48;
    const tcBoxH = 460;

    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, tcBoxX, tcBoxY, tcBoxW, tcBoxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const colX = tcBoxX + 16;
    const colW = tcBoxW - 32;
    let currY = tcBoxY + 26;

    const terms = [
      'CSP is an independent entrepreneur having a franchise contract with BCAR.',
      'CSP is NOT an employee of BCAR or the Bank.',
      'CSP is authorized to serve Bank customers as per Bank specified BC services in his / her specific location only.',
      'This card is NOT transferable and must be produced by the CSP on demand.',
      'This card must be carried by the CSP at all times during operating hours.',
      'CSP must maintain safe keep of this card and return the card on termination of franchise contract to BCAR.',
      'BCAR is NOT liable for any misuse of this card.'
    ];

    terms.forEach(term => {
      currY += this.drawTermItem(ctx, term, colX, currY, colW) + 6;
    });

    // ── Bottom Return Box ──
    const returnBoxX = 24;
    const returnBoxY = yOff + 580;
    const returnBoxW = w - 48;
    const returnBoxH = 140;

    ctx.fillStyle = '#F0F9FF';
    this.roundRect(ctx, returnBoxX, returnBoxY, returnBoxW, returnBoxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    this.drawLocationBoxLogo(ctx, w / 2 - 16, returnBoxY + 14, 34);

    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('If found, please return to:', w / 2, returnBoxY + 68);

    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 14.5px Arial, Helvetica, sans-serif';
    ctx.fillText('Business Correspondent Association Rajasthan', w / 2, returnBoxY + 90);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Arial, Helvetica, sans-serif';
    ctx.fillText('Reg. No.: TU/2026/14/132549    |    Helpline: +91 80948 26724    |    Rajasthan, India', w / 2, returnBoxY + 114);
    ctx.textAlign = 'left';
  }




  /** Truncate text with ellipsis so it fits within maxWidth pixels */
  private truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (maxWidth <= 0) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let result = text;
    while (result.length > 1 && ctx.measureText(result + '…').width > maxWidth) {
      result = result.slice(0, -1);
    }
    return result + '…';
  }

  private drawTermItem(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number
  ): number {
    const bulletSize = 16;
    this.drawCheckmarkIcon(ctx, x, y, bulletSize);

    ctx.fillStyle = '#334155';
    ctx.font = '500 13px Arial, Helvetica, sans-serif';
    const textX = x + 24;
    const words = text.split(' ');
    let line = '';
    let currY = y + 12;
    const lineHeight = 19;

    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > (width - 24)) {
        ctx.fillText(line, textX, currY);
        line = words[i];
        currY += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, textX, currY);
    return currY - y + 12;
  }

  // ════════════════════════════════════════════════════════════════════
  // VECTOR DRAW HELPERS
  // ════════════════════════════════════════════════════════════════════

  private drawVectorIcon(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {
    if      (type === 'pin')      this.drawLocationPinIcon(ctx, x, y, size);
    else if (type === 'building') this.drawBuildingIcon(ctx, x, y, size);
    else if (type === 'envelope') this.drawEnvelopeIcon(ctx, x, y, size);
    else if (type === 'phone')    this.drawPhoneIcon(ctx, x, y, size);
    else if (type === 'link')     this.drawLinkIcon(ctx, x, y, size);
    else if (type === 'user')     this.drawUserIcon(ctx, x, y, size);
    else if (type === 'id')       this.drawIdCardIcon(ctx, x, y, size);
    else if (type === 'bank')     this.drawBankIcon(ctx, x, y, size);
    else if (type === 'wallet')   this.drawWalletIcon(ctx, x, y, size);
    else if (type === 'card')     this.drawCreditCardIcon(ctx, x, y, size);
    else if (type === 'key')      this.drawKeyIcon(ctx, x, y, size);
  }

  private drawLocationPinIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#0B5ED7';
    ctx.translate(x + size / 2, y + size / 2);
    ctx.beginPath();
    ctx.arc(0, -size * 0.15, size * 0.25, Math.PI, 0, false);
    ctx.bezierCurveTo(size * 0.25, -size * 0.15, size * 0.25, size * 0.15, 0, size * 0.45);
    ctx.bezierCurveTo(-size * 0.25, size * 0.15, -size * 0.25, -size * 0.15, -size * 0.25, -size * 0.15);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  private drawBuildingIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#0B5ED7';
    ctx.translate(x, y + 2);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(size, size * 0.3);
    ctx.fill();
    ctx.fillRect(0, size * 0.75, size, size * 0.15);
    ctx.fillRect(size * 0.15, size * 0.35, size * 0.1, size * 0.4);
    ctx.fillRect(size * 0.45, size * 0.35, size * 0.1, size * 0.4);
    ctx.fillRect(size * 0.75, size * 0.35, size * 0.1, size * 0.4);
    ctx.restore();
  }

  private drawEnvelopeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    const h = size * 0.75;
    ctx.strokeRect(x, y + (size - h) / 2 + 1, size, h);
    ctx.beginPath();
    ctx.moveTo(x, y + (size - h) / 2 + 1);
    ctx.lineTo(x + size / 2, y + size / 2 + 1);
    ctx.lineTo(x + size, y + (size - h) / 2 + 1);
    ctx.stroke();
    ctx.restore();
  }

  private drawPhoneIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#0B5ED7';
    ctx.translate(x + size / 2, y + size / 2 + 1);
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-size / 2, -size / 6);
    ctx.quadraticCurveTo(0, -size / 3, size / 2, -size / 6);
    ctx.lineTo(size * 0.4, size / 10);
    ctx.quadraticCurveTo(0, -size / 15, -size * 0.4, size / 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-size * 0.4, -size * 0.05, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.4, -size * 0.05, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawLinkIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 2.2;
    ctx.translate(x + size / 2, y + size / 2 + 1);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    this.drawCapsule(ctx, -size * 0.35, -size * 0.15, size * 0.5, size * 0.3);
    ctx.stroke();
    ctx.beginPath();
    this.drawCapsule(ctx, -size * 0.15, -size * 0.35, size * 0.3, size * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  private drawUserIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#0B5ED7';
    const cx = x + size / 2;
    const cy = y + size / 2 + 1;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.15, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.35, cy + size * 0.4);
    ctx.quadraticCurveTo(cx - size * 0.35, cy + size * 0.1, cx, cy + size * 0.1);
    ctx.quadraticCurveTo(cx + size * 0.35, cy + size * 0.1, cx + size * 0.35, cy + size * 0.4);
    ctx.fill();
    ctx.restore();
  }

  private drawIdCardIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    const h = size * 0.72;
    ctx.strokeRect(x, y + (size - h) / 2 + 1, size, h);
    ctx.fillStyle = '#0B5ED7';
    ctx.fillRect(x + 4, y + (size - h) / 2 + 4, size * 0.24, h - 6);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.38, y + (size - h) / 2 + 5);
    ctx.lineTo(x + size - 4, y + (size - h) / 2 + 5);
    ctx.moveTo(x + size * 0.38, y + (size - h) / 2 + 10);
    ctx.lineTo(x + size - 4, y + (size - h) / 2 + 10);
    ctx.moveTo(x + size * 0.38, y + (size - h) / 2 + 15);
    ctx.lineTo(x + size - 8, y + (size - h) / 2 + 15);
    ctx.stroke();
    ctx.restore();
  }

  private drawBankIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#0B5ED7';
    ctx.translate(x, y + 1);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.25);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(size, size * 0.25);
    ctx.fill();
    ctx.fillRect(0, size * 0.22, size, size * 0.08);
    ctx.fillRect(size * 0.15, size * 0.3, size * 0.1, size * 0.45);
    ctx.fillRect(size * 0.45, size * 0.3, size * 0.1, size * 0.45);
    ctx.fillRect(size * 0.75, size * 0.3, size * 0.1, size * 0.45);
    ctx.fillRect(0, size * 0.75, size, size * 0.1);
    ctx.fillRect(-2, size * 0.85, size + 4, size * 0.12);
    ctx.restore();
  }

  private drawWalletIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    const h = size * 0.75;
    ctx.strokeRect(x, y + (size - h) / 2 + 1, size, h);
    ctx.fillStyle = '#0B5ED7';
    ctx.fillRect(x + size - 8, y + size / 2 - 3, 8, 6);
    ctx.beginPath();
    ctx.arc(x + size - 4, y + size / 2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  private drawCreditCardIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    const h = size * 0.72;
    ctx.strokeRect(x, y + (size - h) / 2 + 1, size, h);
    ctx.fillStyle = '#0B5ED7';
    ctx.fillRect(x, y + (size - h) / 2 + 3, size, 4);
    ctx.fillRect(x + 4, y + size / 2 + 2, 5, 4);
    ctx.restore();
  }

  private drawKeyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    ctx.translate(x + size / 2, y + size / 2 + 1);
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.arc(-size * 0.22, 0, size * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-size * 0.02, 0);
    ctx.lineTo(size * 0.45, 0);
    ctx.stroke();
    ctx.fillRect(size * 0.25, 0, 3, 5);
    ctx.fillRect(size * 0.38, 0, 3, 5);
    ctx.restore();
  }

  private drawCalendarIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x, y + 3, size, size - 3);
    ctx.fillStyle = '#0B5ED7';
    ctx.fillRect(x + 4, y, 2.5, 5);
    ctx.fillRect(x + size - 6.5, y, 2.5, 5);
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x + size, y + 9);
    ctx.stroke();
    ctx.fillRect(x + 4,  y + 13, 3, 3);
    ctx.fillRect(x + 10, y + 13, 3, 3);
    ctx.fillRect(x + 16, y + 13, 3, 3);
    ctx.fillRect(x + 4,  y + 19, 3, 3);
    ctx.fillRect(x + 10, y + 19, 3, 3);
    ctx.fillRect(x + 16, y + 19, 3, 3);
    ctx.restore();
  }

  private drawCheckmarkIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0B5ED7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.22, cy - size * 0.02);
    ctx.lineTo(cx - size * 0.04, cy + size * 0.16);
    ctx.lineTo(cx + size * 0.24, cy - size * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  private drawLocationBoxLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.save();
    const cx = x + size / 2;
    const cy = y + size / 2;

    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - size * 0.48, cy); ctx.lineTo(cx - size * 0.28, cy);
    ctx.moveTo(cx + size * 0.28, cy); ctx.lineTo(cx + size * 0.48, cy);
    ctx.moveTo(cx, cy - size * 0.48); ctx.lineTo(cx, cy - size * 0.28);
    ctx.moveTo(cx, cy + size * 0.28); ctx.lineTo(cx, cy + size * 0.48);
    ctx.stroke();

    ctx.fillStyle = '#0B5ED7';
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.08, size * 0.18, Math.PI, 0, false);
    ctx.bezierCurveTo(cx + size * 0.18, cy - size * 0.08, cx + size * 0.18, cy + size * 0.1, cx, cy + size * 0.32);
    ctx.bezierCurveTo(cx - size * 0.18, cy + size * 0.1, cx - size * 0.18, cy - size * 0.08, cx - size * 0.18, cy - size * 0.08);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.08, size * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════════
  // PROFILE IMAGE & UTILITY HELPERS
  // ════════════════════════════════════════════════════════════════════

  private getProfilePhotoUrl(member: any): string | null {
    if (!member) return null;
    const url = member.profilePhoto?.secure_url || member.photograph?.secure_url
      || member.profilePhoto?.url || member.photograph?.url
      || (typeof member.profilePhoto === 'string' && member.profilePhoto.trim() ? member.profilePhoto : null)
      || (typeof member.photograph   === 'string' && member.photograph.trim()   ? member.photograph   : null)
      || (typeof member.profileImage === 'string' && member.profileImage.trim() ? member.profileImage : null)
      || member.profileImage?.secure_url || member.profileImage?.url;

    if (!url) return null;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  private drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = Math.min(w, h) / 2;
    this.roundRect(ctx, x, y, w, h, r);
  }

  private maskAadhaar(num: string | undefined): string {
    if (!num) return '—';
    const clean = num.toString().replace(/\D/g, '');
    return clean.length >= 4 ? `XXXX XXXX ${clean.slice(-4)}` : num;
  }

  private formatDate(value: any): string {
    if (!value) return 'N/A';
    if (typeof value === 'string' && /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(value.trim())) return value.trim();
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
    const day   = String(d.getDate()).padStart(2, '0');
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
