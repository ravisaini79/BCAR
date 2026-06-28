import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterResponse } from '../interfaces/register.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterApiService {
  private http = inject(HttpClient);

  /**
   * Post registration FormData to auth endpoints
   * @param payload - Multipart FormData payload
   */
  registerMember(payload: FormData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, payload);
  }
}
