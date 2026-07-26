import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  http = inject(HttpClient);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  busy = false;
  toast = '';
  toastType: 'success'|'error' = 'success';
  showPassword = false;
  login = { email: '', password: '' };
  mode: 'login' | 'forgot' = 'login';
  forgotEmail = '';

  show(message: string, type: 'success'|'error' = 'success') {
    this.toast = message;
    this.toastType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 5000);
  }

  submitForgotPassword() {
    if (!this.forgotEmail) {
      this.show('Please enter your email address', 'error');
      return;
    }
    this.busy = true;
    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email: this.forgotEmail }).subscribe({
      next: response => {
        this.busy = false;
        this.show(response.message || 'A temporary password has been successfully sent to your registered email address.', 'success');
        this.mode = 'login';
        this.forgotEmail = '';
      },
      error: error => {
        this.busy = false;
        const msg = error instanceof HttpErrorResponse
          ? (error.error?.message || 'No account found with this email address')
          : (error.message || 'No account found with this email address');
        this.show(msg, 'error');
      }
    });
  }

  submitLogin() {
    this.busy = true;
    this.http.post<any>(`${environment.apiUrl}/auth/login`, this.login).subscribe({
      next: response => {
        this.busy = false;

        const token = response.token || response.data?.token;
        const userObj = { ...(response.data || {}), ...response };
        delete userObj.token;
        delete userObj.data;

        if (!token) {
          this.show('Login failed: no token received', 'error');
          return;
        }

        localStorage.setItem('bcar_token', token);
        localStorage.setItem('bcar_user', JSON.stringify(userObj));
        this.router.navigate(['/dashboard']);
      },
      error: error => {
        this.busy = false;
        const msg = error instanceof HttpErrorResponse
          ? (error.error?.message || 'Invalid email or password')
          : 'Login failed. Please try again.';
        this.show(msg, 'error');
      }
    });
  }

}
