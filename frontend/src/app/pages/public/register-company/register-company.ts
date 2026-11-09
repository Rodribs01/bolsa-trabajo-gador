import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogItem } from '../../../core/models/catalog.model';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import {
  CI_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  passwordsMatch,
} from '../../../core/utils/validators';
import { PasswordRules } from '../../../shared/password-rules/password-rules';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-register-company',
  imports: [ReactiveFormsModule, RouterLink, PasswordRules],
  templateUrl: './register-company.html',
})
export class RegisterCompany implements OnInit {
  private authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  sectors = signal<CatalogItem[]>([]);
  municipalities = signal<CatalogItem[]>([]);
  logo = signal<File | null>(null);
  document = signal<File | null>(null);
  logoError = signal('');
  documentError = signal('');
  errorMessage = signal('');
  sending = signal(false);
  submitted = signal(false);
  showPassword = signal(false);

  companyForm = this.formBuilder.nonNullable.group(
    {
      nit: ['', [Validators.required, Validators.pattern(/^\d{5,20}$/)]],
      businessName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      sectorId: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      legalRepresentative: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
      ],
      representativeCi: ['', [Validators.required, Validators.pattern(CI_PATTERN)]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      municipalityId: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
      declaration: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch('password', 'confirmPassword') },
  );

  ngOnInit(): void {
    this.catalogService.getCatalog('RUBRO').subscribe({
      next: (items) => this.sectors.set(items),
    });
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => this.municipalities.set(items),
    });
  }

  isInvalid(field: string): boolean {
    const control = this.companyForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  passwordsDiffer(): boolean {
    return (
      this.companyForm.controls.confirmPassword.touched &&
      this.companyForm.hasError('passwordsDoNotMatch')
    );
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.logoError.set('');
    this.logo.set(null);
    if (!file) {
      return;
    }
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      this.logoError.set('El logo debe ser una imagen PNG o JPG.');
      input.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      this.logoError.set('El logo debe pesar como máximo 2 MB.');
      input.value = '';
      return;
    }
    this.logo.set(file);
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.documentError.set('');
    this.document.set(null);
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf') {
      this.documentError.set('El documento de respaldo debe ser un PDF.');
      input.value = '';
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      this.documentError.set('El documento debe pesar como máximo 5 MB.');
      input.value = '';
      return;
    }
    this.document.set(file);
  }

  removeLogo(input: HTMLInputElement): void {
    input.value = '';
    this.logo.set(null);
  }

  removeDocument(input: HTMLInputElement): void {
    input.value = '';
    this.document.set(null);
  }

  fileSize(file: File): string {
    if (file.size < 1024 * 1024) {
      return `${Math.ceil(file.size / 1024)} KB`;
    }
    return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  }

  submit(): void {
    this.submitted.set(true);
    if (this.companyForm.invalid || !this.document()) {
      this.companyForm.markAllAsTouched();
      if (!this.document() && !this.documentError()) {
        this.documentError.set('El documento de respaldo es obligatorio.');
      }
      return;
    }

    const values = this.companyForm.getRawValue();
    const data = new FormData();
    data.append('nit', values.nit.trim());
    data.append('businessName', values.businessName.trim());
    data.append('sectorId', values.sectorId);
    data.append('description', values.description.trim());
    data.append('legalRepresentative', values.legalRepresentative.trim());
    data.append('representativeCi', values.representativeCi.trim().toUpperCase());
    data.append('phone', values.phone.trim());
    data.append('email', values.email.trim().toLowerCase());
    data.append('municipalityId', values.municipalityId);
    data.append('address', values.address.trim());
    data.append('password', values.password);
    data.append('supportDocument', this.document() as File);
    const logo = this.logo();
    if (logo) {
      data.append('logo', logo);
    }

    this.sending.set(true);
    this.errorMessage.set('');
    this.authService.registerCompany(data).subscribe({
      next: () => {
        this.sending.set(false);
        this.router.navigate(['/register/company/sent'], {
          state: {
            businessName: values.businessName.trim(),
            nit: values.nit.trim(),
            email: values.email.trim().toLowerCase(),
          },
        });
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }
}
