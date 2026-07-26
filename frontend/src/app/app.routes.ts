import { Routes } from '@angular/router';
import { RegisterComponent }        from './register/register';
import { RegisterSuccessComponent } from './register/register-success';
import { HomeComponent }            from './home/home';
import { LoginComponent }           from './login/login';
import { DashboardComponent }       from './dashboard/dashboard';

// Lazy-loaded page components
const aboutRoutes: Routes = [
  { path: '',         loadComponent: () => import('./pages/about/about').then(m => m.AboutComponent) },
  { path: 'mission',  loadComponent: () => import('./pages/mission/mission').then(m => m.MissionComponent) },
  { path: 'committee',loadComponent: () => import('./pages/committee/committee').then(m => m.CommitteeComponent) },
];

export const routes: Routes = [
  { path: '',                  component: HomeComponent },
  { path: 'register',          component: RegisterComponent },
  { path: 'register-success',  component: RegisterSuccessComponent },
  { path: 'login',             component: LoginComponent },
  { path: 'dashboard',         component: DashboardComponent },

  // About Us sub-pages
  { path: 'about',             children: aboutRoutes },

  // Top-level pages
  {
    path: 'registration-certificate',
    loadComponent: () => import('./pages/registration-certificate/registration-certificate').then(m => m.RegistrationCertificateComponent)
  },
  {
    path: 'benefits',
    loadComponent: () => import('./pages/benefits/benefits').then(m => m.BenefitsComponent)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery').then(m => m.GalleryComponent)
  },
  {
    path: 'news',
    loadComponent: () => import('./pages/news/news').then(m => m.NewsComponent)
  },
  {
    path: 'news/:slug',
    loadComponent: () => import('./pages/news/news-details').then(m => m.NewsDetailsComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent)
  },

  { path: '**', redirectTo: '' }
];
