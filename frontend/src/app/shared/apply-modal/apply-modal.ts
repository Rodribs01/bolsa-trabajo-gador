import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicantProfile } from '../../core/models/applicant.model';
import { JobOfferDetail } from '../../core/models/job-offer.model';
import { ApplicationService } from '../../core/services/application.service';
import { getErrorMessage } from '../../core/utils/error-message';
import { formatDate, formatSalary } from '../../core/utils/format';
import { MatchPreview, previewMatch } from '../../core/utils/match';
import {
  COMPLETION_THRESHOLD,
  MissingSection,
  canApply,
  missingSections,
} from '../../core/utils/profile-completion';
import { CompanyLogo } from '../company-logo/company-logo';

@Component({
  selector: 'app-apply-modal',
  imports: [RouterLink, CompanyLogo],
  templateUrl: './apply-modal.html',
})
export class ApplyModal implements OnInit {
  private applicationService = inject(ApplicationService);

  offer = input.required<JobOfferDetail>();
  profile = input.required<ApplicantProfile>();
  closed = output<void>();
  applied = output<void>();

  preview = signal<MatchPreview | null>(null);
  missing = signal<MissingSection[]>([]);
  accepted = signal(false);
  sending = signal(false);
  errorMessage = signal('');
  sentMatch = signal<number | null>(null);
  threshold = COMPLETION_THRESHOLD;

  ngOnInit(): void {
    this.preview.set(previewMatch(this.offer().skills, this.profile().skills));
    this.missing.set(missingSections(this.profile()));
  }

  canApply(): boolean {
    return canApply(this.profile());
  }

  salary(): string {
    return formatSalary(this.offer());
  }

  closingDate(): string {
    return formatDate(this.offer().closingDate);
  }

  matchLabel(percentage: number): string {
    if (percentage >= 75) {
      return 'alta';
    }
    if (percentage >= 50) {
      return 'media';
    }
    return 'baja';
  }

  onAcceptChange(event: Event): void {
    this.accepted.set((event.target as HTMLInputElement).checked);
  }

  confirm(): void {
    this.sending.set(true);
    this.errorMessage.set('');
    this.applicationService.apply(this.offer().id).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.sentMatch.set(response.matchPercentage);
        this.applied.emit();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }
}
