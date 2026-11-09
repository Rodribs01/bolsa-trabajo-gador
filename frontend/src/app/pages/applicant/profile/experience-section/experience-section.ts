import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Experience } from '../../../../core/models/applicant.model';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { getErrorMessage } from '../../../../core/utils/error-message';
import { formatDate, todayInBolivia } from '../../../../core/utils/format';

@Component({
  selector: 'app-experience-section',
  imports: [ReactiveFormsModule],
  templateUrl: './experience-section.html',
})
export class ExperienceSection {
  private applicantService = inject(ApplicantService);
  private formBuilder = inject(FormBuilder);

  experiences = input.required<Experience[]>();
  saved = output<void>();

  showForm = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  sending = signal(false);
  today = todayInBolivia();

  experienceForm = this.formBuilder.nonNullable.group({
    company: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    location: ['', [Validators.maxLength(100)]],
    startDate: ['', [Validators.required]],
    currentJob: [false],
    endDate: [''],
    description: ['', [Validators.maxLength(2000)]],
  });

  isInvalid(field: string): boolean {
    const control = this.experienceForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  datesError(): string {
    const values = this.experienceForm.getRawValue();
    if (values.startDate && values.startDate > this.today) {
      return 'La fecha de inicio no puede ser futura.';
    }
    if (!values.currentJob && values.endDate && values.endDate < values.startDate) {
      return 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    if (!values.currentJob && values.endDate > this.today) {
      return 'La fecha de fin no puede ser futura.';
    }
    return '';
  }

  period(experience: Experience): string {
    const start = formatDate(experience.startDate).slice(3);
    const end = experience.endDate ? formatDate(experience.endDate).slice(3) : 'actualidad';
    const years = Number(experience.years);
    let duration = '';
    if (years >= 1) {
      duration = ` · ${years.toLocaleString('es-BO')} ${years === 1 ? 'año' : 'años'}`;
    }
    return `${start} – ${end}${duration}`;
  }

  startAdd(): void {
    this.experienceForm.reset();
    this.editingId.set(null);
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  startEdit(experience: Experience): void {
    this.experienceForm.setValue({
      company: experience.company,
      position: experience.position,
      location: experience.location ?? '',
      startDate: experience.startDate,
      currentJob: experience.endDate === null,
      endDate: experience.endDate ?? '',
      description: experience.description ?? '',
    });
    this.editingId.set(experience.id);
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const values = this.experienceForm.getRawValue();
    const needsEndDate = !values.currentJob && !values.endDate;
    if (this.experienceForm.invalid || this.datesError() || needsEndDate) {
      this.experienceForm.markAllAsTouched();
      if (needsEndDate) {
        this.errorMessage.set('Indica la fecha de fin o marca que trabajas ahí actualmente.');
      }
      return;
    }

    const data = {
      company: values.company.trim(),
      position: values.position.trim(),
      location: values.location.trim() || null,
      startDate: values.startDate,
      endDate: values.currentJob ? null : values.endDate,
      description: values.description.trim() || null,
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.applicantService.updateExperience(editingId, data)
      : this.applicantService.addExperience(data);

    this.sending.set(true);
    this.errorMessage.set('');
    request.subscribe({
      next: () => {
        this.sending.set(false);
        this.cancel();
        this.saved.emit();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  remove(experience: Experience): void {
    if (!confirm(`¿Eliminar "${experience.position}" de tu experiencia?`)) {
      return;
    }
    this.applicantService.deleteExperience(experience.id).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
