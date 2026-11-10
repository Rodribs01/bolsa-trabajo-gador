import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FavoritePage } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/favorites`;

  findMine(): Observable<FavoritePage> {
    return this.http.get<FavoritePage>(this.url, { params: { limit: 100 } });
  }

  add(offerId: number): Observable<unknown> {
    return this.http.post(`${this.url}/${offerId}`, {});
  }

  remove(offerId: number): Observable<unknown> {
    return this.http.delete(`${this.url}/${offerId}`);
  }
}
