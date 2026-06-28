import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('bcar_token');

  // Only attach headers to requests targeting our configured API
  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('/api/');
  
  let authReq = req;
  if (token && isApiUrl) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error instanceof HttpErrorResponse) {
        // Handle unauthorized errors centrally (e.g., token expired or invalid)
        if (error.status === 401) {
          console.warn('Unauthorized or expired session. Logging out user...');
          localStorage.removeItem('bcar_token');
          localStorage.removeItem('bcar_user');
          toast.error('Session expired or unauthorized. Please login again.', 'Session Expired');
          router.navigate(['/login']);
        } else {
          // Log other HTTP errors
          const errMsg = error.error?.message || error.statusText || 'An unexpected error occurred';
          console.error(`HTTP Error (${error.status}):`, errMsg);
        }
      }
      return throwError(() => error);
    })
  );
};
