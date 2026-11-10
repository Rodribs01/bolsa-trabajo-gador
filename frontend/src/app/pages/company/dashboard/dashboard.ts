import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company, CompanyOfferPage } from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatDate } from '../../../core/utils/format';
import { companyStatusClass, companyStatusLabel } from '../../../core/utils/status';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

@Component({
  selector: 'app-company-dashboard',
  imports: [RouterLink, CompanyLogo],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private companyService = inject(CompanyService);

  company = signal<Company | null>(null);
  offers = signal<CompanyOfferPage | null>(null);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.companyService.getMyCompany().subscribe({
      next: (company) => {
        this.company.set(company);
        this.loading.set(false);
        if (company.status === 'APROBADA') {
          this.loadOffers();
        }
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  totalApplications(): number {
    let total = 0;
    for (const offer of this.offers()?.items ?? []) {
      total += offer.applicationCount ?? 0;
    }
    return total;
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

  private loadOffers(): void {
    this.companyService.getOffers('', 1).subscribe({
      next: (page) => this.offers.set(page),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
