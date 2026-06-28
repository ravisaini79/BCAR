import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, HeaderComponent, FooterComponent, Card, Skeleton, ProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <!-- Page Hero -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-newspaper"></i> Communications</span>
        <h1>Latest News & Circulars</h1>
        <p>Official announcements, policy updates, and circulars from the Business Correspondent Association Rajasthan.</p>
      </div>
    </div>

    <!-- News Section -->
    <div class="page-section">
      <div class="page-container">

        <!-- Loading State skeletons -->
        <div class="news-grid" *ngIf="loading()">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="news-skeleton-card">
              <p-skeleton width="100%" height="200px" borderRadius="16px" />
              <div style="padding: 20px 0 0 0;">
                <p-skeleton width="30%" height="12px" styleClass="mb-3" />
                <p-skeleton width="90%" height="20px" styleClass="mb-2" />
                <p-skeleton width="100%" height="14px" styleClass="mb-2" />
                <p-skeleton width="40%" height="14px" />
              </div>
            </div>
          }
        </div>

        <!-- News Grid -->
        <div class="news-grid" *ngIf="!loading()">
          @for (item of articles(); track item._id) {
            <!-- Premium PrimeNG Card -->
            <p-card class="news-card">
              <!-- Featured Image header -->
              <ng-template pTemplate="header">
                <div class="news-image-wrapper" (click)="readMore(item.slug)">
                  <img [src]="item.featuredImage?.secure_url" [alt]="item.title" class="news-img" loading="lazy">
                </div>
              </ng-template>

              <!-- Card content -->
              <div class="news-meta">
                <span class="news-date">
                  <i class="pi pi-calendar"></i>
                  {{ item.publishDate | date:'dd MMM yyyy' }}
                </span>
                <span class="news-tag" [class]="item.category">
                  {{ getTag(item.category) }}
                </span>
              </div>
              
              <h3 class="news-title" (click)="readMore(item.slug)">{{ item.title }}</h3>
              <p class="news-desc">{{ item.shortDescription }}</p>

              <!-- Card footer -->
              <ng-template pTemplate="footer">
                <button class="read-btn" (click)="readMore(item.slug)">
                  Read Article <i class="pi pi-arrow-right"></i>
                </button>
              </ng-template>
            </p-card>
          }
          @empty {
            <div class="news-empty" *ngIf="!loading()">
              <i class="pi pi-inbox" style="font-size: 48px; color: #cbd5e1; display: block; margin-bottom: 16px;"></i>
              <p>No news articles published yet.</p>
            </div>
          }
        </div>

      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    /* ── Hero ── */
    .page-hero {
      margin-top: 80px;
      background: radial-gradient(circle at top right, rgba(15, 118, 110, 0.15) 0%, transparent 60%), linear-gradient(135deg, #051c3c 0%, #0c356a 100%);
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
      font-family: 'Poppins', sans-serif;
      font-size: clamp(28px, 5vw, 46px);
      font-weight: 700; color: #ffffff; margin: 0 0 16px;
    }
    .page-hero p { font-size: 16px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0; }

    /* ── Section Wrapper ── */
    .page-section { background: #F8FAFC; padding: 64px 24px 80px; }
    .page-container { max-width: 1300px; margin: 0 auto; }

    /* ── Grid Stacking Layout ── */
    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
    }
    @media (max-width: 991px) {
      .news-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }
    }
    @media (max-width: 640px) {
      .news-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ── Skeletons ── */
    .news-skeleton-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #f1f5f9;
    }

    /* ── Card Styling Overrides ── */
    ::ng-deep .news-card .p-card {
      background: #ffffff !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
      border: 1px solid #f1f5f9 !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    ::ng-deep .news-card:hover .p-card {
      transform: translateY(-4px) !important;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
      border-color: #e2e8f0 !important;
    }
    ::ng-deep .news-card .p-card-body {
      padding: 24px !important;
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }
    ::ng-deep .news-card .p-card-content {
      padding: 0 !important;
      flex: 1 !important;
    }
    ::ng-deep .news-card .p-card-footer {
      padding: 16px 0 0 0 !important;
      border-top: 1px solid #f1f5f9 !important;
      margin-top: auto !important;
    }

    /* Image wrapper */
    .news-image-wrapper {
      width: 100%;
      overflow: hidden;
      cursor: pointer;
      background: #f1f5f9;
    }
    .news-img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    ::ng-deep .news-card:hover .news-img {
      transform: scale(1.04);
    }

    /* News Metadata */
    .news-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
    }
    .news-date {
      color: #64748B;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .news-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 50px;
    }
    .news-tag.circular { background: rgba(212,175,55,0.12); color: #92700e; }
    .news-tag.policy   { background: rgba(14,165,233,0.12); color: #0369a1; }
    .news-tag.event    { background: rgba(15,118,110,0.12); color: #0f766e; }
    .news-tag.alert    { background: rgba(239,68,68,0.1);   color: #dc2626; }

    /* Title & Desc */
    .news-title {
      font-family: 'Poppins', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #082B5C;
      margin: 0;
      line-height: 1.4;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    .news-title:hover {
      color: #D4AF37;
    }
    .news-desc {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Buttons */
    .read-btn {
      border: 0;
      background: none;
      color: #082B5C;
      font-weight: 700;
      font-size: 13.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0;
      cursor: pointer;
      transition: color 0.2s;
    }
    .read-btn:hover {
      color: #D4AF37;
    }

    /* Empty state */
    .news-empty {
      text-align: center;
      padding: 80px 24px;
      color: #64748B;
    }
  `]
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);
  private router = inject(Router);

  articles = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.loading.set(true);
    this.newsService.getArticles().subscribe({
      next: (data) => {
        // filter deleted and sort descending chronologically
        const sorted = (data || [])
          .filter((a: any) => !a.isDeleted && a.status === 'Published')
          .sort((a: any, b: any) => {
            const dateA = new Date(a.publishDate).getTime();
            const dateB = new Date(b.publishDate).getTime();
            return dateB - dateA;
          });
        this.articles.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  readMore(slug: string) {
    this.router.navigate(['/news', slug]);
  }

  getTag(category: string): string {
    if (category === 'policy') return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event') return 'Event';
    return 'Alert';
  }
}
