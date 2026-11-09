import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicantProfile } from '../../../core/models/applicant.model';
import { JobOfferDetail, OfferSkill } from '../../../core/models/job-offer.model';
import { ApplicantService } from '../../../core/services/applicant.service';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { daysUntil, formatDate, formatSalary } from '../../../core/utils/format';
import { canApply } from '../../../core/utils/profile-completion';
import { applicationStatusClass, statusLabel } from '../../../core/utils/status';
import { ApplyModal } from '../../../shared/apply-modal/apply-modal';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

@Component({
  selector: 'app-offer-detail',
  imports: [RouterLink, CompanyLogo, ApplyModal],
  templateUrl: './offer-detail.html',
})
export class OfferDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private jobOfferService = inject(JobOfferService);
  private applicantService = inject(ApplicantService);
  private applicationService = inject(ApplicationService);
  private favoriteService = inject(FavoriteService);
  authService = inject(AuthService);

  offer = signal<JobOfferDetail | null>(null);
  loading = signal(true);
  errorMessage = signal('');
  profile = signal<ApplicantProfile | null>(null);
  profileError = signal(false);
  myApplicationStatus = signal('');
  isFavorite = signal(false);
  savingFavorite = signal(false);
  favoriteError = signal('');
  showApplyModal = signal(false);
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

    if (this.authService.hasRole('POSTULANTE')) {
      this.loadApplicantData(id);
    }
  }

  loadMyApplication(offerId: number): void {
    this.applicationService.findMine().subscribe({
      next: (page) => {
        for (const application of page.items) {
          if (application.offer.id === offerId) {
            this.myApplicationStatus.set(application.status);
          }
        }
      },
    });
  }

  toggleFavorite(offer: JobOfferDetail): void {
    const request = this.isFavorite()
      ? this.favoriteService.remove(offer.id)
      : this.favoriteService.add(offer.id);

    this.savingFavorite.set(true);
    this.favoriteError.set('');
    request.subscribe({
      next: () => {
        this.savingFavorite.set(false);
        this.isFavorite.set(!this.isFavorite());
      },
      error: (error) => {
        this.savingFavorite.set(false);
        this.favoriteError.set(getErrorMessage(error));
      },
    });
  }

  canApply(profile: ApplicantProfile): boolean {
    return canApply(profile);
  }

  statusLabel(status: string): string {
    return statusLabel(status);
  }

  statusClass(status: string): string {
    return applicationStatusClass(status);
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

  private loadApplicantData(offerId: number): void {
    this.applicantService.getProfile().subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.profileError.set(true),
    });
    this.loadMyApplication(offerId);
    this.favoriteService.findMine().subscribe({
      next: (page) => {
        for (const favorite of page.items) {
          if (favorite.offer.id === offerId) {
            this.isFavorite.set(true);
          }
        }
      },
    });
  }
}
