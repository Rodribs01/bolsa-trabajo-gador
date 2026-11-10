import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Education } from '../../../../core/models/applicant.model';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { getErrorMessage } from '../../../../core/utils/error-message';

@Component({
  selector: 'app-education-section',
  imports: [ReactiveFormsModule],
  templateUrl: './education-section.html',
})
export class EducationSection {
  private applicantService = inject(ApplicantService);
  private formBuilder = inject(FormBuilder);

  educations = input.required<Education[]>();
  saved = output<void>();

  showForm = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal('');
  sending = signal(false);
  currentYear = new Date().getFullYear();

  educationForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    institution: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    graduationYear: [
      '',
      [Validators.required, Validators.min(1950), Validators.max(this.currentYear)],
    ],
    nationalTitleNumber: ['', [Validators.maxLength(30)]],
  });

  isInvalid(field: string): boolean {
    const control = this.educationForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  startAdd(): void {
    this.educationForm.reset();
    this.editingId.set(null);
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  startEdit(education: Education): void {
    this.educationForm.setValue({
      title: education.title,
      institution: education.institution,
      graduationYear: String(education.graduationYear),
      nationalTitleNumber: education.nationalTitleNumber ?? '',
    });
    this.editingId.set(education.id);
    this.errorMessage.set('');
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.educationForm.invalid) {
      this.educationForm.markAllAsTouched();
      return;
    }

    const values = this.educationForm.getRawValue();
    const data = {
      title: values.title.trim(),
      institution: values.institution.trim(),
      graduationYear: Number(values.graduationYear),
      nationalTitleNumber: values.nationalTitleNumber.trim() || null,
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.applicantService.updateEducation(editingId, data)
      : this.applicantService.addEducation(data);

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

  remove(education: Education): void {
    if (!confirm(`¿Eliminar "${education.title}" de tu formación?`)) {
      return;
    }
    this.applicantService.deleteEducation(education.id).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
