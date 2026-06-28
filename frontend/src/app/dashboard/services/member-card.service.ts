import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MemberCardService {

  /** Generates an ATM-style membership card on HTML Canvas and triggers a PNG download. */
  generateCard(member: any): void {
    const W = 1012;   // ~85.6 mm at 300dpi
    const H = 638;    // ~54 mm at 300dpi

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // ── Background ─────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#041a3d');
    bg.addColorStop(0.55, '#0B2D5C');
    bg.addColorStop(1, '#0d3f7a');
    this.roundRect(ctx, 0, 0, W, H, 44);
    ctx.fillStyle = bg;
    ctx.fill();

    // ── Gold top stripe ─────────────────────────────────────────────────
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 0, W, 10);

    // ── Decorative circles ──────────────────────────────────────────────
    const drawCircle = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    drawCircle(820, 320, 240, 0.08);
    drawCircle(820, 320, 190, 0.10);
    drawCircle(820, 320, 140, 0.12);
    drawCircle(820, 320, 90,  0.14);

    // ── BCAR Logo text ──────────────────────────────────────────────────
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 54px serif';
    ctx.fillText('BCAR', 56, 110);

    // ── Full name below logo ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '500 15px sans-serif';
    ctx.fillText('BUSINESS CORRESPONDENT ASSOCIATION RAJASTHAN', 56, 140);

    // ── Chip design ─────────────────────────────────────────────────────
    const chipX = 56, chipY = 170;
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + 60, chipY + 44);
    chipGrad.addColorStop(0, '#D4AF37');
    chipGrad.addColorStop(0.5, '#f5e070');
    chipGrad.addColorStop(1, '#b8942a');
    this.roundRect(ctx, chipX, chipY, 60, 44, 6);
    ctx.fillStyle = chipGrad;
    ctx.fill();
    // chip lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    [chipY + 12, chipY + 22, chipY + 32].forEach(y => {
      ctx.beginPath(); ctx.moveTo(chipX + 2, y); ctx.lineTo(chipX + 58, y); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(chipX + 30, chipY + 2); ctx.lineTo(chipX + 30, chipY + 42); ctx.stroke();

    // ── Member Name ─────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText((member.name || 'MEMBER NAME').toUpperCase(), 56, 310);

    // ── Membership Number ───────────────────────────────────────────────
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(member.membershipNo || 'BCAR/RJ/0000', 56, 360);

    // ── Registration Number ─────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '14px monospace';
    ctx.fillText(`Reg: ${member.registrationNumber || 'N/A'}`, 56, 395);

    // ── Bank Mitra Badge ────────────────────────────────────────────────
    const bx = 56, by = 418;
    ctx.fillStyle = 'rgba(212,175,55,0.18)';
    this.roundRect(ctx, bx, by, 160, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('✦  BANK MITRA', bx + 14, by + 24);

    // ── District ────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '14px sans-serif';
    ctx.fillText(`District: ${member.district || 'Rajasthan'}`, 56, 478);

    // ── Valid period ────────────────────────────────────────────────────
    const joinYear = member.createdAt ? new Date(member.createdAt).getFullYear() : new Date().getFullYear();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`MEMBER SINCE: ${joinYear}`, 56, 510);
    ctx.fillText(`VALID TILL: ${joinYear + 3}`, 280, 510);

    // ── QR placeholder ──────────────────────────────────────────────────
    const qrX = W - 150, qrY = H - 160;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    this.roundRect(ctx, qrX, qrY, 110, 110, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, 110, 110);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('QR VERIFY', qrX + 55, qrY + 58);
    ctx.textAlign = 'left';

    // ── Gold bottom stripe ───────────────────────────────────────────────
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, H - 8, W, 8);

    // ── Watermark ────────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px serif';
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.textAlign = 'center';
    ctx.fillText('BCAR', 0, 0);
    ctx.restore();

    // ── Download ─────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `BCAR-Card-${member.membershipNo || member.name || 'member'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
