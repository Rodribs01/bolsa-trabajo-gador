import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  successMessage = signal<string>(history.state?.message ?? '');
  errorMessage = signal('');
  lockedUntil = signal('');
  sending = signal(false);
  showPassword = signal(false);

  loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const values = this.loginForm.getRawValue();
    this.sending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.lockedUntil.set('');

    this.authService.login(values.email, values.password).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.router.navigateByUrl(this.nextUrl(response.user.role));
      },
      error: (error: HttpErrorResponse) => {
        this.sending.set(false);
        this.handleError(error);
      },
    });
  }

  private handleError(error: HttpErrorResponse): void {
    const code = error.error?.code;
    if (code === 'CORREO_SIN_VERIFICAR') {
      this.router.navigate(['/verify-email'], {
        state: { email: error.error.email, canResend: true },
      });
      return;
    }
    if (code === 'CUENTA_BLOQUEADA') {
      const until = new Date(error.error.lockedUntil);
      this.lockedUntil.set(
        until.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      );
      return;
    }
    this.errorMessage.set(getErrorMessage(error));
  }

  private nextUrl(role: string): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return this.authService.homeForRole(role);
  }
}
