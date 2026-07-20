import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../layout/header/header';
import { FooterComponent } from '../layout/footer/footer';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <div class="success-page">
      <div class="success-card">

        <!-- Animated checkmark -->
        <div class="check-circle">
          <div class="check-ring"></div>
          <svg class="check-icon" viewBox="0 0 52 52">
            <circle class="check-circle-bg" cx="26" cy="26" r="25" fill="none"/>
            <path class="check-mark" fill="none" d="M14 27l7 7 16-18"/>
          </svg>
        </div>

        <div class="success-badge">Registration Successful</div>

        <h1>Application Received Successfully!</h1>

        <p class="success-subtitle">
          Your BCAR membership application has been submitted and is now under review by our team.
          A confirmation email along with your ₹700 registration receipt (₹100 Enrollment + ₹600 Annual Membership) has been sent to your registered email.
        </p>

        <!-- Dynamic Registration Details -->
        <div class="details-card">
          <h3>Application Details</h3>
          <div class="detail-row">
            <span class="detail-lbl">Registration Number</span>
            <span class="detail-val" style="color: #0B2D5C">{{ registrationNumber || 'BCAR-2026-XXXXXX' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Receipt Number</span>
            <span class="detail-val">{{ receiptNumber || 'BCAR-RCP-2026-XXXXXX' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Membership Fee Paid</span>
            <span class="detail-val">₹700.00 (Paid)</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Verification Status</span>
            <span class="detail-val status-pending">Pending Approval</span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">Email Confirmation</span>
            <span class="detail-val">
              <span class="status-badge" [class.success]="emailSent" [class.warning]="!emailSent">
                <i class="pi" [class.pi-check]="emailSent" [class.pi-spin]="!emailSent" [class.pi-sync]="!emailSent"></i>
                {{ emailSent ? 'Sent' : 'Pending/Retrying' }}
              </span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-lbl">PDF Receipt Status</span>
            <span class="detail-val">
              <span class="status-badge" [class.success]="receiptGenerated" [class.warning]="!receiptGenerated">
                <i class="pi" [class.pi-check]="receiptGenerated" [class.pi-spin]="!receiptGenerated" [class.pi-sync]="!receiptGenerated"></i>
                {{ receiptGenerated ? 'Generated' : 'Failed/Pending' }}
              </span>
            </span>
          </div>
        </div>

        <!-- Info box -->
        <div class="info-box">
          <div class="info-row">
            <i class="pi pi-clock"></i>
            <div>
              <strong>Processing Time</strong>
              <span>Applications are reviewed within 3–5 working days</span>
            </div>
          </div>
          <div class="info-row">
            <i class="pi pi-envelope"></i>
            <div>
              <strong>Confirmation Email</strong>
              <span>Check your inbox for a confirmation message from BCAR</span>
            </div>
          </div>
          <div class="info-row">
            <i class="pi pi-phone"></i>
            <div>
              <strong>Need Help?</strong>
              <span>Call us at +91 98297 15474 or email info&#64;bcarajasthan.org</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <button class="btn-download" (click)="downloadReceipt()" [disabled]="!registrationNumber">
            <i class="pi pi-download"></i> Download Receipt
          </button>
          <button class="btn-home" (click)="router.navigate(['/'])">
            <i class="pi pi-home"></i> Go to Home
          </button>
        </div>

        <p class="reg-note">
          Reg. No. TU/2026/14/132549 | Business Correspondent Association Rajasthan
        </p>

      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');

    .success-page {
      min-height: 100vh;
      background: linear-gradient(160deg, #F0F4FF 0%, #F5F7FA 50%, #FFF8E8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 100px 20px 60px;
    }

    .success-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 50px 40px;
      max-width: 680px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 80px rgba(11, 45, 92, 0.12);
      border-top: 5px solid #16A34A;
      animation: slideUp 0.5s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Animated check circle */
    .check-circle {
      position: relative;
      width: 90px;
      height: 90px;
      margin: 0 auto 24px;
    }
    .check-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    }
    .check-icon {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .check-circle-bg {
      stroke: #16A34A;
      stroke-width: 2;
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      animation: drawCircle 0.6s ease forwards 0.2s;
    }
    .check-mark {
      stroke: #16A34A;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: drawCheck 0.4s ease forwards 0.7s;
    }
    @keyframes drawCircle {
      to { stroke-dashoffset: 0; }
    }
    @keyframes drawCheck {
      to { stroke-dashoffset: 0; }
    }

    .success-badge {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 16px;
      border-radius: 50px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    h1 {
      font-family: Poppins, sans-serif;
      font-size: clamp(22px, 4vw, 30px);
      font-weight: 800;
      color: #0B2D5C;
      margin: 0 0 12px;
      line-height: 1.2;
    }

    .success-subtitle {
      font-size: 14.5px;
      color: #64748B;
      line-height: 1.6;
      margin: 0 0 28px;
    }

    /* Details card style */
    .details-card {
      background: #F8FAFF;
      border: 1px solid #EEF2F6;
      border-radius: 16px;
      padding: 24px;
      margin: 28px 0;
      text-align: left;
    }
    .details-card h3 {
      font-family: Poppins, sans-serif;
      font-size: 15px;
      color: #0B2D5C;
      margin-top: 0;
      margin-bottom: 16px;
      border-bottom: 1.5px solid #E2E8F0;
      padding-bottom: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-lbl { color: #64748B; font-weight: 500; }
    .detail-val { color: #1E293B; font-weight: 700; }
    .detail-val.status-pending { color: #D4AF37; }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
    }
    .status-badge.success { background: #dcfce7; color: #16a34a; }
    .status-badge.warning { background: #fee2e2; color: #ef4444; }

    /* Info box */
    .info-box {
      background: #F8FAFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 10px 0;
      border-bottom: 1px solid #EEF2F8;
    }
    .info-row:last-child { border-bottom: none; }
    .info-row i { font-size: 18px; color: #2563EB; margin-top: 2px; flex-shrink: 0; }
    .info-row div { display: flex; flex-direction: column; gap: 2px; }
    .info-row strong { font-size: 13.5px; font-weight: 700; color: #1E293B; }
    .info-row span   { font-size: 13px; color: #64748B; }

    /* Action buttons */
    .action-buttons {
      display: flex;
      gap: 14px;
      justify-content: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .btn-download, .btn-home {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 28px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-download {
      background: linear-gradient(135deg, #D4AF37, #b89223);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(212,175,55,0.3);
    }
    .btn-download:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,175,55,0.35); }
    .btn-download:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
    
    .btn-home {
      background: linear-gradient(135deg, #0B2D5C, #1e40af);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(11,45,92,0.3);
    }
    .btn-home:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,45,92,0.35); }

    .reg-note {
      font-size: 11.5px;
      color: #94A3B8;
      margin: 0;
    }

    @media (max-width: 560px) {
      .success-card { padding: 36px 24px; }
      .action-buttons { flex-direction: column; width: 100%; }
      .btn-download, .btn-home { width: 100%; justify-content: center; }
    }
  `]
})
export class RegisterSuccessComponent implements OnInit {
  readonly router = inject(Router);

  registrationNumber = '';
  receiptNumber = '';
  emailSent = false;
  receiptGenerated = false;

  ngOnInit(): void {
    // Read state from router navigation history
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || window.history.state;
    if (state && state.registrationNumber) {
      this.registrationNumber = state.registrationNumber;
      this.receiptNumber = state.receiptNumber || '';
      this.emailSent = state.emailSent !== false;
      this.receiptGenerated = state.receiptGenerated !== false;
    }

    // Redirect to home after 5 minutes if user stays idle
    setTimeout(() => this.router.navigate(['/']), 300_000);
  }

  downloadReceipt() {
    if (!this.registrationNumber) return;
    const downloadUrl = `${environment.apiUrl}/auth/receipt/${this.registrationNumber}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `BCAR_Receipt_${this.registrationNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
