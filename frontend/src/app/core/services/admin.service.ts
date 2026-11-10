import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyPage, DashboardSummary, PendingOfferPage } from '../models/admin.model';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.url}/dashboard`);
  }

  getCompanies(status: string, page: number, limit: number): Observable<CompanyPage> {
    return this.http.get<CompanyPage>(`${this.url}/companies`, {
      params: { status: status, page: page, limit: limit },
    });
  }

  getCompanyDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/companies/${id}/document`, { responseType: 'blob' });
  }

  approveCompany(id: number): Observable<Company> {
    return this.http.patch<Company>(`${this.url}/companies/${id}/approve`, {});
  }

  rejectCompany(id: number, reason: string): Observable<Company> {
    return this.http.patch<Company>(`${this.url}/companies/${id}/reject`, { reason: reason });
  }

  suspendCompany(id: number): Observable<Company> {
    return this.http.patch<Company>(`${this.url}/companies/${id}/suspend`, {});
  }

  getPendingOffers(): Observable<PendingOfferPage> {
    return this.http.get<PendingOfferPage>(`${this.url}/job-offers/pending`, {
      params: { limit: 100 },
    });
  }

  approveOffer(id: number): Observable<unknown> {
    return this.http.patch(`${this.url}/job-offers/${id}/approve`, {});
  }

  returnOffer(id: number, observation: string): Observable<unknown> {
    return this.http.patch(`${this.url}/job-offers/${id}/return`, { observation: observation });
  }
}
