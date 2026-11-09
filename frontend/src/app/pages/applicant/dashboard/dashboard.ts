import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicantProfile } from '../../../core/models/applicant.model';
import { MyApplication } from '../../../core/models/application.model';
import { JobOfferSummary } from '../../../core/models/job-offer.model';
import { ApplicantService } from '../../../core/services/applicant.service';
import { ApplicationService } from '../../../core/services/application.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import {
  COMPLETION_THRESHOLD,
  MissingSection,
  canApply,
  missingSections,
} from '../../../core/utils/profile-completion';
import {
  ALL_APPLICATION_STATUSES,
  applicationStatusClass,
  statusLabel,
} from '../../../core/utils/status';
import { OfferCard } from '../../../shared/offer-card/offer-card';

interface StatusCount {
  status: string;
  total: number;
}

@Component({
  selector: 'app-applicant-dashboard',
  imports: [RouterLink, OfferCard],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private applicantService = inject(ApplicantService);
  private applicationService = inject(ApplicationService);
  private jobOfferService = inject(JobOfferService);

  profile = signal<ApplicantProfile | null>(null);
  missing = signal<MissingSection[]>([]);
  statusCounts = signal<StatusCount[]>([]);
  totalApplications = signal(0);
  recommended = signal<JobOfferSummary[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  applicationsError = signal(false);
  threshold = COMPLETION_THRESHOLD;
  today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ngOnInit(): void {
    this.applicantService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.missing.set(missingSections(profile));
        this.loading.set(false);
        this.loadRecommended(profile);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });

    this.applicationService.findMine().subscribe({
      next: (page) => {
        this.totalApplications.set(page.total);
        this.statusCounts.set(this.countByStatus(page.items));
      },
      error: () => this.applicationsError.set(true),
    });
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Buenos días';
    }
    if (hour < 19) {
      return 'Buenas tardes';
    }
    return 'Buenas noches';
  }

  firstName(profile: ApplicantProfile): string {
    return profile.firstNames.split(' ')[0];
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

  private loadRecommended(profile: ApplicantProfile): void {
    const filters = { professionId: profile.professionId ? String(profile.professionId) : '' };
    this.jobOfferService.search(filters, 3).subscribe({
      next: (page) => this.recommended.set(page.items),
    });
  }

  private countByStatus(applications: MyApplication[]): StatusCount[] {
    const counts: StatusCount[] = [];
    for (const status of ALL_APPLICATION_STATUSES) {
      let total = 0;
      for (const application of applications) {
        if (application.status === status) {
          total++;
        }
      }
      counts.push({ status: status, total: total });
    }
    return counts;
  }
}
