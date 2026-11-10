import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyApplication } from '../../../core/models/application.model';
import { ApplicationService } from '../../../core/services/application.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatDate } from '../../../core/utils/format';
import {
  APPLICATION_STEPS,
  applicationStatusClass,
  statusLabel,
  isFinished,
} from '../../../core/utils/status';

interface TimelineStep {
  label: string;
  done: boolean;
}

@Component({
  selector: 'app-applicant-applications',
  imports: [RouterLink],
  templateUrl: './applications.html',
})
export class Applications implements OnInit {
  private applicationService = inject(ApplicationService);

  applications = signal<MyApplication[]>([]);
  selected = signal<MyApplication | null>(null);
  filter = signal('all');
  search = signal('');
  loading = signal(true);
  errorMessage = signal('');
  actionMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.applicationService.findMine().subscribe({
      next: (page) => {
        this.applications.set(page.items);
        this.loading.set(false);
        const selected = this.selected();
        if (selected) {
          this.selected.set(this.findById(selected.id));
        }
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  visibleApplications(): MyApplication[] {
    const text = this.search().trim().toLowerCase();
    const result: MyApplication[] = [];
    for (const application of this.applications()) {
      const finished = isFinished(application.status);
      if (this.filter() === 'active' && finished) {
        continue;
      }
      if (this.filter() === 'finished' && !finished) {
        continue;
      }
      const title = application.offer.title.toLowerCase();
      const company = application.offer.company.businessName.toLowerCase();
      if (text && !title.includes(text) && !company.includes(text)) {
        continue;
      }
      result.push(application);
    }
    return result;
  }

  countActive(): number {
    let total = 0;
    for (const application of this.applications()) {
      if (!isFinished(application.status)) {
        total++;
      }
    }
    return total;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  statusLabel(status: string): string {
    return statusLabel(status);
  }

  statusClass(status: string): string {
    return applicationStatusClass(status);
  }

  date(value: string): string {
    return formatDate(value);
  }

  matchColor(match: number): string {
    if (match >= 75) {
      return 'bg-success';
    }
    if (match >= 50) {
      return 'bg-warning';
    }
    return 'bg-secondary';
  }

  timeline(application: MyApplication): TimelineStep[] {
    const steps: TimelineStep[] = [];
    if (application.status === 'RECHAZADO' || application.status === 'RETIRADO') {
      steps.push({ label: 'POSTULADO', done: true });
      steps.push({ label: application.status, done: true });
      return steps;
    }
    const currentIndex = APPLICATION_STEPS.indexOf(application.status);
    for (let i = 0; i < APPLICATION_STEPS.length; i++) {
      steps.push({ label: APPLICATION_STEPS[i], done: currentIndex >= i });
    }
    return steps;
  }

  withdraw(application: MyApplication): void {
    if (
      !confirm(
        `¿Retirar tu postulación a "${application.offer.title}"? No podrás volver a postular a esta oferta.`,
      )
    ) {
      return;
    }
    this.actionMessage.set('');
    this.errorMessage.set('');
    this.applicationService.withdraw(application.id).subscribe({
      next: () => {
        this.actionMessage.set('Retiraste tu postulación.');
        this.load();
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.load();
      },
    });
  }

  private findById(id: number): MyApplication | null {
    for (const application of this.applications()) {
      if (application.id === id) {
        return application;
      }
    }
    return null;
  }
}
