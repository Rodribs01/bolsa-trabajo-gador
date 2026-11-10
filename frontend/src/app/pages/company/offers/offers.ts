import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Company, CompanyOffer, CompanyOfferPage } from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { daysUntil, formatDate } from '../../../core/utils/format';
import { offerStatusClass, offerStatusLabel } from '../../../core/utils/status';

@Component({
  selector: 'app-company-offers',
  imports: [RouterLink],
  templateUrl: './offers.html',
})
export class Offers implements OnInit {
  private companyService = inject(CompanyService);
  private router = inject(Router);

  company = signal<Company | null>(null);
  result = signal<CompanyOfferPage | null>(null);
  status = signal('');
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  busyId = signal<number | null>(null);

  statuses = [
    'BORRADOR',
    'EN_REVISION_GADOR',
    'PUBLICADA',
    'EN_PROCESO_SELECCION',
    'CERRADA',
    'ANULADA',
  ];

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (company) => this.company.set(company),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.companyService.getOffers(this.status(), this.page()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  onStatusChange(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  totalPages(): number {
    const result = this.result();
    if (!result) {
      return 1;
    }
    return Math.max(1, Math.ceil(result.total / result.limit));
  }

  isApproved(): boolean {
    return this.company()?.status === 'APROBADA';
  }

  canClose(offer: CompanyOffer): boolean {
    return offer.status === 'PUBLICADA' || offer.status === 'EN_PROCESO_SELECCION';
  }

  canCancel(offer: CompanyOffer): boolean {
    return offer.status !== 'CERRADA' && offer.status !== 'ANULADA';
  }

  hasApplicants(offer: CompanyOffer): boolean {
    return offer.status !== 'BORRADOR' && offer.status !== 'EN_REVISION_GADOR';
  }

  closesSoon(offer: CompanyOffer): boolean {
    return offer.status === 'PUBLICADA' && daysUntil(offer.closingDate) <= 2;
  }

  statusClass(status: string): string {
    return offerStatusClass(status);
  }

  statusLabel(status: string): string {
    return offerStatusLabel(status);
  }

  date(value: string): string {
    return formatDate(value);
  }

  submit(offer: CompanyOffer): void {
    this.runAction(
      offer,
      this.companyService.submitOffer(offer.id),
      'Enviaste la oferta a revisión de la Gobernación.',
    );
  }

  close(offer: CompanyOffer): void {
    if (!confirm(`¿Cerrar "${offer.title}"? Ya no recibirá postulantes.`)) {
      return;
    }
    this.runAction(offer, this.companyService.closeOffer(offer.id), 'La oferta quedó cerrada.');
  }

  cancel(offer: CompanyOffer): void {
    if (!confirm(`¿Anular "${offer.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.runAction(offer, this.companyService.cancelOffer(offer.id), 'La oferta quedó anulada.');
  }

  duplicate(offer: CompanyOffer): void {
    this.busyId.set(offer.id);
    this.errorMessage.set('');
    this.companyService.duplicateOffer(offer.id).subscribe({
      next: (copy) => {
        this.busyId.set(null);
        this.router.navigate(['/company/job-offers', copy.id, 'edit']);
      },
      error: (error) => {
        this.busyId.set(null);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  private runAction(offer: CompanyOffer, request: Observable<unknown>, message: string): void {
    this.busyId.set(offer.id);
    this.errorMessage.set('');
    this.successMessage.set('');
    request.subscribe({
      next: () => {
        this.busyId.set(null);
        this.successMessage.set(message);
        this.load();
      },
      error: (error) => {
        this.busyId.set(null);
        this.errorMessage.set(getErrorMessage(error));
        this.load();
      },
    });
  }
}
