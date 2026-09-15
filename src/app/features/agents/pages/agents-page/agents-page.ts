import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize, switchMap, throwError } from 'rxjs';

import {
  AgentCommissionSummary,
  AgentOrderCommission,
  AgentPaymentStatus,
  CommissionSummaryResponse,
  InvoicingStatus,
  OrderLineSummary,
  OrderPaymentStatusResponse,
  PaymentStatus,
} from '../../../../core/models/order.models';
import { AuthService } from '../../../../core/services/auth.service';
import { OrdersService } from '../../../../core/services/orders.service';
import { lineStatusClass, lineStatusLabel, lineStatusTitle } from '../../../../shared/line-status';

@Component({
  selector: 'app-agents-page',
  imports: [
    ButtonModule,
    DatePickerModule,
    DialogModule,
    FormsModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './agents-page.html',
})
export class AgentsPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly summary = signal<CommissionSummaryResponse | null>(null);
  protected readonly fromDate = signal<Date | null>(null);
  protected readonly toDate = signal<Date | null>(null);
  protected readonly preset = signal<string | null>('all');
  protected readonly expandedAgent = signal<string | null>(null);
  protected readonly expandedMonths = signal<ReadonlySet<string>>(new Set());
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly detailLoading = signal(false);
  protected readonly detailVisible = signal(false);
  protected readonly selectedOrder = signal<OrderPaymentStatusResponse | null>(null);
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly invoicingFilter = signal<InvoicingStatus>('ALL');
  protected readonly selectedOrderIds = signal<ReadonlySet<number>>(new Set());
  protected readonly invoicingUpdating = signal(false);
  protected readonly invoicingOrderId = signal<number | null>(null);

  protected readonly presetOptions = [
    { label: 'Tutto', value: 'all' },
    { label: 'Anno corrente', value: 'currentYear' },
    { label: 'Anno precedente', value: 'previousYear' },
    { label: 'Ultimi 3 mesi', value: 'last3' },
    { label: 'Ultimi 6 mesi', value: 'last6' },
  ];

  protected readonly invoicingFilterOptions: Array<{ label: string; value: InvoicingStatus }> = [
    { label: 'Tutti', value: 'ALL' },
    { label: 'Da fatturare', value: 'NOT_INVOICED' },
    { label: 'Fatturati', value: 'INVOICED' },
  ];

  protected readonly agents = computed(() => this.summary()?.agents ?? []);
  protected readonly selectedOrderCount = computed(() => this.selectedOrderIds().size);

  protected readonly rangeLabel = computed(() => {
    const from = this.fromDate();
    const to = this.toDate();

    if (from && to) {
      return `${this.capitalize(this.monthLabel(from))} – ${this.capitalize(this.monthLabel(to))}`;
    }
    if (from) {
      return `Da ${this.monthLabel(from)}`;
    }
    if (to) {
      return `Fino a ${this.monthLabel(to)}`;
    }
    return '';
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.ordersService
      .getCommissionSummary(
        this.paramString(this.fromDate()),
        this.paramString(this.toDate()),
        this.invoicingFilter(),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.pruneSelection(summary);
        },
        error: (error: HttpErrorResponse) => {
          this.summary.set(null);
          this.messages.add({
            severity: 'error',
            summary: 'Agenti non caricati',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected onPresetChange(value: string | null): void {
    this.preset.set(value);
    if (value) {
      const range = this.presetRange(value);
      this.fromDate.set(range.from);
      this.toDate.set(range.to);
    }
    this.expandedAgent.set(null);
    this.expandedMonths.set(new Set());
    this.clearSelection();
    this.load();
  }

  protected onFromChange(value: Date | null): void {
    this.fromDate.set(value);
    const to = this.toDate();
    if (value && to && value.getTime() > to.getTime()) {
      this.toDate.set(value);
    }
    this.preset.set(null);
    this.expandedAgent.set(null);
    this.expandedMonths.set(new Set());
    this.clearSelection();
    this.load();
  }

  protected onToChange(value: Date | null): void {
    this.toDate.set(value);
    const from = this.fromDate();
    if (value && from && from.getTime() > value.getTime()) {
      this.fromDate.set(value);
    }
    this.preset.set(null);
    this.expandedAgent.set(null);
    this.expandedMonths.set(new Set());
    this.clearSelection();
    this.load();
  }

  protected onInvoicingFilterChange(value: InvoicingStatus | null): void {
    this.invoicingFilter.set(value ?? 'ALL');
    this.expandedAgent.set(null);
    this.expandedMonths.set(new Set());
    this.clearSelection();
    this.load();
  }

  protected toggleAgent(row: AgentCommissionSummary): void {
    const key = this.agentKey(row);
    this.expandedAgent.set(this.expandedAgent() === key ? null : key);
  }

  protected isExpanded(row: AgentCommissionSummary): boolean {
    return this.expandedAgent() === this.agentKey(row);
  }

  protected toggleMonth(row: AgentCommissionSummary, month: string | null): void {
    const key = this.monthKey(row, month);
    const next = new Set(this.expandedMonths());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.expandedMonths.set(next);
  }

  protected isMonthExpanded(row: AgentCommissionSummary, month: string | null): boolean {
    return this.expandedMonths().has(this.monthKey(row, month));
  }

  protected openOrder(order: AgentOrderCommission): void {
    this.detailVisible.set(false);
    this.detailLoading.set(true);
    this.selectedOrder.set(null);

    if (order.orderId == null && order.paymentStatus == null) {
      this.detailLoading.set(false);
      this.messages.add({
        severity: 'error',
        summary: 'Ordine non disponibile',
        detail: "L'ordine " + order.orderNumber + ' non esiste nella lista ordini.',
      });
      return;
    }

    this.orderDetailRequest(order)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (detail) => {
          this.selectedOrder.set(detail);
          this.detailVisible.set(true);
        },
        error: (error: HttpErrorResponse | Error) => {
          this.messages.add({
            severity: 'error',
            summary: 'Dettaglio ordine non caricato',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected closeDetail(): void {
    this.detailVisible.set(false);
    this.selectedOrder.set(null);
  }

  /** Apre gli ordini del cliente. Ferma la propagazione: la riga ha già un click su openOrder. */
  protected openCustomer(order: AgentOrderCommission, event: Event): void {
    event.stopPropagation();
    if (!order.clientCode) {
      return;
    }
    this.router.navigate(['/orders'], { queryParams: { customer: order.clientCode } });
  }

  protected canManageInvoicing(order: AgentOrderCommission): boolean {
    return this.isAdmin() && order.orderId != null && order.paymentStatus === 'PAID';
  }

  protected isInvoiced(order: AgentOrderCommission): boolean {
    return !!order.agentInvoicedAt;
  }

  protected detailInvoicedAt(detail: OrderPaymentStatusResponse): string | null {
    return detail.agentInvoicedAt ?? detail.order.agentInvoicedAt ?? null;
  }

  protected isDetailInvoiced(detail: OrderPaymentStatusResponse): boolean {
    return !!this.detailInvoicedAt(detail);
  }

  protected invoicingStatusLabel(order: AgentOrderCommission): string {
    if (order.orderId == null || order.paymentStatus !== 'PAID') {
      return 'Non fatturabile';
    }
    return this.isInvoiced(order) ? 'FATTURATO' : 'DA FATTURARE';
  }

  protected invoicingStatusSeverity(order: AgentOrderCommission): 'success' | 'warn' | 'secondary' {
    if (order.orderId == null || order.paymentStatus !== 'PAID') {
      return 'secondary';
    }
    return this.isInvoiced(order) ? 'success' : 'warn';
  }

  protected detailInvoicingStatusLabel(detail: OrderPaymentStatusResponse): string {
    if (detail.paymentStatus !== 'PAID') {
      return 'Non fatturabile';
    }
    return this.isDetailInvoiced(detail) ? 'FATTURATO' : 'DA FATTURARE';
  }

  protected detailInvoicingStatusSeverity(
    detail: OrderPaymentStatusResponse,
  ): 'success' | 'warn' | 'secondary' {
    if (detail.paymentStatus !== 'PAID') {
      return 'secondary';
    }
    return this.isDetailInvoiced(detail) ? 'success' : 'warn';
  }

  protected toggleOrderSelection(order: AgentOrderCommission, event: Event): void {
    event.stopPropagation();
    if (!this.canManageInvoicing(order) || order.orderId == null) {
      return;
    }

    const next = new Set(this.selectedOrderIds());
    if (next.has(order.orderId)) {
      next.delete(order.orderId);
    } else {
      next.add(order.orderId);
    }
    this.selectedOrderIds.set(next);
  }

  protected isOrderSelected(order: AgentOrderCommission): boolean {
    return order.orderId != null && this.selectedOrderIds().has(order.orderId);
  }

  protected selectableOrderIds(row: AgentCommissionSummary): number[] {
    const ids = new Set<number>();
    for (const month of row.months) {
      for (const order of month.orders) {
        if (this.canManageInvoicing(order) && order.orderId != null) {
          ids.add(order.orderId);
        }
      }
    }
    return Array.from(ids);
  }

  protected hasSelectableOrders(row: AgentCommissionSummary): boolean {
    return this.selectableOrderIds(row).length > 0;
  }

  protected isAgentFullySelected(row: AgentCommissionSummary): boolean {
    const ids = this.selectableOrderIds(row);
    return ids.length > 0 && ids.every((id) => this.selectedOrderIds().has(id));
  }

  protected isAgentPartiallySelected(row: AgentCommissionSummary): boolean {
    const ids = this.selectableOrderIds(row);
    const selectedCount = ids.filter((id) => this.selectedOrderIds().has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }

  protected agentSelectionId(row: AgentCommissionSummary): string {
    const key = this.agentKey(row).replace(/[^a-zA-Z0-9_-]/g, '-');
    return `agent-selection-${key}`;
  }

  protected toggleAgentSelection(row: AgentCommissionSummary, event: Event): void {
    event.stopPropagation();
    const ids = this.selectableOrderIds(row);
    if (ids.length === 0) {
      return;
    }

    const next = new Set(this.selectedOrderIds());
    if (ids.every((id) => next.has(id))) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    this.selectedOrderIds.set(next);
  }

  protected clearSelection(): void {
    this.selectedOrderIds.set(new Set());
  }

  protected updateOrderInvoicing(order: AgentOrderCommission, event: Event): void {
    event.stopPropagation();
    if (!this.canManageInvoicing(order) || order.orderId == null || this.invoicingUpdating()) {
      return;
    }

    this.persistInvoicingStatus(
      [order.orderId],
      !this.isInvoiced(order),
      `Ordine ${order.orderNumber}: stato fatturazione aggiornato.`,
      order.orderId,
    );
  }

  protected updateDetailInvoicing(detail: OrderPaymentStatusResponse, event: Event): void {
    event.stopPropagation();
    if (!this.isAdmin() || detail.paymentStatus !== 'PAID' || this.invoicingUpdating()) {
      return;
    }

    this.persistInvoicingStatus(
      [detail.order.id],
      !this.isDetailInvoiced(detail),
      `Ordine ${detail.order.orderNumber}: stato fatturazione aggiornato.`,
      detail.order.id,
    );
  }

  protected updateSelectedInvoicing(invoiced: boolean): void {
    if (!this.isAdmin() || this.invoicingUpdating()) {
      return;
    }
    const ids = Array.from(this.selectedOrderIds());
    if (ids.length === 0) {
      return;
    }

    this.persistInvoicingStatus(
      ids,
      invoiced,
      invoiced
        ? `${ids.length} ${ids.length === 1 ? 'ordine segnato' : 'ordini segnati'} come fatturati.`
        : `${ids.length} ${ids.length === 1 ? 'ordine riportato' : 'ordini riportati'} a da fatturare.`,
    );
  }

  protected formatMonth(value: string | null): string {
    if (!value) {
      return 'Mese non determinato';
    }

    const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(
      new Date(`${value}-01`),
    );
    return this.capitalize(label);
  }

  protected formatCurrency(value: number | null): string {
    if (value == null) {
      return '-';
    }

    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  protected formatPostingDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  protected formatPaidMonth(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(
      new Date(value),
    );
  }

  protected formatNumber(value: number | null): string {
    if (value == null) {
      return '-';
    }

    return new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected displayOrderLines(detail: OrderPaymentStatusResponse): OrderLineSummary[] {
    return detail.order.lines.flatMap((line) => {
      const orderedQuantity = line.quantita;
      const netPaidQuantity = Math.max(0, (line.paidQuantity ?? 0) - (line.creditedQuantity ?? 0));
      const returnedQuantity = (orderedQuantity ?? 0) - netPaidQuantity;

      if (
        line.lineStatus !== 'PARTIAL' ||
        orderedQuantity == null ||
        orderedQuantity <= 1 ||
        netPaidQuantity <= 0 ||
        returnedQuantity <= 0
      ) {
        return [line];
      }

      return [
        {
          ...line,
          quantita: netPaidQuantity,
          paidQuantity: netPaidQuantity,
          creditedQuantity: 0,
          lineStatus: 'PAID',
        },
        {
          ...line,
          quantita: returnedQuantity,
          paidQuantity: 0,
          creditedQuantity: returnedQuantity,
          lineStatus: 'CREDITED',
        },
      ];
    });
  }

  protected paymentStatusLabel(
    status: AgentPaymentStatus | PaymentStatus | null | undefined,
  ): string {
    switch (status) {
      case 'PAID':
        return 'Pagato';
      case 'UNPAID':
      default:
        return 'Non pagato';
    }
  }

  protected paymentStatusSeverity(
    status: AgentPaymentStatus | PaymentStatus | null | undefined,
  ): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'UNPAID':
      default:
        return 'danger';
    }
  }

  protected readonly lineStatusLabel = lineStatusLabel;
  protected readonly lineStatusClass = lineStatusClass;
  protected readonly lineStatusTitle = lineStatusTitle;

  private persistInvoicingStatus(
    orderIds: number[],
    invoiced: boolean,
    successMessage: string,
    detailOrderId?: number,
  ): void {
    const uniqueIds = Array.from(new Set(orderIds.filter((id) => Number.isFinite(id))));
    if (uniqueIds.length === 0) {
      return;
    }

    this.invoicingUpdating.set(true);
    this.invoicingOrderId.set(detailOrderId ?? null);
    this.ordersService
      .updateAgentInvoicingStatus({ orderIds: uniqueIds, invoiced })
      .pipe(
        finalize(() => {
          this.invoicingUpdating.set(false);
          this.invoicingOrderId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.clearSelection();
          if (detailOrderId != null && this.selectedOrder()?.order.id === detailOrderId) {
            const timestamp = invoiced ? new Date().toISOString() : null;
            this.selectedOrder.update((detail) =>
              detail
                ? {
                    ...detail,
                    agentInvoicedAt: timestamp,
                    order: { ...detail.order, agentInvoicedAt: timestamp },
                  }
                : detail,
            );
          }
          this.load();
          this.messages.add({ severity: 'success', summary: successMessage });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Stato fatturazione non aggiornato',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  private pruneSelection(response: CommissionSummaryResponse): void {
    const visibleIds = new Set<number>();
    for (const agent of response.agents) {
      for (const month of agent.months) {
        for (const order of month.orders) {
          if (order.orderId != null) {
            visibleIds.add(order.orderId);
          }
        }
      }
    }
    this.selectedOrderIds.update((selected) => {
      const next = new Set(Array.from(selected).filter((id) => visibleIds.has(id)));
      return next.size === selected.size ? selected : next;
    });
  }

  private orderDetailRequest(order: AgentOrderCommission) {
    if (order.orderId != null) {
      return this.ordersService.getOrderDetail(order.orderId);
    }

    return this.ordersService.getOrders(0, 20, order.orderNumber, true).pipe(
      switchMap((response) => {
        const expectedNumber = order.orderNumber.trim();
        const match = response.items.find((item) => item.orderNumber.trim() === expectedNumber);

        return match
          ? this.ordersService.getOrderDetail(match.id)
          : throwError(() => new Error(`Ordine ${order.orderNumber} non trovato.`));
      }),
    );
  }

  private agentKey(row: AgentCommissionSummary): string {
    return row.agentId != null ? String(row.agentId) : row.agentName;
  }

  private monthKey(row: AgentCommissionSummary, month: string | null): string {
    return `${this.agentKey(row)}:${month ?? ''}`;
  }

  private presetRange(preset: string): { from: Date | null; to: Date | null } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (preset) {
      case 'currentYear':
        return { from: new Date(currentYear, 0, 1), to: new Date(currentYear, currentMonth, 1) };
      case 'previousYear':
        return { from: new Date(currentYear - 1, 0, 1), to: new Date(currentYear - 1, 11, 1) };
      case 'last3':
        return {
          from: new Date(currentYear, currentMonth - 2, 1),
          to: new Date(currentYear, currentMonth, 1),
        };
      case 'last6':
        return {
          from: new Date(currentYear, currentMonth - 5, 1),
          to: new Date(currentYear, currentMonth, 1),
        };
      case 'all':
      default:
        return { from: null, to: null };
    }
  }

  private monthLabel(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(date);
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private paramString(date: Date | null): string {
    if (!date) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private errorMessage(error: HttpErrorResponse | Error): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') {
      return error.error.error;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Operazione non riuscita. Controlla la connessione e riprova.';
  }
}
