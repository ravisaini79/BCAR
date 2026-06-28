import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  // p-toast at ROOT level — uses the root MessageService from main.ts
  // This means toasts work on every page without needing p-toast in each component
  template: `
    <p-toast position="top-right" [life]="4500" [breakpoints]="{'960px': {width: '100%', right: '0', left: '0'}}"></p-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
