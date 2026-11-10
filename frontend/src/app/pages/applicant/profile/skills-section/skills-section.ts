import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantSkill, SkillOption } from '../../../../core/models/applicant.model';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { getErrorMessage } from '../../../../core/utils/error-message';
import { levelLabel } from '../../../../core/utils/status';

@Component({
  selector: 'app-skills-section',
  imports: [ReactiveFormsModule],
  templateUrl: './skills-section.html',
})
export class SkillsSection implements OnInit {
  private applicantService = inject(ApplicantService);
  private catalogService = inject(CatalogService);
  private formBuilder = inject(FormBuilder);

  skills = input.required<ApplicantSkill[]>();
  saved = output<void>();

  options = signal<SkillOption[]>([]);
  errorMessage = signal('');
  sending = signal(false);
  levels = ['BASICO', 'INTERMEDIO', 'AVANZADO'];

  skillForm = this.formBuilder.nonNullable.group({
    skillId: ['', [Validators.required]],
    level: ['INTERMEDIO', [Validators.required]],
  });

  ngOnInit(): void {
    this.catalogService.getSkills().subscribe({
      next: (items) => this.options.set(items),
    });
  }

  label(level: string): string {
    return levelLabel(level);
  }

  availableOptions(): SkillOption[] {
    const usedIds: number[] = [];
    for (const skill of this.skills()) {
      usedIds.push(skill.skillId);
    }
    const result: SkillOption[] = [];
    for (const option of this.options()) {
      if (!usedIds.includes(option.id)) {
        result.push(option);
      }
    }
    return result;
  }

  add(): void {
    if (this.skillForm.invalid) {
      this.skillForm.markAllAsTouched();
      return;
    }
    const values = this.skillForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');
    this.applicantService.addSkill(Number(values.skillId), values.level).subscribe({
      next: () => {
        this.sending.set(false);
        this.skillForm.reset();
        this.saved.emit();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  changeLevel(skill: ApplicantSkill, event: Event): void {
    const level = (event.target as HTMLSelectElement).value;
    this.errorMessage.set('');
    this.applicantService.updateSkill(skill.id, level).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  remove(skill: ApplicantSkill): void {
    this.errorMessage.set('');
    this.applicantService.deleteSkill(skill.id).subscribe({
      next: () => this.saved.emit(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }
}
