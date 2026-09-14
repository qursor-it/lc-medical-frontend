import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  PaidOrderItemFileSummary,
  PaidOrderItemsPageResponse,
} from '../models/paid-order-item.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaidOrderItemsService {
  private readonly http = inject(HttpClient);

  getPaidOrderItems(
    page: number,
    size: number,
    search = '',
    month = '',
    customer = '',
  ): Observable<PaidOrderItemsPageResponse> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    if (month) {
      params = params.set('month', month);
    }

    if (customer) {
      params = params.set('customer', customer);
    }

    return this.http.get<PaidOrderItemsPageResponse>(`${environment.apiBaseUrl}/paid-order-items`, { params });
  }

  getRecentFiles(limit = 5): Observable<PaidOrderItemFileSummary[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<PaidOrderItemFileSummary[]>(
      `${environment.apiBaseUrl}/paid-order-items/recent-files`,
      { params },
    );
  }
}
