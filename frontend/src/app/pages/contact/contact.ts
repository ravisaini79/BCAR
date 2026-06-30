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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    // Simulate API call – wire to real endpoint if available
    setTimeout(() => {
      this.submitting = false;
      this.successMsg = '✓ Thank you! Your message has been sent. We will get back to you shortly.';
      this.form = { name: '', email: '', phone: '', message: '' };
    }, 1000);
  }
}
