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
  templateUrl: './news-details.html',
  styleUrls: ['./news-details.css']
})
export class NewsDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private newsService = inject(NewsService);

  article  = signal<any | null>(null);
  articles = signal<any[]>([]);
  loading  = signal<boolean>(true);
  error    = signal<boolean>(false);

  // Related articles of same category, excluding current
  relatedArticles = computed(() => {
    const current = this.article();
    if (!current) return [];
    return this.articles()
      .filter(a => a._id !== current._id && a.category === current.category)
      .slice(0, 3);
  });

  // Previous article (older)
  prevArticle = computed(() => {
    const current = this.article();
    if (!current) return null;
    const list = this.articles();
    const idx = list.findIndex(a => a._id === current._id);
    return idx !== -1 && idx < list.length - 1 ? list[idx + 1] : null;
  });

  // Next article (newer)
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

    this.newsService.getArticleBySlug(slug).subscribe({
      next: (data) => {
        this.article.set(data);
        this.newsService.getArticles().subscribe({
          next: (list) => {
            const activeSorted = (list || [])
              .filter((a: any) => !a.isDeleted && a.status === 'Published')
              .sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
            this.articles.set(activeSorted);
            this.loading.set(false);
          },
          error: () => { this.loading.set(false); }
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
    if (slug) this.router.navigate(['/news', slug]);
  }

  getShareLink(platform: 'whatsapp' | 'facebook' | 'twitter'): string {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.article()?.title || '');
    if (platform === 'whatsapp') return `https://api.whatsapp.com/send?text=${title}%20${url}`;
    if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  }

  getTag(category: string): string {
    if (category === 'policy')   return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event')    return 'Event';
    return 'Alert';
  }

  goBack(): void { this.router.navigate(['/news']); }
}
