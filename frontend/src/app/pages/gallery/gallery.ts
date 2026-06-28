import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { GalleryService } from '../../core/services/gallery.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <!-- Page Hero -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-images"></i> Media Gallery</span>
        <h1>BCAR in Action</h1>
        <p>Glimpses of meetings, training sessions, and community support assemblies across all 33 districts of Rajasthan.</p>
      </div>
    </div>

    <!-- Gallery Section -->
    <div class="page-section">
      <div class="page-container">

        <!-- Category Filters -->
        <div class="gallery-filters">
          <button [class.active]="activeFilter() === 'all'"       (click)="setFilter('all')">
            <i class="pi pi-th-large"></i> All Photos
          </button>
          <button [class.active]="activeFilter() === 'inclusion'" (click)="setFilter('inclusion')">
            <i class="pi pi-wallet"></i> Financial Inclusion
          </button>
          <button [class.active]="activeFilter() === 'meeting'"   (click)="setFilter('meeting')">
            <i class="pi pi-users"></i> Official Assemblies
          </button>
          <button [class.active]="activeFilter() === 'training'"  (click)="setFilter('training')">
            <i class="pi pi-book"></i> Workshops & Training
          </button>
        </div>

        <!-- Count badge -->
        <p class="result-count">
          Showing <strong>{{ filtered().length }}</strong> photo{{ filtered().length !== 1 ? 's' : '' }}
        </p>

        <!-- Masonry Grid -->
        <div class="gallery-masonry">
          @for (item of filtered(); track item._id) {
            <div class="gallery-item" (click)="selectedImage.set(item)">
              <img [src]="item.image?.secure_url" [alt]="item.title" loading="lazy">
              <div class="gallery-overlay">
                <i class="pi pi-search-plus zoom-icon"></i>
                <h4>{{ item.title }}</h4>
                <span class="gallery-tag">{{ getTag(item.category) }}</span>
              </div>
            </div>
          }
          @empty {
            <div class="gallery-empty" *ngIf="!loading()">
              <i class="pi pi-image"></i>
              <p>No photos in this category yet.</p>
            </div>
          }
        </div>
        
        <!-- Loading Indicator -->
        <div class="gallery-empty" *ngIf="loading()" style="padding: 40px 0;">
          <i class="pi pi-spin pi-spinner" style="font-size: 32px;"></i>
          <p>Loading gallery images...</p>
        </div>

      </div>
    </div>

    <!-- Lightbox Overlay -->
    @if (selectedImage()) {
      <div class="lightbox-overlay" (click)="selectedImage.set(null)">
        <div class="lightbox-content" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="selectedImage.set(null)">
            <i class="pi pi-times"></i>
          </button>
          <img [src]="selectedImage()!.image?.secure_url" [alt]="selectedImage()!.title">
          <div class="lightbox-caption">
            <span class="caption-tag">{{ getTag(selectedImage()!.category) }}</span>
            <h3>{{ selectedImage()!.title }}</h3>
          </div>
        </div>
      </div>
    }

    <app-footer></app-footer>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap');

    /* ── Hero ── */
    .page-hero {
      margin-top: 50px;
      background: linear-gradient(135deg, #0B2D5C 0%, #0d3a6e 100%);
      padding: 100px 24px 80px;
      text-align: center;
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

    /* ── Section Wrapper ── */
    .page-section { background: #F5F7FA; padding: 64px 24px 80px; }
    .page-container { max-width: 1200px; margin: 0 auto; }

    /* ── Filters ── */
    .gallery-filters {
      display: flex; flex-wrap: wrap; gap: 10px;
      justify-content: center; margin-bottom: 16px;
    }
    .gallery-filters button {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 9px 20px; border-radius: 50px;
      border: 1.5px solid #dde3ec;
      background: #ffffff; color: #475569;
      font-size: 13.5px; font-weight: 600;
      cursor: pointer; transition: all 0.22s ease;
    }
    .gallery-filters button:hover {
      border-color: #0B2D5C; color: #0B2D5C;
      background: rgba(11,45,92,0.05);
    }
    .gallery-filters button.active {
      background: #0B2D5C; color: #D4AF37;
      border-color: #0B2D5C;
      box-shadow: 0 4px 14px rgba(11,45,92,0.2);
    }
    .gallery-filters button i { font-size: 12px; }

    /* ── Result Count ── */
    .result-count {
      text-align: center; font-size: 13.5px; color: #64748B;
      margin: 0 0 32px;
    }
    .result-count strong { color: #0B2D5C; }

    /* ── Masonry Grid ── */
    .gallery-masonry {
      columns: 3 280px; column-gap: 20px;
    }
    .gallery-item {
      break-inside: avoid;
      position: relative; overflow: hidden;
      border-radius: 14px; cursor: pointer;
      margin-bottom: 20px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.08);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .gallery-item:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); }
    .gallery-item img {
      width: 100%; display: block; object-fit: cover;
      min-height: 180px; transition: transform 0.4s ease;
    }
    .gallery-item:hover img { transform: scale(1.06); }
    .gallery-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(8,43,92,0.88) 100%);
      display: flex; flex-direction: column;
      justify-content: flex-end; align-items: flex-start;
      padding: 20px;
      opacity: 0; transition: opacity 0.3s ease;
    }
    .gallery-item:hover .gallery-overlay { opacity: 1; }
    .zoom-icon {
      position: absolute; top: 16px; right: 16px;
      font-size: 20px; color: #D4AF37;
      background: rgba(0,0,0,0.4);
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .gallery-overlay h4 {
      font-family: Poppins, sans-serif;
      font-size: 14px; font-weight: 700;
      color: #ffffff; margin: 0 0 6px;
    }
    .gallery-tag {
      font-size: 11px; font-weight: 600;
      color: #D4AF37;
      background: rgba(212,175,55,0.18);
      border: 1px solid rgba(212,175,55,0.35);
      padding: 3px 10px; border-radius: 50px;
    }

    /* ── Empty State ── */
    .gallery-empty {
      column-span: all;
      text-align: center; padding: 60px 24px;
      color: #94a3b8;
    }
    .gallery-empty i { font-size: 48px; display: block; margin-bottom: 16px; }
    .gallery-empty p { font-size: 15px; }

    /* ── Lightbox ── */
    .lightbox-overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(4,26,61,0.92);
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .lightbox-content {
      position: relative;
      max-width: 860px; width: 100%;
      background: #ffffff; border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.4);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .lightbox-content img { width: 100%; display: block; max-height: 70vh; object-fit: contain; background: #0B2D5C; }
    .lightbox-caption {
      padding: 20px 24px;
      background: #ffffff;
    }
    .lightbox-caption .caption-tag {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #D4AF37;
    }
    .lightbox-caption h3 {
      font-family: Poppins, sans-serif;
      font-size: 18px; font-weight: 700; color: #0B2D5C;
      margin: 6px 0 0;
    }
    .lightbox-close {
      position: absolute; top: 14px; right: 14px;
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.3);
      color: #ffffff; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.2s;
      z-index: 10;
    }
    .lightbox-close:hover { background: rgba(255,255,255,0.3); }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .gallery-masonry { columns: 1; }
      .page-hero { padding: 80px 16px 60px; }
    }
  `]
})
export class GalleryComponent implements OnInit {
  private galleryService = inject(GalleryService);

  activeFilter = signal<string>('all');
  selectedImage = signal<any>(null);
  galleryItems = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.galleryService.getItems().subscribe({
      next: (data) => {
        this.galleryItems.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  getTag(category: string): string {
    if (category === 'inclusion') return 'Financial Inclusion';
    if (category === 'meeting') return 'Official Assembly';
    if (category === 'training') return 'Workshop & Training';
    return 'BCAR Media';
  }

  filtered(): any[] {
    const f = this.activeFilter();
    const items = this.galleryItems();
    if (f === 'all') return items;
    return items.filter(i => i.category === f);
  }
}
