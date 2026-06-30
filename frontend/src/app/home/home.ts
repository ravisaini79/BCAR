import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../layout/header/header';
import { FooterComponent } from '../layout/footer/footer';
import { GalleryService } from '../core/services/gallery.service';
import { NewsService } from '../core/services/news.service';
import { ToastService } from '../core/services/toast.service';

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

  // Gallery Lightbox
  selectedImage: any = null;

  // Live data from API
  galleryItems: any[] = [];
  latestNews: any[] = [];
  galleryLoading = true;
  newsLoading = true;

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

  private galleryService = inject(GalleryService);
  private newsService = inject(NewsService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.fetchNotices();
    this.fetchGallery();
    this.fetchLatestNews();
  }

  fetchNotices() {
    this.http.get<any[]>(`${environment.apiUrl}/public/notices`).subscribe({
      next: rows => this.notices = rows,
      error: () => this.notices = []
    });
  }

  fetchGallery() {
    this.galleryLoading = true;
    this.galleryService.getItems().subscribe({
      next: (data) => {
        this.galleryItems = (data || []).slice(0, 6);
        this.galleryLoading = false;
      },
      error: () => { this.galleryLoading = false; }
    });
  }

  fetchLatestNews() {
    this.newsLoading = true;
    this.newsService.getArticles().subscribe({
      next: (data) => {
        this.latestNews = (data || [])
          .sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
          .slice(0, 3);
        this.newsLoading = false;
      },
      error: () => { this.newsLoading = false; }
    });
  }

  showToast(message: string, type: 'success'|'error' = 'success') {
    if (type === 'success') {
      this.toastService.success(message);
    } else {
      this.toastService.error(message);
    }
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

  // Return all gallery items (filters removed)
  get filteredGallery() {
    return this.galleryItems;
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
    this.http.post<any>(`${environment.apiUrl}/public/contact`, this.contact).subscribe({
      next: (res) => {
        this.submittingContact = false;
        this.showToast(res.message || 'Thank you! Your message has been sent successfully.');
        this.contact = { name: '', email: '', phone: '', message: '' };
      },
      error: (err) => {
        this.submittingContact = false;
        console.error('Failed to submit contact query from home:', err);
        this.showToast('Failed to send message. Please try again later.', 'error');
      }
    });
  }
}
