import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogItem } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  getCatalog(type: string): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${environment.apiUrl}/catalogs`, {
      params: { type: type },
    });
  }
}
