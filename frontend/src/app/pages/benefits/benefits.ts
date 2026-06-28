import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-gift"></i> Benefits</span>
        <h1>Membership Benefits</h1>
        <p>BCAR membership gives you legal protection, training access, and collective bargaining power.</p>
      </div>
    </div>
    <div class="page-section">
      <div class="page-container">
        <div class="benefits-grid">
          <div class="benefit-item" *ngFor="let b of benefits">
            <div class="benefit-icon"><i [class]="'pi ' + b.icon"></i></div>
            <div class="benefit-text">
              <h4>{{ b.title }}</h4>
              <p>{{ b.desc }}</p>
            </div>
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
    .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .benefit-item { background: #ffffff; border-radius: 14px; padding: 28px 24px; display: flex; gap: 18px; align-items: flex-start; box-shadow: 0 3px 16px rgba(0,0,0,0.05); border-left: 4px solid #D4AF37; }
    .benefit-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #0B2D5C, #1e40af); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .benefit-icon i { color: #ffffff; font-size: 20px; }
    .benefit-text h4 { font-family: Poppins, sans-serif; font-size: 15px; font-weight: 700; color: #0B2D5C; margin: 0 0 6px; }
    .benefit-text p  { font-size: 13.5px; color: #64748B; line-height: 1.6; margin: 0; }
  `]
})
export class BenefitsComponent {
  benefits = [
    { icon: 'pi-shield',         title: 'Legal Protection',         desc: 'Free legal aid and representation in disputes with banks or employers.' },
    { icon: 'pi-book',           title: 'Training Programs',         desc: 'Regular workshops on technology, compliance, and service standards.' },
    { icon: 'pi-wallet',         title: 'Fair Compensation Advocacy', desc: 'Collective bargaining for better commission structures and timely payments.' },
    { icon: 'pi-id-card',        title: 'Official BCAR ID Card',      desc: 'Recognized identity card useful for banking interactions and official visits.' },
    { icon: 'pi-comments',       title: 'Grievance Redressal',        desc: 'Dedicated helpline and team to resolve member grievances quickly.' },
    { icon: 'pi-globe',          title: 'Network & Community',         desc: 'Connect with thousands of BC agents across all 33 Rajasthan districts.' },
    { icon: 'pi-bell',           title: 'Policy Updates',             desc: 'Regular circulars on RBI guidelines, bank policies and new schemes.' },
    { icon: 'pi-star',           title: 'Recognition & Awards',         desc: 'Annual recognition of outstanding BC agents at the state level.' },
  ];
}
