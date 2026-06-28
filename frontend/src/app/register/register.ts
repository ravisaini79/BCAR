import {
  Component, inject, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
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

  registerForm!: FormGroup;
  submitted = false;
  readonly today = new Date();


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

  ngOnDestroy(): void { /* cleanup handled by GC */ }

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
