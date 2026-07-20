import { Injectable, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterApiService } from '../core/api/register-api.service';
import { ToastService } from '../core/services/toast.service';
import { ErrorHandlerService } from '../core/services/error-handler.service';
import { CustomValidators } from '../core/validators/custom-validators';
import { UploadService, UploadFieldName } from './upload.service';

@Injectable({
  providedIn: 'root'
})
export class RegisterBusinessService {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private api = inject(RegisterApiService);
  private toast = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);
  readonly upload = inject(UploadService);

  // UI State Signals
  submitting = signal<boolean>(false);
  dragOverField = signal<string>('');
  districtSearchText = signal<string>('');
  districtDropdownOpen = signal<boolean>(false);

  readonly districts = signal<string[]>([
    'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh',
    'Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar',
    'Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur',
    'Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'
  ]);

  /** Computed: filtered district list based on search input */
  readonly filteredDistricts = computed(() => {
    const search = this.districtSearchText().toLowerCase().trim();
    const all = this.districts();
    return search ? all.filter(d => d.toLowerCase().includes(search)) : all;
  });

  /** Build the reactive registration FormGroup */
  createForm(): FormGroup {
    const form = this.fb.group({
      // Personal
      name:                     ['', [Validators.required, Validators.minLength(2)]],
      fatherHusbandName:        [''],
      dob:                      [''],
      gender:                   [''],
      maritalStatus:            [''],
      wifeHusbandName:          [''],
      childrenSon:              [0,  [Validators.min(0)]],
      childrenDaughter:         [0,  [Validators.min(0)]],
      educationalQualification: [''],
      bloodGroup:               [''],
      // Mandatory Aadhaar Number (12 digits)
      aadhaarNumber:            ['', [Validators.required, CustomValidators.aadhaarPattern()]],
      // Contact
      email:    ['', [Validators.required, Validators.email]],
      phone:    ['', [Validators.required, CustomValidators.phonePattern()]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Address
      homeAddressVill: ['', Validators.required],
      po:              [''],
      ps:              [''],
      district:        ['', Validators.required],
      pin:             ['', [CustomValidators.pinPattern()]],
      gramPanchayat:   [''],
      devBlock:        [''],
      subDistrict:     [''],
      // Professional
      bcCspIdNo:          [''],
      ssa:                [''],
      bankName:           [''],
      linkBranchName:     [''],
      dateOfStartingCsp:  [''],
      // Membership
      interestedToJoin:       ['YES', Validators.required],
      // Declaration
      declarationAccepted: [false, Validators.requiredTrue],
      
      // Mandatory Document Attachments
      profileImage:      [null, Validators.required],
      photograph:        [null, Validators.required],
      aadhaarCard:       [null, Validators.required],
      aadhaarBack:       [null],
      panCard:           [null, Validators.required],
      bankBcCertificate: [null, Validators.required],
    });

    return form;
  }

  // ── Draft persistence ──────────────────────────────────────────────────────

  loadDraft(form: FormGroup): void {
    try {
      const raw = localStorage.getItem('bcar_registration_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Patch text fields
      const textData = { ...parsed };
      (['profileImage', 'photograph', 'aadhaarCard', 'aadhaarBack', 'panCard', 'bankBcCertificate'] as UploadFieldName[]).forEach(k => {
        delete textData[k];
      });
      form.patchValue(textData, { emitEvent: false });

      // Restore base64 previews and display names
      const nameUpdates: Partial<Record<string, string>> = {};
      if (parsed.profileImage)      { form.get('profileImage')?.setValue(parsed.profileImage, { emitEvent: false });           nameUpdates['profileImageName']      = 'Profile_Image_Restored.jpg'; }
      if (parsed.photograph)        { form.get('photograph')?.setValue(parsed.photograph, { emitEvent: false });               nameUpdates['photographName']        = 'Photograph_Restored.jpg'; }
      if (parsed.aadhaarCard)       { form.get('aadhaarCard')?.setValue(parsed.aadhaarCard, { emitEvent: false });             nameUpdates['aadhaarCardName']       = 'Aadhaar_Restored.pdf'; }
      if (parsed.panCard)           { form.get('panCard')?.setValue(parsed.panCard, { emitEvent: false });                     nameUpdates['panCardName']           = 'PAN_Restored.pdf'; }
      if (parsed.bankBcCertificate) { form.get('bankBcCertificate')?.setValue(parsed.bankBcCertificate, { emitEvent: false }); nameUpdates['bankBcCertificateName'] = 'BC_Certificate_Restored.pdf'; }

      if (Object.keys(nameUpdates).length) {
        this.upload.fileNames.update(n => ({ ...n, ...nameUpdates }));
      }
    } catch (e) {
      console.error('[Draft] Load error:', e);
    }
  }

  saveDraft(form: FormGroup): void {
    try {
      localStorage.setItem('bcar_registration_draft', JSON.stringify(form.value));
      this.toast.success('Draft saved successfully!', 'Saved');
    } catch (e) {
      this.toast.error('Failed to save draft.', 'Error');
    }
  }

  autoSave(form: FormGroup): void {
    try {
      localStorage.setItem('bcar_registration_draft', JSON.stringify(form.value));
    } catch { /* silently swallow */ }
  }

  clearDraft(): void {
    localStorage.removeItem('bcar_registration_draft');
  }

  // ── District dropdown ──────────────────────────────────────────────────────

  selectDistrict(dist: string, form: FormGroup): void {
    form.get('district')?.setValue(dist);
    form.get('district')?.markAsTouched();
    this.districtSearchText.set('');
    this.districtDropdownOpen.set(false);
  }

  // ── Scroll to first invalid ────────────────────────────────────────────────

  scrollToFirstInvalid(): void {
    const el = document.querySelector('form .ng-invalid') as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el.querySelector('input, select, textarea') as HTMLElement | null)?.focus();
  }

  // ── Form Submission ────────────────────────────────────────────────────────

  submitForm(form: FormGroup): void {
    this.submitting.set(true);

    const formData = new FormData();

    // Append all text controls
    Object.keys(form.controls).forEach(key => {
      if (!['profileImage', 'photograph', 'aadhaarCard', 'aadhaarBack', 'panCard', 'bankBcCertificate'].includes(key)) {
        formData.append(key, form.get(key)?.value ?? '');
      }
    });

    // Append file fields via UploadService
    this.upload.appendFileToFormData(formData, 'profileImage',      form, 'profile_image_draft.jpg', 'image/jpeg');
    this.upload.appendFileToFormData(formData, 'photograph',        form, 'photograph_draft.jpg',  'image/jpeg');
    this.upload.appendFileToFormData(formData, 'aadhaarCard',       form, 'aadhaar_front_draft.pdf', 'application/pdf');
    this.upload.appendFileToFormData(formData, 'aadhaarBack',       form, 'aadhaar_back_draft.pdf',  'application/pdf');
    this.upload.appendFileToFormData(formData, 'panCard',           form, 'pan_draft.pdf',         'application/pdf');
    this.upload.appendFileToFormData(formData, 'bankBcCertificate', form, 'bc_cert_draft.pdf',     'application/pdf');

    this.api.registerMember(formData).subscribe({
      next: res => {
        this.submitting.set(false);
        this.toast.success(
          'Your registration has been submitted successfully. A confirmation email along with your ₹700 fee receipt (₹100 Registration + ₹600 Membership) has been sent to your registered email address.',
          'Registration Successful'
        );

        form.reset({ interestedToJoin: 'YES', declarationAccepted: false });
        this.upload.resetAll(form);
        this.clearDraft();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Redirect to success page
        setTimeout(() => this.router.navigate(['/register-success'], {
          state: {
            registrationNumber: res.registrationNumber,
            receiptNumber: res.receiptNumber,
            emailSent: res.emailSent,
            receiptGenerated: res.receiptGenerated
          }
        }), 800);
      },
      error: err => {
        this.submitting.set(false);
        this.errorHandler.handleError(err);
      }
    });
  }
}
