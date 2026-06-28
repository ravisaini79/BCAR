import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private toast = inject(ToastService);

  /**
   * Handle Http and Application errors centrally
   * @param error - The error object to process
   */
  handleError(error: any): void {
    console.error('[Error Handler] Centralized exception caught:', error);

    if (error instanceof HttpErrorResponse) {
      const apiMsg = error.error?.message || error.error?.Message || '';
      
      if (error.status === 0) {
        this.toast.networkError();
      } else if (error.status === 400 && apiMsg.toLowerCase().includes('registered')) {
        this.toast.warning('You are already registered with this mobile or email. Please login.', 'Member Already Registered');
      } else if (error.status === 400) {
        this.toast.validationError(apiMsg || 'Invalid data submitted.');
      } else if (error.status === 500) {
        this.toast.error('An internal server error occurred. Please contact support.', 'Server Error');
      } else {
        this.toast.apiError(apiMsg || error.message);
      }
    } else {
      // Non-HTTP errors (application logic errors)
      const msg = error.message || 'An unexpected application error occurred.';
      this.toast.error(msg, 'Unexpected Exception');
    }
  }
}
