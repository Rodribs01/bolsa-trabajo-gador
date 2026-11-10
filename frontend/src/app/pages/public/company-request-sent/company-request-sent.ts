import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-company-request-sent',
  imports: [RouterLink],
  templateUrl: './company-request-sent.html',
})
export class CompanyRequestSent {
  businessName: string = history.state?.businessName ?? '';
  nit: string = history.state?.nit ?? '';
  email: string = history.state?.email ?? '';
}
