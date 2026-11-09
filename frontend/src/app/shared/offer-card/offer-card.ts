import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobOfferSummary } from '../../core/models/job-offer.model';
import { formatDate, formatSalary } from '../../core/utils/format';
import { CompanyLogo } from '../company-logo/company-logo';

@Component({
  selector: 'app-offer-card',
  imports: [RouterLink, CompanyLogo],
  templateUrl: './offer-card.html',
})
export class OfferCard {
  offer = input.required<JobOfferSummary>();

  salary(): string {
    return formatSalary(this.offer());
  }

  closingDate(): string {
    return formatDate(this.offer().closingDate);
  }
}
