import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Imports
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Tag } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';

// Services
import { GalleryService } from '../../../core/services/gallery.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-gallery-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Dialog,
    Select,
    InputText,
    TooltipModule,
    Tag
  ],
  templateUrl: './gallery-management.html',
  styleUrls: ['./gallery-management.css']
})
export class GalleryManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private galleryService = inject(GalleryService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // Signals
  allItems = signal<any[]>([]);
  filteredItems = signal<any[]>([]);
  loading = signal<boolean>(false);
  dialogVisible = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // States
  galleryForm!: FormGroup;
  selectedItem: any | null = null;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  busy = false;

  // Search & Filter
  searchQuery = '';
  selectedCategory = 'all';
  currentPage = 1;
  pageSize = 6;

  // Dropdown Options
  filterCategories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Financial Inclusion', value: 'inclusion' },
    { label: 'Official Assemblies', value: 'meeting' },
    { label: 'Workshops & Training', value: 'training' }
  ];

  formCategories = [
    { label: 'Financial Inclusion', value: 'inclusion' },
    { label: 'Official Assemblies', value: 'meeting' },
    { label: 'Workshops & Training', value: 'training' }
  ];

  statusOptions = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Published', value: 'Published' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadItems();
  }

  private initForm(): void {
    this.galleryForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['inclusion', Validators.required],
      description: [''],
      displayOrder: [0],
      status: ['Published', Validators.required],
      featured: [false]
    });
  }

  loadItems(): void {
    this.loading.set(true);
    this.galleryService.getItems().subscribe({
      next: (data) => {
        this.allItems.set(data);
        this.filterItems();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load gallery items.', 'Error');
        this.loading.set(false);
      }
    });
  }

  filterItems(): void {
    let items = this.allItems();

    // Category Filter
    if (this.selectedCategory !== 'all') {
      items = items.filter(item => item.category === this.selectedCategory);
    }

    // Search Query Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(item => 
        (item.title || '').toLowerCase().includes(q) || 
        (item.description || '').toLowerCase().includes(q)
      );
    }

    this.filteredItems.set(items);
    this.currentPage = 1; // Reset to page 1
  }

  // Pagination getters & methods
  get totalPages(): number {
    return Math.ceil(this.filteredItems().length / this.pageSize);
  }

  paginatedItems(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // Image upload handling
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (500 KB limit)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      this.toast.error('Image exceeds 500 KB size limit.', 'Validation Failed');
      return;
    }

    // Validate type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.toast.error('Unsupported format. Please upload JPG, PNG or WEBP.', 'Validation Failed');
      return;
    }

    this.selectedFile = file;

    // Generate Preview URL
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
    this.toast.success('Image selected successfully.', 'Image Uploaded');
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  // Dialog actions
  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedItem = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.galleryForm.reset({
      category: 'inclusion',
      displayOrder: 0,
      status: 'Published',
      featured: false
    });
    this.dialogVisible.set(true);
  }

  openEditDialog(item: any): void {
    this.isEditMode.set(true);
    this.selectedItem = item;
    this.selectedFile = null;
    this.imagePreviewUrl = item.image?.secure_url || null;
    
    this.galleryForm.patchValue({
      title: item.title,
      category: item.category,
      description: item.description,
      displayOrder: item.displayOrder,
      status: item.status,
      featured: item.featured
    });
    
    this.dialogVisible.set(true);
  }

  onSubmit(): void {
    if (this.galleryForm.invalid || this.busy) return;
    
    // Build FormData
    const formData = new FormData();
    formData.append('title', this.galleryForm.get('title')?.value);
    formData.append('category', this.galleryForm.get('category')?.value);
    formData.append('description', this.galleryForm.get('description')?.value || '');
    formData.append('displayOrder', this.galleryForm.get('displayOrder')?.value || 0);
    formData.append('status', this.galleryForm.get('status')?.value);
    formData.append('featured', this.galleryForm.get('featured')?.value ? 'true' : 'false');
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.busy = true;

    if (this.isEditMode()) {
      // Edit mode
      this.galleryService.updateItem(this.selectedItem._id, formData).subscribe({
        next: (res) => {
          this.toast.success('Gallery image updated successfully.', 'Gallery Updated');
          this.busy = false;
          this.dialogVisible.set(false);
          this.loadItems();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update image.', 'Error');
          this.busy = false;
        }
      });
    } else {
      // Create mode
      if (!this.selectedFile) {
        this.toast.error('Please select an image file.', 'Validation Failed');
        this.busy = false;
        return;
      }

      this.galleryService.createItem(formData).subscribe({
        next: (res) => {
          this.toast.success('Gallery image uploaded successfully.', 'Gallery Created');
          this.busy = false;
          this.dialogVisible.set(false);
          this.loadItems();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to upload image.', 'Error');
          this.busy = false;
        }
      });
    }
  }

  confirmDelete(item: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary' },
      accept: () => {
        this.galleryService.deleteItem(item._id).subscribe({
          next: () => {
            this.toast.success('Gallery image deleted successfully.', 'Gallery Deleted');
            this.loadItems();
          },
          error: (err) => {
            this.toast.error('Failed to delete gallery image.', 'Error');
          }
        });
      }
    });
  }

  getItemImageUrl(item: any): string {
    if (!item) return '/images/bcar-logo-official.jpg';
    let url = item.image?.secure_url || item.image?.url || item.imageUrl;
    if (!url && typeof item.image === 'string') {
      url = item.image;
    }
    if (!url || typeof url !== 'string' || !url.trim()) {
      return '/images/bcar-logo-official.jpg';
    }
    if (url.includes('amazonaws.com') && (item.image?.key || item.image?.public_id)) {
      const key = item.image.key || item.image.public_id;
      return `/api/media/${key}`;
    }
    return url;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('bcar-logo-official.jpg')) {
      img.src = '/images/bcar-logo-official.jpg';
    }
  }
}
