import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantProfile } from '../../../../core/models/applicant.model';
import { CatalogItem } from '../../../../core/models/catalog.model';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { getErrorMessage } from '../../../../core/utils/error-message';
import { initials, publicFileUrl, todayInBolivia } from '../../../../core/utils/format';
import { PHONE_PATTERN } from '../../../../core/utils/validators';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-personal-data',
  imports: [ReactiveFormsModule],
  templateUrl: './personal-data.html',
})
export class PersonalData implements OnInit {
  private applicantService = inject(ApplicantService);
  private catalogService = inject(CatalogService);
  private formBuilder = inject(FormBuilder);

  profile = input.required<ApplicantProfile>();
  saved = output<void>();

  municipalities = signal<CatalogItem[]>([]);
  professions = signal<CatalogItem[]>([]);
  errorMessage = signal('');
  successMessage = signal('');
  photoError = signal('');
  sending = signal(false);
  uploadingPhoto = signal(false);
  maxBirthDate = this.latestBirthDate();

  profileForm = this.formBuilder.nonNullable.group({
    firstNames: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(74)]],
    lastNames: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(74)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    birthDate: [''],
    address: ['', [Validators.maxLength(200)]],
    municipalityId: [''],
    professionId: [''],
    summary: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.fillForm();
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => this.municipalities.set(items),
    });
    this.catalogService.getCatalog('PROFESION').subscribe({
      next: (items) => this.professions.set(items),
    });
  }

  fillForm(): void {
    const profile = this.profile();
    this.profileForm.setValue({
      firstNames: profile.firstNames,
      lastNames: profile.lastNames,
      phone: profile.phone,
      birthDate: profile.birthDate ?? '',
      address: profile.address ?? '',
      municipalityId: profile.municipalityId ? String(profile.municipalityId) : '',
      professionId: profile.professionId ? String(profile.professionId) : '',
      summary: profile.summary ?? '',
    });
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
  }

  isInvalid(field: string): boolean {
    const control = this.profileForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  photoUrl(): string {
    return publicFileUrl('photos', this.profile().photo ?? '');
  }

  letters(): string {
    return initials(`${this.profile().firstNames} ${this.profile().lastNames}`);
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const values = this.profileForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.applicantService
      .updateProfile({
        firstNames: values.firstNames.trim(),
        lastNames: values.lastNames.trim(),
        phone: values.phone.trim(),
        birthDate: values.birthDate || null,
        address: values.address.trim() || null,
        municipalityId: values.municipalityId ? Number(values.municipalityId) : null,
        professionId: values.professionId ? Number(values.professionId) : null,
        summary: values.summary.trim() || null,
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.successMessage.set('Guardamos tus datos.');
          this.profileForm.markAsPristine();
          this.saved.emit();
        },
        error: (error) => {
          this.sending.set(false);
          this.errorMessage.set(getErrorMessage(error));
        },
      });
  }

  // Solo se registran postulantes mayores de 18 años
  private latestBirthDate(): string {
    const today = todayInBolivia();
    const year = Number(today.slice(0, 4)) - 18;
    return `${year}${today.slice(4)}`;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.photoError.set('');
    if (!file) {
      return;
    }
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      this.photoError.set('La foto debe ser una imagen PNG o JPG.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      this.photoError.set('La foto debe pesar como máximo 2 MB.');
      return;
    }

    this.uploadingPhoto.set(true);
    this.applicantService.uploadPhoto(file).subscribe({
      next: () => {
        this.uploadingPhoto.set(false);
        this.saved.emit();
      },
      error: (error) => {
        this.uploadingPhoto.set(false);
        this.photoError.set(getErrorMessage(error));
      },
    });
  }
}
