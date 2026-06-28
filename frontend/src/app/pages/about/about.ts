import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-info-circle"></i> About BCAR</span>
        <h1>Organization Introduction</h1>
        <p>Business Correspondent Association Rajasthan (BCAR) is a registered trade union working to empower Banking Correspondents across Rajasthan.</p>
        <p class="reg">Reg. No. TU/2026/14/132549 | Registered under Trade Unions Act, 1926</p>
      </div>
    </div>
    <div class="page-section">
      <div class="page-container">
        <div class="info-cards">
          <div class="info-card">
            <i class="pi pi-users"></i>
            <h3>Who We Are</h3>
            <p>BCAR represents thousands of BC agents (Bank Mitras) who serve as the last-mile banking access point in rural and semi-urban Rajasthan.</p>
          </div>
          <div class="info-card">
            <i class="pi pi-shield"></i>
            <h3>Our Purpose</h3>
            <p>We advocate for fair compensation, legal protection, and capacity building for all banking correspondents registered under our association.</p>
          </div>
          <div class="info-card">
            <i class="pi pi-map-marker"></i>
            <h3>Our Reach</h3>
            <p>Operating across all 33 districts of Rajasthan, our members provide essential banking services to millions of unbanked citizens.</p>
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
    .page-hero p { font-size: 16px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0 0 8px; }
    .page-hero .reg { font-size: 12px; color: rgba(212,175,55,0.8); margin-top: 12px; }
    .page-section { background: #F5F7FA; padding: 72px 24px; }
    .page-container { max-width: 1100px; margin: 0 auto; }
    .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; }
    .info-card { background: #ffffff; border-radius: 16px; padding: 36px 28px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border-top: 4px solid #D4AF37; }
    .info-card i { font-size: 36px; color: #0B2D5C; margin-bottom: 16px; display: block; }
    .info-card h3 { font-family: Poppins, sans-serif; font-size: 18px; font-weight: 700; color: #0B2D5C; margin: 0 0 12px; }
    .info-card p { font-size: 14px; color: #64748B; line-height: 1.7; margin: 0; }
  `]
})
export class AboutComponent {}
