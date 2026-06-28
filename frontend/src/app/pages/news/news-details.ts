import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-header></app-header>

    <!-- Details View Container -->
    <div class="details-section" *ngIf="article()">
      <div class="details-container">
        
        <!-- Back Button -->
        <button class="back-link" (click)="goBack()">
          <i class="pi pi-arrow-left"></i> Back to News
        </button>

        <!-- Article Header -->
        <header class="article-header">
          <span class="article-tag" [class]="'cat-' + article()!.category">
            {{ article()!.category === 'policy' ? 'Policy Update' : article()!.category === 'circular' ? 'Circular' : article()!.category === 'event' ? 'Event' : 'Alert' }}
          </span>
          <h1>{{ article()!.title }}</h1>
          <div class="article-meta">
            <time><i class="pi pi-calendar"></i> {{ article()!.publishDate | date: 'dd MMMM yyyy' }}</time>
            <span *ngIf="article()!.pinned" class="pinned-badge"><i class="pi pi-bookmark-fill"></i> Pinned Update</span>
          </div>
        </header>

        <!-- Featured Image -->
        <div class="article-image-box" *ngIf="article()!.featuredImage?.secure_url">
          <img [src]="article()!.featuredImage.secure_url" [alt]="article()!.title" />
        </div>

        <!-- Short Description Box -->
        <div class="article-summary">
          <p>{{ article()!.shortDescription }}</p>
        </div>

        <!-- Full HTML Content -->
        <div class="article-body" [innerHTML]="article()!.fullDescription"></div>

      </div>
    </div>

    <!-- Loading State -->
    <div class="details-section" *ngIf="loading()">
      <div class="details-container" style="text-align: center; padding: 100px 0;">
        <i class="pi pi-spin pi-spinner" style="font-size: 40px; color: #0B2D5C; margin-bottom: 20px;"></i>
        <p style="color: #64748B;">Loading article details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div class="details-section" *ngIf="error() && !loading()">
      <div class="details-container" style="text-align: center; padding: 100px 0; color: #64748B;">
        <i class="pi pi-exclamation-circle" style="font-size: 56px; color: #cbd5e1; display: block; margin-bottom: 20px;"></i>
        <h3>Article Not Found</h3>
        <p>The news article you are looking for does not exist or may have been removed.</p>
        <button class="btn-back-home" (click)="goBack()">Return to News</button>
      </div>
    </div>

    <app-footer></app-footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');

    .details-section {
      background: #F5F7FA;
      padding: 120px 24px 80px;
    }
    .details-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }

    .back-link {
      background: none; border: 0; color: #0B2D5C;
      font-size: 14.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 0; margin-bottom: 30px; font-family: inherit;
      transition: color 0.2s;
    }
    .back-link:hover { color: #D4AF37; }

    .article-header { margin-bottom: 28px; }
    .article-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; padding: 4px 14px; border-radius: 50px;
      display: inline-block; margin-bottom: 12px;
      background: rgba(11,45,92,0.08); color: #0B2D5C;
    }
    .article-tag.cat-circular  { background: rgba(212,175,55,0.12); color: #92700e; }
    .article-tag.cat-policy    { background: rgba(14,165,233,0.12); color: #0369a1; }
    .article-tag.cat-event     { background: rgba(15,118,110,0.12); color: #0f766e; }
    .article-tag.cat-alert     { background: rgba(239,68,68,0.1);   color: #dc2626; }

    .article-header h1 {
      font-family: Poppins, sans-serif;
      font-size: clamp(24px, 4.5vw, 36px);
      font-weight: 800; color: #0B2D5C;
      line-height: 1.3; margin: 0 0 12px;
    }

    .article-meta {
      display: flex; gap: 16px; align-items: center;
      font-size: 13.5px; color: #64748B;
    }
    .article-meta time { display: inline-flex; align-items: center; gap: 6px; }
    .pinned-badge {
      display: inline-flex; align-items: center; gap: 4px;
      color: #0284c7; font-weight: 600;
    }

    .article-image-box {
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 30px;
      max-height: 420px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
    }
    .article-image-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      max-height: 418px;
      display: block;
    }

    .article-summary {
      background: #F8FAFC;
      border-left: 4px solid #D4AF37;
      padding: 18px 20px;
      border-radius: 4px;
      font-size: 15px; color: #334155;
      line-height: 1.6; font-weight: 500;
      margin-bottom: 30px;
    }
    .article-summary p { margin: 0; }

    .article-body {
      font-size: 16px; color: #334155;
      line-height: 1.8;
    }
    .article-body ::ng-deep p { margin: 0 0 16px; }
    .article-body ::ng-deep h2, .article-body ::ng-deep h3 {
      font-family: Poppins, sans-serif;
      color: #0B2D5C; margin: 28px 0 12px;
      font-weight: 700;
    }
    .article-body ::ng-deep ul, .article-body ::ng-deep ol {
      margin: 0 0 20px; padding-left: 24px;
    }
    .article-body ::ng-deep li { margin-bottom: 8px; }

    .btn-back-home {
      display: inline-block; background: #0B2D5C; color: #D4AF37;
      border: 0; padding: 10px 24px; border-radius: 8px;
      font-weight: 600; font-size: 14px; cursor: pointer;
      margin-top: 16px; font-family: inherit;
      transition: opacity 0.2s;
    }
    .btn-back-home:hover { opacity: 0.85; }

    @media (max-width: 640px) {
      .details-section { padding: 90px 16px 60px; }
      .details-container { padding: 24px 16px; }
    }
  `]
})
export class NewsDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private newsService = inject(NewsService);

  article = signal<any | null>(null);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        this.fetchDetails(slug);
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  fetchDetails(slug: string): void {
    this.loading.set(true);
    this.error.set(false);
    
    this.newsService.getArticleBySlug(slug).subscribe({
      next: (data) => {
        this.article.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load article details:', err);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/news']);
  }
}
