import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // ── Stats ──────────────────────────────────────────────────────────
  getStats(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/dashboard/stats`);
  }

  // ── Members ────────────────────────────────────────────────────────
  getMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/dashboard/members`);
  }

  updateMemberStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/dashboard/members/${id}/status`, { status });
  }

  deleteMember(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/dashboard/members/${id}`);
  }

  // ── Notices ────────────────────────────────────────────────────────
  getNotices(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/dashboard/notices`);
  }

  createNotice(notice: { title: string; body: string; category: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/dashboard/notices`, notice);
  }

  // ── Grievances ─────────────────────────────────────────────────────
  /** Member's own grievances */
  getMyGrievances(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/dashboard/grievances`);
  }

  /** All grievances (admin only) */
  getAllGrievances(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/dashboard/all-grievances`);
  }

  createGrievance(g: { subject: string; description: string; category: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/dashboard/grievances`, g);
  }

  updateGrievanceStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/dashboard/grievances/${id}/status`, { status });
  }
}
