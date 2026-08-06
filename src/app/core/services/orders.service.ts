import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CommissionSummaryResponse,
  OrderListItem,
  OrderPaymentStatusResponse,
  PageResponse,
  UpdateOrderRequest,
} from '../models/order.models';
import { environment } from '../../../environments/environment';

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

    return this.http.get<PageResponse<OrderListItem>>(`${environment.apiBaseUrl}/orders`, { params });
  }

  getOrderDetail(id: number): Observable<OrderPaymentStatusResponse> {
    return this.http.get<OrderPaymentStatusResponse>(`${environment.apiBaseUrl}/orders/${id}`);
  }

  getCommissionSummary(month = ''): Observable<CommissionSummaryResponse> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<CommissionSummaryResponse>(
      `${environment.apiBaseUrl}/orders/commission-summary`,
      { params },
    );
  }

  updateOrder(id: number, request: UpdateOrderRequest): Observable<OrderPaymentStatusResponse> {
    return this.http.put<OrderPaymentStatusResponse>(`${environment.apiBaseUrl}/orders/${id}`, request);
  }

  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/orders/${id}`);
  }
}
