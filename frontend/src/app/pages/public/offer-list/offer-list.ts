import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { CatalogItem } from '../../../core/models/catalog.model';
import { JobOfferFilters, JobOfferSummary } from '../../../core/models/job-offer.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { formatMoney } from '../../../core/utils/format';
import { OfferCard } from '../../../shared/offer-card/offer-card';

const PAGE_SIZE = 12;

interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-offer-list',
  imports: [ReactiveFormsModule, RouterLink, OfferCard],
  templateUrl: './offer-list.html',
})
export class OfferList implements OnInit {
  private jobOfferService = inject(JobOfferService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  offers = signal<JobOfferSummary[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  errorMessage = signal('');
  showFilters = signal(false);
  chips = signal<FilterChip[]>([]);
  professions = signal<CatalogItem[]>([]);
  municipalities = signal<CatalogItem[]>([]);
  modalities = signal<CatalogItem[]>([]);

  filterForm = this.formBuilder.nonNullable.group({
    keyword: [''],
    professionId: [''],
    municipalityId: [''],
    modalityId: [''],
    minSalary: [''],
    includeNegotiable: [true],
    sort: ['recent'],
  });

  ngOnInit(): void {
    this.catalogService.getCatalog('PROFESION').subscribe({
      next: (items) => {
        this.professions.set(items);
        this.updateChips();
      },
    });
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => {
        this.municipalities.set(items);
        this.updateChips();
      },
    });
    this.catalogService.getCatalog('MODALIDAD').subscribe({
      next: (items) => {
        this.modalities.set(items);
        this.updateChips();
      },
    });

    this.route.queryParamMap.subscribe((params) => {
      this.fillForm(params);
      this.page.set(Number(params.get('page')) || 1);
      this.updateChips();
      this.loadOffers();
    });
  }

  applyFilters(): void {
    this.showFilters.set(false);
    this.navigate(1);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.navigate(1);
  }

  removeFilter(key: string): void {
    if (key === 'keyword') {
      this.filterForm.controls.keyword.setValue('');
    } else if (key === 'professionId') {
      this.filterForm.controls.professionId.setValue('');
    } else if (key === 'municipalityId') {
      this.filterForm.controls.municipalityId.setValue('');
    } else if (key === 'modalityId') {
      this.filterForm.controls.modalityId.setValue('');
    } else if (key === 'minSalary') {
      this.filterForm.controls.minSalary.setValue('');
    }
    this.navigate(1);
  }

  goToPage(page: number): void {
    this.navigate(page);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / PAGE_SIZE));
  }

  firstShown(): number {
    return (this.page() - 1) * PAGE_SIZE + 1;
  }

  lastShown(): number {
    return Math.min(this.page() * PAGE_SIZE, this.total());
  }

  private navigate(page: number): void {
    const values = this.filterForm.getRawValue();
    const minSalary = values.minSalary.trim();

    this.router.navigate(['/job-offers'], {
      queryParams: {
        keyword: values.keyword.trim() || null,
        professionId: values.professionId || null,
        municipalityId: values.municipalityId || null,
        modalityId: values.modalityId || null,
        minSalary: minSalary || null,
        includeNegotiable: minSalary ? String(values.includeNegotiable) : null,
        sort: values.sort === 'recent' ? null : values.sort,
        page: page > 1 ? page : null,
      },
    });
  }

  private fillForm(params: ParamMap): void {
    this.filterForm.setValue({
      keyword: params.get('keyword') ?? '',
      professionId: params.get('professionId') ?? '',
      municipalityId: params.get('municipalityId') ?? '',
      modalityId: params.get('modalityId') ?? '',
      minSalary: params.get('minSalary') ?? '',
      includeNegotiable: params.get('includeNegotiable') !== 'false',
      sort: params.get('sort') ?? 'recent',
    });
  }

  private loadOffers(): void {
    const values = this.filterForm.getRawValue();
    const filters: JobOfferFilters = {
      keyword: values.keyword.trim(),
      professionId: values.professionId,
      municipalityId: values.municipalityId,
      modalityId: values.modalityId,
      minSalary: values.minSalary.trim(),
      sort: values.sort,
      page: String(this.page()),
    };
    if (filters.minSalary) {
      filters.includeNegotiable = String(values.includeNegotiable);
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.jobOfferService.search(filters, PAGE_SIZE).subscribe({
      next: (result) => {
        this.offers.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.offers.set([]);
        this.total.set(0);
        this.loading.set(false);
      },
    });
  }

  private updateChips(): void {
    const values = this.filterForm.getRawValue();
    const chips: FilterChip[] = [];

    if (values.keyword) {
      chips.push({ key: 'keyword', label: values.keyword });
    }
    if (values.professionId) {
      chips.push({
        key: 'professionId',
        label: this.findName(this.professions(), values.professionId),
      });
    }
    if (values.municipalityId) {
      chips.push({
        key: 'municipalityId',
        label: this.findName(this.municipalities(), values.municipalityId),
      });
    }
    if (values.modalityId) {
      chips.push({ key: 'modalityId', label: this.findName(this.modalities(), values.modalityId) });
    }
    if (values.minSalary) {
      chips.push({ key: 'minSalary', label: `desde ${formatMoney(Number(values.minSalary))}` });
    }
    this.chips.set(chips);
  }

  private findName(items: CatalogItem[], id: string): string {
    for (const item of items) {
      if (String(item.id) === id) {
        return item.name;
      }
    }
    return '...';
  }
}
