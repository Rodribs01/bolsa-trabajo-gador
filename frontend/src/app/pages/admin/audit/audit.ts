import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuditEntry } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-audit',
  imports: [ReactiveFormsModule],
  templateUrl: './audit.html',
})
export class Audit implements OnInit {
  private adminService = inject(AdminService);
  private formBuilder = inject(FormBuilder);

  actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CHANGE_STATUS'];
  tables = signal<string[]>([]);
  filters = this.formBuilder.nonNullable.group({
    from: [''],
    to: [''],
    action: [''],
    tableName: [''],
    user: [''],
  });

  entries = signal<AuditEntry[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  selected = signal<AuditEntry | null>(null);

  ngOnInit(): void {
    this.adminService.getAuditTables().subscribe({
      next: (tables) => this.tables.set(tables),
    });
    this.load();
  }

  search(): void {
    const values = this.filters.getRawValue();
    if (values.from && values.to && values.from > values.to) {
      this.errorMessage.set('La fecha "desde" no puede ser posterior a la fecha "hasta"');
      return;
    }
    this.page.set(1);
    this.load();
  }

  clear(): void {
    this.filters.reset();
    this.search();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.adminService.getAudit(this.filters.getRawValue(), this.page(), PAGE_SIZE).subscribe({
      next: (result) => {
        this.entries.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.load();
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / PAGE_SIZE));
  }

  actionClass(action: string): string {
    if (action === 'CREATE') {
      return 'text-bg-success';
    }
    if (action === 'UPDATE') {
      return 'text-bg-primary';
    }
    if (action === 'DELETE') {
      return 'text-bg-danger';
    }
    if (action === 'LOGIN') {
      return 'text-bg-secondary';
    }
    return 'text-bg-warning';
  }

  userLabel(entry: AuditEntry): string {
    if (entry.user) {
      return entry.user.email;
    }
    return 'Sistema';
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  toJson(data: Record<string, unknown> | null): string {
    if (!data) {
      return 'Sin datos';
    }
    return JSON.stringify(data, null, 2);
  }

  changedFields(entry: AuditEntry): string[] {
    const previous = entry.previousData ?? {};
    const current = entry.newData ?? {};
    const keys: string[] = [];
    for (const key of Object.keys(previous)) {
      keys.push(key);
    }
    for (const key of Object.keys(current)) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
    const changed: string[] = [];
    for (const key of keys) {
      if (JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
        changed.push(key);
      }
    }
    return changed;
  }
}
