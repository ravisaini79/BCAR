import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header';
import { FooterComponent } from '../../layout/footer/footer';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './benefits.html',
  styleUrls: ['./benefits.css']
})
export class BenefitsComponent {
  benefits = [
    {
      num: '1',
      title: 'बिचौलिया प्रथा समाप्त हो',
      desc: 'समस्त बैंक मित्रों को सीधे से संबंधित बैंक से जोड़ा जाए, थर्ड पार्टी/कंपनी/BCNM/मिडलमैन व्यवस्था को पूर्णतः समाप्त किया जाए, ताकि शोषण रुके और पारदर्शिता आए!',
      icon: 'fa-solid fa-ban',
      colorClass: 'demand-red'
    },
    {
      num: '2',
      title: '₹5000 प्रोत्साहन राशि का तत्काल भुगतान',
      desc: 'माननीय प्रधानमंत्री जी द्वारा घोषित ₹5000 प्रति बैंक मित्र की प्रोत्साहन राशि (लगभग 7,20,000 रुपए/बैंक मित्र) को एकमुश्त एवं तत्काल दिया जाए!',
      icon: 'fa-solid fa-sack-dollar',
      colorClass: 'demand-green'
    },
    {
      num: '3',
      title: 'ड्यूटी के दौरान मृत्यु पर ₹50 लाख मुआवजा',
      desc: 'बैंकिंग कार्य के दौरान जिन बैंक मित्रों की मृत्यु हुई है या भविष्य में होगी, उनके परिवार को ₹50,00,000 (पचास लाख) की राहत राशि सुनिश्चित की जाए!',
      icon: 'fa-solid fa-helmet-safety',
      colorClass: 'demand-orange'
    },
    {
      num: '4',
      title: 'बिना ब्याज ₹5,00,000 कार्यशील पूंजी',
      desc: 'बैंक मित्रों को कियोस्क/बैंकिंग संचालन हेतु ₹5,00,000 तक की बिना ब्याज ऋण राशि दी जाए!',
      icon: 'fa-solid fa-building-columns',
      colorClass: 'demand-blue'
    },
    {
      num: '5',
      title: 'कमिशन दरों में महंगाई अनुसार वृद्धि',
      desc: 'वर्तमान महंगाई दर के अनुसार कमीशन संरचना में व्यापक वृद्धि की जाए तथा न्यूनतम गारंटीड कमीशन तय किया जाए!',
      icon: 'fa-solid fa-chart-line',
      colorClass: 'demand-green-dark'
    },
    {
      num: '6',
      title: '₹20,000 प्रतिमाह कियोस्क भत्ता',
      desc: 'किराया/रेंट, बिजली, इंटरनेट, स्टेशनरी, स्टाफ आदि हेतु ₹20,000 प्रतिमाह निश्चित भत्ता + कमीशन दिया जाए!',
      icon: 'fa-solid fa-store',
      colorClass: 'demand-purple'
    },
    {
      num: '7',
      title: 'बैंक द्वारा जीवन एवं धन बीमा',
      desc: 'बैंक मित्रों को जीवन बीमा व कैश/धन बीमा दिया जाए, जिसका प्रीमियम पूर्णतः बैंक द्वारा वहन किया जाए!',
      icon: 'fa-solid fa-shield-halved',
      colorClass: 'demand-blue-sky'
    },
    {
      num: '8',
      title: 'PF एवं पेंशन सुविधा',
      desc: 'बैंक मित्रों को PF, EPS एवं पेंशन योजना का लाभ दिया जाए, ठीक उसी प्रकार जैसे बैंक कर्मचारियों को मिलता है!',
      icon: 'fa-solid fa-file-invoice-dollar',
      colorClass: 'demand-indigo'
    },
    {
      num: '9',
      title: 'मेडिकल सुविधा एवं हेल्थ इंश्योरेंस',
      desc: 'बैंक मित्रों व उनके परिवार को कैशलेस मेडिकल सुविधा एवं हेल्थ इंश्योरेंस दिया जाए, सरकारी/बैंक कर्मचारियों के समकक्ष!',
      icon: 'fa-solid fa-user-doctor',
      colorClass: 'demand-teal'
    },
    {
      num: '10',
      title: 'Bank Mitra ID की कानूनी सुरक्षा',
      desc: 'बैंक मित्रों की डिजिटल ID व कानूनी रूप से सुरक्षित हो, बिना कारण ID सस्पेंड/DELETE  न की जाए और अपील प्रणाली लागू हो!',
      icon: 'fa-solid fa-id-card-clip',
      colorClass: 'demand-blue-navy'
    },
    {
      num: '11',
      title: 'बैंक मित्रों को अर्ध-कर्मचारी (Semi-Employee) का दर्जा',
      desc: 'बैंक मित्रों को बैंक का अर्ध-कर्मचारी (Semi-Employee) माना जाए और उन्हें सभी श्रम व सामाजिक सुरक्षा अधिकार दिये जाएं!',
      icon: 'fa-solid fa-user-tie',
      colorClass: 'demand-slate'
    }
  ];
}
