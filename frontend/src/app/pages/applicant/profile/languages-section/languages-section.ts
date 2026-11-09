import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantLanguage } from '../../../../core/models/applicant.model';
import { CatalogItem } from '../../../../core/models/catalog.model';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { getErrorMessage } from '../../../../core/utils/error-message';
import { levelLabel } from '../../../../core/utils/status';

@Component({
  selector: 'app-languages-section',
  imports: [ReactiveFormsModule],
  templateUrl: './languages-section.html',
})
export class LanguagesSection implements OnInit {
  private applicantService = inject(ApplicantService);
  private catalogService = inject(CatalogService);
  private formBuilder = inject(FormBuilder);

  languages = input.required<ApplicantLanguage[]>();
  saved = output<void>();

  options = signal<CatalogItem[]>([]);
  errorMessage = signal('');
  sending = signal(false);
  levels = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'NATIVO'];

  languageForm = this.formBuilder.nonNullable.group({
    languageId: ['', [Validators.required]],
    level: ['INTERMEDIO', [Validators.required]],
  });

  ngOnInit(): void {
    this.catalogService.getCatalog('IDIOMA').subscribe({
      next: (items) => this.options.set(items),
    });
  }

  label(level: string): string {
    return levelLabel(level);
  }

  availableOptions(): CatalogItem[] {
    const usedIds: number[] = [];
    for (const language of this.languages()) {
      usedIds.push(language.languageId);
    }
    const result: CatalogItem[] = [];
    for (const option of this.options()) {
      if (!usedIds.includes(option.id)) {
        result.push(option);
      }
    }
    return result;
  }

  add(): void {
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();
      return;
    }
    const values = this.languageForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');
    this.applicantService.addLanguage(Number(values.languageId), values.level).subscribe({
      next: () => {
        this.sending.set(false);
        this.languageForm.reset();
        this.saved.emit();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  changeLevel(language: ApplicantLanguage, event: Event): void {
    const level = (event.target as HTMLSelectElement).value;
    this.errorMessage.set('');
    this.applicantService.updateLanguage(language.id, level).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  remove(language: ApplicantLanguage): void {
    this.errorMessage.set('');
    this.applicantService.deleteLanguage(language.id).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
