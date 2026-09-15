import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { OrdersService } from './orders.service';

describe('OrdersService agent invoicing API', () => {
  let service: OrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the commission date range and invoicing filter', () => {
    service.getCommissionSummary('2026-01', '2026-03', 'NOT_INVOICED').subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === `${environment.apiBaseUrl}/orders/commission-summary`,
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe('2026-01');
    expect(request.request.params.get('to')).toBe('2026-03');
    expect(request.request.params.get('invoicingStatus')).toBe('NOT_INVOICED');
    request.flush({});
  });

  it('keeps the default ALL filter backward compatible', () => {
    service.getCommissionSummary().subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === `${environment.apiBaseUrl}/orders/commission-summary`,
    );
    expect(request.request.params.has('invoicingStatus')).toBeFalse();
    request.flush({});
  });

  it('updates a single or batch of agent invoicing statuses', () => {
    service.updateAgentInvoicingStatus({ orderIds: [12, 18, 12], invoiced: true }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/orders/agent-invoicing-status`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ orderIds: [12, 18, 12], invoiced: true });
    request.flush(null);
  });
});
