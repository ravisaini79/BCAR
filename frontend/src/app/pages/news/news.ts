import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';

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
              (ngModelChange)="currentPage = 1; filterItems()"
              placeholder="Search news by title or content..."
            >
            @if (searchQuery) {
              <button class="clear-btn" (click)="searchQuery = ''; currentPage = 1; filterItems()">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Category Filter -->
          <div class="category-filters">
            @for (cat of categories; track cat.value) {
              <button
                [class.active]="activeCategory === cat.value"
                (click)="activeCategory = cat.value; currentPage = 1; filterItems()">
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-wrap">
            <div class="spinner"></div>
            <p>Loading news articles...</p>
          </div>
        }

        <!-- News Grid -->
        @if (!loading()) {
          @if (paginatedArticles().length > 0) {
            <div class="notice-grid">
              @for (item of paginatedArticles(); track item._id) {
                <article class="notice-card">
                  <!-- Featured Image -->
                  <div class="news-image-wrapper" *ngIf="item.featuredImage?.secure_url" (click)="router.navigate(['/news', item.slug])" style="cursor: pointer;">
                    <img [src]="item.featuredImage.secure_url" [alt]="item.title" class="news-featured-img">
                  </div>
                  
                  <div class="notice-top">
                    <span class="notice-tag" [class]="'cat-' + (item.category | lowercase)">
                      {{ item.category === 'policy' ? 'Policy Update' : item.category === 'circular' ? 'Circular' : item.category === 'event' ? 'Event' : 'Alert' }}
                    </span>
                    <time class="notice-date">
                      <i class="pi pi-calendar"></i>
                      {{ item.publishDate | date:'dd MMM yyyy' }}
                    </time>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.shortDescription }}</p>
                  <button class="read-btn" (click)="router.navigate(['/news', item.slug])">
                    Read More <i class="pi pi-arrow-right"></i>
                  </button>
                </article>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
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
                <button class="pg-btn" [disabled]="currentPage === totalPages()" (click)="nextPage()">
                  <i class="pi pi-chevron-right"></i>
                </button>
              </div>
              <p class="pagination-info">
                Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredArticles().length) }}
                of {{ filteredArticles().length }} articles
              </p>
            }

          } @else {
            <!-- Empty State -->
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <h3>No Articles Found</h3>
              <p>{{ searchQuery || activeCategory !== 'all' ? 'Try a different search term or category.' : 'Check back soon for new updates from BCAR.' }}</p>
              @if (searchQuery || activeCategory !== 'all') {
                <button class="clear-filters-btn" (click)="searchQuery = ''; activeCategory = 'all'; currentPage = 1; filterItems()">
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
      overflow: hidden;
    }
    .notice-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

    .news-image-wrapper {
      margin: -28px -24px 12px -24px;
      height: 180px;
      overflow: hidden;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      background: #cbd5e1;
    }
    .news-featured-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }
    .notice-card:hover .news-featured-img {
      transform: scale(1.05);
    }

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

    .notice-date { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #64748B; }
    .notice-card h3 {
      font-family: Poppins, sans-serif; font-size: 18px; font-weight: 700;
      color: #0B2D5C; margin: 0; line-height: 1.4;
    }
    .notice-card p {
      font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 8px;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }

    .read-btn {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 6px;
      background: 0; border: 0; color: #0B2D5C; font-weight: 700; font-size: 13.5px;
      padding: 0; cursor: pointer; transition: color 0.2s;
      margin-top: auto; font-family: inherit;
    }
    .read-btn:hover { color: #D4AF37; }

    /* ── Pagination ── */
    .pagination { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
    .pg-btn {
      width: 38px; height: 38px; border-radius: 8px;
      border: 1.5px solid #dde3ec; background: #ffffff;
      color: #475569; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s;
    }
    .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .pg-btn:not(:disabled):hover { border-color: #0B2D5C; color: #0B2D5C; }

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
  private newsService = inject(NewsService);
  router = inject(Router);
  Math = Math;

  articles = signal<any[]>([]);
  filteredArticles = signal<any[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';
  activeCategory = 'all';
  currentPage = 1;
  pageSize = 6;

  categories = [
    { value: 'all',      label: 'All' },
    { value: 'circular', label: 'Circulars' },
    { value: 'policy',   label: 'Policy Updates' },
    { value: 'event',    label: 'Events' },
    { value: 'alert',    label: 'Alerts' },
  ];

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.loading.set(true);
    this.newsService.getArticles().subscribe({
      next: (data) => {
        this.articles.set(data);
        this.filterItems();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterItems() {
    let list = this.articles();
    
    // Category Filter
    if (this.activeCategory !== 'all') {
      list = list.filter(n => (n.category ?? '').toLowerCase() === this.activeCategory);
    }
    
    // Search Query Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(n =>
        (n.title ?? '').toLowerCase().includes(q) ||
        (n.shortDescription ?? '').toLowerCase().includes(q) ||
        (n.category ?? '').toLowerCase().includes(q)
      );
    }
    
    this.filteredArticles.set(list);
    this.currentPage = 1;
  }

  paginatedArticles() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredArticles().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.filteredArticles().length / this.pageSize);
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages()) this.currentPage++; }
}
