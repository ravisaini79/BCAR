import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private ms = inject(MessageService);

  success(detail: string, summary = 'Success') {
    this.ms.add({ severity: 'success', summary, detail, life: 4000 });
  }
  error(detail: string, summary = 'Error') {
    this.ms.add({ severity: 'error', summary, detail, life: 5000 });
  }
  warn(detail: string, summary = 'Warning') {
    this.ms.add({ severity: 'warn', summary, detail, life: 4000 });
  }
  info(detail: string, summary = 'Info') {
    this.ms.add({ severity: 'info', summary, detail, life: 3000 });
  }
}
