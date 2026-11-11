import { Component, input, signal } from '@angular/core';
import { initials, publicFileUrl } from '../../core/utils/format';

@Component({
  selector: 'app-applicant-photo',
  template: `
    @if (photo() && failedPhoto() !== photo()) {
      <img
        [src]="photoUrl()"
        [alt]="alt()"
        class="foto-perfil"
        [class]="extraClass()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        (error)="failedPhoto.set(photo())"
      />
    } @else {
      <span
        class="foto-perfil"
        [class]="extraClass()"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.font-size.px]="fontSize()"
        aria-hidden="true"
        >{{ letters() }}</span
      >
    }
  `,
})
export class ApplicantPhoto {
  name = input.required<string>();
  photo = input<string | null>(null);
  alt = input('');
  size = input<number | null>(null);
  fontSize = input<number | null>(null);
  extraClass = input('');
  failedPhoto = signal<string | null>(null);

  photoUrl(): string {
    return publicFileUrl('photos', this.photo() ?? '');
  }

  letters(): string {
    return initials(this.name());
  }
}
