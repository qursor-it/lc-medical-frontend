import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  OrderListItem,
  OrderPaymentStatusResponse,
  PageResponse,
  UpdateOrderRequest,
} from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  getOrders(
    page: number,
    size: number,
    search = '',
    deepSearch = false,
    month = '',
    paymentStatus: '' | 'paid' | 'unpaid' = '',
  ): Observable<PageResponse<OrderListItem>> {
    let params = new HttpParams().set('page', page).set('size', size).set('deepSearch', deepSearch);

    if (search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    if (month) {
      params = params.set('month', month);
    }

    if (paymentStatus) {
      params = params.set('paymentStatus', paymentStatus);
    }

    return this.http.get<PageResponse<OrderListItem>>('/api/orders', { params });
  }

  getOrderDetail(id: number): Observable<OrderPaymentStatusResponse> {
    return this.http.get<OrderPaymentStatusResponse>(`/api/orders/${id}`);
  }

  updateOrder(id: number, request: UpdateOrderRequest): Observable<OrderPaymentStatusResponse> {
    return this.http.put<OrderPaymentStatusResponse>(`/api/orders/${id}`, request);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`/api/orders/${id}`);
  }
}
