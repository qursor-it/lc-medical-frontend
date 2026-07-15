import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InvoiceDetail, InvoicePageResponse, UpdateInvoiceRequest } from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  getInvoices(
    page: number,
    size: number,
    search = '',
    deepSearch = false,
    month = '',
  ): Observable<InvoicePageResponse> {
    let params = new HttpParams().set('page', page).set('size', size).set('deepSearch', deepSearch);

    if (search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    if (month) {
      params = params.set('month', month);
    }

    return this.http.get<InvoicePageResponse>('/api/invoices', { params });
  }

  getInvoiceDetail(id: number): Observable<InvoiceDetail> {
    return this.http.get<InvoiceDetail>(`/api/invoices/${id}`);
  }

  updateInvoice(id: number, request: UpdateInvoiceRequest): Observable<InvoiceDetail> {
    return this.http.put<InvoiceDetail>(`/api/invoices/${id}`, request);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`/api/invoices/${id}`);
  }
}
