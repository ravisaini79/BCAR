import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../layout/header/header';
import { FooterComponent } from '../layout/footer/footer';

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

        <div class="success-badge">Registration Submitted</div>

        <h1>Application Received Successfully!</h1>

        <p class="success-subtitle">
          Your BCAR membership application has been submitted and is now under review by our team.
          You will receive a confirmation on your registered email and mobile number.
        </p>

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
              <span>Call us at +91 94140 08299 or WhatsApp for support</span>
            </div>
          </div>
        </div>

        <!-- What happens next -->
        <div class="steps-section">
          <h3>What Happens Next?</h3>
          <div class="steps">
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">
                <strong>Document Verification</strong>
                <p>Our team verifies your submitted documents and details</p>
              </div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">
                <strong>Approval Notification</strong>
                <p>You will be notified via email and SMS upon approval</p>
              </div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">
                <strong>BCAR ID Card</strong>
                <p>Receive your official membership ID card from the association</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <button class="btn-home" (click)="router.navigate(['/'])">
            <i class="pi pi-home"></i> Go to Home
          </button>
          <button class="btn-login" (click)="router.navigate(['/login'])">
            <i class="pi pi-sign-in"></i> Member Login
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
      padding: 80px 20px 60px;
    }

    .success-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 60px 48px;
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
      width: 100px;
      height: 100px;
      margin: 0 auto 28px;
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
      font-size: 12px;
      font-weight: 700;
      padding: 4px 16px;
      border-radius: 50px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    h1 {
      font-family: Poppins, sans-serif;
      font-size: clamp(22px, 4vw, 32px);
      font-weight: 800;
      color: #0B2D5C;
      margin: 0 0 14px;
      line-height: 1.2;
    }

    .success-subtitle {
      font-size: 15px;
      color: #64748B;
      line-height: 1.7;
      margin: 0 0 36px;
    }

    /* Info box */
    .info-box {
      background: #F8FAFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 36px;
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

    /* Steps */
    .steps-section { margin-bottom: 36px; }
    .steps-section h3 {
      font-family: Poppins, sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #0B2D5C;
      margin: 0 0 20px;
    }
    .steps { display: flex; flex-direction: column; gap: 16px; text-align: left; }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      background: #F8FAFF;
      padding: 16px 20px;
      border-radius: 12px;
      border-left: 4px solid #D4AF37;
    }
    .step-num {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #0B2D5C, #1e40af);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .step-text strong { display: block; font-size: 13.5px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
    .step-text p { font-size: 13px; color: #64748B; margin: 0; line-height: 1.5; }

    /* Action buttons */
    .action-buttons {
      display: flex;
      gap: 14px;
      justify-content: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .btn-home, .btn-login {
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
    .btn-home {
      background: linear-gradient(135deg, #0B2D5C, #1e40af);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(11,45,92,0.3);
    }
    .btn-home:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,45,92,0.35); }
    .btn-login {
      background: #ffffff;
      color: #0B2D5C;
      border: 2px solid #D4AF37;
    }
    .btn-login:hover { background: #FFF8E8; transform: translateY(-2px); }

    .reg-note {
      font-size: 11.5px;
      color: #94A3B8;
      margin: 0;
    }

    @media (max-width: 560px) {
      .success-card { padding: 36px 24px; }
    }
  `]
})
export class RegisterSuccessComponent implements OnInit {
  readonly router = inject(Router);

  ngOnInit(): void {
    // Redirect to home after 5 minutes if user stays idle
    setTimeout(() => this.router.navigate(['/']), 300_000);
  }
}
