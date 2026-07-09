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
  templateUrl: './news.html',
  styleUrls: ['./news.css']
})
export class NewsComponent implements OnInit {
  private newsService = inject(NewsService);
  private router = inject(Router);

  articles = signal<any[]>([]);
  loading = signal<boolean>(true);
  selectedCategory = signal<string>('all');

  ngOnInit() { this.loadNews(); }

  loadNews() {
    this.loading.set(true);
    this.newsService.getArticles().subscribe({
      next: (data) => {
        const sorted = (data || [])
          .filter((a: any) => !a.isDeleted && a.status === 'Published')
          .sort((a: any, b: any) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
        this.articles.set(sorted);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  filterCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  get filteredArticles() {
    const cat = this.selectedCategory();
    const list = this.articles();
    if (cat === 'all') return list;
    return list.filter((a: any) => a.category === cat);
  }

  readMore(slug: string) { this.router.navigate(['/news', slug]); }

  getTag(category: string): string {
    if (category === 'policy')   return 'Policy Update';
    if (category === 'circular') return 'Circular';
    if (category === 'event')    return 'Event';
    return 'Alert';
  }
}
