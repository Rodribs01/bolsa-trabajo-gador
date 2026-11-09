import { Component, OnInit, inject, signal } from '@angular/core';
import { PendingOffer } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatDate, formatMoney } from '../../../core/utils/format';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

@Component({
  selector: 'app-offers-review',
  imports: [CompanyLogo],
  templateUrl: './offers-review.html',
})
export class OffersReview implements OnInit {
  private adminService = inject(AdminService);

  offers = signal<PendingOffer[]>([]);
  total = signal(0);
  selected = signal<PendingOffer | null>(null);
  observation = signal('');
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getPendingOffers().subscribe({
      next: (result) => {
        this.offers.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
        if (result.items.length > 0) {
          this.select(result.items[0]);
        } else {
          this.selected.set(null);
        }
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  select(offer: PendingOffer): void {
    this.selected.set(offer);
    this.observation.set('');
    this.errorMessage.set('');
  }

  onObservationInput(event: Event): void {
    this.observation.set((event.target as HTMLTextAreaElement).value);
  }

  salary(offer: PendingOffer): string {
    if (offer.salaryToNegotiate || offer.minSalary === null || offer.maxSalary === null) {
      return 'A tratar';
    }
    if (Number(offer.minSalary) === Number(offer.maxSalary)) {
      return formatMoney(offer.minSalary);
    }
    return `${formatMoney(offer.minSalary)} - ${formatMoney(offer.maxSalary)}`;
  }

  date(value: string | null): string {
    return formatDate(value);
  }

  approve(offer: PendingOffer): void {
    if (!confirm(`¿Aprobar y publicar "${offer.title}"?`)) {
      return;
    }
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.adminService.approveOffer(offer.id).subscribe({
      next: () => {
        this.sending.set(false);
        this.successMessage.set(`"${offer.title}" fue publicada.`);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  // Devolver una oferta exige una observación para que la empresa sepa qué corregir
  returnToCompany(offer: PendingOffer): void {
    if (this.observation().trim().length < 5) {
      this.errorMessage.set('Escribe la observación para la empresa (al menos 5 caracteres).');
      return;
    }
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.adminService.returnOffer(offer.id, this.observation().trim()).subscribe({
      next: () => {
        this.sending.set(false);
        this.successMessage.set(`"${offer.title}" fue devuelta a la empresa.`);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }
}
