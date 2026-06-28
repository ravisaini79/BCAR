import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-phone"></i> Contact</span>
        <h1>Get In Touch</h1>
        <p>Reach out to BCAR for membership queries, grievances, or partnership opportunities.</p>
      </div>
    </div>
    <div class="page-section">
      <div class="page-container">
        <div class="contact-grid">
          <a href="tel:+919414008299" class="contact-card">
            <i class="pi pi-phone"></i>
            <h3>Phone</h3>
            <p>+91 94140 08299</p>
          </a>
          <a href="mailto:info@bcarajasthan.org" class="contact-card">
            <i class="pi pi-envelope"></i>
            <h3>Email</h3>
            <p>info&#64;bcarajasthan.org</p>
          </a>
          <a href="https://wa.me/919414008299" target="_blank" class="contact-card">
            <i class="pi pi-whatsapp"></i>
            <h3>WhatsApp</h3>
            <p>Message us anytime</p>
          </a>
          <div class="contact-card">
            <i class="pi pi-map-marker"></i>
            <h3>Office</h3>
            <p>Jaipur, Rajasthan, India</p>
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
    .page-container { max-width: 900px; margin: 0 auto; }
    .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
    .contact-card { background: #ffffff; border-radius: 16px; padding: 36px 24px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.07); text-decoration: none; color: inherit; border-top: 4px solid #D4AF37; transition: transform 0.2s, box-shadow 0.2s; display: block; }
    .contact-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
    .contact-card i { font-size: 36px; color: #0B2D5C; display: block; margin-bottom: 12px; }
    .contact-card h3 { font-family: Poppins, sans-serif; font-size: 16px; font-weight: 700; color: #0B2D5C; margin: 0 0 8px; }
    .contact-card p { font-size: 14px; color: #64748B; margin: 0; }
  `]
})
export class ContactComponent {}
