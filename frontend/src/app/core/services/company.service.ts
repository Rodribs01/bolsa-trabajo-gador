import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicationDetail,
  Company,
  CompanyOffer,
  CompanyOfferPage,
  OfferApplicationPage,
  OfferData,
} from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/company`;

  getMyCompany(): Observable<Company> {
    return this.http.get<Company>(`${environment.apiUrl}/companies/me`);
  }

  getOffers(status: string, page: number): Observable<CompanyOfferPage> {
    const params: Record<string, string | number> = { page: page, limit: 20 };
    if (status) {
      params['status'] = status;
    }
    return this.http.get<CompanyOfferPage>(`${this.url}/job-offers`, { params: params });
  }

  getOffer(id: number): Observable<CompanyOffer> {
    return this.http.get<CompanyOffer>(`${this.url}/job-offers/${id}`);
  }

  createOffer(data: OfferData): Observable<CompanyOffer> {
    return this.http.post<CompanyOffer>(`${this.url}/job-offers`, data);
  }

  updateOffer(id: number, data: OfferData): Observable<CompanyOffer> {
    return this.http.put<CompanyOffer>(`${this.url}/job-offers/${id}`, data);
  }

  submitOffer(id: number): Observable<CompanyOffer> {
    return this.http.patch<CompanyOffer>(`${this.url}/job-offers/${id}/submit`, {});
  }

  closeOffer(id: number): Observable<CompanyOffer> {
    return this.http.patch<CompanyOffer>(`${this.url}/job-offers/${id}/close`, {});
  }

  cancelOffer(id: number): Observable<CompanyOffer> {
    return this.http.patch<CompanyOffer>(`${this.url}/job-offers/${id}/cancel`, {});
  }

  duplicateOffer(id: number): Observable<CompanyOffer> {
    return this.http.post<CompanyOffer>(`${this.url}/job-offers/${id}/duplicate`, {});
  }

  getApplications(offerId: number, status: string, page: number): Observable<OfferApplicationPage> {
    const params: Record<string, string | number> = { page: page, limit: 20 };
    if (status) {
      params['status'] = status;
    }
    return this.http.get<OfferApplicationPage>(`${this.url}/job-offers/${offerId}/applications`, {
      params: params,
    });
  }

  getApplication(id: number): Observable<ApplicationDetail> {
    return this.http.get<ApplicationDetail>(`${this.url}/applications/${id}`);
  }

  getApplicationCv(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/applications/${id}/cv`, { responseType: 'blob' });
  }

  updateApplicationStatus(id: number, status: string): Observable<unknown> {
    return this.http.patch(`${this.url}/applications/${id}/status`, { status: status });
  }
}
