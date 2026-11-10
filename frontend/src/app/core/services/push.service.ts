import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private http = inject(HttpClient);
  private swPush = inject(SwPush);
  private url = `${environment.apiUrl}/notifications`;

  endpoint = signal<string | null>(null);

  constructor() {
    if (this.swPush.isEnabled) {
      this.swPush.subscription.subscribe((subscription) => {
        this.endpoint.set(subscription ? subscription.endpoint : null);
      });
    }
  }

  isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  isBlocked(): boolean {
    return typeof Notification !== 'undefined' && Notification.permission === 'denied';
  }

  getPublicKey(): Observable<{ publicKey: string | null }> {
    return this.http.get<{ publicKey: string | null }>(`${this.url}/push-key`);
  }

  requestSubscription(publicKey: string): Promise<PushSubscription> {
    return this.swPush.requestSubscription({ serverPublicKey: publicKey });
  }

  saveSubscription(subscription: PushSubscription): Observable<{ message: string }> {
    const data = subscription.toJSON();
    return this.http.post<{ message: string }>(`${this.url}/push-subscription`, {
      endpoint: data.endpoint,
      p256dh: data.keys ? data.keys['p256dh'] : '',
      auth: data.keys ? data.keys['auth'] : '',
    });
  }

  removeSubscription(endpoint: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/push-subscription`, {
      body: { endpoint: endpoint },
    });
  }

  unsubscribeDevice(): Promise<void> {
    return this.swPush.unsubscribe();
  }

  // Al cerrar sesión el dispositivo deja de recibir avisos de esa cuenta
  forgetDevice(): void {
    const endpoint = this.endpoint();
    if (!endpoint) {
      return;
    }
    this.removeSubscription(endpoint).subscribe({ error: () => {} });
    this.unsubscribeDevice().catch(() => {});
  }
}
