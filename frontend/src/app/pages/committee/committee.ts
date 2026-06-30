import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './committee.html',
  styleUrls: ['./committee.css']
})
export class CommitteeComponent {
  committee = [
    {
      name: 'अमर चंद शर्मा',
      nameEn: 'Amar Chand Sharma',
      photo: '/images/secretary.jpg',
      role: 'प्रदेश महामंत्री',
      roleEn: 'General Secretary',
      location: 'कंचनपुर, राजस्थान',
      quote: 'दुनिया की सबसे असरदार दवा जिम्मेदारी है — एक बार उठाकर देखो, ना दर्द महसूस होगा।'
    },
    {
      name: 'प्रदीप भार्गव',
      nameEn: 'Pradeep Bhargava',
      photo: '/images/treasurer.png',
      role: 'प्रदेश कोषाध्यक्ष',
      roleEn: 'State Treasurer',
      location: 'कोटा, राजस्थान',
      quote: 'नेतृत्व का उद्देश्य है — जो अच्छा प्रदर्शन नहीं कर रहे उन्हें बेहतर बनाना और जो बेहतर हैं उन्हें और भी श्रेष्ठ बनाना।'
    }
  ];
}
