import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { OrderPaymentStatusResponse, PageResponse } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  getOrders(page: number, size: number): Observable<PageResponse<OrderPaymentStatusResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<OrderPaymentStatusResponse>>('/api/orders', { params });
  }
}
