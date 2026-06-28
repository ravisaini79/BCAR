import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { GalleryService } from '../../core/services/gallery.service';
import { Image } from 'primeng/image';
import { Skeleton } from 'primeng/skeleton';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, Image, Skeleton, ProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header></app-header>

    <!-- Page Hero -->
    <div class="page-hero">
      <div class="page-hero-inner">
        <span class="page-badge"><i class="pi pi-images"></i> Media Gallery</span>
        <h1>BCAR in Action</h1>
        <p>Glimpses of meetings, training sessions, and community support assemblies across Rajasthan.</p>
      </div>
    </div>

    <!-- Gallery Section -->
    <div class="page-section">
      <div class="page-container">

        <!-- Loading State Skeletons -->
        <div class="gallery-masonry" *ngIf="loading()">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="gallery-item-skeleton">
              <p-skeleton width="100%" height="220px" borderRadius="14px" />
              <div class="skeleton-meta">
                <p-skeleton width="60%" height="16px" styleClass="mb-2" />
                <p-skeleton width="40%" height="12px" />
              </div>
            </div>
          }
        </div>

        <!-- Masonry Grid -->
        <div class="gallery-masonry" *ngIf="!loading()">
          @for (item of galleryItems(); track item._id; let idx = $index) {
            <div class="gallery-item" (click)="openLightbox(idx)">
              <!-- PrimeNG Image Component (disabling default preview, handled in custom carousel) -->
              <p-image 
                [src]="item.image?.secure_url" 
                [alt]="item.title"
                [preview]="false"
                styleClass="w-full"
                imageClass="gallery-img"
              />
              <div class="gallery-overlay">
                <i class="pi pi-search zoom-icon"></i>
                <div class="gallery-info">
                  <h4>{{ item.title }}</h4>
                  <span class="gallery-date" *ngIf="item.createdAt">
                    <i class="pi pi-calendar"></i>
                    {{ item.createdAt | date:'dd MMM yyyy' }}
                  </span>
                </div>
              </div>
            </div>
          }
          @empty {
            <div class="gallery-empty" *ngIf="!loading()">
              <i class="pi pi-image" style="font-size: 48px; color: #cbd5e1; display: block; margin-bottom: 16px;"></i>
              <p>No photos published in the gallery yet.</p>
            </div>
          }
        </div>

      </div>
    </div>

    <!-- Premium Custom Lightbox Overlay with Previous/Next Controls -->
    @if (selectedIdx() !== -1) {
      <div class="lightbox-overlay" (click)="closeLightbox()">
        
        <!-- Previous Nav Button -->
        <button class="lightbox-nav-btn prev-btn" (click)="prevImage($event)" aria-label="Previous image">
          <i class="pi pi-chevron-left"></i>
        </button>

        <div class="lightbox-content" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="closeLightbox()">
            <i class="pi pi-times"></i>
          </button>
          
          <div class="lightbox-img-box">
            <img [src]="activeItem()?.image?.secure_url" [alt]="activeItem()?.title" class="lightbox-img">
          </div>
          
          <div class="lightbox-caption">
            <span class="caption-tag">{{ getTag(activeItem()?.category) }}</span>
            <h3>{{ activeItem()?.title }}</h3>
            <p class="caption-desc" *ngIf="activeItem()?.description">{{ activeItem()?.description }}</p>
            <span class="caption-date" *ngIf="activeItem()?.createdAt">
              Uploaded on {{ activeItem()?.createdAt | date:'dd MMMM yyyy' }}
            </span>
          </div>
        </div>

        <!-- Next Nav Button -->
        <button class="lightbox-nav-btn next-btn" (click)="nextImage($event)" aria-label="Next image">
          <i class="pi pi-chevron-right"></i>
        </button>

      </div>
    }

    <app-footer></app-footer>
  `,
  styles: [`
    /* ── Hero ── */
    .page-hero {
      margin-top: 80px;
      background: radial-gradient(circle at top right, rgba(15, 118, 110, 0.15) 0%, transparent 60%), linear-gradient(135deg, #051c3c 0%, #0c356a 100%);
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
      font-family: 'Poppins', sans-serif;
      font-size: clamp(28px, 5vw, 46px);
      font-weight: 700; color: #ffffff; margin: 0 0 16px;
    }
    .page-hero p { font-size: 16px; color: rgba(255,255,255,0.82); line-height: 1.7; margin: 0; }

    /* ── Section Wrapper ── */
    .page-section { background: #F8FAFC; padding: 64px 24px 80px; }
    .page-container { max-width: 1400px; margin: 0 auto; }

    /* ── CSS Masonry Grid ── */
    .gallery-masonry {
      column-count: 4;
      column-gap: 24px;
      width: 100%;
    }
    @media (max-width: 1200px) {
      .gallery-masonry {
        column-count: 3;
      }
    }
    @media (max-width: 991px) {
      .gallery-masonry {
        column-count: 2;
      }
    }
    @media (max-width: 575px) {
      .gallery-masonry {
        column-count: 1;
      }
    }

    /* ── Gallery Card Item ── */
    .gallery-item {
      break-inside: avoid;
      position: relative;
      overflow: hidden;
      border-radius: 14px;
      cursor: pointer;
      margin-bottom: 24px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.05);
      background: #ffffff;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .gallery-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    }
    
    ::ng-deep .gallery-img {
      width: 100% !important;
      height: auto !important;
      display: block !important;
      object-fit: cover !important;
      border-radius: 14px;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .gallery-item:hover ::ng-deep .gallery-img {
      transform: scale(1.05);
    }

    /* Overlay styles */
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(4, 26, 61, 0.9) 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: flex-start;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 14px;
    }
    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }
    .zoom-icon {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 16px;
      color: #D4AF37;
      background: rgba(4, 26, 61, 0.6);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .gallery-info h4 {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 6px;
    }
    .gallery-date {
      font-size: 11.5px;
      color: #cbd5e1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* ── Empty State ── */
    .gallery-empty {
      column-span: all;
      text-align: center;
      padding: 80px 24px;
      color: #64748B;
    }

    /* ── Skeletons ── */
    .gallery-item-skeleton {
      break-inside: avoid;
      margin-bottom: 24px;
      background: #ffffff;
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.05);
    }
    .skeleton-meta {
      margin-top: 14px;
    }

    /* ── Premium Lightbox ── */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      z-index: 20000;
      background: rgba(4, 18, 38, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      backdrop-filter: blur(8px);
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .lightbox-content {
      position: relative;
      max-width: 900px;
      width: 100%;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .lightbox-img-box {
      background: #041226;
      display: flex;
      align-items: center;
      justify-content: center;
      max-height: 65vh;
      overflow: hidden;
    }
    .lightbox-img {
      max-width: 100%;
      max-height: 65vh;
      display: block;
      object-fit: contain;
    }

    .lightbox-caption {
      padding: 24px 30px;
      background: #ffffff;
    }
    .caption-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #D4AF37;
      display: block;
      margin-bottom: 6px;
    }
    .lightbox-caption h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #082B5C;
      margin: 0 0 8px;
    }
    .caption-desc {
      font-size: 14.5px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 12px;
    }
    .caption-date {
      font-size: 12px;
      color: #94a3b8;
      display: block;
    }

    .lightbox-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(4, 18, 38, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      z-index: 10;
    }
    .lightbox-close:hover {
      background: rgba(4, 18, 38, 0.8);
      transform: scale(1.05);
    }

    /* Lightbox Navigation Buttons */
    .lightbox-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.1);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.25s ease;
      z-index: 20010;
      backdrop-filter: blur(4px);
    }
    .lightbox-nav-btn:hover {
      background: #ffffff;
      color: #041226;
      border-color: #ffffff;
      box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
    }
    .prev-btn { left: 40px; }
    .next-btn { right: 40px; }

    @media (max-width: 768px) {
      .lightbox-nav-btn {
        width: 44px;
        height: 44px;
        font-size: 16px;
      }
      .prev-btn { left: 10px; }
      .next-btn { right: 10px; }
      .lightbox-content {
        max-width: 95%;
      }
      .lightbox-caption {
        padding: 16px 20px;
      }
      .lightbox-caption h3 {
        font-size: 17px;
      }
    }
  `]
})
export class GalleryComponent implements OnInit, OnDestroy {
  private galleryService = inject(GalleryService);

  selectedIdx = signal<number>(-1);
  galleryItems = signal<any[]>([]);
  loading = signal<boolean>(true);

  activeItem = computed(() => {
    const idx = this.selectedIdx();
    return idx !== -1 ? this.galleryItems()[idx] : null;
  });

  ngOnInit(): void {
    this.galleryService.getItems().subscribe({
      next: (data) => {
        // filter out any soft deleted items
        const active = (data || []).filter((i: any) => !i.isDeleted && i.status === 'Published');
        this.galleryItems.set(active);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openLightbox(idx: number): void {
    this.selectedIdx.set(idx);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.selectedIdx.set(-1);
    document.body.style.overflow = '';
  }

  prevImage(event?: Event): void {
    if (event) event.stopPropagation();
    const len = this.galleryItems().length;
    if (len === 0) return;
    this.selectedIdx.update(idx => idx > 0 ? idx - 1 : len - 1);
  }

  nextImage(event?: Event): void {
    if (event) event.stopPropagation();
    const len = this.galleryItems().length;
    if (len === 0) return;
    this.selectedIdx.update(idx => idx < len - 1 ? idx + 1 : 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (this.selectedIdx() !== -1) {
      if (event.key === 'ArrowLeft') this.prevImage();
      if (event.key === 'ArrowRight') this.nextImage();
      if (event.key === 'Escape') this.closeLightbox();
    }
  }

  getTag(category: string): string {
    if (category === 'inclusion') return 'Financial Inclusion';
    if (category === 'meeting') return 'Official Assembly';
    if (category === 'training') return 'Workshop & Training';
    return 'BCAR Media';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
