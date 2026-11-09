import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Experience } from '../../../core/models/applicant.model';
import { ApplicationDetail, OfferSkillMatch } from '../../../core/models/company.model';
import { CompanyService } from '../../../core/services/company.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import {
  formatDate,
  formatYears,
  initials,
  publicFileUrl,
  todayInBolivia,
} from '../../../core/utils/format';
import {
  APPLICATION_STEPS,
  applicationStatusClass,
  levelLabel,
  matchTextColor,
  nextApplicationStatus,
  statusLabel,
} from '../../../core/utils/status';

@Component({
  selector: 'app-applicant-detail',
  imports: [RouterLink],
  templateUrl: './applicant-detail.html',
})
export class ApplicantDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private companyService = inject(CompanyService);

  detail = signal<ApplicationDetail | null>(null);
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  actionError = signal('');
  successMessage = signal('');
  steps = APPLICATION_STEPS;
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.companyService.getApplication(this.id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  fullName(detail: ApplicationDetail): string {
    return `${detail.applicant.firstNames} ${detail.applicant.lastNames}`;
  }

  letters(detail: ApplicationDetail): string {
    return initials(this.fullName(detail));
  }

  photoUrl(detail: ApplicationDetail): string {
    return publicFileUrl('photos', detail.applicant.photo ?? '');
  }

  age(birthDate: string | null): number | null {
    if (!birthDate) {
      return null;
    }
    const today = todayInBolivia();
    let age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
    if (today.slice(5) < birthDate.slice(5, 10)) {
      age--;
    }
    return age;
  }

  totalYears(experiences: Experience[]): number {
    let total = 0;
    for (const experience of experiences) {
      total += Number(experience.years);
    }
    return Math.round(total * 10) / 10;
  }

  matchedSkills(detail: ApplicationDetail): OfferSkillMatch[] {
    const result: OfferSkillMatch[] = [];
    for (const skill of detail.offerSkills) {
      if (skill.matched) {
        result.push(skill);
      }
    }
    return result;
  }

  missingSkills(detail: ApplicationDetail): OfferSkillMatch[] {
    const result: OfferSkillMatch[] = [];
    for (const skill of detail.offerSkills) {
      if (!skill.matched) {
        result.push(skill);
      }
    }
    return result;
  }

  // Una postulación rechazada muestra solo de dónde partió, igual que la ve el postulante
  timelineSteps(detail: ApplicationDetail): string[] {
    if (detail.status === 'RECHAZADO') {
      return ['POSTULADO'];
    }
    return this.steps;
  }

  stepDone(detail: ApplicationDetail, step: string): boolean {
    if (detail.status === 'RECHAZADO') {
      return step === 'POSTULADO';
    }
    return this.steps.indexOf(detail.status) >= this.steps.indexOf(step);
  }

  nextStatus(status: string): string | null {
    return nextApplicationStatus(status);
  }

  years(value: number): string {
    return formatYears(value);
  }

  matchColor(match: number): string {
    return matchTextColor(match);
  }

  statusClass(status: string): string {
    return applicationStatusClass(status);
  }

  statusLabel(status: string): string {
    return statusLabel(status);
  }

  level(value: string): string {
    return levelLabel(value);
  }

  date(value: string | null): string {
    return formatDate(value);
  }

  period(experience: Experience): string {
    const start = formatDate(experience.startDate).slice(3);
    const end = experience.endDate ? formatDate(experience.endDate).slice(3) : 'actualidad';
    return `${start} – ${end}`;
  }

  changeStatus(status: string): void {
    const question =
      status === 'RECHAZADO'
        ? '¿Rechazar esta postulación? Esta decisión es definitiva.'
        : `¿Pasar la postulación a ${statusLabel(status)}?`;
    if (!confirm(question)) {
      return;
    }

    this.sending.set(true);
    this.actionError.set('');
    this.successMessage.set('');
    this.companyService.updateApplicationStatus(this.id, status).subscribe({
      next: () => {
        this.sending.set(false);
        this.successMessage.set(`La postulación pasó a ${statusLabel(status)}.`);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.actionError.set(getErrorMessage(error));
        this.load();
      },
    });
  }

  downloadCv(): void {
    this.actionError.set('');
    const newWindow = window.open('', '_blank');
    this.companyService.getApplicationCv(this.id).subscribe({
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
        this.actionError.set(getErrorMessage(error));
      },
    });
  }
}
