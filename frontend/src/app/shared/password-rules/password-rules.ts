import { Component, input } from '@angular/core';

@Component({
  selector: 'app-password-rules',
  template: `
    <ul class="list-unstyled small mt-2 mb-0">
      <li [class]="hasLength() ? 'text-success' : 'text-secondary'">
        <i class="bi me-1" [class]="hasLength() ? 'bi-check-circle-fill' : 'bi-circle'"></i>
        Entre 8 y 72 caracteres
      </li>
      <li [class]="hasCases() ? 'text-success' : 'text-secondary'">
        <i class="bi me-1" [class]="hasCases() ? 'bi-check-circle-fill' : 'bi-circle'"></i>
        Una mayúscula y una minúscula
      </li>
      <li [class]="hasNumber() ? 'text-success' : 'text-secondary'">
        <i class="bi me-1" [class]="hasNumber() ? 'bi-check-circle-fill' : 'bi-circle'"></i>
        Al menos un número
      </li>
    </ul>
  `,
})
export class PasswordRules {
  password = input<string>('');

  hasLength(): boolean {
    const length = this.password().length;
    return length >= 8 && length <= 72;
  }

  hasCases(): boolean {
    return /[a-z]/.test(this.password()) && /[A-Z]/.test(this.password());
  }

  hasNumber(): boolean {
    return /\d/.test(this.password());
  }
}
