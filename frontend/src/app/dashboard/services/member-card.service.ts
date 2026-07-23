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
    // 1. Background (very light blue slate)
    ctx.fillStyle = '#F5FAFE';
    this.roundRect(ctx, 0, 0, w, h, 30);
    ctx.fill();

    // 2. Watermark Logo
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.05;
      const wmSize = 350;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, h / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
    } catch (e) {}

    // 3. Thick Blue Outer Border
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    this.roundRect(ctx, 0, 0, w, h, 30);
    ctx.stroke();

    // ── Header (Logo + Title) ──
    const logoX = 50;
    const logoY = 25;
    const logoSize = 80;

    let logoLoaded = false;
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

      // Blue border ring around logo
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#0B5ED7';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      logoLoaded = true;
    } catch {
      logoLoaded = false;
    }

    const textStartX = logoLoaded ? logoX + logoSize + 20 : logoX;

    // "BCAR"
    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 38px Arial, Helvetica, sans-serif';
    ctx.fillText('BCAR', textStartX, logoY + 36);

    // "BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN"
    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', textStartX, logoY + 54);

    // Hindi tagline "राजस्थान के बैंक मित्रों का सशक्त संगठन"
    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 14px "Noto Sans Devanagari", "Segoe UI", sans-serif';
    ctx.fillText('राजस्थान के बैंक मित्रों का सशक्त संगठन', textStartX, logoY + 74);

    // Top-Right Official Membership Card Pill Badge
    const badgeW = 200;
    const badgeH = 32;
    const badgeX = w - badgeW - 50;
    const badgeY = logoY + 12;

    ctx.fillStyle = '#0B5ED7';
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL MEMBERSHIP CARD', badgeX + badgeW / 2, badgeY + 20);
    ctx.textAlign = 'left';

    // ── Member Profile Circular Headshot ──
    const photoCx = 185;
    const photoCy = 210;
    const photoRadius = 80;

    // Draw blue outer ring
    ctx.beginPath();
    ctx.arc(photoCx, photoCy, photoRadius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw white gap ring
    ctx.beginPath();
    ctx.arc(photoCx, photoCy, photoRadius + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    let photoLoaded = false;
    const photoUrl = this.getProfilePhotoUrl(member);
    if (photoUrl) {
      try {
        const img = await this.loadImage(photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2);
        ctx.clip();
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(photoCx - photoRadius, photoCy - photoRadius, photoRadius * 2, photoRadius * 2);

        const aspect = img.width / img.height;
        let dw = photoRadius * 2;
        let dh = photoRadius * 2;
        let dx = photoCx - photoRadius;
        let dy = photoCy - photoRadius;
        if (aspect > 1) {
          dw = photoRadius * 2 * aspect;
          dx = photoCx - dw / 2;
        } else {
          dh = photoRadius * 2 / aspect;
          dy = photoCy - photoRadius;
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
      ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(photoCx - photoRadius, photoCy - photoRadius, photoRadius * 2, photoRadius * 2);
      this.drawPersonIcon(ctx, photoCx, photoCy + 10);
      ctx.restore();
    }

    // BCAR/RJ/00001 Badge directly below circular photo
    const mNoBadgeW = 170;
    const mNoBadgeH = 34;
    const mNoBadgeX = photoCx - mNoBadgeW / 2;
    const mNoBadgeY = photoCy + photoRadius + 14;

    ctx.fillStyle = '#0B5ED7';
    this.roundRect(ctx, mNoBadgeX, mNoBadgeY, mNoBadgeW, mNoBadgeH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(member.membershipNo || 'BCAR/RJ/00001', photoCx, mNoBadgeY + 22);
    ctx.textAlign = 'left';

    // ── Member Name & Valid Dates Next to Photo ──
    const infoStartX = 325;

    // Member Name (RAVI KUMAR SAINI)
    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 31px Arial, Helvetica, sans-serif';
    ctx.fillText((member.name || 'RAVI KUMAR SAINI').toUpperCase(), infoStartX, 154);

    // Membership Type: BANK MITRA (CSP)
    ctx.fillStyle = '#475569';
    ctx.font = '500 17px Arial, Helvetica, sans-serif';
    ctx.fillText('Membership Type : ', infoStartX, 186);
    const typeLabelW = ctx.measureText('Membership Type : ').width;
    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 17px Arial, Helvetica, sans-serif';
    ctx.fillText('BANK MITRA (CSP)', infoStartX + typeLabelW, 186);

    // Date block with calendar icon
    const dateBlockY = 208;
    
    // Issue Date
    this.drawCalendarIcon(ctx, infoStartX, dateBlockY + 12, 30);
    const issueDate = this.parseDate(member.joinedAt || member.createdAt);
    const issueDateStr = issueDate ? this.formatDateObj(issueDate) : '24-07-2025';

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10.5px Arial, Helvetica, sans-serif';
    ctx.fillText('ISSUE DATE', infoStartX + 45, dateBlockY + 20);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(issueDateStr, infoStartX + 45, dateBlockY + 38);

    // ── Verified Seal Badge ──
    const sealX = w - 145;
    const sealY = 115;
    const sealRadius = 45;
    const sealCx = sealX + sealRadius;
    const sealCy = sealY + sealRadius;

    ctx.beginPath();
    ctx.arc(sealCx, sealCy, sealRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0B5ED7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealCx, sealCy - 10, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(sealCx - 6, sealCy - 10);
    ctx.lineTo(sealCx - 1, sealCy - 5);
    ctx.lineTo(sealCx + 6, sealCy - 13);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED', sealCx, sealCy + 18);
    ctx.fillText('MEMBER', sealCx, sealCy + 29);
    ctx.textAlign = 'left';

    // ── Details Boxes ──
    const boxLeftX = 45;
    const boxRightX = 525;
    const boxW = 442;
    const boxH = 215;
    const boxY = 320;

    // Draw Left Box (PERSONAL & LOCATION DETAILS)
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, boxLeftX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.fillText('PERSONAL & LOCATION DETAILS', boxLeftX + 16, boxY + 24);

    ctx.strokeStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(boxLeftX + 16, boxY + 32);
    ctx.lineTo(boxLeftX + boxW - 16, boxY + 32);
    ctx.stroke();

    // Draw Right Box (IDENTITY & BANKING DETAILS)
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, boxRightX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.stroke();

    ctx.fillStyle = '#0B5ED7';
    ctx.fillText('IDENTITY & BANKING DETAILS', boxRightX + 16, boxY + 24);

    ctx.beginPath();
    ctx.moveTo(boxRightX + 16, boxY + 32);
    ctx.lineTo(boxRightX + boxW - 16, boxY + 32);
    ctx.stroke();

    // Populate Left Box Rows
    const addrParts = [member.homeAddressVill, member.gramPanchayat, member.devBlock].filter(Boolean);
    const addrLine1 = addrParts.join(', ') || 'Jagatpura, Jaipur';
    const addrLine2 = `${member.district || 'Rajasthan'} - ${member.pin || '302017'}`;
    const addressVal = `${addrLine1}\n${addrLine2}`;

    this.drawFieldRow(ctx, 'pin', 'Address', addressVal, boxLeftX + 16, boxY + 45, true);
    this.drawFieldRow(ctx, 'building', 'Sub District', member.subDistrict || member.devBlock || '—', boxLeftX + 16, boxY + 88);
    this.drawFieldRow(ctx, 'envelope', 'Email', member.email || '—', boxLeftX + 16, boxY + 120);
    this.drawFieldRow(ctx, 'phone', 'Contact', member.phone || '—', boxLeftX + 16, boxY + 152);
    this.drawFieldRow(ctx, 'link', 'Link Branch', member.linkBranchName || '—', boxLeftX + 16, boxY + 184);

    // Populate Right Box Rows
    this.drawFieldRow(ctx, 'user', 'Mobile No.', member.phone || '—', boxRightX + 16, boxY + 45);
    this.drawFieldRow(ctx, 'id', 'Aadhaar No.', this.maskAadhaar(member.aadhaarNumber), boxRightX + 16, boxY + 74);
    this.drawFieldRow(ctx, 'bank', 'Bank Name', member.bankName || '—', boxRightX + 16, boxY + 103);
    this.drawFieldRow(ctx, 'wallet', 'Bank Account No.', member.bankAccountNumber || member.accountNo || '—', boxRightX + 16, boxY + 132);
    this.drawFieldRow(ctx, 'card', 'IFSC Code', member.ifsc || '—', boxRightX + 16, boxY + 161);
    this.drawFieldRow(ctx, 'key', 'SSA Code', member.ssa || '—', boxRightX + 16, boxY + 190);

    // Divider Line above copyright footer
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, h - 36);
    ctx.lineTo(w - 50, h - 36);
    ctx.stroke();

    // Copyright bar
    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', w / 2, h - 16);
    ctx.textAlign = 'left';
  }

  // ════════════════════════════════════════════════════════════════════
  // BACK SIDE (Horizontal Premium Light Blue Corporate Card)
  // ════════════════════════════════════════════════════════════════════

  private async drawBackSide(ctx: CanvasRenderingContext2D, w: number, h: number, yOff: number): Promise<void> {
    // 1. Background
    ctx.fillStyle = '#F5FAFE';
    this.roundRect(ctx, 0, yOff, w, h, 30);
    ctx.fill();

    // 2. Watermark Logo
    try {
      const watermark = await this.loadImage('/images/bcar-logo-official.jpg');
      ctx.save();
      ctx.globalAlpha = 0.05;
      const wmSize = 350;
      ctx.drawImage(watermark, w / 2 - wmSize / 2, yOff + h / 2 - wmSize / 2, wmSize, wmSize);
      ctx.restore();
    } catch (e) {}

    // 3. Thick Blue Outer Border
    ctx.strokeStyle = '#0B5ED7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    this.roundRect(ctx, 0, yOff, w, h, 30);
    ctx.stroke();

    // ── Header Title ──
    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', w / 2, yOff + 42);

    // Subtitle Terms & Conditions rounded badge
    const tcBadgeW = 180;
    const tcBadgeH = 26;
    const tcBadgeX = w / 2 - tcBadgeW / 2;
    const tcBadgeY = yOff + 56;

    ctx.fillStyle = '#0B5ED7';
    this.roundRect(ctx, tcBadgeX, tcBadgeY, tcBadgeW, tcBadgeH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
    ctx.fillText('TERMS & CONDITIONS', w / 2, tcBadgeY + 17);
    ctx.textAlign = 'left';

    // ── Terms Container Box (White Background with Light Blue Border) ──
    const tcBoxX = 45;
    const tcBoxY = yOff + 100;
    const tcBoxW = w - 90;
    const tcBoxH = 385;

    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, tcBoxX, tcBoxY, tcBoxW, tcBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Render terms in two columns
    const leftColX = tcBoxX + 24;
    const rightColX = w / 2 + 12;
    const colW = 430;

    let leftY = tcBoxY + 28;
    let rightY = tcBoxY + 28;

    const leftTerms = [
      'CSP is an independent entrepreneur having a franchise contract with BCAR.',
      'CSP is NOT an employee of BCAR or the Bank.',
      'CSP is authorized to serve Bank customers as per Bank specified BC services in his / her specific location only.',
      'This card is NOT transferable and must be produced by the CSP on demand.'
    ];

    const rightTerms = [
      'This card must be carried by the CSP at all times during operating hours.',
      'CSP must maintain safe keep of this card and return the card on termination of franchise contract to BCAR.',
      'BCAR is NOT liable for any misuse of this card.'
    ];

    leftTerms.forEach(term => {
      leftY += this.drawTermItem(ctx, term, leftColX, leftY, colW);
    });

    rightTerms.forEach(term => {
      rightY += this.drawTermItem(ctx, term, rightColX, rightY, colW);
    });

    // ── Bottom Return Box ──
    const returnBoxX = 45;
    const returnBoxY = yOff + 505;
    const returnBoxW = w - 90;
    const returnBoxH = 90;

    ctx.fillStyle = '#F0F9FF';
    this.roundRect(ctx, returnBoxX, returnBoxY, returnBoxW, returnBoxH, 16);
    ctx.fill();
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Map pin box logo
    this.drawLocationBoxLogo(ctx, returnBoxX + 26, returnBoxY + 15, 60);

    // Text details
    const textStartX = returnBoxX + 104;

    ctx.fillStyle = '#0B5ED7';
    ctx.font = 'bold 13.5px Arial, Helvetica, sans-serif';
    ctx.fillText('If found, please return to:', textStartX, returnBoxY + 25);

    ctx.fillStyle = '#0b2d5c';
    ctx.font = 'bold 17px Arial, Helvetica, sans-serif';
    ctx.fillText('Business Correspondent Association Rajasthan', textStartX, returnBoxY + 47);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12.5px Arial, Helvetica, sans-serif';
    ctx.fillText('Reg. No.: TU/2026/14/132549    |    Helpline: +91 98291 15474    |    Rajasthan, India', textStartX, returnBoxY + 70);
  }

  // ════════════════════════════════════════════════════════════════════
  // DYNAMIC GRID FIELD RENDERER WITH MULTI-LINE TEXT WRAPPING
  // ════════════════════════════════════════════════════════════════════

  private drawFieldRow(
    ctx: CanvasRenderingContext2D,
    iconType: string,
    label: string,
    value: string,
    x: number,
    y: number,
    isTwoLine: boolean = false
  ) {
    const iconSize = 16;
    
    // Draw icon on the left
    this.drawVectorIcon(ctx, iconType, x, y, iconSize);

    // Label styling
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12.5px sans-serif';
    const labelText = label + ' : ';
    ctx.fillText(labelText, x + 24, y + 12);
    const lw = ctx.measureText(labelText).width;

    // Value styling
    ctx.fillStyle = '#334155';
    ctx.font = '500 12.5px sans-serif';
    
    if (isTwoLine) {
      const parts = value.split('\n');
      if (parts.length > 0) {
        ctx.fillText(parts[0], x + 24 + lw, y + 12);
      }
      if (parts.length > 1) {
        ctx.fillText(parts[1], x + 24 + lw, y + 27);
      }
    } else {
      ctx.fillText(value || '—', x + 24 + lw, y + 12);
    }
  }

  private drawTermItem(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    width: number
  ): number {
    const bulletSize = 16;
    
    // Draw circular checkmark bullet icon
    this.drawCheckmarkIcon(ctx, x, y, bulletSize);
    
    // Draw wrapped text
    ctx.fillStyle = '#334155';
    ctx.font = '500 13px sans-serif';
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
    if (line) {
      ctx.fillText(line, textX, currY);
    }
    
    return currY - y + 12;
  }

  // ════════════════════════════════════════════════════════════════════
  // VECTOR DRAW HELPERS (Independent of FontAwesome)
  // ════════════════════════════════════════════════════════════════════

  private drawVectorIcon(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) {
    if (type === 'pin') {
      this.drawLocationPinIcon(ctx, x, y, size);
    } else if (type === 'building') {
      this.drawBuildingIcon(ctx, x, y, size);
    } else if (type === 'envelope') {
      this.drawEnvelopeIcon(ctx, x, y, size);
    } else if (type === 'phone') {
      this.drawPhoneIcon(ctx, x, y, size);
    } else if (type === 'link') {
      this.drawLinkIcon(ctx, x, y, size);
    } else if (type === 'user') {
      this.drawUserIcon(ctx, x, y, size);
    } else if (type === 'id') {
      this.drawIdCardIcon(ctx, x, y, size);
    } else if (type === 'bank') {
      this.drawBankIcon(ctx, x, y, size);
    } else if (type === 'wallet') {
      this.drawWalletIcon(ctx, x, y, size);
    } else if (type === 'card') {
      this.drawCreditCardIcon(ctx, x, y, size);
    } else if (type === 'key') {
      this.drawKeyIcon(ctx, x, y, size);
    }
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
    
    // Hole
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
    // Roof
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(size, size * 0.3);
    ctx.fill();
    // Base
    ctx.fillRect(0, size * 0.75, size, size * 0.15);
    // Pillars
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
    
    // Draw interlocking links
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
    ctx.fillRect(x + 4, y + 13, 3, 3);
    ctx.fillRect(x + 10, y + 13, 3, 3);
    ctx.fillRect(x + 16, y + 13, 3, 3);
    ctx.fillRect(x + 4, y + 19, 3, 3);
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
    ctx.moveTo(cx - size * 0.48, cy);
    ctx.lineTo(cx - size * 0.28, cy);
    ctx.moveTo(cx + size * 0.28, cy);
    ctx.lineTo(cx + size * 0.48, cy);
    ctx.moveTo(cx, cy - size * 0.48);
    ctx.lineTo(cx, cy - size * 0.28);
    ctx.moveTo(cx, cy + size * 0.28);
    ctx.lineTo(cx, cy + size * 0.48);
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

  private drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = Math.min(w, h) / 2;
    this.roundRect(ctx, x, y, w, h, r);
  }

  private maskAadhaar(num: string | undefined): string {
    if (!num) return '—';
    const clean = num.toString().replace(/\D/g, '');
    if (clean.length >= 4) {
      return `XXXX XXXX ${clean.slice(-4)}`;
    }
    return num;
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
