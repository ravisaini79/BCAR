import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
  imports: [CommonModule, DatePipe, RouterModule, HeaderComponent, FooterComponent, Image, Skeleton, ProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.html',
  styleUrls: ['./gallery.css']
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
        const active = (data || []).filter((i: any) => !i.isDeleted && i.status === 'Published');
        this.galleryItems.set(active);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
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
      if (event.key === 'ArrowLeft')  this.prevImage();
      if (event.key === 'ArrowRight') this.nextImage();
      if (event.key === 'Escape')     this.closeLightbox();
    }
  }

  getTag(category: string): string {
    if (category === 'inclusion') return 'Financial Inclusion';
    if (category === 'meeting')   return 'Official Assembly';
    if (category === 'training')  return 'Workshop & Training';
    return 'BCAR Media';
  }

  ngOnDestroy(): void { document.body.style.overflow = ''; }
}
