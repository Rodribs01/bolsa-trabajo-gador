import { Component, OnInit, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '../../../core/models/company.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatDate } from '../../../core/utils/format';
import { companyStatusClass, companyStatusLabel } from '../../../core/utils/status';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

interface StatusTab {
  status: string;
  label: string;
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-companies',
  imports: [CompanyLogo],
  templateUrl: './companies.html',
})
export class Companies implements OnInit {
  private adminService = inject(AdminService);

  tabs: StatusTab[] = [
    { status: 'PENDIENTE_VALIDACION', label: 'Pendientes' },
    { status: 'APROBADA', label: 'Aprobadas' },
    { status: 'RECHAZADA', label: 'Rechazadas' },
    { status: 'SUSPENDIDA', label: 'Suspendidas' },
  ];

  status = signal('PENDIENTE_VALIDACION');
  companies = signal<Company[]>([]);
  total = signal(0);
  page = signal(1);
  counts = signal<Record<string, number>>({});
  selected = signal<Company | null>(null);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showReject = signal(false);
  rejectReason = signal('');

  ngOnInit(): void {
    this.load();
    this.loadCounts();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getCompanies(this.status(), this.page(), PAGE_SIZE).subscribe({
      next: (result) => {
        this.companies.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  loadCounts(): void {
    for (const tab of this.tabs) {
      this.adminService.getCompanies(tab.status, 1, 1).subscribe({
        next: (result) => {
          const counts = { ...this.counts() };
          counts[tab.status] = result.total;
          this.counts.set(counts);
        },
      });
    }
  }

  selectTab(status: string): void {
    this.status.set(status);
    this.page.set(1);
    this.selected.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.load();
  }

  select(company: Company): void {
    this.selected.set(company);
    this.showReject.set(false);
    this.rejectReason.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / PAGE_SIZE));
  }

  onReasonInput(event: Event): void {
    this.rejectReason.set((event.target as HTMLTextAreaElement).value);
  }

  viewDocument(company: Company): void {
    this.errorMessage.set('');
    const newWindow = window.open('', '_blank');
    this.adminService.getCompanyDocument(company.id).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        if (newWindow) {
          newWindow.location.href = url;
        } else {
          window.location.href = url;
        }
      },
      error: (error) => {
        newWindow?.close();
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  approve(company: Company): void {
    const reactivating = company.status === 'SUSPENDIDA';
    const question = reactivating
      ? `¿Reactivar a ${company.businessName}?`
      : `¿Aprobar a ${company.businessName}? Podrá publicar ofertas.`;
    if (!confirm(question)) {
      return;
    }
    const message = reactivating ? 'La empresa fue reactivada.' : 'La empresa fue aprobada.';
    this.runAction(this.adminService.approveCompany(company.id), message);
  }

  cancelReject(): void {
    this.showReject.set(false);
    this.errorMessage.set('');
  }

  // El rechazo exige un motivo para que la empresa sepa qué corregir
  reject(company: Company): void {
    if (this.rejectReason().trim().length < 5) {
      this.errorMessage.set('Escribe el motivo del rechazo (al menos 5 caracteres).');
      return;
    }
    this.runAction(
      this.adminService.rejectCompany(company.id, this.rejectReason().trim()),
      'La empresa fue rechazada.',
    );
  }

  suspend(company: Company): void {
    if (
      !confirm(
        `¿Suspender a ${company.businessName}? Sus ofertas dejarán de recibir postulaciones.`,
      )
    ) {
      return;
    }
    this.runAction(this.adminService.suspendCompany(company.id), 'La empresa fue suspendida.');
  }

  statusClass(status: string): string {
    return companyStatusClass(status);
  }

  statusLabel(status: string): string {
    return companyStatusLabel(status);
  }

  date(value: string | null): string {
    return formatDate(value);
  }

  private runAction(request: Observable<Company>, message: string): void {
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    request.subscribe({
      next: () => {
        this.sending.set(false);
        this.successMessage.set(message);
        this.selected.set(null);
        this.showReject.set(false);
        this.load();
        this.loadCounts();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }
}
