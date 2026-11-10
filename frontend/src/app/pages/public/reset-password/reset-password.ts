import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { PASSWORD_PATTERN, passwordsMatch } from '../../../core/utils/validators';
import { PasswordRules } from '../../../shared/password-rules/password-rules';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, PasswordRules],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private token = '';

  validLink = signal(true);
  errorMessage = signal('');
  sending = signal(false);
  showPassword = signal(false);

  passwordForm = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch('newPassword', 'confirmPassword') },
  );

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!/^[a-f0-9]{64}$/.test(this.token)) {
      this.validLink.set(false);
      return;
    }
    // El enlace es de un solo uso
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
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

    this.sending.set(true);
    this.errorMessage.set('');
    this.authService
      .resetPassword(this.token, this.passwordForm.getRawValue().newPassword)
      .subscribe({
        next: (response) => {
          this.sending.set(false);
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
