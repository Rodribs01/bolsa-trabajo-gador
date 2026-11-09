import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JobOfferDetail, OfferSkill } from '../../../core/models/job-offer.model';
import { AuthService } from '../../../core/services/auth.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { daysUntil, formatDate, formatSalary } from '../../../core/utils/format';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

@Component({
  selector: 'app-offer-detail',
  imports: [RouterLink, CompanyLogo],
  templateUrl: './offer-detail.html',
})
export class OfferDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private jobOfferService = inject(JobOfferService);
  authService = inject(AuthService);

  offer = signal<JobOfferDetail | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  currentUrl = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.currentUrl = `/job-offers/${id}`;

    this.jobOfferService.findOne(id).subscribe({
      next: (offer) => {
        this.offer.set(offer);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  salary(offer: JobOfferDetail): string {
    return formatSalary(offer);
  }

  date(value: string | null): string {
    return formatDate(value);
  }

  // Se puede postular hasta el mismo día de cierre
  daysLeft(offer: JobOfferDetail): string {
    const days = daysUntil(offer.closingDate);
    if (days <= 0) {
      return 'Cierra hoy';
    }
    if (days === 1) {
      return 'Queda 1 día';
    }
    return `Quedan ${days} días`;
  }

  requiredSkills(offer: JobOfferDetail): OfferSkill[] {
    const result: OfferSkill[] = [];
    for (const skill of offer.skills) {
      if (skill.required) {
        result.push(skill);
      }
    }
    return result;
  }

  desiredSkills(offer: JobOfferDetail): OfferSkill[] {
    const result: OfferSkill[] = [];
    for (const skill of offer.skills) {
      if (!skill.required) {
        result.push(skill);
      }
    }
    return result;
  }
}
