import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { PASSWORD_PATTERN, passwordsMatch } from '../../../core/utils/validators';
import { PasswordRules } from '../../../shared/password-rules/password-rules';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, PasswordRules],
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  errorMessage = signal('');
  sending = signal(false);

  passwordForm = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.maxLength(72)]],
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch('newPassword', 'confirmPassword') },
  );

  isInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return control !== null && control.touched && control.invalid;
  }

  passwordsDiffer(): boolean {
    return (
      this.passwordForm.controls.confirmPassword.touched &&
      this.passwordForm.hasError('passwordsDoNotMatch')
    );
  }

  submit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const values = this.passwordForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');
    this.authService.changePassword(values.currentPassword, values.newPassword).subscribe({
      next: (response) => {
        this.sending.set(false);
        // Cambiar la contraseña cierra todas las sesiones, también la actual
        this.authService.clearSession();
        this.router.navigate(['/login'], { state: { message: response.message } });
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }
}
