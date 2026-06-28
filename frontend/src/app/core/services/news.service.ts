import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private api = inject(ApiService);

  /**
   * Fetch all news articles.
   * Returns published news for public users, and all articles for logged-in admins.
   */
  getArticles(): Observable<any[]> {
    return this.api.get<any[]>('/news');
  }

  /**
   * Fetch single news article details by slug
   */
  getArticleBySlug(slug: string): Observable<any> {
    return this.api.get<any>(`/news/${slug}`);
  }

  /**
   * Create a new news article (multipart FormData)
   */
  createArticle(formData: FormData): Observable<any> {
    return this.api.post<any>('/news', formData);
  }

  /**
   * Update an existing news article (multipart FormData)
   */
  updateArticle(id: string, formData: FormData): Observable<any> {
    return this.api.put<any>(`/news/${id}`, formData);
  }

  /**
   * Soft delete a news article
   */
  deleteArticle(id: string): Observable<any> {
    return this.api.delete<any>(`/news/${id}`);
  }
}
