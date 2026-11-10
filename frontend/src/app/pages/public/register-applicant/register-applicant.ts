import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import {
  CI_ISSUED_IN,
  CI_PATTERN,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  passwordsMatch,
} from '../../../core/utils/validators';
import { PasswordRules } from '../../../shared/password-rules/password-rules';

@Component({
  selector: 'app-register-applicant',
  imports: [ReactiveFormsModule, RouterLink, PasswordRules],
  templateUrl: './register-applicant.html',
})
export class RegisterApplicant {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  ciOptions = CI_ISSUED_IN;
  errorMessage = signal('');
  sending = signal(false);
  showPassword = signal(false);

  registerForm = this.formBuilder.nonNullable.group(
    {
      ci: ['', [Validators.required, Validators.pattern(CI_PATTERN)]],
      ciIssuedIn: ['OR', [Validators.required]],
      firstNames: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(74)]],
      lastNames: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(74)]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch('password', 'confirmPassword') },
  );

  isInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  passwordsDiffer(): boolean {
    return (
      this.registerForm.controls.confirmPassword.touched &&
      this.registerForm.hasError('passwordsDoNotMatch')
    );
  }

  submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const values = this.registerForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');

    this.authService
      .registerApplicant({
        ci: values.ci.trim().toUpperCase(),
        ciIssuedIn: values.ciIssuedIn,
        firstNames: values.firstNames.trim(),
        lastNames: values.lastNames.trim(),
        phone: values.phone.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.router.navigate(['/verify-email'], {
            state: { email: values.email.trim().toLowerCase(), canResend: false },
          });
        },
        error: (error) => {
          this.sending.set(false);
          this.errorMessage.set(getErrorMessage(error));
        },
      });
  }
}
