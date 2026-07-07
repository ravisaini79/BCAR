import { Injectable, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastService } from '../core/services/toast.service';
import { inject } from '@angular/core';

export type UploadFieldName = 'profileImage' | 'photograph' | 'aadhaarCard' | 'panCard' | 'bankBcCertificate';

export interface FileMetadata {
  profileImageName: string;
  photographName: string;
  aadhaarCardName: string;
  panCardName: string;
  bankBcCertificateName: string;
}

export interface RawFileStore {
  profileImage: File | null;
  photograph: File | null;
  aadhaarCard: File | null;
  panCard: File | null;
  bankBcCertificate: File | null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private toast = inject(ToastService);

  fileNames = signal<FileMetadata>({
    profileImageName: '',
    photographName: '',
    aadhaarCardName: '',
    panCardName: '',
    bankBcCertificateName: ''
  });

  rawFiles = signal<RawFileStore>({
    profileImage: null,
    photograph: null,
    aadhaarCard: null,
    panCard: null,
    bankBcCertificate: null
  });

  /**
   * Validate and process a single file for a given field
   */
  processFile(file: File, fieldName: UploadFieldName, form: FormGroup): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.toast.error(`Unsupported file type. Please upload PDF, JPG or PNG.`, 'Invalid File Type');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.toast.warning(`File exceeds ${MAX_SIZE_MB}MB size limit.`, 'File Too Large');
      return;
    }

    // Store raw binary
    this.rawFiles.update(raw => ({ ...raw, [fieldName]: file }));

    // Store preview name
    const nameKey = `${fieldName}Name` as keyof FileMetadata;
    this.fileNames.update(names => ({ ...names, [nameKey]: file.name }));

    // Generate base64 preview for images; use filename for documents
    const reader = new FileReader();
    reader.onload = () => {
      form.get(fieldName)?.setValue(reader.result as string);
      form.get(fieldName)?.markAsTouched();
    };
    reader.onerror = () => {
      this.toast.error('Failed to read file.', 'File Error');
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove file and reset form control
   */
  removeFile(fieldName: UploadFieldName, form: FormGroup): void {
    form.get(fieldName)?.setValue(null);
    form.get(fieldName)?.markAsUntouched();

    this.rawFiles.update(raw => ({ ...raw, [fieldName]: null }));
    const nameKey = `${fieldName}Name` as keyof FileMetadata;
    this.fileNames.update(names => ({ ...names, [nameKey]: '' }));
  }

  /**
   * Reset all file state after form submission
   */
  resetAll(form: FormGroup): void {
    (['profileImage', 'photograph', 'aadhaarCard', 'panCard', 'bankBcCertificate'] as UploadFieldName[]).forEach(field => {
      form.get(field)?.setValue(null);
      form.get(field)?.markAsUntouched();
    });
    this.rawFiles.set({ profileImage: null, photograph: null, aadhaarCard: null, panCard: null, bankBcCertificate: null });
    this.fileNames.set({ profileImageName: '', photographName: '', aadhaarCardName: '', panCardName: '', bankBcCertificateName: '' });
  }

  /**
   * Convert base64 string to Blob for FormData submission
   */
  base64ToBlob(base64Data: string, contentType = '', sliceSize = 512): Blob {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays: BlobPart[] = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = Array.from({ length: slice.length }, (_, i) => slice.charCodeAt(i));
      byteArrays.push(new Uint8Array(byteNumbers).buffer);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  /**
   * Append a file field to FormData — uses raw File or converts base64 blob
   */
  appendFileToFormData(
    formData: FormData,
    fieldName: UploadFieldName,
    form: FormGroup,
    fallbackName: string,
    fallbackMime: string
  ): void {
    const raw = this.rawFiles();
    const rawFile = raw[fieldName];

    if (rawFile) {
      formData.append(fieldName, rawFile, rawFile.name);
    } else {
      const val = form.get(fieldName)?.value;
      if (val && typeof val === 'string' && val.startsWith('data:')) {
        const mime = val.match(/^data:(.*);base64,/)?.[1] || fallbackMime;
        formData.append(fieldName, this.base64ToBlob(val, mime), fallbackName);
      }
    }
  }
}
