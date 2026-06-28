import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private api = inject(ApiService);

  /**
   * Fetch all gallery items. 
   * Returns published items for public users, and all items for logged-in admins.
   */
  getItems(): Observable<any[]> {
    return this.api.get<any[]>('/gallery');
  }

  /**
   * Fetch single gallery item details
   */
  getItemById(id: string): Observable<any> {
    return this.api.get<any>(`/gallery/${id}`);
  }

  /**
   * Create a new gallery image item (multipart FormData)
   */
  createItem(formData: FormData): Observable<any> {
    return this.api.post<any>('/gallery', formData);
  }

  /**
   * Update an existing gallery item (multipart FormData)
   */
  updateItem(id: string, formData: FormData): Observable<any> {
    return this.api.put<any>(`/gallery/${id}`, formData);
  }

  /**
   * Soft delete a gallery item
   */
  deleteItem(id: string): Observable<any> {
    return this.api.delete<any>(`/gallery/${id}`);
  }
}
