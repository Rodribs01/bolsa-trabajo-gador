import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const RESEND_WAIT_SECONDS = 60;

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword implements OnDestroy {
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private timer: number | null = null;

  sent = signal(false);
  sending = signal(false);
  errorMessage = signal('');
  secondsLeft = signal(0);

  emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  ngOnDestroy(): void {
    this.stopTimer();
  }

  submit(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');
    const email = this.emailForm.getRawValue().email.trim().toLowerCase();

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
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
