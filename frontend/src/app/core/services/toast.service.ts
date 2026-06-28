import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageService = inject(MessageService);

  success(message: string, title = 'Success'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  error(message: string, title = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000
    });
  }

  warning(message: string, title = 'Warning'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  info(message: string, title = 'Information'): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 4000
    });
  }

  apiError(message: string): void {
    this.error(message || 'An API error occurred.', 'Server Error');
  }

  validationError(message: string): void {
    this.warning(message || 'Please correct the validation errors.', 'Validation Failed');
  }

  networkError(): void {
    this.error('Network unreachable. Please verify your connection.', 'Connection Failure');
  }
}
