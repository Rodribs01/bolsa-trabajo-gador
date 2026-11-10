import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationPage } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/notifications`;

  unreadCount = signal(0);

  getMine(page: number, limit: number): Observable<NotificationPage> {
    return this.http.get<NotificationPage>(this.url, { params: { page: page, limit: limit } });
  }

  refreshUnreadCount(): void {
    this.getMine(1, 1).subscribe({
      next: (result) => this.unreadCount.set(result.unreadCount),
    });
  }

  markAsRead(id: number): Observable<unknown> {
    return this.http.patch(`${this.url}/${id}/read`, {});
  }

  markAllAsRead(): Observable<unknown> {
    return this.http.patch(`${this.url}/read-all`, {});
  }
}
