import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-star"></i> Leadership</span>
        <h1>President &amp; Committee</h1>
        <p>Meet the elected leadership of BCAR driving the mission of BC empowerment across Rajasthan.</p>
      </div>
    </div>
    <div class="page-section">
      <div class="page-container">
        <div class="committee-grid">
          <div class="committee-card president">
            <div class="avatar-ring"><i class="pi pi-user"></i></div>
            <h3>Sh. Ramesh Chand Sharma</h3>
            <span class="role">President, BCAR</span>
            <p>Leading the association with 12+ years of experience in banking and financial inclusion across Rajasthan.</p>
          </div>
          <div class="committee-card">
            <div class="avatar-ring small"><i class="pi pi-user"></i></div>
            <h3>Secretary General</h3>
            <span class="role">General Secretary</span>
            <p>Manages day-to-day operations and member coordination across all districts.</p>
          </div>
          <div class="committee-card">
            <div class="avatar-ring small"><i class="pi pi-user"></i></div>
            <h3>Treasurer</h3>
            <span class="role">Chief Treasurer</span>
            <p>Responsible for financial management, membership fees, and fund allocation.</p>
          </div>
          <div class="committee-card">
            <div class="avatar-ring small"><i class="pi pi-user"></i></div>
            <h3>Legal Advisor</h3>
            <span class="role">Legal &amp; Compliance</span>
            <p>Provides legal guidance to members and handles grievance redressal.</p>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');
    .page-hero {margin-top: 50px; background: linear-gradient(135deg, #0B2D5C 0%, #0d3a6e 100%); padding: 100px 24px 80px; text-align: center; }
    .page-hero-inner { max-width: 700px; margin: 0 auto; }
    .page-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(212,175,55,0.15); color: #D4AF37; border: 1px solid rgba(212,175,55,0.3); padding: 6px 18px; border-radius: 50px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .page-hero h1 { font-family: Poppins, sans-serif; font-size: clamp(28px, 5vw, 46px); font-weight: 800; color: #ffffff; margin: 0 0 16px; }
    .page-hero p { font-size: 16px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0; }
    .page-section { background: #F5F7FA; padding: 72px 24px; }
    .page-container { max-width: 1100px; margin: 0 auto; }
    .committee-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px; }
    .committee-card { background: #ffffff; border-radius: 16px; padding: 36px 24px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.07); transition: transform 0.2s; }
    .committee-card:hover { transform: translateY(-4px); }
    .committee-card.president { border-top: 4px solid #D4AF37; grid-column: 1 / -1; max-width: 380px; margin: 0 auto; }
    .avatar-ring { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0B2D5C, #1e40af); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .avatar-ring i { font-size: 36px; color: #ffffff; }
    .avatar-ring.small { width: 60px; height: 60px; }
    .avatar-ring.small i { font-size: 26px; }
    .committee-card h3 { font-family: Poppins, sans-serif; font-size: 17px; font-weight: 700; color: #0B2D5C; margin: 0 0 6px; }
    .role { display: inline-block; background: rgba(212,175,55,0.12); color: #92700e; font-size: 12px; font-weight: 600; padding: 3px 12px; border-radius: 50px; margin-bottom: 12px; }
    .committee-card p { font-size: 13.5px; color: #64748B; line-height: 1.7; margin: 0; }
  `]
})
export class CommitteeComponent {}
