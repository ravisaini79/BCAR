import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-news-details',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    DatePipe, 
    HeaderComponent, 
    FooterComponent,
    Skeleton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './news-details.html',
  styleUrls: ['./news-details.css']
})
export class NewsDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private newsService = inject(NewsService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  article  = signal<any | null>(null);
  articles = signal<any[]>([]);
  loading  = signal<boolean>(true);
  error    = signal<boolean>(false);
  copied   = signal<boolean>(false);

  // Clean HTML description: sanitizes &nbsp;, wraps tables for responsive scroll, and demotes inner h1 tags
  cleanFullDescription = computed(() => {
    let raw = this.article()?.fullDescription || '';
    if (!raw) return '';
    // Replace non-breaking spaces with regular space
    raw = raw.replace(/&nbsp;/g, ' ');
    // Convert inner h1 tags to h2 subheadings
    raw = raw.replace(/<h1([^>]*)>/gi, '<h2 class="content-subheading"$1>').replace(/<\/h1>/gi, '</h2>');
    // Wrap raw <table> elements in a responsive container if not already wrapped
    if (raw.includes('<table') && !raw.includes('table-responsive')) {
      raw = raw.replace(/<table([^>]*)>/gi, '<div class="table-responsive"><table class="news-content-table"$1>').replace(/<\/table>/gi, '</table></div>');
    }
    return raw;
  });

  // Display Title for SEO & Share
  displayTitle = computed(() => {
    const art = this.article();
    return art ? (art.title || 'Official Announcement') : 'BCAR News & Circulars';
  });

  // Related articles (up to 3-4 items of same category or latest)
  relatedArticles = computed(() => {
    const current = this.article();
    if (!current) return [];
    const all = this.articles();
    let sameCat = all.filter(a => a._id !== current._id && a.category === current.category);
    if (sameCat.length < 3) {
      const remaining = all.filter(a => a._id !== current._id && a.category !== current.category);
      sameCat = [...sameCat, ...remaining];
    }
    return sameCat.slice(0, 4);
  });

  // Recent Posts for Right Sidebar (top 4 latest articles)
  recentPosts = computed(() => {
    const current = this.article();
    const all = this.articles();
    return all.filter(a => !current || a._id !== current._id).slice(0, 4);
  });

  // Categories Widget (unique categories with counts)
  categories = computed(() => {
    const all = this.articles();
    const counts: { [key: string]: number } = { circular: 0, policy: 0, event: 0 };
    all.forEach(a => {
      const cat = a.category || 'circular';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return [
      { name: 'Circulars', key: 'circular', count: counts['circular'] || 0, icon: 'pi-file' },
      { name: 'Policy Updates', key: 'policy', count: counts['policy'] || 0, icon: 'pi-shield' },
      { name: 'Events & Assemblies', key: 'event', count: counts['event'] || 0, icon: 'pi-calendar' }
    ];
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
    this.copied.set(false);

    this.newsService.getArticleBySlug(slug).subscribe({
      next: (data) => {
        this.article.set(data);
        this.updateSeoMetadata(data);

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

  updateSeoMetadata(art: any): void {
    if (!art) return;
    const pageTitle = `${art.title} | BCAR Rajasthan`;
    const pageDesc = art.shortDescription || 'Official news circular from Business Correspondent Association Rajasthan.';
    const pageImg = this.getImageUrl(art);
    const pageUrl = window.location.href;

    // Dynamic Title
    this.titleService.setTitle(pageTitle);

    // OpenGraph & Meta Tags
    this.metaService.updateTag({ name: 'description', content: pageDesc });
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: pageDesc });
    this.metaService.updateTag({ property: 'og:image', content: pageImg });
    this.metaService.updateTag({ property: 'og:url', content: pageUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });

    // Twitter Card Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: pageDesc });
    this.metaService.updateTag({ name: 'twitter:image', content: pageImg });
  }

  navigateToArticle(slug: string | undefined): void {
    if (slug) {
      this.router.navigate(['/news', slug]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  filterCategory(catKey: string): void {
    this.router.navigate(['/news'], { queryParams: { category: catKey } });
  }

  getShareLink(platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'telegram'): string {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.displayTitle());
    if (platform === 'whatsapp') return `https://api.whatsapp.com/send?text=${title}%20${url}`;
    if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'linkedin') return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (platform === 'telegram') return `https://t.me/share/url?url=${url}&text=${title}`;
    return `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2500);
  }

  getTag(category: string): string {
    if (category === 'policy')   return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event')    return 'Event';
    return 'Announcement';
  }

  getReadingTime(text: string): string {
    if (!text) return '3 min read';
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  getImageUrl(item: any): string {
    if (!item) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop';
    if (typeof item.featuredImage === 'string' && item.featuredImage.trim()) return item.featuredImage;
    if (item.featuredImage?.secure_url) return item.featuredImage.secure_url;
    if (item.featuredImage?.url) return item.featuredImage.url;
    if (typeof item.image === 'string' && item.image.trim()) return item.image;
    if (item.image?.secure_url) return item.image.secure_url;
    if (item.image?.url) return item.image.url;
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop';
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop';
  }

  goBack(): void { this.router.navigate(['/news']); }
}
