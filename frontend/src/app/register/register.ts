import {
  Component, inject, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG Modules
import { InputTextModule }     from 'primeng/inputtext';
import { PasswordModule }      from 'primeng/password';
import { SelectModule }        from 'primeng/select';
import { DatePickerModule }    from 'primeng/datepicker';
import { CheckboxModule }      from 'primeng/checkbox';
import { ButtonModule }        from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule }       from 'primeng/divider';
import { TooltipModule }       from 'primeng/tooltip';
import { TagModule }           from 'primeng/tag';
import { FloatLabelModule }    from 'primeng/floatlabel';

// App
import { RegisterBusinessService } from './register-business.service';
import { UploadService, UploadFieldName, FileMetadata } from './upload.service';
import { HeaderComponent } from '../layout/header/header';
import { FooterComponent } from '../layout/footer/footer';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    HeaderComponent, FooterComponent,
    // PrimeNG
    InputTextModule, PasswordModule, SelectModule, DatePickerModule,
    CheckboxModule, ButtonModule, ProgressSpinnerModule,
    DividerModule, TooltipModule, TagModule, FloatLabelModule
  ],
  providers: [],   // MessageService provided at root in main.ts — do NOT re-provide here
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit, OnDestroy {
  readonly srv    = inject(RegisterBusinessService);
  readonly upload = inject(UploadService);
  readonly router = inject(Router);
  private  cdr    = inject(ChangeDetectorRef);
  private  sanitizer = inject(DomSanitizer);

  registerForm!: FormGroup;
  submitted = false;
  readonly today = new Date();

  // ── Document Preview Lightbox ──────────────────────────────────────────────
  previewUrl: string | null = null;
  previewUrlSafe: SafeResourceUrl | null = null;
  previewTitle = '';
  previewIsImage = true;

  viewUploadedFile(fieldName: UploadFieldName, title: string): void {
    const val = this.registerForm.get(fieldName)?.value;
    if (!val) return;

    this.previewTitle = title;
    this.previewUrl = val;
    if (val.startsWith('data:image') || val.startsWith('data:application/pdf') === false) {
      this.previewIsImage = true;
      this.previewUrlSafe = null;
    } else {
      this.previewIsImage = false;
      this.previewUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(val);
    }
    this.cdr.markForCheck();
  }

  closePreview(): void {
    this.previewUrl = null;
    this.previewUrlSafe = null;
    this.cdr.markForCheck();
  }

  // ── Camera / Webcam Handling ──────────────────────────────────────────────
  isCameraActive = false;
  private mediaStream: MediaStream | null = null;

  async startCamera(event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }
    this.isCameraActive = true;
    this.cdr.markForCheck();
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      setTimeout(() => {
        const videoEl = document.getElementById('camera-preview-video') as HTMLVideoElement | null;
        if (videoEl && this.mediaStream) {
          videoEl.srcObject = this.mediaStream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      this.isCameraActive = false;
      this.cdr.markForCheck();
      alert('Could not access camera. Please make sure permissions are granted.');
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
    this.cdr.markForCheck();
  }

  capturePhoto(): void {
    const videoEl = document.getElementById('camera-preview-video') as HTMLVideoElement | null;
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        this.openCropper(dataUrl, 'profileImage');
      }
    }
    this.stopCamera();
  }

  // ── Interactive Image Cropper ─────────────────────────────────────────────
  isCropping = false;
  cropperFieldName: UploadFieldName = 'profileImage';
  cropperImageSrc = '';
  cropperTitle = 'Crop Profile Photo';
  cropScale = 1;
  cropRotate = 0;
  cropOffsetX = 0;
  cropOffsetY = 0;
  isDraggingCropper = false;
  private dragStartX = 0;
  private dragStartY = 0;

  openCropper(dataUrl: string, fieldName: UploadFieldName = 'profileImage'): void {
    this.cropperFieldName = fieldName;
    this.cropperTitle = fieldName === 'photograph' ? 'Crop Passport Photograph' : 'Crop Profile Image';
    this.cropperImageSrc = dataUrl;
    this.cropScale = 1;
    this.cropRotate = 0;
    this.cropOffsetX = 0;
    this.cropOffsetY = 0;
    this.isCropping = true;
    this.cdr.markForCheck();
  }

  openCropperForField(fieldName: UploadFieldName): void {
    const val = this.registerForm.get(fieldName)?.value;
    if (val && typeof val === 'string' && val.startsWith('data:image')) {
      this.openCropper(val, fieldName);
    }
  }

  closeCropper(): void {
    this.isCropping = false;
    this.cropperImageSrc = '';
    this.cdr.markForCheck();
  }

  zoomInCropper(): void {
    this.cropScale = Math.min(3, +(this.cropScale + 0.15).toFixed(2));
    this.cdr.markForCheck();
  }

  zoomOutCropper(): void {
    this.cropScale = Math.max(0.5, +(this.cropScale - 0.15).toFixed(2));
    this.cdr.markForCheck();
  }

  rotateCropper(): void {
    this.cropRotate = (this.cropRotate + 90) % 360;
    this.cdr.markForCheck();
  }

  resetCropper(): void {
    this.cropScale = 1;
    this.cropRotate = 0;
    this.cropOffsetX = 0;
    this.cropOffsetY = 0;
    this.cdr.markForCheck();
  }

  startCropDrag(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDraggingCropper = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.dragStartX = clientX - this.cropOffsetX;
    this.dragStartY = clientY - this.cropOffsetY;
  }

  onCropDrag(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingCropper) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.cropOffsetX = clientX - this.dragStartX;
    this.cropOffsetY = clientY - this.dragStartY;
    this.cdr.markForCheck();
  }

  endCropDrag(): void {
    this.isDraggingCropper = false;
  }

  applyCrop(): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const outputCanvas = document.createElement('canvas');
      const size = 600;
      outputCanvas.width = size;
      outputCanvas.height = size;
      const ctx = outputCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size / 2 + this.cropOffsetX, size / 2 + this.cropOffsetY);
        ctx.rotate((this.cropRotate * Math.PI) / 180);
        ctx.scale(this.cropScale, this.cropScale);

        const aspect = img.width / img.height;
        let drawWidth = size;
        let drawHeight = size;
        if (aspect > 1) {
          drawHeight = size;
          drawWidth = size * aspect;
        } else {
          drawWidth = size;
          drawHeight = size / aspect;
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        const croppedDataUrl = outputCanvas.toDataURL('image/jpeg', 0.92);

        this.registerForm.get(this.cropperFieldName)?.setValue(croppedDataUrl);
        this.registerForm.get(this.cropperFieldName)?.markAsTouched();

        const nameKey = `${this.cropperFieldName}Name` as keyof FileMetadata;
        this.upload.fileNames.update(names => ({
          ...names,
          [nameKey]: `${this.cropperFieldName}_cropped.jpg`
        }));

        this.closeCropper();
      }
    };
    img.src = this.cropperImageSrc;
  }

  // District dropdown proxy (needed for ngModel binding in template)
  get districtSearchText(): string { return this.srv.districtSearchText(); }
  set districtSearchText(v: string) { this.srv.districtSearchText.set(v); }

  // Dropdown option lists
  readonly genderOptions  = [
    { label: 'Male',   value: 'Male'   },
    { label: 'Female', value: 'Female' },
    { label: 'Other',  value: 'Other'  }
  ];

  readonly maritalOptions = [
    { label: 'Married',   value: 'Married'   },
    { label: 'Unmarried', value: 'Unmarried' }
  ];

  readonly bloodGroupOptions = [
    { label: 'A+',  value: 'A+' },
    { label: 'A−',  value: 'A-' },
    { label: 'B+',  value: 'B+' },
    { label: 'B−',  value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB−', value: 'AB-' },
    { label: 'O+',  value: 'O+' },
    { label: 'O−',  value: 'O-' }
  ];

  readonly joinOptions = [
    { label: 'YES — I want to join as an active member', value: 'YES' },
    { label: 'NO — I do not wish to join currently',     value: 'NO'  }
  ];

  ngOnInit(): void {
    this.registerForm = this.srv.createForm();
    this.srv.loadDraft(this.registerForm);
    // Trigger CD after draft load since OnPush
    this.registerForm.valueChanges.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  saveDraft():   void { this.srv.saveDraft(this.registerForm); }
  autoSave():    void { this.srv.autoSave(this.registerForm);  }

  selectDistrict(dist: string): void {
    this.srv.selectDistrict(dist, this.registerForm);
    this.cdr.markForCheck();
  }

  // ── File handling ──────────────────────────────────────────────────────────

  onFileSelected(event: Event, fieldName: UploadFieldName): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) {
      if (fieldName === 'profileImage' || fieldName === 'photograph') {
        const reader = new FileReader();
        reader.onload = () => {
          this.openCropper(reader.result as string, fieldName);
        };
        reader.readAsDataURL(file);
      } else {
        this.upload.processFile(file, fieldName, this.registerForm);
      }
      this.cdr.markForCheck();
    }
    // Reset input so same file can be re-selected
    input.value = '';
  }

  openFilePicker(id: string): void {
    document.getElementById(id)?.click();
  }

  removeFile(fieldName: UploadFieldName): void {
    this.upload.removeFile(fieldName, this.registerForm);
    this.cdr.markForCheck();
  }

  onDragOver(event: DragEvent, fieldName: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.srv.dragOverField.set(fieldName);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.srv.dragOverField.set('');
  }

  onDrop(event: DragEvent, fieldName: UploadFieldName): void {
    event.preventDefault();
    event.stopPropagation();
    this.srv.dragOverField.set('');
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.upload.processFile(file, fieldName, this.registerForm);
      this.cdr.markForCheck();
    }
  }

  isImagePreview(value: string | null): boolean {
    return !!value && value.startsWith('data:image');
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submitRegistration(): void {
    this.submitted = true;
    this.registerForm.markAllAsTouched();
    this.cdr.markForCheck();

    if (this.registerForm.invalid) {
      this.srv.scrollToFirstInvalid();
      return;
    }

    this.srv.submitForm(this.registerForm);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  hasError(field: string, error?: string): boolean {
    const ctrl = this.registerForm.get(field);
    if (!ctrl) return false;
    const invalid = error ? ctrl.hasError(error) : ctrl.invalid;
    return invalid && (ctrl.touched || this.submitted);
  }

  trackByDistrict(_: number, d: string): string { return d; }
}
