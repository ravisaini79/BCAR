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
  templateUrl: './benefits.html',
  styleUrls: ['./benefits.css']
})
export class BenefitsComponent {
  benefits = [
    { icon: 'fa-solid fa-award',          title: 'Government Recognition',         desc: 'Officially registered under the Trade Unions Act, 1926, giving members solid legal backing and official representation.' },
    { icon: 'fa-solid fa-scale-balanced', title: 'Legal Protection & Support',      desc: 'A dedicated legal grievance cell that actively resolves corporate BC commission issues and field harassments.' },
    { icon: 'fa-solid fa-laptop-code',    title: 'Specialized Training',            desc: 'Regular technical workshops covering AEPS, micro-ATMs, digital security, and RBI financial inclusion policies.' },
    { icon: 'fa-solid fa-certificate',    title: 'IIBF Certification Programs',     desc: 'Coaching and assistance for IIBF examinations to ensure all members achieve mandatory certifications easily.' },
    { icon: 'fa-solid fa-id-card',        title: 'Official BCAR ID Card',           desc: 'Recognized identity card useful for banking interactions and official visits.' },
    { icon: 'fa-solid fa-users-gear',     title: 'Professional Networking',         desc: 'Statewide network connecting over thousands of CSPs across 33 districts to share best practices.' },
    { icon: 'fa-solid fa-bell',           title: 'Policy & Circular Updates',       desc: 'Regular notifications on RBI guidelines, bank policies, and new government schemes.' },
    { icon: 'fa-solid fa-sack-dollar',    title: 'Financial Awareness',             desc: 'Updates on commissions, banking service codes, and welfare funds specifically curated for Rajasthan Bank Mitras.' },
    { icon: 'fa-solid fa-briefcase',      title: 'Career Advancement',              desc: 'Exclusive notifications on job opportunities, banking partner openings, and corporate agent listings.' },
    { icon: 'fa-solid fa-comments',       title: 'Grievance Redressal',             desc: 'Dedicated helpline and team to resolve member grievances quickly and effectively.' },
  ];
}
