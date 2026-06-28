import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../layout/header/header';
import { FooterComponent } from '../layout/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe, HeaderComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  router = inject(Router);
  http = inject(HttpClient);

  notices: any[] = [];
  toast = '';
  toastType = 'success';
  showBackToTop = false;

  // Contact form
  contact = { name: '', email: '', phone: '', message: '' };
  submittingContact = false;

  // News Search & Pagination
  searchQuery = '';
  currentPage = 1;
  pageSize = 3;

  // Gallery Filters & Lightbox
  galleryFilter = 'all';
  selectedImage: any = null;

  galleryItems = [
    {
      title: 'Financial Inclusion Desk',
      category: 'inclusion',
      tag: 'Digital Banking',
      url: '/images/gallery_inclusion.png'
    },
    {
      title: 'State Committee Assembly',
      category: 'meeting',
      tag: 'Official Meeting',
      url: '/images/gallery_meeting.png'
    },
    {
      title: 'Digital Finance Workshop',
      category: 'training',
      tag: 'BC Training',
      url: '/images/gallery_training.png'
    },
    {
      title: 'Biometric Attendance Project',
      category: 'inclusion',
      tag: 'Technology',
      url: '/images/gallery_inclusion.png'
    },
    {
      title: 'Jaipur Representative Meet',
      category: 'meeting',
      tag: 'Committee',
      url: '/images/gallery_meeting.png'
    },
    {
      title: 'NABARD Rural Support Program',
      category: 'training',
      tag: 'Awareness',
      url: '/images/gallery_training.png'
    }
  ];

  testimonials = [
    {
      name: 'Ramesh Kumar',
      role: 'Bank Mitra, SBBJ/SBI',
      district: 'Jodhpur',
      avatar: 'RK',
      text: 'BCAR has given us a unified platform to present our issues to bank authorities. The term insurance scheme negotiated by the association provides immense security to my family.'
    },
    {
      name: 'Priyanka Sharma',
      role: 'CSP, Bank of Baroda',
      district: 'Jaipur',
      avatar: 'PS',
      text: 'The digital training workshops conducted by BCAR have helped me learn advanced banking systems and increase my monthly commissions. Proud to be a verified member!'
    },
    {
      name: 'Mahesh Vyas',
      role: 'BC Operator, PNB',
      district: 'Bikaner',
      avatar: 'MV',
      text: 'During a commission dispute with our corporate BC provider, the BCAR legal support team stepped in and resolved it within a week. Joining this union was my best decision.'
    }
  ];

  benefits = [
    {
      title: 'Government Recognition',
      icon: 'fa-solid fa-award',
      desc: 'Officially registered under the Trade Unions Act, 1926, giving members solid legal backing and official representation.'
    },
    {
      title: 'Specialized Training',
      icon: 'fa-solid fa-laptop-code',
      desc: 'Regular technical workshops covering AEPS, micro-ATMs, digital security, and RBI financial inclusion policies.'
    },
    {
      title: 'Certification Programs',
      icon: 'fa-solid fa-certificate',
      desc: 'Coaching and assistance for IIBF examinations to ensure all members achieve mandatory certifications easily.'
    },
    {
      title: 'Legal Protection & Support',
      icon: 'fa-solid fa-scale-balanced',
      desc: 'A dedicated legal grievance cell that actively resolves corporate BC commission issues and field harassments.'
    },
    {
      title: 'Professional Networking',
      icon: 'fa-solid fa-users-gear',
      desc: 'Statewide network connecting over thousands of CSPs across 33 districts to share best practices and resources.'
    },
    {
      title: 'Career Advancement',
      icon: 'fa-solid fa-briefcase',
      desc: 'Exclusive notifications on job opportunities, banking partner openings, and corporate agent listings.'
    },
    {
      title: 'Financial Awareness',
      icon: 'fa-solid fa-sack-dollar',
      desc: 'Updates on commissions, banking service codes, and welfare funds specifically curated for Rajasthan Bank Mitras.'
    }
  ];

  ngOnInit() {
    this.fetchNotices();
  }

  fetchNotices() {
    this.http.get<any[]>('/api/public/notices').subscribe({
      next: rows => this.notices = rows,
      error: () => this.notices = []
    });
  }

  showToast(message: string, type: 'success'|'error' = 'success') {
    this.toast = message;
    this.toastType = type;
    setTimeout(() => this.toast = '', 5000);
  }

  scrollTo(id: string) {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 10);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showBackToTop = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Filtered gallery items
  get filteredGallery() {
    if (this.galleryFilter === 'all') {
      return this.galleryItems;
    }
    return this.galleryItems.filter(item => item.category === this.galleryFilter);
  }

  // Filtered and paginated notices
  get filteredNotices() {
    let list = this.notices;
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.body.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
    }
    return list;
  }

  get paginatedNotices() {
    const list = this.filteredNotices;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return list.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredNotices.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  submitContactForm() {
    this.submittingContact = true;
    // Simulate API call
    setTimeout(() => {
      this.submittingContact = false;
      this.showToast('Thank you! Your message has been sent successfully. We will get back to you soon.');
      this.contact = { name: '', email: '', phone: '', message: '' };
    }, 1000);
  }
}
