import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { InvoiceDetail, InvoicePageResponse } from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly http = inject(HttpClient);

  getInvoices(page: number, size: number, search = '', deepSearch = false): Observable<InvoicePageResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('deepSearch', deepSearch);

    if (search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.http.get<InvoicePageResponse>('/api/invoices', { params });
  }

  getInvoiceDetail(id: number): Observable<InvoiceDetail> {
    return this.http.get<InvoiceDetail>(`/api/invoices/${id}`);
  }
}
