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
  showFullSecretaryQuote = false;

  toggleSecretaryQuote() {
    this.showFullSecretaryQuote = !this.showFullSecretaryQuote;
  }

  getTruncatedQuote(quote: string): string {
    const words = quote.split(/\s+/);
    if (words.length <= 50) return quote;
    return words.slice(0, 50).join(' ') + '...';
  }

  committee = [
    {
      name: 'अमर चंद शर्मा',
      nameEn: 'Amar Chand Sharma',
      photo: '/images/secretary.jpg',
      role: 'बैंक ऑफ बड़ौदा BC',
      roleEn: 'Bank of Baroda BC',
      location: 'कंचनपुर (सीकर), राजस्थान',
      isGeneralSecretary: true,
      quote: `आदरणीय अतिथियों, सम्मानित बैंक मित्रों/निर्णायकों और यहाँ उपस्थित मेरे प्यारे साथियों,

आप सभी को मेरा नमस्कार!

आज मैं आप सभी के सामने एक ऐसे महत्वपूर्ण विषय पर अपने विचार साझा करने जा रहा हूँ, जो हमारे देश की ग्रामीण अर्थव्यवस्था और वित्तीय समावेश (Financial Inclusion) की रीढ़ बन चुका है — 'बैंक मित्र'।

'बैंक मित्र' (या बिज़नेस कॉरेस्पोंडेंट) महज़ एक शब्द नहीं, बल्कि एक ऐसा माध्यम है जो दूर-दराज के गांवों में रहने वाले लोगों को सीधे मुख्य बैंकिंग व्यवस्था से जोड़ता है। पहले बैंकिंग सेवाओं का लाभ उठाने के लिए ग्रामीण इलाकों के लोगों को कई किलोमीटर का सफर तय करके शहरों में जाना पड़ता था। लेकिन बैंक मित्रों ने इस दूरी को मिटाकर 'बैंकिंग को आपके द्वार' तक पहुंचा दिया है।

एक बैंक मित्र अपने क्षेत्र में बैंक की एक छोटी शाखा (Micro-branch) के रूप में कार्य करता है। उनका काम सिर्फ पैसे जमा करना या निकालना नहीं है। वे ग्रामीणों को बचत खाते खोलने, सरकारी योजनाओं का लाभ दिलवाने, माइक्रो-लोन (ऋण) प्राप्त करने, और बीमा पॉलिसियों की सही जानकारी देने में मदद करते हैं।

डिजिटल इंडिया के इस दौर में, गाँव के बुजुर्गों और अनपढ़ लोगों के लिए स्मार्टफोन या एटीएम मशीन चलाना थोड़ा मुश्किल हो सकता है। ऐसे में, बैंक मित्र उनके और तकनीक के बीच एक पुल का काम करते हैं। वे आधार-सक्षम भुगतान प्रणाली (AEPS) के माध्यम से लोगों को पेंशन, छात्रवृत्ति और मज़दूरी का पैसा सुरक्षित रूप से दिलवाते हैं।

सबसे बड़ी बात, बैंक मित्र हमारे ग्रामीण भाई-बहनों को साहूकारों और धोखेबाजों के चंगुल से बचाकर उन्हें आर्थिक रूप से सशक्त और आत्मनिर्भर बना रहे हैं। यह सही मायने में "मानवीय स्पर्श के साथ बैंकिंग" (Banking with a human touch) का एक बेहतरीन उदाहरण है।

अंत में, मैं यही कहना चाहूँगा कि बैंक मित्र सिर्फ एक एजेंट नहीं, बल्कि वे आर्थिक रक्षक हैं जो ग्रामीण भारत के विकास में एक मूक लेकिन बहुत बड़ा योगदान दे रहे हैं। हमारे इन बैंक मित्रों का सम्मान करें।

धन्यवाद
जय बैंक मित्र`
    },
    {
      name: 'प्रदीप भार्गव',
      nameEn: 'Pradeep Bhargava',
      photo: '/images/pradeep_bhargava.jpg',
      role: 'बैंक ऑफ बड़ौदा BC',
      roleEn: 'Bank of Baroda BC',
      location: 'कोटा, राजस्थान',
      isGeneralSecretary: false,
      quote: 'नेतृत्व करने का एक अच्छा उद्देश्य यह है कि जो लोग अच्छा प्रदर्शन नहीं कर रहे हैं, उन्हें अच्छा प्रदर्शन करने में मदद की जाए और जो लोग अच्छा प्रदर्शन कर रहे हैं, उन्हें और भी बेहतर प्रदर्शन करने में मदद की जाए।'
    }
  ];

  coordinators = [
    {
      name: 'सूरज करन बैरवा',
      nameEn: 'Suraj Karan Bairwa',
      photo: '/images/suraj_karan_bairwa.png',
      role: 'बैंक ऑफ बड़ौदा (BC)',
      roleEn: 'Bank of Baroda BC Coordinator',
      location: 'राजस्थान',
      quote: 'बैंक मित्रों के सशक्तिकरण और एकता के लिए समर्पित प्रयास।'
    },
    {
      name: 'राकेश कुमार शर्मा',
      nameEn: 'Rakesh Kumar Sharma',
      photo: '/images/rakesh_kumar_sharma.jpg',
      role: 'स्टेट बैंक ऑफ इंडिया (BC)',
      roleEn: 'State Bank of India BC Coordinator',
      location: 'राजस्थान',
      quote: 'बैंक मित्रों की समस्याओं का त्वरित समाधान और संगठन का सुदृढ़ीकरण ही हमारा संकल्प है।'
    },
    {
      name: 'बाबू लाल सैनी',
      nameEn: 'Babu Lal Saini',
      photo: '/images/babu_lal_saini.jpg',
      role: 'स्टेट बैंक ऑफ इंडिया (BC)',
      roleEn: 'State Bank of India BC Coordinator',
      location: 'राजस्थान',
      quote: 'बैंक मित्रों के कल्याण और अधिकारों के संरक्षण के लिए निरंतर संघर्षरत।'
    },
    {
      name: 'पवन कुमार वर्मा',
      nameEn: 'Pawan Kumar Verma',
      photo: '/images/pawan_kumar_verma.png',
      role: 'स्टेट बैंक ऑफ इंडिया (CSP)',
      roleEn: 'State Bank of India CSP Coordinator',
      location: 'राजस्थान',
      quote: 'सभी बैंक मित्रों को संगठित कर उनके उज्ज्वल भविष्य का मार्ग प्रशस्त करना।'
    },
    {
      name: 'राजेश कुमार सैनी',
      nameEn: 'Rajesh Kumar Saini',
      photo: '/images/rajesh_kumar_saini.png',
      role: 'बैंक ऑफ बड़ौदा (CSP)',
      roleEn: 'Bank of Baroda CSP Coordinator',
      location: 'राजस्थान',
      quote: 'सच्ची कर्तव्यनिष्ठा और सामूहिक प्रयास से ही हम अपने अधिकारों को प्राप्त कर सकते हैं।'
    },
    {
      name: 'जितेन्द्र कुमार तेली',
      nameEn: 'Jitendra Kumar Teli',
      photo: '/images/jitendra_kumar_teli.png',
      role: 'बैंक ऑफ बड़ौदा (BC)',
      roleEn: 'Bank of Baroda BC Coordinator',
      location: 'राजस्थान',
      quote: 'संगठन में ही शक्ति है और हमारा लक्ष्य बैंक मित्रों के हितों को सुरक्षित रखना है।'
    },
    {
      name: 'बिरदी चंद रैदास',
      nameEn: 'Birdhi Chand Raidas',
      photo: '/images/birdhi_chand_raidas.png',
      role: 'राजस्थान ग्रामीण बैंक (BC)',
      roleEn: 'Rajasthan Gramin Bank BC Coordinator',
      location: 'राजस्थान',
      quote: 'ग्रामीण क्षेत्रों में वित्तीय समावेशन को मजबूत करने के साथ बैंक मित्रों की उन्नति के लिए संकल्पित।'
    },
    {
      name: 'शंभू दयाल शर्मा',
      nameEn: 'Shimbhu Dayal Sharma',
      photo: '/images/shimbhu_dayal_sharma.png',
      role: 'बैंक ऑफ बड़ौदा (CSP)',
      roleEn: 'Bank of Baroda CSP Coordinator',
      location: 'राजस्थान',
      quote: 'पारदर्शिता और निष्पक्षता ही सेवा का मुख्य आधार है।'
    },
    {
      name: 'लूणाराम खिलेरी',
      nameEn: 'Lunaram Khileri',
      photo: '/images/lunaram_khileri.jpg',
      role: 'पंजाब नेशनल बैंक (BC)',
      roleEn: 'Punjab National Bank BC Coordinator',
      location: 'राजस्थान',
      quote: 'एकता और सेवा भाव से ही संगठन सुदृढ़ होता है और बैंक मित्रों की समस्याओं का समाधान संभव है।'
    },
    {
      name: 'रीना गर्ग',
      nameEn: 'Reena Garg',
      photo: '/images/reena_garg.jpg',
      role: 'स्टेट बैंक ऑफ इंडिया (CSP)',
      roleEn: 'State Bank of India CSP Coordinator',
      location: 'राजस्थान',
      quote: 'ईमानदारी और लगन से की गई सेवा ही समाज में सम्मान और अधिकार दिलाती है।'
    },
    {
      name: 'कमल रजक',
      nameEn: 'Kamal Rajak',
      photo: '/images/kamal_rajak.png',
      role: 'स्टेट बैंक ऑफ इंडिया (CSP)',
      roleEn: 'State Bank of India CSP Coordinator',
      location: 'राजस्थान',
      quote: 'सामूहिक शक्ति और संगठित आवाज़ ही हमारी समस्याओं के समाधान की कुंजी है।'
    },
    {
      name: 'नसरीन बानो',
      nameEn: 'Nasrin Bano',
      photo: '/images/nasrin_bano.png',
      role: 'स्टेट बैंक ऑफ इंडिया (CSP)',
      roleEn: 'State Bank of India CSP Coordinator',
      location: 'राजस्थान',
      quote: 'बैंक मित्रों की उन्नति और उनके अधिकारों की रक्षा के प्रति सदैव तत्पर।'
    }
  ];
}
