import { Component, input, signal } from '@angular/core';
import { initials, publicFileUrl } from '../../core/utils/format';

@Component({
  selector: 'app-company-logo',
  template: `
    @if (logo() && !failed()) {
      <img
        [src]="logoUrl()"
        [alt]="'Logo de ' + name()"
        class="emp-logo"
        [class.lg]="large()"
        (error)="failed.set(true)"
      />
    } @else {
      <span class="emp-logo" [class.lg]="large()" aria-hidden="true">{{ letters() }}</span>
    }
  `,
})
export class CompanyLogo {
  name = input.required<string>();
  logo = input<string | null>(null);
  large = input(false);
  failed = signal(false);

  logoUrl(): string {
    return publicFileUrl('logos', this.logo() ?? '');
  }

  letters(): string {
    return initials(this.name());
  }
}
