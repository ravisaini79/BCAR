import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { NewsService } from '../../core/services/news.service';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DatePipe,
    HeaderComponent,
    FooterComponent,
    Skeleton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './news.html',
  styleUrls: ['./news.css']
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);
  private router = inject(Router);

  articles = signal<any[]>([]);
  loading = signal<boolean>(true);
  selectedCategory = signal<string>('all');
  searchQuery = signal<string>('');

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.loading.set(true);
    this.newsService.getArticles().subscribe({
      next: (data) => {
        const sorted = (data || [])
          .filter((a: any) => !a.isDeleted && a.status === 'Published')
          .sort((a: any, b: any) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
          });
        this.articles.set(sorted);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  filterCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  get featuredArticle() {
    const list = this.articles();
    if (!list.length) return null;
    const pinned = list.find((a: any) => a.pinned || a.featured);
    return pinned || list[0];
  }

  get filteredArticles() {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    const featuredId = this.featuredArticle?._id;
    
    let list = this.articles();

    // Exclude featured article from the regular grid if no active filter or search
    if (featuredId && cat === 'all' && !query) {
      list = list.filter((a: any) => a._id !== featuredId);
    }

    if (cat !== 'all') {
      list = list.filter((a: any) => a.category === cat);
    }

    if (query) {
      list = list.filter((a: any) => 
        (a.title || '').toLowerCase().includes(query) ||
        (a.shortDescription || '').toLowerCase().includes(query) ||
        (a.category || '').toLowerCase().includes(query)
      );
    }

    return list;
  }

  readMore(slug: string) {
    if (slug) {
      this.router.navigate(['/news', slug]);
    }
  }

  getTag(category: string): string {
    if (category === 'policy')   return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event')    return 'Event';
    return 'Announcement';
  }

  getReadingTime(text: string): string {
    if (!text) return '2 min read';
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
}
