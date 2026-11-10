import { Component, inject, input, output, signal } from '@angular/core';
import { ApplicantService } from '../../../../core/services/applicant.service';
import { getErrorMessage } from '../../../../core/utils/error-message';

const MAX_CV_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-cv-section',
  templateUrl: './cv-section.html',
})
export class CvSection {
  private applicantService = inject(ApplicantService);

  hasCv = input.required<boolean>();
  saved = output<void>();

  errorMessage = signal('');
  successMessage = signal('');
  uploading = signal(false);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.errorMessage.set('');
    this.successMessage.set('');
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf') {
      this.errorMessage.set('El CV debe ser un archivo PDF.');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      this.errorMessage.set('El CV debe pesar como máximo 5 MB.');
      return;
    }

    this.uploading.set(true);
    this.applicantService.uploadCv(file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.successMessage.set('Tu CV se guardó correctamente.');
        this.saved.emit();
      },
      error: (error) => {
        this.uploading.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  view(): void {
    this.errorMessage.set('');
    const newWindow = window.open('', '_blank');
    this.applicantService.getCv().subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        if (newWindow) {
          newWindow.location.href = url;
        } else {
          window.location.href = url;
        }
      },
      error: () => {
        newWindow?.close();
        this.errorMessage.set('No pudimos abrir tu CV. Intenta subirlo de nuevo.');
      },
    });
  }
}
