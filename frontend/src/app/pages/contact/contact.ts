import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {
  private http = inject(HttpClient);

  form = { name: '', email: '', phone: '', message: '' };
  submitting = false;
  successMsg = '';

  submitForm() {
    this.submitting = true;
    this.successMsg = '';
    
    this.http.post<any>(`${environment.apiUrl}/public/contact`, this.form).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMsg = '✓ ' + (res.message || 'Thank you! Your message has been sent.');
        this.form = { name: '', email: '', phone: '', message: '' };
      },
      error: (err) => {
        this.submitting = false;
        console.error('Failed to submit contact query:', err);
        this.successMsg = '❌ Failed to send message. Please try again later.';
      }
    });
  }
}
