import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CatalogItem } from '../../../core/models/catalog.model';
import { AdminService } from '../../../core/services/admin.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { todayInBolivia } from '../../../core/utils/format';

const FILE_NAMES: Record<string, string> = {
  companies: 'Empresas',
  applicants: 'Postulantes',
  'job-offers': 'Ofertas',
  hirings: 'Contrataciones',
};

interface FilterOption {
  value: string;
  label: string;
}

interface ReportCard {
  type: string;
  title: string;
  description: string;
  icon: string;
  filterName: string;
  filterLabel: string;
  form: FormGroup;
}

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule],
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private adminService = inject(AdminService);
  private catalogService = inject(CatalogService);
  private formBuilder = inject(FormBuilder);

  companyStatuses: FilterOption[] = [
    { value: 'PENDIENTE_VALIDACION', label: 'Pendiente' },
    { value: 'APROBADA', label: 'Aprobada' },
    { value: 'RECHAZADA', label: 'Rechazada' },
    { value: 'SUSPENDIDA', label: 'Suspendida' },
  ];
  offerStatuses: FilterOption[] = [
    { value: 'EN_REVISION_GADOR', label: 'En revisión' },
    { value: 'PUBLICADA', label: 'Publicada' },
    { value: 'EN_PROCESO_SELECCION', label: 'En selección' },
    { value: 'CERRADA', label: 'Cerrada' },
    { value: 'ANULADA', label: 'Anulada' },
    { value: 'BORRADOR', label: 'Borrador' },
  ];
  municipalities = signal<FilterOption[]>([]);
  sectors = signal<FilterOption[]>([]);

  cards: ReportCard[] = [];
  downloading = signal('');
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {
    this.cards = [
      this.createCard(
        'companies',
        'Empresas',
        'Registradas y su estado de validación',
        'bi-buildings',
        'status',
        'Estado',
      ),
      this.createCard(
        'applicants',
        'Postulantes',
        'CI, nombre, profesión y celular',
        'bi-people',
        'municipalityId',
        'Municipio',
      ),
      this.createCard(
        'job-offers',
        'Ofertas por fecha',
        'Ofertas creadas en el periodo y sus postulantes',
        'bi-calendar3',
        'status',
        'Estado',
      ),
      this.createCard(
        'hirings',
        'Contrataciones por empresa',
        'Postulantes en estado Contratado, por empresa',
        'bi-person-check',
        'sectorId',
        'Rubro',
      ),
    ];
  }

  ngOnInit(): void {
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => this.municipalities.set(this.toOptions(items)),
    });
    this.catalogService.getCatalog('RUBRO').subscribe({
      next: (items) => this.sectors.set(this.toOptions(items)),
    });
  }

  createCard(
    type: string,
    title: string,
    description: string,
    icon: string,
    filterName: string,
    filterLabel: string,
  ): ReportCard {
    const today = todayInBolivia();
    return {
      type: type,
      title: title,
      description: description,
      icon: icon,
      filterName: filterName,
      filterLabel: filterLabel,
      form: this.formBuilder.nonNullable.group({
        from: [`${today.slice(0, 4)}-01-01`],
        to: [today],
        filter: [''],
      }),
    };
  }

  toOptions(items: CatalogItem[]): FilterOption[] {
    const options: FilterOption[] = [];
    for (const item of items) {
      options.push({ value: String(item.id), label: item.name });
    }
    return options;
  }

  filterOptions(card: ReportCard): FilterOption[] {
    if (card.type === 'companies') {
      return this.companyStatuses;
    }
    if (card.type === 'job-offers') {
      return this.offerStatuses;
    }
    if (card.type === 'applicants') {
      return this.municipalities();
    }
    return this.sectors();
  }

  download(card: ReportCard, format: string): void {
    const values = card.form.getRawValue();
    this.errorMessage.set('');
    this.successMessage.set('');
    if (values.from && values.to && values.from > values.to) {
      this.errorMessage.set(
        `${card.title}: la fecha "desde" no puede ser posterior a la fecha "hasta"`,
      );
      return;
    }

    const filters: Record<string, string> = {
      format: format,
      from: values.from,
      to: values.to,
    };
    filters[card.filterName] = values.filter;

    this.downloading.set(`${card.type}-${format}`);
    this.adminService.downloadReport(card.type, filters).subscribe({
      next: (file) => {
        const fileName = `${FILE_NAMES[card.type]}_${values.from || 'inicio'}_${values.to || todayInBolivia()}.${format}`;
        this.saveFile(file, fileName);
        this.downloading.set('');
        this.successMessage.set(`Se descargó ${fileName}`);
      },
      error: (error) => {
        this.downloading.set('');
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }

  saveFile(file: Blob, fileName: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
