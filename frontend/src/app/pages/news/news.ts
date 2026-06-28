import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-header></app-header>

    <!-- Page Hero -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-newspaper"></i> Communications</span>
        <h1>Latest News & Announcements</h1>
        <p>Stay up to date with official circulars, policy updates, and association announcements from BCAR.</p>
      </div>
    </div>

    <!-- News Section -->
    <div class="page-section">
      <div class="page-container">

        <!-- Controls Row -->
        <div class="controls-row">

          <!-- Search -->
          <div class="search-wrap">
            <i class="pi pi-search"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="currentPage = 1"
              placeholder="Search by keyword, category..."
            >
            @if (searchQuery) {
              <button class="clear-btn" (click)="searchQuery = ''; currentPage = 1">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Category Filter -->
          <div class="category-filters">
            @for (cat of categories; track cat.value) {
              <button
                [class.active]="activeCategory === cat.value"
                (click)="activeCategory = cat.value; currentPage = 1">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Loading State -->
        @if (loading) {
          <div class="loading-wrap">
            <div class="spinner"></div>
            <p>Loading announcements...</p>
          </div>
        }

        <!-- News Grid -->
        @if (!loading) {
          @if (paginatedNotices.length > 0) {
            <div class="notice-grid">
              @for (item of paginatedNotices; track item.id ?? item.title) {
                <article class="notice-card">
                  <div class="notice-top">
                    <span class="notice-tag" [class]="'cat-' + (item.category | lowercase)">
                      {{ item.category }}
                    </span>
                    <time class="notice-date">
                      <i class="pi pi-calendar"></i>
                      {{ item.publishedAt | date:'dd MMM yyyy' }}
                    </time>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.body }}</p>
                  <button class="read-btn" (click)="router.navigate(['/login'])">
                    Read full update in portal <i class="pi pi-arrow-right"></i>
                  </button>
                </article>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages > 1) {
              <div class="pagination">
                <button class="pg-btn" [disabled]="currentPage === 1" (click)="prevPage()">
                  <i class="pi pi-chevron-left"></i>
                </button>
                @for (page of pageNumbers(); track page) {
                  <button
                    class="pg-num"
                    [class.active]="page === currentPage"
                    (click)="currentPage = page">
                    {{ page }}
                  </button>
                }
                <button class="pg-btn" [disabled]="currentPage === totalPages" (click)="nextPage()">
                  <i class="pi pi-chevron-right"></i>
                </button>
              </div>
              <p class="pagination-info">
                Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredNotices.length) }}
                of {{ filteredNotices.length }} announcements
              </p>
            }

          } @else {
            <!-- Empty State -->
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <h3>No Announcements Found</h3>
              <p>{{ searchQuery || activeCategory !== 'all' ? 'Try a different search term or category.' : 'Check back soon for new updates from BCAR.' }}</p>
              @if (searchQuery || activeCategory !== 'all') {
                <button class="clear-filters-btn" (click)="searchQuery = ''; activeCategory = 'all'; currentPage = 1">
                  Clear Filters
                </button>
              }
            </div>
          }
        }
      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');

    /* ── Hero ── */
    .page-hero {
      margin-top: 50px;
      background: linear-gradient(135deg, #0B2D5C 0%, #0d3a6e 100%);
      padding: 100px 24px 80px; text-align: center;
    }
    .page-hero-inner { max-width: 700px; margin: 0 auto; }
    .page-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(212,175,55,0.15); color: #D4AF37;
      border: 1px solid rgba(212,175,55,0.3);
      padding: 6px 18px; border-radius: 50px;
      font-size: 13px; font-weight: 600; margin-bottom: 20px;
    }
    .page-hero h1 {
      font-family: Poppins, sans-serif;
      font-size: clamp(28px, 5vw, 46px);
      font-weight: 800; color: #ffffff; margin: 0 0 16px;
    }
    .page-hero p { font-size: 16px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0; }

    /* ── Section ── */
    .page-section { background: #F5F7FA; padding: 64px 24px 80px; }
    .page-container { max-width: 1100px; margin: 0 auto; }

    /* ── Controls Row ── */
    .controls-row {
      display: flex; flex-wrap: wrap; gap: 16px;
      align-items: center; margin-bottom: 36px;
    }

    /* Search */
    .search-wrap {
      display: flex; align-items: center; gap: 10px;
      background: #ffffff; border: 1.5px solid #dde3ec;
      border-radius: 10px; padding: 10px 16px;
      flex: 1; min-width: 240px;
      transition: border-color 0.2s;
    }
    .search-wrap:focus-within { border-color: #0B2D5C; }
    .search-wrap i { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
    .search-wrap input {
      border: 0; outline: 0; background: 0;
      font-size: 14px; color: #1e293b; flex: 1;
      font-family: inherit;
    }
    .clear-btn {
      background: none; border: 0; color: #94a3b8;
      cursor: pointer; padding: 0; font-size: 12px;
      display: flex; align-items: center;
    }
    .clear-btn:hover { color: #ef4444; }

    /* Category filters */
    .category-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .category-filters button {
      padding: 8px 16px; border-radius: 50px;
      border: 1.5px solid #dde3ec;
      background: #ffffff; color: #475569;
      font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .category-filters button:hover { border-color: #0B2D5C; color: #0B2D5C; }
    .category-filters button.active {
      background: #0B2D5C; color: #D4AF37; border-color: #0B2D5C;
      box-shadow: 0 4px 12px rgba(11,45,92,0.2);
    }

    /* ── Loading ── */
    .loading-wrap {
      text-align: center; padding: 80px 24px; color: #64748B;
    }
    .spinner {
      width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid #e2e8f0;
      border-top-color: #0B2D5C;
      animation: spin 0.9s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-wrap p { font-size: 15px; }

    /* ── Notice Grid ── */
    .notice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .notice-card {
      background: #ffffff; border-radius: 16px;
      padding: 28px 24px;
      box-shadow: 0 3px 16px rgba(0,0,0,0.06);
      border-left: 4px solid #D4AF37;
      display: flex; flex-direction: column; gap: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .notice-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

    .notice-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .notice-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; padding: 4px 12px; border-radius: 50px;
      background: rgba(11,45,92,0.08); color: #0B2D5C;
    }
    .notice-tag.cat-circular  { background: rgba(212,175,55,0.12); color: #92700e; }
    .notice-tag.cat-policy    { background: rgba(14,165,233,0.12); color: #0369a1; }
    .notice-tag.cat-event     { background: rgba(15,118,110,0.12); color: #0f766e; }
    .notice-tag.cat-alert     { background: rgba(239,68,68,0.1);   color: #dc2626; }

    .notice-date { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #94a3b8; font-weight: 500; }

    .notice-card h3 {
      font-family: Poppins, sans-serif; font-size: 16px; font-weight: 700;
      color: #0B2D5C; margin: 0; line-height: 1.4;
    }
    .notice-card p { font-size: 13.5px; color: #64748B; line-height: 1.7; margin: 0; flex: 1; }

    .read-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 0; padding: 0;
      color: #D4AF37; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: gap 0.2s;
      margin-top: auto;
      font-family: inherit;
    }
    .read-btn:hover { gap: 10px; }

    /* ── Pagination ── */
    .pagination { display: flex; align-items: center; justify-content: center; gap: 6px; }
    .pg-btn {
      width: 38px; height: 38px; border-radius: 8px;
      border: 1.5px solid #dde3ec; background: #ffffff;
      color: #0B2D5C; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-btn:not(:disabled):hover { border-color: #0B2D5C; background: rgba(11,45,92,0.05); }
    .pg-num {
      width: 38px; height: 38px; border-radius: 8px;
      border: 1.5px solid #dde3ec; background: #ffffff;
      color: #475569; font-size: 13.5px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .pg-num.active {
      background: #0B2D5C; color: #D4AF37; border-color: #0B2D5C;
    }
    .pagination-info {
      text-align: center; margin-top: 12px;
      font-size: 13px; color: #94a3b8;
    }

    /* ── Empty State ── */
    .empty-state {
      text-align: center; padding: 80px 24px;
      color: #64748B;
    }
    .empty-state i { font-size: 56px; color: #cbd5e1; display: block; margin-bottom: 20px; }
    .empty-state h3 { font-family: Poppins, sans-serif; font-size: 20px; font-weight: 700; color: #0B2D5C; margin: 0 0 10px; }
    .empty-state p { font-size: 14.5px; margin: 0 0 24px; }
    .clear-filters-btn {
      padding: 10px 24px; border-radius: 8px;
      background: #0B2D5C; color: #D4AF37;
      border: 0; font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: opacity 0.2s;
    }
    .clear-filters-btn:hover { opacity: 0.85; }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .controls-row { flex-direction: column; align-items: stretch; }
      .category-filters { justify-content: flex-start; }
      .notice-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class NewsComponent implements OnInit {
  private http = inject(HttpClient);
  router = inject(Router);
  Math = Math;

  notices: any[] = [];
  loading = true;
  searchQuery = '';
  activeCategory = 'all';
  currentPage = 1;
  pageSize = 9;

  categories = [
    { value: 'all',      label: 'All' },
    { value: 'circular', label: 'Circulars' },
    { value: 'policy',   label: 'Policy Updates' },
    { value: 'event',    label: 'Events' },
    { value: 'alert',    label: 'Alerts' },
  ];

  ngOnInit() {
    this.http.get<any[]>('/api/public/notices').subscribe({
      next:  rows  => { this.notices = rows; this.loading = false; },
      error: ()    => {
        // Fallback demo data when API unavailable
        this.notices = this.demoNotices;
        this.loading = false;
      }
    });
  }

  get filteredNotices(): any[] {
    let list = this.notices;
    if (this.activeCategory !== 'all') {
      list = list.filter(n => (n.category ?? '').toLowerCase() === this.activeCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(n =>
        (n.title ?? '').toLowerCase().includes(q) ||
        (n.body  ?? '').toLowerCase().includes(q) ||
        (n.category ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get paginatedNotices(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNotices.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNotices.length / this.pageSize);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  demoNotices = [
    { id: 1, title: 'New Commission Structure Announced by SBI for BC Agents',          category: 'Circular',   publishedAt: '2026-06-20', body: 'State Bank of India has revised its commission matrix for Banking Correspondents effective from July 2026. All registered members are advised to review the updated schedule.' },
    { id: 2, title: 'RBI Guideline Update: AEPS Transaction Limits Revised',             category: 'Policy',     publishedAt: '2026-06-15', body: 'The Reserve Bank of India has issued fresh guidelines revising AEPS daily transaction limits. BCAR members must comply with the updated limits from 1st July 2026.' },
    { id: 3, title: 'BCAR Annual General Meeting – Jaipur, July 2026',                   category: 'Event',      publishedAt: '2026-06-10', body: 'The Annual General Meeting of BCAR will be held at Birla Auditorium, Jaipur on 20th July 2026. All district representatives are requested to confirm attendance.' },
    { id: 4, title: 'Alert: Fraudulent BC Agent IDs Being Circulated',                   category: 'Alert',      publishedAt: '2026-06-05', body: 'BCAR has received reports of fraudulent identity cards being circulated. Please verify your ID card authenticity via the member portal. Report any suspected fraud immediately.' },
    { id: 5, title: 'IIBF BC Examination Registration Open – July 2026 Batch',           category: 'Circular',   publishedAt: '2026-05-28', body: 'Registration for the July 2026 batch of IIBF Business Correspondent Certificate Examination is now open. BCAR is offering subsidized coaching for registered members.' },
    { id: 6, title: 'Group Insurance Scheme for BC Agents – Enrollment Deadline',        category: 'Circular',   publishedAt: '2026-05-20', body: 'BCAR has negotiated a group life and medical insurance scheme for all active members. Enrollment deadline is 30th June 2026. Nominal premium applicable.' },
    { id: 7, title: 'Digital Payments Workshop – All Districts',                         category: 'Event',      publishedAt: '2026-05-12', body: 'A series of digital payment workshops will be conducted across all 33 districts during June 2026. Topics include UPI, AEPS security, and fraud prevention.' },
    { id: 8, title: 'Rajasthan Govt: Financial Inclusion Policy 2026 Released',          category: 'Policy',     publishedAt: '2026-05-05', body: 'The Government of Rajasthan has released its Financial Inclusion Policy 2026, outlining increased targets for banking penetration. BCAR has contributed key recommendations.' },
    { id: 9, title: 'Member ID Card Renewal: Process and Timeline',                      category: 'Circular',   publishedAt: '2026-04-28', body: 'BCAR member ID cards issued in 2024 are up for renewal. Members are requested to log in to the portal and initiate the renewal process before May 31, 2026.' },
    { id:10, title: 'Alert: System Downtime on Member Portal – 28th June (Maintenance)', category: 'Alert',      publishedAt: '2026-04-20', body: 'The BCAR member portal will undergo scheduled maintenance on 28th June 2026 from 2:00 AM to 6:00 AM IST. Services will be unavailable during this period.' },
  ];
}
