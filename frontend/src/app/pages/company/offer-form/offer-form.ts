import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SkillOption } from '../../../core/models/applicant.model';
import { CatalogItem } from '../../../core/models/catalog.model';
import { CompanyOffer, OfferData } from '../../../core/models/company.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { CompanyService } from '../../../core/services/company.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { todayInBolivia } from '../../../core/utils/format';

interface SelectedSkill {
  skillId: number;
  name: string;
  required: boolean;
}

@Component({
  selector: 'app-offer-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './offer-form.html',
})
export class OfferForm implements OnInit {
  private companyService = inject(CompanyService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  offerId: number | null = null;
  observation = signal('');
  loading = signal(true);
  sending = signal(false);
  errorMessage = signal('');
  submitted = signal(false);

  contractTypes = signal<CatalogItem[]>([]);
  modalities = signal<CatalogItem[]>([]);
  municipalities = signal<CatalogItem[]>([]);
  professions = signal<CatalogItem[]>([]);
  skillOptions = signal<SkillOption[]>([]);

  selectedProfessions = signal<CatalogItem[]>([]);
  selectedSkills = signal<SelectedSkill[]>([]);
  minClosingDate = this.tomorrow();

  offerForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
    requiredRequirements: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(2000)],
    ],
    desiredRequirements: ['', [Validators.maxLength(2000)]],
    yearsOfExperience: ['0', [Validators.required, Validators.min(0), Validators.max(50)]],
    contractTypeId: ['', [Validators.required]],
    modalityId: ['', [Validators.required]],
    municipalityId: ['', [Validators.required]],
    salaryToNegotiate: [false],
    minSalary: [''],
    maxSalary: [''],
    benefits: [''],
    closingDate: ['', [Validators.required]],
    vacancies: ['1', [Validators.required, Validators.min(1), Validators.max(1000)]],
    professionToAdd: [''],
    skillToAdd: [''],
  });

  ngOnInit(): void {
    this.catalogService.getCatalog('TIPO_CONTRATO').subscribe({
      next: (items) => this.contractTypes.set(items),
    });
    this.catalogService.getCatalog('MODALIDAD').subscribe({
      next: (items) => this.modalities.set(items),
    });
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => this.municipalities.set(items),
    });
    this.catalogService.getCatalog('PROFESION').subscribe({
      next: (items) => this.professions.set(items),
    });
    this.catalogService.getSkills().subscribe({
      next: (items) => this.skillOptions.set(items),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.offerId = Number(id);
      this.loadOffer(this.offerId);
    } else {
      this.loading.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const control = this.offerForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  availableProfessions(): CatalogItem[] {
    const result: CatalogItem[] = [];
    for (const profession of this.professions()) {
      if (!this.selectedProfessions().some((item) => item.id === profession.id)) {
        result.push(profession);
      }
    }
    return result;
  }

  availableSkills(): SkillOption[] {
    const result: SkillOption[] = [];
    for (const skill of this.skillOptions()) {
      if (!this.selectedSkills().some((item) => item.skillId === skill.id)) {
        result.push(skill);
      }
    }
    return result;
  }

  addProfession(): void {
    const id = Number(this.offerForm.controls.professionToAdd.value);
    for (const profession of this.professions()) {
      if (profession.id === id) {
        this.selectedProfessions.set([...this.selectedProfessions(), profession]);
      }
    }
    this.offerForm.controls.professionToAdd.setValue('');
  }

  removeProfession(id: number): void {
    const result: CatalogItem[] = [];
    for (const profession of this.selectedProfessions()) {
      if (profession.id !== id) {
        result.push(profession);
      }
    }
    this.selectedProfessions.set(result);
  }

  addSkill(): void {
    const id = Number(this.offerForm.controls.skillToAdd.value);
    for (const skill of this.skillOptions()) {
      if (skill.id === id) {
        this.selectedSkills.set([
          ...this.selectedSkills(),
          { skillId: skill.id, name: skill.name, required: true },
        ]);
      }
    }
    this.offerForm.controls.skillToAdd.setValue('');
  }

  setRequired(skillId: number, required: boolean): void {
    const result: SelectedSkill[] = [];
    for (const skill of this.selectedSkills()) {
      if (skill.skillId === skillId) {
        result.push({ skillId: skill.skillId, name: skill.name, required: required });
      } else {
        result.push(skill);
      }
    }
    this.selectedSkills.set(result);
  }

  removeSkill(skillId: number): void {
    const result: SelectedSkill[] = [];
    for (const skill of this.selectedSkills()) {
      if (skill.skillId !== skillId) {
        result.push(skill);
      }
    }
    this.selectedSkills.set(result);
  }

  salaryError(): string {
    const values = this.offerForm.getRawValue();
    if (values.salaryToNegotiate) {
      return '';
    }
    if (values.minSalary === '' || values.maxSalary === '') {
      return 'Indica el salario mínimo y máximo, o marca "A tratar".';
    }
    if (isNaN(Number(values.minSalary)) || isNaN(Number(values.maxSalary))) {
      return 'El salario debe ser un número.';
    }
    if (Number(values.minSalary) < 0 || Number(values.maxSalary) < 0) {
      return 'El salario no puede ser negativo.';
    }
    if (Number(values.minSalary) > Number(values.maxSalary)) {
      return 'El salario mínimo no puede ser mayor que el máximo.';
    }
    return '';
  }

  closingDateError(): string {
    const closingDate = this.offerForm.controls.closingDate.value;
    if (closingDate && closingDate < this.minClosingDate) {
      return 'La fecha de cierre debe ser posterior a hoy.';
    }
    return '';
  }

  save(sendToReview: boolean): void {
    this.submitted.set(true);
    const hasErrors =
      this.offerForm.invalid ||
      this.salaryError() !== '' ||
      this.closingDateError() !== '' ||
      this.selectedProfessions().length === 0 ||
      this.selectedSkills().length === 0;
    if (hasErrors) {
      this.offerForm.markAllAsTouched();
      this.errorMessage.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    const request = this.offerId
      ? this.companyService.updateOffer(this.offerId, this.buildData())
      : this.companyService.createOffer(this.buildData());

    this.sending.set(true);
    this.errorMessage.set('');
    request.subscribe({
      next: (offer) => {
        if (sendToReview) {
          this.sendToReview(offer.id);
        } else {
          this.sending.set(false);
          this.router.navigate(['/company/job-offers']);
        }
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  private sendToReview(offerId: number): void {
    this.companyService.submitOffer(offerId).subscribe({
      next: () => {
        this.sending.set(false);
        this.router.navigate(['/company/job-offers']);
      },
      error: (error) => {
        this.sending.set(false);
        this.offerId = offerId;
        this.errorMessage.set(
          `Guardamos el borrador, pero no se pudo enviar a revisión: ${getErrorMessage(error)}`,
        );
      },
    });
  }

  private buildData(): OfferData {
    const values = this.offerForm.getRawValue();
    const professionIds: number[] = [];
    for (const profession of this.selectedProfessions()) {
      professionIds.push(profession.id);
    }
    const skills: { skillId: number; required: boolean }[] = [];
    for (const skill of this.selectedSkills()) {
      skills.push({ skillId: skill.skillId, required: skill.required });
    }
    const benefits: string[] = [];
    for (const line of values.benefits.split('\n')) {
      if (line.trim()) {
        benefits.push(line.trim());
      }
    }

    const data: OfferData = {
      title: values.title.trim(),
      description: values.description.trim(),
      requiredRequirements: values.requiredRequirements.trim(),
      professionIds: professionIds,
      yearsOfExperience: Number(values.yearsOfExperience),
      contractTypeId: Number(values.contractTypeId),
      modalityId: Number(values.modalityId),
      municipalityId: Number(values.municipalityId),
      salaryToNegotiate: values.salaryToNegotiate,
      closingDate: values.closingDate,
      vacancies: Number(values.vacancies),
      skills: skills,
      benefits: benefits,
    };
    if (values.desiredRequirements.trim()) {
      data.desiredRequirements = values.desiredRequirements.trim();
    }
    if (!values.salaryToNegotiate) {
      data.minSalary = Number(values.minSalary);
      data.maxSalary = Number(values.maxSalary);
    }
    return data;
  }

  private loadOffer(id: number): void {
    this.companyService.getOffer(id).subscribe({
      next: (offer) => {
        if (offer.status !== 'BORRADOR') {
          this.router.navigate(['/company/job-offers']);
          return;
        }
        this.fillForm(offer);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  private fillForm(offer: CompanyOffer): void {
    this.observation.set(offer.observation ?? '');
    this.offerForm.patchValue({
      title: offer.title,
      description: offer.description,
      requiredRequirements: offer.requiredRequirements,
      desiredRequirements: offer.desiredRequirements ?? '',
      yearsOfExperience: String(offer.yearsOfExperience),
      contractTypeId: String(offer.contractTypeId),
      modalityId: String(offer.modalityId),
      municipalityId: String(offer.municipalityId),
      salaryToNegotiate: offer.salaryToNegotiate,
      minSalary: offer.minSalary !== null ? String(Number(offer.minSalary)) : '',
      maxSalary: offer.maxSalary !== null ? String(Number(offer.maxSalary)) : '',
      benefits: (offer.benefits ?? []).join('\n'),
      closingDate: offer.closingDate,
      vacancies: String(offer.vacancies),
    });

    const professions: CatalogItem[] = [];
    for (const item of offer.professions ?? []) {
      professions.push({
        id: item.professionId,
        name: item.profession.name,
        type: 'PROFESION',
        parentId: null,
        order: 0,
      });
    }
    this.selectedProfessions.set(professions);

    const skills: SelectedSkill[] = [];
    for (const item of offer.skills ?? []) {
      skills.push({ skillId: item.skillId, name: item.skill.name, required: item.required });
    }
    this.selectedSkills.set(skills);
  }

  private tomorrow(): string {
    const today = new Date(todayInBolivia() + 'T12:00:00');
    today.setDate(today.getDate() + 1);
    return today.toISOString().slice(0, 10);
  }
}
