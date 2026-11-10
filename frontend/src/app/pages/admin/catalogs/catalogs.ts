import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCatalog, AdminSkill } from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { getErrorMessage } from '../../../core/utils/error-message';

interface CatalogTab {
  type: string;
  label: string;
  singular: string;
}

interface CatalogRow {
  id: number;
  name: string;
  detail: string;
  parentId: number | null;
  active: boolean;
}

const SKILLS = 'HABILIDAD';

@Component({
  selector: 'app-catalogs',
  imports: [ReactiveFormsModule],
  templateUrl: './catalogs.html',
})
export class Catalogs implements OnInit {
  private adminService = inject(AdminService);
  private formBuilder = inject(FormBuilder);

  tabs: CatalogTab[] = [
    { type: 'RUBRO', label: 'Rubros', singular: 'rubro' },
    { type: 'PROFESION', label: 'Profesiones', singular: 'profesión' },
    { type: SKILLS, label: 'Habilidades', singular: 'habilidad' },
    { type: 'TIPO_CONTRATO', label: 'Tipos de contrato', singular: 'tipo de contrato' },
    { type: 'MODALIDAD', label: 'Modalidades', singular: 'modalidad' },
    { type: 'DEPARTAMENTO', label: 'Departamentos', singular: 'departamento' },
    { type: 'MUNICIPIO', label: 'Municipios', singular: 'municipio' },
    { type: 'IDIOMA', label: 'Idiomas', singular: 'idioma' },
  ];

  tab = signal<CatalogTab>(this.tabs[0]);
  rows = signal<CatalogRow[]>([]);
  departments = signal<AdminCatalog[]>([]);
  search = signal('');
  statusFilter = signal('ALL');
  loading = signal(true);
  errorMessage = signal('');
  successMessage = signal('');

  editing = signal<CatalogRow | null>(null);
  formOpen = signal(false);
  saving = signal(false);
  formError = signal('');

  form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    parentId: [0],
    category: ['', [Validators.maxLength(60)]],
    active: [true],
  });

  filteredRows = computed(() => {
    const text = this.search().trim().toLowerCase();
    const result: CatalogRow[] = [];
    for (const row of this.rows()) {
      if (text && !row.name.toLowerCase().includes(text)) {
        continue;
      }
      if (this.statusFilter() === 'ACTIVE' && !row.active) {
        continue;
      }
      if (this.statusFilter() === 'INACTIVE' && row.active) {
        continue;
      }
      result.push(row);
    }
    return result;
  });

  ngOnInit(): void {
    this.load();
  }

  selectTab(tab: CatalogTab): void {
    this.tab.set(tab);
    this.search.set('');
    this.statusFilter.set('ALL');
    this.successMessage.set('');
    this.load();
  }

  isSkills(): boolean {
    return this.tab().type === SKILLS;
  }

  isMunicipality(): boolean {
    return this.tab().type === 'MUNICIPIO';
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    if (this.isSkills()) {
      this.adminService.getSkills().subscribe({
        next: (skills) => this.showSkills(skills),
        error: (error) => this.showError(error),
      });
      return;
    }
    if (this.isMunicipality() && this.departments().length === 0) {
      this.adminService.getCatalogs('DEPARTAMENTO').subscribe({
        next: (departments) => this.departments.set(departments),
      });
    }
    this.adminService.getCatalogs(this.tab().type).subscribe({
      next: (catalogs) => this.showCatalogs(catalogs),
      error: (error) => this.showError(error),
    });
  }

  showCatalogs(catalogs: AdminCatalog[]): void {
    const rows: CatalogRow[] = [];
    for (const catalog of catalogs) {
      rows.push({
        id: catalog.id,
        name: catalog.name,
        detail: catalog.parent ? catalog.parent.name : '',
        parentId: catalog.parentId,
        active: catalog.active,
      });
    }
    this.rows.set(rows);
    this.loading.set(false);
  }

  showSkills(skills: AdminSkill[]): void {
    const rows: CatalogRow[] = [];
    for (const skill of skills) {
      rows.push({
        id: skill.id,
        name: skill.name,
        detail: skill.category ?? '',
        parentId: null,
        active: skill.active,
      });
    }
    this.rows.set(rows);
    this.loading.set(false);
  }

  showError(error: HttpErrorResponse): void {
    this.errorMessage.set(getErrorMessage(error));
    this.loading.set(false);
  }

  openNew(): void {
    this.editing.set(null);
    this.formError.set('');
    let parentId = 0;
    if (this.isMunicipality() && this.departments().length > 0) {
      parentId = this.findOruroId();
    }
    this.form.reset({ name: '', parentId: parentId, category: '', active: true });
    this.formOpen.set(true);
  }

  openEdit(row: CatalogRow): void {
    this.editing.set(row);
    this.formError.set('');
    this.form.reset({
      name: row.name,
      parentId: row.parentId ?? 0,
      category: row.detail,
      active: row.active,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isMunicipality() && !this.form.controls.parentId.value) {
      this.formError.set('Selecciona el departamento del municipio');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const values = this.form.getRawValue();
    const row = this.editing();

    if (this.isSkills()) {
      const skillForm = { name: values.name, category: values.category, active: values.active };
      if (row) {
        this.adminService.updateSkill(row.id, skillForm).subscribe({
          next: () => this.afterSave(`Se guardó "${values.name}"`),
          error: (error) => this.afterError(error),
        });
      } else {
        this.adminService.createSkill({ name: values.name, category: values.category }).subscribe({
          next: () => this.afterSave(`Se agregó "${values.name}"`),
          error: (error) => this.afterError(error),
        });
      }
      return;
    }

    let parentId: number | undefined = undefined;
    if (this.isMunicipality()) {
      parentId = values.parentId;
    }
    if (row) {
      this.adminService
        .updateCatalog(row.id, { name: values.name, parentId: parentId, active: values.active })
        .subscribe({
          next: () => this.afterSave(`Se guardó "${values.name}"`),
          error: (error) => this.afterError(error),
        });
    } else {
      this.adminService
        .createCatalog({ type: this.tab().type, name: values.name, parentId: parentId })
        .subscribe({
          next: () => this.afterSave(`Se agregó "${values.name}"`),
          error: (error) => this.afterError(error),
        });
    }
  }

  toggleActive(row: CatalogRow): void {
    const action = row.active ? 'Desactivar' : 'Activar';
    if (!confirm(`¿${action} "${row.name}"?`)) {
      return;
    }
    this.errorMessage.set('');
    const message = row.active ? `Se desactivó "${row.name}"` : `Se activó "${row.name}"`;
    if (this.isSkills()) {
      this.adminService
        .updateSkill(row.id, { name: row.name, category: row.detail, active: !row.active })
        .subscribe({
          next: () => this.afterSave(message),
          error: (error) => this.showError(error),
        });
      return;
    }
    let parentId: number | undefined = undefined;
    if (row.parentId) {
      parentId = row.parentId;
    }
    this.adminService
      .updateCatalog(row.id, { name: row.name, parentId: parentId, active: !row.active })
      .subscribe({
        next: () => this.afterSave(message),
        error: (error) => this.showError(error),
      });
  }

  afterSave(message: string): void {
    this.saving.set(false);
    this.formOpen.set(false);
    this.successMessage.set(message);
    this.load();
  }

  afterError(error: HttpErrorResponse): void {
    this.saving.set(false);
    this.formError.set(getErrorMessage(error));
  }

  findOruroId(): number {
    for (const department of this.departments()) {
      if (department.name === 'Oruro') {
        return department.id;
      }
    }
    return this.departments()[0].id;
  }

  countActive(): number {
    let total = 0;
    for (const row of this.rows()) {
      if (row.active) {
        total++;
      }
    }
    return total;
  }
}
