import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const RESEND_WAIT_SECONDS = 60;

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private timer: number | null = null;

  email = signal<string>(history.state?.email ?? '');
  errorMessage = signal('');
  infoMessage = signal('');
  sending = signal(false);
  secondsLeft = signal(0);
  showChangeEmail = signal(false);

  emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  codeForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  changeEmailForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.maxLength(72)]],
    newEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  ngOnInit(): void {
    // El código recién se envió al registrarse, por eso se espera antes de permitir otro
    if (this.email() && history.state?.canResend === false) {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  useEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    this.email.set(this.emailForm.getRawValue().email.trim().toLowerCase());
  }

  verify(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');
    this.authService.verifyOtp(this.email(), this.codeForm.getRawValue().code).subscribe({
      next: () => {
        this.sending.set(false);
        this.router.navigate(['/login'], {
          state: { message: 'Tu correo fue verificado. Ya puedes iniciar sesión.' },
        });
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  resend(): void {
    this.errorMessage.set('');
    this.infoMessage.set('');
    this.authService.resendOtp(this.email()).subscribe({
      next: (response) => {
        this.infoMessage.set(response.message);
        this.startTimer();
      },
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  changeEmail(): void {
    if (this.changeEmailForm.invalid) {
      this.changeEmailForm.markAllAsTouched();
      return;
    }

    const values = this.changeEmailForm.getRawValue();
    const newEmail = values.newEmail.trim().toLowerCase();
    this.sending.set(true);
    this.errorMessage.set('');
    this.infoMessage.set('');

    this.authService.changeEmail(this.email(), values.password, newEmail).subscribe({
      next: (response) => {
        this.sending.set(false);
        this.email.set(newEmail);
        this.infoMessage.set(response.message);
        this.showChangeEmail.set(false);
        this.changeEmailForm.reset();
        this.codeForm.reset();
        this.startTimer();
      },
      error: (error) => {
        this.sending.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.secondsLeft.set(RESEND_WAIT_SECONDS);
    this.timer = window.setInterval(() => {
      this.secondsLeft.set(this.secondsLeft() - 1);
      if (this.secondsLeft() <= 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
