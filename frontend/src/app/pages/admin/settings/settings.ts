import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminSettings } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private adminService = inject(AdminService);
  private formBuilder = inject(FormBuilder);

  settings = signal<AdminSettings | null>(null);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form = this.formBuilder.nonNullable.group({
    activeOffersLimit: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
  });

  ngOnInit(): void {
    this.adminService.getSettings().subscribe({
      next: (settings) => this.show(settings),
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  show(settings: AdminSettings): void {
    this.settings.set(settings);
    this.form.reset({ activeOffersLimit: settings.activeOffersLimit });
    this.loading.set(false);
  }

  save(): void {
    const value = this.form.controls.activeOffersLimit.value;
    if (this.form.invalid || !Number.isInteger(value)) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.adminService.updateSettings(value).subscribe({
      next: (settings) => {
        this.show(settings);
        this.saving.set(false);
        this.successMessage.set('Se guardó el límite de ofertas activas');
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.saving.set(false);
      },
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
