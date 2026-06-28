import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  http = inject(HttpClient);
  router = inject(Router);

  busy = false;
  toast = '';
  toastType: 'success'|'error' = 'success';
  login = { email: '', password: '' };

  show(message: string, type: 'success'|'error' = 'success') {
    this.toast = message;
    this.toastType = type;
    setTimeout(() => this.toast = '', 5000);
  }

  submitLogin() {
    this.busy = true;
    this.http.post<any>('/api/auth/login', this.login).subscribe({
      next: response => {
        this.busy = false;

        // Backend returns flat: { _id, name, email, role, token }
        const { token, ...user } = response;

        if (!token) {
          this.show('Login failed: no token received', 'error');
          return;
        }

        localStorage.setItem('bcar_token', token);
        localStorage.setItem('bcar_user', JSON.stringify(user));
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
