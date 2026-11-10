import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { PushService } from '../../../core/services/push.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  pushService = inject(PushService);

  items = signal<AppNotification[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  unreadCount = this.notificationService.unreadCount;
  pushBusy = signal(false);
  pushMessage = signal('');
  pushError = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.notificationService.getMine(this.page(), PAGE_SIZE).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.total.set(result.total);
        this.notificationService.unreadCount.set(result.unreadCount);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  open(item: AppNotification): void {
    if (!item.read) {
      this.notificationService.markAsRead(item.id).subscribe({
        next: () => this.notificationService.refreshUnreadCount(),
      });
    }
    if (item.link) {
      this.router.navigateByUrl(item.link);
    }
  }

  markAll(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.load(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / PAGE_SIZE));
  }

  icon(type: string): string {
    if (type === 'CV_VISTO') {
      return 'bi-eye';
    }
    if (type === 'CAMBIO_ESTADO_POSTULACION') {
      return 'bi-arrow-repeat';
    }
    if (type === 'EMPRESA_VALIDADA') {
      return 'bi-building-check';
    }
    if (type === 'OFERTA_POR_VENCER') {
      return 'bi-alarm';
    }
    return 'bi-briefcase';
  }

  date(value: string): string {
    return new Date(value).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  enablePush(): void {
    this.pushBusy.set(true);
    this.pushMessage.set('');
    this.pushError.set('');
    this.pushService.getPublicKey().subscribe({
      next: (result) => {
        if (!result.publicKey) {
          this.showPushError('Los avisos en el dispositivo no están disponibles en este momento.');
          return;
        }
        this.pushService
          .requestSubscription(result.publicKey)
          .then((subscription) => this.saveSubscription(subscription))
          .catch(() => {
            if (this.pushService.isBlocked()) {
              this.showPushError(
                'Bloqueaste los avisos de este sitio. Permítelos desde el navegador.',
              );
            } else {
              this.showPushError('No pudimos activar los avisos en este dispositivo.');
            }
          });
      },
      error: (error) => this.showPushError(getErrorMessage(error)),
    });
  }

  private saveSubscription(subscription: PushSubscription): void {
    this.pushService.saveSubscription(subscription).subscribe({
      next: (result) => {
        this.pushBusy.set(false);
        this.pushMessage.set(result.message);
      },
      error: (error) => {
        this.pushService.unsubscribeDevice().catch(() => {});
        this.showPushError(getErrorMessage(error));
      },
    });
  }

  disablePush(): void {
    const endpoint = this.pushService.endpoint();
    if (!endpoint) {
      return;
    }
    this.pushBusy.set(true);
    this.pushMessage.set('');
    this.pushError.set('');
    this.pushService.removeSubscription(endpoint).subscribe({
      next: (result) => {
        this.pushService.unsubscribeDevice().catch(() => {});
        this.pushBusy.set(false);
        this.pushMessage.set(result.message);
      },
      error: (error) => this.showPushError(getErrorMessage(error)),
    });
  }

  private showPushError(message: string): void {
    this.pushBusy.set(false);
    this.pushError.set(message);
  }
}
