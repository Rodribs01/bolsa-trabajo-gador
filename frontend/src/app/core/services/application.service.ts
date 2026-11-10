import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplyResponse, MyApplicationPage } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/applications`;

  apply(offerId: number): Observable<ApplyResponse> {
    return this.http.post<ApplyResponse>(`${this.url}/${offerId}`, {});
  }

  findMine(): Observable<MyApplicationPage> {
    return this.http.get<MyApplicationPage>(`${this.url}/me`, { params: { limit: 100 } });
  }

  withdraw(id: number): Observable<unknown> {
    return this.http.patch(`${this.url}/${id}/withdraw`, {});
  }
}
