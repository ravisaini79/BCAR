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
import { UploadService, UploadFieldName } from './upload.service';
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
        this.registerForm.get('profileImage')?.setValue(dataUrl);
        this.registerForm.get('profileImage')?.markAsTouched();
        this.upload.fileNames.update(names => ({ ...names, profileImageName: 'profile_capture.jpg' }));
      }
    }
    this.stopCamera();
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
      this.upload.processFile(file, fieldName, this.registerForm);
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
