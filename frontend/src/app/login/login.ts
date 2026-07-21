import { Component, inject } from '@angular/core';
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
    this.http.post<any>(`${environment.apiUrl}/auth/login`, this.login).subscribe({
      next: response => {
        this.busy = false;

        const token = response.token || response.data?.token;
        const userObj = {
          _id: response._id || response.data?._id,
          name: response.name || response.data?.name,
          email: response.email || response.data?.email,
          role: response.role || response.data?.role,
          status: response.status || response.data?.status,
          district: response.district || response.data?.district
        };

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
