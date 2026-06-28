import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // ── Stats ──────────────────────────────────────────────────────────
  getStats(): Observable<any> {
    return this.http.get('/api/dashboard/stats');
  }

  // ── Members ────────────────────────────────────────────────────────
  getMembers(): Observable<any[]> {
    return this.http.get<any[]>('/api/dashboard/members');
  }

  updateMemberStatus(id: string, status: string): Observable<any> {
    return this.http.put(`/api/dashboard/members/${id}/status`, { status });
  }

  deleteMember(id: string): Observable<any> {
    return this.http.delete(`/api/dashboard/members/${id}`);
  }

  // ── Notices ────────────────────────────────────────────────────────
  getNotices(): Observable<any[]> {
    return this.http.get<any[]>('/api/dashboard/notices');
  }

  createNotice(notice: { title: string; body: string; category: string }): Observable<any> {
    return this.http.post('/api/dashboard/notices', notice);
  }

  // ── Grievances ─────────────────────────────────────────────────────
  /** Member's own grievances */
  getMyGrievances(): Observable<any[]> {
    return this.http.get<any[]>('/api/dashboard/grievances');
  }

  /** All grievances (admin only) */
  getAllGrievances(): Observable<any[]> {
    return this.http.get<any[]>('/api/dashboard/all-grievances');
  }

  createGrievance(g: { subject: string; description: string; category: string }): Observable<any> {
    return this.http.post('/api/dashboard/grievances', g);
  }

  updateGrievanceStatus(id: string, status: string): Observable<any> {
    return this.http.put(`/api/dashboard/grievances/${id}/status`, { status });
  }
}
