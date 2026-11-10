import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminCatalog,
  AdminSettings,
  AdminSkill,
  AuditFilters,
  AuditPage,
  CatalogForm,
  CompanyPage,
  DashboardSummary,
  PendingOfferPage,
  SkillForm,
} from '../models/admin.model';
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

  getCatalogs(type: string): Observable<AdminCatalog[]> {
    return this.http.get<AdminCatalog[]>(`${this.url}/catalogs`, { params: { type: type } });
  }

  createCatalog(form: CatalogForm): Observable<AdminCatalog> {
    return this.http.post<AdminCatalog>(`${this.url}/catalogs`, form);
  }

  updateCatalog(id: number, form: CatalogForm): Observable<AdminCatalog> {
    return this.http.put<AdminCatalog>(`${this.url}/catalogs/${id}`, form);
  }

  getSkills(): Observable<AdminSkill[]> {
    return this.http.get<AdminSkill[]>(`${this.url}/skills`);
  }

  createSkill(form: SkillForm): Observable<AdminSkill> {
    return this.http.post<AdminSkill>(`${this.url}/skills`, form);
  }

  updateSkill(id: number, form: SkillForm): Observable<AdminSkill> {
    return this.http.put<AdminSkill>(`${this.url}/skills/${id}`, form);
  }

  getSettings(): Observable<AdminSettings> {
    return this.http.get<AdminSettings>(`${this.url}/settings`);
  }

  updateSettings(activeOffersLimit: number): Observable<AdminSettings> {
    return this.http.put<AdminSettings>(`${this.url}/settings`, {
      activeOffersLimit: activeOffersLimit,
    });
  }

  getAudit(filters: AuditFilters, page: number, limit: number): Observable<AuditPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.action) {
      params = params.set('action', filters.action);
    }
    if (filters.tableName) {
      params = params.set('tableName', filters.tableName);
    }
    if (filters.user) {
      params = params.set('user', filters.user);
    }
    return this.http.get<AuditPage>(`${this.url}/audit`, { params: params });
  }

  getAuditTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/audit/tables`);
  }

  downloadReport(type: string, filters: Record<string, string>): Observable<Blob> {
    let params = new HttpParams();
    for (const key of Object.keys(filters)) {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    }
    return this.http.get(`${this.url}/reports/${type}`, {
      params: params,
      responseType: 'blob',
    });
  }
}
