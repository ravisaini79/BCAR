import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-mission',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-flag"></i> Mission & Vision</span>
        <h1>Our Mission &amp; Vision</h1>
        <p>Driving financial inclusion and empowering banking correspondents with rights, resources and recognition.</p>
      </div>
    </div>
    <div class="page-section">
      <div class="page-container">
        <div class="mv-grid">
          <div class="mv-card mission">
            <div class="mv-icon"><i class="pi pi-bullseye"></i></div>
            <h2>Our Mission</h2>
            <ul>
              <li>Protect the rights and interests of all BC agents in Rajasthan</li>
              <li>Negotiate fair service charges and commissions with banks</li>
              <li>Provide legal aid and support during disputes</li>
              <li>Conduct training programs to enhance service quality</li>
              <li>Bridge communication between BCs and banking institutions</li>
            </ul>
          </div>
          <div class="mv-card vision">
            <div class="mv-icon"><i class="pi pi-eye"></i></div>
            <h2>Our Vision</h2>
            <ul>
              <li>A Rajasthan where every citizen has dignified banking access</li>
              <li>BC agents recognized as essential financial infrastructure</li>
              <li>Technology-enabled, well-trained, and fairly compensated workforce</li>
              <li>Zero financial exclusion in rural and tribal areas</li>
              <li>A self-sustaining BC ecosystem supported by BCAR</li>
            </ul>
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
    .mv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
    .mv-card { background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .mv-card.mission { border-left: 5px solid #D4AF37; }
    .mv-card.vision  { border-left: 5px solid #2563EB; }
    .mv-icon { font-size: 40px; margin-bottom: 20px; }
    .mission .mv-icon { color: #D4AF37; }
    .vision  .mv-icon { color: #2563EB; }
    .mv-card h2 { font-family: Poppins, sans-serif; font-size: 22px; font-weight: 700; color: #0B2D5C; margin: 0 0 20px; }
    .mv-card ul { padding-left: 20px; margin: 0; }
    .mv-card li { font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 8px; }
  `]
})
export class MissionComponent {}
