import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <!-- Details View Container -->
    <div class="details-section" *ngIf="article() && !loading()">
      <div class="details-container">
        
        <!-- Back Button -->
        <button class="back-link" (click)="goBack()">
          <i class="pi pi-arrow-left"></i> Back to News
        </button>

        <!-- Article Header -->
        <header class="article-header">
          <div class="header-meta-top">
            <span class="article-tag" [class]="article()!.category">
              {{ getTag(article()!.category) }}
            </span>
            <span *ngIf="article()!.pinned" class="pinned-badge">
              <i class="pi pi-bookmark-fill"></i> Pinned Update
            </span>
          </div>
          <h1>{{ article()!.title }}</h1>
          <div class="article-meta">
            <time><i class="pi pi-calendar"></i> {{ article()!.publishDate | date: 'dd MMMM yyyy' }}</time>
          </div>
        </header>

        <!-- Large Banner Image -->
        <div class="article-image-box" *ngIf="article()!.featuredImage?.secure_url">
          <img [src]="article()!.featuredImage.secure_url" [alt]="article()!.title" class="banner-img" />
        </div>

        <!-- Short Description Box -->
        <div class="article-summary" *ngIf="article()!.shortDescription">
          <p>{{ article()!.shortDescription }}</p>
        </div>

        <!-- Full HTML Content -->
        <div class="article-body" [innerHTML]="article()!.fullDescription"></div>

        <!-- Share Buttons Row -->
        <div class="share-section">
          <h4>Share this Article</h4>
          <div class="share-buttons">
            <a [href]="getShareLink('whatsapp')" target="_blank" class="share-btn whatsapp" rel="noopener noreferrer">
              <i class="pi pi-whatsapp"></i> WhatsApp
            </a>
            <a [href]="getShareLink('facebook')" target="_blank" class="share-btn facebook" rel="noopener noreferrer">
              <i class="pi pi-facebook"></i> Facebook
            </a>
            <a [href]="getShareLink('twitter')" target="_blank" class="share-btn twitter" rel="noopener noreferrer">
              <i class="pi pi-twitter-x"></i> Twitter / X
            </a>
          </div>
        </div>

        <!-- Prev / Next Navigation Row -->
        <div class="prev-next-nav">
          <button class="nav-btn prev" [disabled]="!prevArticle()" (click)="navigateToArticle(prevArticle()?.slug)">
            <i class="pi pi-arrow-left"></i>
            <div class="btn-lbl" *ngIf="prevArticle()">
              <span>Previous Article</span>
              <strong>{{ prevArticle()?.title }}</strong>
            </div>
            <div class="btn-lbl" *ngIf="!prevArticle()">
              <span>No Previous Article</span>
            </div>
          </button>

          <button class="nav-btn next" [disabled]="!nextArticle()" (click)="navigateToArticle(nextArticle()?.slug)">
            <div class="btn-lbl" *ngIf="nextArticle()">
              <span>Next Article</span>
              <strong>{{ nextArticle()?.title }}</strong>
            </div>
            <div class="btn-lbl" *ngIf="!nextArticle()">
              <span>No Next Article</span>
            </div>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>

        <!-- Related News Section -->
        <div class="related-section" *ngIf="relatedArticles().length > 0">
          <h3>Related News</h3>
          <div class="related-grid">
            @for (rel of relatedArticles(); track rel._id) {
              <div class="related-card" (click)="navigateToArticle(rel.slug)">
                <div class="rel-img-box" *ngIf="rel.featuredImage?.secure_url">
                  <img [src]="rel.featuredImage.secure_url" [alt]="rel.title" />
                </div>
                <div class="rel-content">
                  <time>{{ rel.publishDate | date:'dd MMM yyyy' }}</time>
                  <h4>{{ rel.title }}</h4>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>

    <!-- Loading State -->
    <div class="details-section" *ngIf="loading()">
      <div class="details-container" style="text-align: center; padding: 100px 0;">
        <i class="pi pi-spin pi-spinner" style="font-size: 40px; color: #082B5C; margin-bottom: 20px;"></i>
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
    .details-section {
      background: #F8FAFC;
      padding: 120px 24px 80px;
    }
    .details-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
    }

    .back-link {
      background: none; border: 0; color: #082B5C;
      font-size: 14.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 0; margin-bottom: 30px; font-family: inherit;
      transition: color 0.2s;
    }
    .back-link:hover { color: #D4AF37; }

    .article-header { margin-bottom: 32px; }
    .header-meta-top {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .article-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; padding: 4px 14px; border-radius: 50px;
    }
    .article-tag.circular { background: rgba(212,175,55,0.12); color: #92700e; }
    .article-tag.policy   { background: rgba(14,165,233,0.12); color: #0369a1; }
    .article-tag.event    { background: rgba(15,118,110,0.12); color: #0f766e; }
    .article-tag.alert    { background: rgba(239,68,68,0.1);   color: #dc2626; }

    .pinned-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 700;
      color: #0369a1;
    }

    .article-header h1 {
      font-family: 'Poppins', sans-serif;
      font-size: clamp(24px, 4.5vw, 38px);
      font-weight: 700; color: #082B5C;
      line-height: 1.3; margin: 0 0 16px;
    }

    .article-meta {
      display: flex; gap: 16px; align-items: center;
      font-size: 13.5px; color: #64748B;
    }
    .article-meta time { display: inline-flex; align-items: center; gap: 6px; }

    /* Banner Box */
    .article-image-box {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
      box-shadow: 0 4px 18px rgba(0,0,0,0.03);
    }
    .banner-img {
      width: 100%;
      height: auto;
      max-height: 480px;
      object-fit: cover;
      display: block;
    }

    .article-summary {
      background: #F8FAFC;
      border-left: 4px solid #D4AF37;
      padding: 18px 20px;
      border-radius: 4px;
      font-size: 15px; color: #334155;
      line-height: 1.6; font-weight: 500;
      margin-bottom: 32px;
    }
    .article-summary p { margin: 0; }

    .article-body {
      font-size: 16px; color: #334155;
      line-height: 1.8;
    }
    .article-body ::ng-deep p { margin: 0 0 16px; }
    .article-body ::ng-deep h2, .article-body ::ng-deep h3 {
      font-family: 'Poppins', sans-serif;
      color: #082B5C; margin: 32px 0 14px;
      font-weight: 700;
    }
    .article-body ::ng-deep ul, .article-body ::ng-deep ol {
      margin: 0 0 20px; padding-left: 24px;
    }
    .article-body ::ng-deep li { margin-bottom: 8px; }

    /* Share buttons */
    .share-section {
      margin-top: 40px;
      padding: 24px 0;
      border-top: 1px solid #e2e8f0;
    }
    .share-section h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      color: #082B5C;
      margin: 0 0 16px;
    }
    .share-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .share-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 50px;
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      text-decoration: none;
      transition: transform 0.2s;
    }
    .share-btn:hover {
      transform: translateY(-2px);
    }
    .share-btn.whatsapp { background: #25D366; }
    .share-btn.facebook { background: #1877F2; }
    .share-btn.twitter  { background: #000000; }

    /* Prev / Next buttons */
    .prev-next-nav {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      border-top: 1px solid #e2e8f0;
      margin-top: 40px;
      padding-top: 32px;
    }
    .nav-btn {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: left;
    }
    .nav-btn:hover:not(:disabled) {
      border-color: #082B5C;
      box-shadow: 0 4px 16px rgba(8,43,92,0.05);
    }
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .nav-btn.next {
      justify-content: flex-end;
      text-align: right;
    }
    .btn-lbl {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .btn-lbl span {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .btn-lbl strong {
      font-size: 13.5px;
      color: #082B5C;
      font-weight: 700;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Related News */
    .related-section {
      border-top: 1px solid #e2e8f0;
      margin-top: 48px;
      padding-top: 40px;
    }
    .related-section h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 22px;
      color: #082B5C;
      margin-bottom: 24px;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    @media (max-width: 768px) {
      .related-grid {
        grid-template-columns: 1fr;
      }
      .prev-next-nav {
        flex-direction: column;
      }
    }
    .related-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 2px 12px rgba(0,0,0,0.03);
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .related-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .rel-img-box {
      height: 140px;
      overflow: hidden;
    }
    .rel-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .rel-content {
      padding: 16px;
    }
    .rel-content time {
      font-size: 11px;
      color: #94a3b8;
      display: block;
      margin-bottom: 6px;
    }
    .rel-content h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #082B5C;
      margin: 0;
      line-height: 1.4;
    }

    .btn-back-home {
      display: inline-block; background: #082B5C; color: #D4AF37;
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
  articles = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<boolean>(false);

  // Compute related articles of the same category, excluding the current one
  relatedArticles = computed(() => {
    const current = this.article();
    if (!current) return [];
    return this.articles()
      .filter(a => a._id !== current._id && a.category === current.category)
      .slice(0, 3);
  });

  // Compute previous article (older)
  prevArticle = computed(() => {
    const current = this.article();
    if (!current) return null;
    const list = this.articles();
    const idx = list.findIndex(a => a._id === current._id);
    return idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null;
  });

  // Compute next article (newer)
  nextArticle = computed(() => {
    const current = this.article();
    if (!current) return null;
    const list = this.articles();
    const idx = list.findIndex(a => a._id === current._id);
    return idx > 0 ? list[idx - 1] : null;
  });

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
    
    // First load the active article details
    this.newsService.getArticleBySlug(slug).subscribe({
      next: (data) => {
        this.article.set(data);
        
        // Next load all articles to resolve prev/next & related lists
        this.newsService.getArticles().subscribe({
          next: (list) => {
            const activeSorted = (list || [])
              .filter((a: any) => !a.isDeleted && a.status === 'Published')
              .sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
            
            this.articles.set(activeSorted);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load article details:', err);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  navigateToArticle(slug: string | undefined): void {
    if (slug) {
      this.router.navigate(['/news', slug]);
    }
  }

  getShareLink(platform: 'whatsapp' | 'facebook' | 'twitter'): string {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.article()?.title || '');
    if (platform === 'whatsapp') return `https://api.whatsapp.com/send?text=${title}%20${url}`;
    if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  }

  getTag(category: string): string {
    if (category === 'policy') return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event') return 'Event';
    return 'Alert';
  }

  goBack(): void {
    this.router.navigate(['/news']);
  }
}
