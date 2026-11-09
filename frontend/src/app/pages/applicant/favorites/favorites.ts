import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorite } from '../../../core/models/application.model';
import { FavoriteService } from '../../../core/services/favorite.service';
import { getErrorMessage } from '../../../core/utils/error-message';
import { daysUntil, formatDate, formatSalary } from '../../../core/utils/format';
import { CompanyLogo } from '../../../shared/company-logo/company-logo';

@Component({
  selector: 'app-applicant-favorites',
  imports: [RouterLink, CompanyLogo],
  templateUrl: './favorites.html',
})
export class Favorites implements OnInit {
  private favoriteService = inject(FavoriteService);

  favorites = signal<Favorite[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.favoriteService.findMine().subscribe({
      next: (page) => {
        this.favorites.set(page.items);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  remove(favorite: Favorite): void {
    this.errorMessage.set('');
    this.favoriteService.remove(favorite.offer.id).subscribe({
      next: () => this.load(),
      error: (error) => this.errorMessage.set(getErrorMessage(error)),
    });
  }

  salary(favorite: Favorite): string {
    return formatSalary(favorite.offer);
  }

  date(value: string): string {
    return formatDate(value);
  }

  closesSoon(favorite: Favorite): boolean {
    return favorite.available && daysUntil(favorite.offer.closingDate) <= 1;
  }
}
