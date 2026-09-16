import { of, throwError } from 'rxjs';

import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import {
  AgentCommissionSummary,
  AgentMonthlyCommission,
  AgentOrderCommission,
} from '../../../../core/models/order.models';
import { AuthService } from '../../../../core/services/auth.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { AgentsPage } from './agents-page';

describe('AgentsPage agent invoicing controls', () => {
  const storageKey = 'lc-medical-auth';
  let page: any;
  let fixture: ComponentFixture<AgentsPage>;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let messages: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        token: 'test-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        user: { id: 1, email: 'admin@example.com', fullName: 'Admin', role: 'ADMIN', active: true },
      }),
    );

    ordersService = jasmine.createSpyObj<OrdersService>('OrdersService', [
      'getCommissionSummary',
      'updateAgentInvoicingStatus',
    ]);
    ordersService.getCommissionSummary.and.returnValue(of(emptySummary()));
    ordersService.updateAgentInvoicingStatus.and.returnValue(of(void 0));
    messages = jasmine.createSpyObj<MessageService>('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [AgentsPage],
      providers: [
        provideHttpClient(),
        provideAnimationsAsync(),
        { provide: MessageService, useValue: messages },
        AuthService,
        { provide: OrdersService, useValue: ordersService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AgentsPage);
    page = fixture.componentInstance;
  });

  afterEach(() => localStorage.removeItem(storageKey));

  it('selects an individual paid order for invoicing', () => {
    const order = paidOrder(44);

    page.toggleOrderSelection(order, new Event('change'));

    expect(Array.from(page.selectedOrderIds())).toEqual([44]);
    expect(page.isOrderSelected(order)).toBeTrue();
  });

  it('does not make unpaid orders selectable and labels them as non-invoiceable', () => {
    const unpaid = paidOrder(45, 'UNPAID');

    expect(page.canManageInvoicing(unpaid)).toBeFalse();
    expect(page.invoicingStatusLabel(unpaid)).toBe('Non fatturabile');
  });

  it('toggles one paid order without opening the order row', () => {
    const order = paidOrder(46);
    const event = new Event('change');
    spyOn(event, 'stopPropagation');

    page.toggleOrderSelection(order, event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(page.isOrderSelected(order)).toBeTrue();

    page.toggleOrderSelection(order, event);
    expect(page.isOrderSelected(order)).toBeFalse();
  });

  it('updates the selected orders, clears the selection and reloads the summary', () => {
    page.selectedOrderIds.set(new Set([46, 47]));

    page.updateSelectedInvoicing(true);

    expect(ordersService.updateAgentInvoicingStatus).toHaveBeenCalledOnceWith({
      orderIds: [46, 47],
      invoiced: true,
    });
    expect(page.selectedOrderIds().size).toBe(0);
    expect(ordersService.getCommissionSummary).toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('keeps the selection and exposes the backend message when an update fails', () => {
    ordersService.updateAgentInvoicingStatus.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { error: 'Un ordine non è ancora pagato.' },
          }),
      ),
    );
    page.selectedOrderIds.set(new Set([48]));

    page.updateSelectedInvoicing(true);

    expect(Array.from(page.selectedOrderIds())).toEqual([48]);
    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        detail: 'Un ordine non è ancora pagato.',
      }),
    );
  });

  it('renders invoiced and to-invoice badges as text, not color alone', () => {
    fixture.detectChanges();
    const invoiced = { ...paidOrder(49), agentInvoicedAt: '2026-09-15T10:00:00Z' };
    const pendingInvoice = paidOrder(50);
    const row = agentRow([month('2026-09', [invoiced, pendingInvoice])]);
    page.summary.set({
      ...emptySummary(),
      agents: [row],
      totalOrders: 2,
      totalPaidAmount: 200,
      totalCommission: 20,
    });
    page.expandedAgent.set('1');
    page.expandedMonths.set(new Set(['1:2026-09']));

    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('FATTURATO');
    expect(text).toContain('DA FATTURARE');
  });
});

function emptySummary() {
  return {
    from: null,
    to: null,
    agents: [],
    totalOrders: 0,
    totalPaidAmount: 0,
    totalCommission: 0,
  };
}

function paidOrder(id: number, paymentStatus: 'PAID' | 'UNPAID' = 'PAID'): AgentOrderCommission {
  return {
    orderId: id,
    orderNumber: `ORD-${id}`,
    clientCode: null,
    customerName: null,
    payerName: null,
    paidAmount: 100,
    commissionAmount: 10,
    paymentStatus,
    agentInvoicedAt: null,
    payments: [],
  };
}

function month(value: string, orders: AgentOrderCommission[]): AgentMonthlyCommission {
  return { month: value, orderCount: orders.length, paidAmount: 100, commissionAmount: 10, orders };
}

function agentRow(months: AgentMonthlyCommission[]): AgentCommissionSummary {
  return {
    agentId: 1,
    agentName: 'Mario Rossi',
    agentEmail: null,
    orderCount: months.reduce((total, current) => total + current.orderCount, 0),
    paidAmount: 100,
    commissionAmount: 10,
    months,
    pendingOrders: [],
  };
}
