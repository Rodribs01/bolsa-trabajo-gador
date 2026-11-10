import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
})
export class Notifications implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  items = signal<AppNotification[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  unreadCount = this.notificationService.unreadCount;

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
}
