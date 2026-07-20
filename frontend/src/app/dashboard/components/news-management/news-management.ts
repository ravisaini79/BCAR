import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Tag } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { Editor } from 'primeng/editor';

// Services
import { NewsService } from '../../../core/services/news.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Dialog,
    Select,
    InputText,
    Textarea,
    TooltipModule,
    Tag,
    Editor
  ],
  templateUrl: './news-management.html',
  styleUrls: ['./news-management.css']
})
export class NewsManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private newsService = inject(NewsService);
  private toast = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  // Signals
  allItems = signal<any[]>([]);
  filteredItems = signal<any[]>([]);
  loading = signal<boolean>(false);
  dialogVisible = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // States
  newsForm!: FormGroup;
  selectedItem: any | null = null;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  slugPreview = '';
  busy = false;

  // Search & Filter
  searchQuery = '';
  selectedCategory = 'all';

  // Dropdown Options
  filterCategories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Circulars', value: 'circular' },
    { label: 'Policy Updates', value: 'policy' },
    { label: 'Events', value: 'event' },
    { label: 'Alerts', value: 'alert' }
  ];

  formCategories = [
    { label: 'Circular', value: 'circular' },
    { label: 'Policy Update', value: 'policy' },
    { label: 'Event', value: 'event' },
    { label: 'Alert', value: 'alert' }
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
    this.newsForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(150)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(300)]],
      fullDescription: ['', Validators.required],
      category: ['circular', Validators.required],
      publishDate: [this.getTodayString(), Validators.required],
      status: ['Draft', Validators.required],
      featured: [false],
      pinned: [false]
    });
  }

  private getTodayString(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  loadItems(): void {
    this.loading.set(true);
    this.newsService.getArticles().subscribe({
      next: (data) => {
        this.allItems.set(data);
        this.filterItems();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to load news articles.', 'Error');
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
        (item.shortDescription || '').toLowerCase().includes(q) ||
        (item.fullDescription || '').toLowerCase().includes(q)
      );
    }

    this.filteredItems.set(items);
  }

  // Slug Generation
  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start
      .replace(/-+$/, '');            // Trim - from end
  }

  onTitleChange(): void {
    const titleVal = this.newsForm.get('title')?.value || '';
    this.slugPreview = this.slugify(titleVal);
  }

  // Image upload handling
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (500 KB limit)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      this.toast.error('Featured image exceeds 500 KB size limit.', 'Validation Failed');
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
    this.toast.success('Featured image selected successfully.', 'Image Uploaded');
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
    this.slugPreview = '';
    
    this.newsForm.reset({
      category: 'circular',
      publishDate: this.getTodayString(),
      status: 'Draft',
      featured: false,
      pinned: false
    });
    
    this.dialogVisible.set(true);
  }

  openEditDialog(item: any): void {
    this.isEditMode.set(true);
    this.selectedItem = item;
    this.selectedFile = null;
    this.imagePreviewUrl = item.featuredImage?.secure_url || null;
    this.slugPreview = item.slug;

    // Format Date string for HTML Date input (yyyy-MM-dd)
    let dateStr = this.getTodayString();
    if (item.publishDate) {
      const date = new Date(item.publishDate);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      dateStr = `${yyyy}-${mm}-${dd}`;
    }
    
    this.newsForm.patchValue({
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      category: item.category,
      publishDate: dateStr,
      status: item.status,
      featured: item.featured,
      pinned: item.pinned
    });
    
    this.dialogVisible.set(true);
  }

  onSubmit(): void {
    if (this.newsForm.invalid || this.busy) return;
    
    // Build FormData
    const formData = new FormData();
    formData.append('title', this.newsForm.get('title')?.value);
    formData.append('shortDescription', this.newsForm.get('shortDescription')?.value);
    formData.append('fullDescription', this.newsForm.get('fullDescription')?.value);
    formData.append('category', this.newsForm.get('category')?.value);
    formData.append('publishDate', this.newsForm.get('publishDate')?.value);
    formData.append('status', this.newsForm.get('status')?.value);
    formData.append('featured', this.newsForm.get('featured')?.value ? 'true' : 'false');
    formData.append('pinned', this.newsForm.get('pinned')?.value ? 'true' : 'false');
    
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.busy = true;

    if (this.isEditMode()) {
      // Edit mode
      this.newsService.updateArticle(this.selectedItem._id, formData).subscribe({
        next: (res) => {
          this.toast.success('News article updated successfully.', 'News Updated');
          this.busy = false;
          this.dialogVisible.set(false);
          this.loadItems();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update article.', 'Error');
          this.busy = false;
        }
      });
    } else {
      // Create mode
      if (!this.selectedFile) {
        this.toast.error('Please select a featured image file.', 'Validation Failed');
        this.busy = false;
        return;
      }

      this.newsService.createArticle(formData).subscribe({
        next: (res) => {
          this.toast.success('News article published successfully.', 'News Published');
          this.busy = false;
          this.dialogVisible.set(false);
          this.loadItems();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to publish article.', 'Error');
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
        this.newsService.deleteArticle(item._id).subscribe({
          next: () => {
            this.toast.success('News article deleted successfully.', 'News Deleted');
            this.loadItems();
          },
          error: (err) => {
            this.toast.error('Failed to delete news article.', 'Error');
          }
        });
      }
    });
  }

  getArticleImageUrl(item: any): string {
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
