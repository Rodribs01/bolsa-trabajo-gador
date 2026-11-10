import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JobOfferDetail, JobOfferFilters, JobOfferPage } from '../models/job-offer.model';

@Injectable({ providedIn: 'root' })
export class JobOfferService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/job-offers`;

  search(filters: JobOfferFilters, limit: number): Observable<JobOfferPage> {
    let params = new HttpParams().set('limit', limit);
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params = params.set(key, value);
      }
    }
    return this.http.get<JobOfferPage>(this.url, { params: params });
  }

  findOne(id: number): Observable<JobOfferDetail> {
    return this.http.get<JobOfferDetail>(`${this.url}/${id}`);
  }
}
