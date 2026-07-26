import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-registration-certificate',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './registration-certificate.html',
  styleUrls: ['./registration-certificate.css']
})
export class RegistrationCertificateComponent {
  printCertificate() {
    window.print();
  }
}
