import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogItem } from '../../../core/models/catalog.model';
import { JobOfferSummary } from '../../../core/models/job-offer.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { JobOfferService } from '../../../core/services/job-offer.service';
import { OfferCard } from '../../../shared/offer-card/offer-card';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, OfferCard],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private jobOfferService = inject(JobOfferService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  offers = signal<JobOfferSummary[]>([]);
  totalOffers = signal(0);
  municipalities = signal<CatalogItem[]>([]);
  loading = signal(true);
  error = signal(false);
  frequentSearches = ['Técnico', 'Contador', 'Chofer', 'Sistemas'];

  searchForm = this.formBuilder.nonNullable.group({
    keyword: [''],
    municipalityId: [''],
  });

  ngOnInit(): void {
    this.catalogService.getCatalog('MUNICIPIO').subscribe({
      next: (items) => this.municipalities.set(items),
    });

    this.jobOfferService.search({ sort: 'recent' }, 6).subscribe({
      next: (page) => {
        this.offers.set(page.items);
        this.totalOffers.set(page.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  search(): void {
    const values = this.searchForm.getRawValue();
    this.router.navigate(['/job-offers'], {
      queryParams: {
        keyword: values.keyword.trim() || null,
        municipalityId: values.municipalityId || null,
      },
    });
  }
}
