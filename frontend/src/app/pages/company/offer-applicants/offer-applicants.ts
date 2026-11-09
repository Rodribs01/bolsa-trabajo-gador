import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CompanyOffer,
  OfferApplicationCard,
  OfferApplicationPage,
} from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatDate, formatYears, initials, publicFileUrl } from '../../../core/utils/format';
import {
  APPLICATION_STEPS,
  matchTextColor,
  applicationStatusClass,
  offerStatusClass,
  offerStatusLabel,
  statusLabel,
} from '../../../core/utils/status';

@Component({
  selector: 'app-offer-applicants',
  imports: [RouterLink],
  templateUrl: './offer-applicants.html',
})
export class OfferApplicants implements OnInit {
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);

  offerId = 0;
  offer = signal<CompanyOffer | null>(null);
  result = signal<OfferApplicationPage | null>(null);
  filter = signal('');
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  cvError = signal('');

  // Las postulaciones retiradas no se muestran a la empresa
  filterStatuses = [...APPLICATION_STEPS, 'RECHAZADO'];

  ngOnInit(): void {
    this.offerId = Number(this.route.snapshot.paramMap.get('id'));
    this.companyService.getOffer(this.offerId).subscribe({
      next: (offer) => this.offer.set(offer),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.companyService.getApplications(this.offerId, this.filter(), this.page()).subscribe({
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

  setFilter(status: string): void {
    this.filter.set(status);
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

  countFor(status: string): number {
    const result = this.result();
    if (!result) {
      return 0;
    }
    return result.statusCounts[status] ?? 0;
  }

  totalCount(): number {
    let total = 0;
    for (const status of this.filterStatuses) {
      total += this.countFor(status);
    }
    return total;
  }

  fullName(card: OfferApplicationCard): string {
    return `${card.applicant.firstNames} ${card.applicant.lastNames}`;
  }

  photoUrl(card: OfferApplicationCard): string {
    return publicFileUrl('photos', card.applicant.photo ?? '');
  }

  letters(card: OfferApplicationCard): string {
    return initials(this.fullName(card));
  }

  matchColor(match: number): string {
    return matchTextColor(match);
  }

  years(value: number): string {
    return formatYears(value);
  }

  statusClass(status: string): string {
    return applicationStatusClass(status);
  }

  statusLabel(status: string): string {
    return statusLabel(status);
  }

  offerClass(status: string): string {
    return offerStatusClass(status);
  }

  offerLabel(status: string): string {
    return offerStatusLabel(status);
  }

  date(value: string): string {
    return formatDate(value);
  }

  downloadCv(card: OfferApplicationCard): void {
    this.cvError.set('');
    const newWindow = window.open('', '_blank');
    this.companyService.getApplicationCv(card.id).subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        if (newWindow) {
          newWindow.location.href = url;
        } else {
          window.location.href = url;
        }
        this.load();
      },
      error: (error) => {
        newWindow?.close();
        this.cvError.set(getErrorMessage(error));
      },
    });
  }
}
