import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import {
  OrderListItem,
  OrderPaymentStatusResponse,
  PageResponse,
  PaymentStatus,
  UpdateOrderRequest,
} from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

type OrderEditForm = Record<keyof UpdateOrderRequest, string>;

@Component({
  selector: 'app-orders-list-page',
  imports: [
    ButtonModule,
    DatePickerModule,
    DialogModule,
    FormsModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './orders-list-page.html',
})
export class OrdersListPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);

  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detailSaving = signal(false);
  protected readonly detailDeleting = signal(false);
  protected readonly detailVisible = signal(false);
  protected readonly selectedOrder = signal<OrderPaymentStatusResponse | null>(null);
  protected readonly editing = signal(false);
  protected readonly editDraft = signal<OrderEditForm | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly deepSearch = signal(false);
  protected readonly monthDate = signal<Date | null>(null);
  protected readonly paymentFilter = signal<'' | 'paid' | 'unpaid'>('');
  protected readonly paymentOptions = [
    { label: 'Tutti i pagamenti', value: '' },
    { label: 'Pagato', value: 'paid' },
    { label: 'Non pagato', value: 'unpaid' },
  ];
  protected readonly resultLabel = computed(() => {
    const total = this.totalItems();
    return total === 1 ? '1 risultato' : `${total} risultati`;
  });
  protected readonly hasSearch = computed(() => this.appliedSearch().length > 0);

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);

    this.ordersService
      .getOrders(
        this.page(),
        this.size(),
        this.appliedSearch(),
        this.deepSearch(),
        this.monthParam(),
        this.paymentFilter(),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.applyPageResponse(response),
        error: (error: HttpErrorResponse) => {
          this.applyPageResponse(null);
          this.messages.add({
            severity: 'error',
            summary: 'Ordini non caricati',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected onPageChange(event: PaginatorState): void {
    this.page.set(event.page ?? 0);
    this.size.set(event.rows ?? this.size());
    this.loadOrders();
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected applySearch(): void {
    this.appliedSearch.set(this.searchText().trim());
    this.page.set(0);
    this.loadOrders();
  }

  protected toggleDeepSearch(): void {
    this.deepSearch.update((value) => !value);
    this.page.set(0);
    if (this.appliedSearch()) {
      this.loadOrders();
    }
  }

  protected clearSearch(): void {
    this.searchText.set('');
    this.appliedSearch.set('');
    this.page.set(0);
    this.loadOrders();
  }

  protected onMonthChange(date: Date | null): void {
    this.monthDate.set(date);
    this.page.set(0);
    this.loadOrders();
  }

  protected onPaymentFilterChange(value: '' | 'paid' | 'unpaid'): void {
    this.paymentFilter.set(value);
    this.page.set(0);
    this.loadOrders();
  }

  private monthParam(): string {
    const date = this.monthDate();
    if (!date) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  protected openDetail(order: OrderListItem): void {
    this.detailVisible.set(true);
    this.detailLoading.set(true);
    this.selectedOrder.set(null);
    this.editing.set(false);
    this.editDraft.set(null);

    this.ordersService
      .getOrderDetail(order.id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (detail) => this.selectedOrder.set(detail),
        error: (error: HttpErrorResponse) => {
          this.detailVisible.set(false);
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
    this.editing.set(false);
    this.editDraft.set(null);
  }

  protected startEdit(detail: OrderPaymentStatusResponse): void {
    this.editDraft.set(this.toEditForm(detail));
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.editDraft.set(null);
  }

  protected updateDraft(field: keyof UpdateOrderRequest, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
      .value;
    this.editDraft.update((draft) => (draft ? { ...draft, [field]: value } : draft));
  }

  protected saveEdit(detail: OrderPaymentStatusResponse): void {
    const draft = this.editDraft();
    if (!draft) {
      return;
    }

    if (!draft.orderNumber.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Ordine mancante',
        detail: 'Il numero ordine e obbligatorio.',
      });
      return;
    }

    this.detailSaving.set(true);
    this.ordersService
      .updateOrder(detail.order.id, this.toUpdateRequest(draft))
      .pipe(finalize(() => this.detailSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedOrder.set(updated);
          this.editing.set(false);
          this.editDraft.set(null);
          this.updateListItem(updated);
          this.messages.add({ severity: 'success', summary: 'Ordine aggiornato' });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Ordine non aggiornato',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected deleteOrder(detail: OrderPaymentStatusResponse): void {
    if (!window.confirm(`Eliminare l'ordine ${detail.order.orderNumber || detail.order.id}?`)) {
      return;
    }

    this.detailDeleting.set(true);
    this.ordersService
      .deleteOrder(detail.order.id)
      .pipe(finalize(() => this.detailDeleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDetail();
          this.loadOrders();
          this.messages.add({ severity: 'success', summary: 'Ordine eliminato' });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Ordine non eliminato',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected detailInvoiceNumbers(order: OrderPaymentStatusResponse): string {
    const numbers = order.invoices
      ?.map((invoice) => invoice.invoiceNumber)
      .filter((invoiceNumber): invoiceNumber is string => Boolean(invoiceNumber));

    return numbers?.length ? numbers.join(', ') : '-';
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

  protected formatNumber(value: number | null): string {
    if (value == null) {
      return '-';
    }

    return new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  protected paymentStatusLabel(status: PaymentStatus | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'Pagato';
      case 'PARTIAL':
        return 'Parziale';
      case 'UNPAID':
      default:
        return 'Non pagato';
    }
  }

  protected paymentStatusSeverity(
    status: PaymentStatus | null | undefined,
  ): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warn';
      case 'UNPAID':
      default:
        return 'danger';
    }
  }

  protected inputClass(): string {
    return 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  protected textareaClass(): string {
    return 'mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  private applyPageResponse(response: PageResponse<OrderListItem> | null): void {
    this.orders.set(response?.items ?? []);
    this.page.set(response?.page ?? this.page());
    this.size.set(response?.size ?? this.size());
    this.totalItems.set(response?.totalItems ?? 0);
  }

  private updateListItem(detail: OrderPaymentStatusResponse): void {
    this.orders.update((items) =>
      items.map((item) =>
        item.id === detail.order.id
          ? {
              id: detail.order.id,
              orderNumber: detail.order.orderNumber,
              clientCode: detail.order.clientCode,
              paid: detail.paid,
              paymentStatus: detail.paymentStatus,
            }
          : item,
      ),
    );
  }

  private toEditForm(detail: OrderPaymentStatusResponse): OrderEditForm {
    const order = detail.order;
    return {
      orderNumber: this.textValue(order.orderNumber),
      surgeryDate: this.textValue(order.surgeryDate),
      shippingDate: this.textValue(order.shippingDate),
      clientCode: this.textValue(order.clientCode),
      pickupDate: this.textValue(order.pickupDate),
      shipTo: this.textValue(order.shipTo),
      orderRef: this.textValue(order.orderRef),
      patient: this.textValue(order.patient),
      transport: this.textValue(order.transport),
      surgeon: this.textValue(order.surgeon),
      contact: this.textValue(order.contact),
      phone: this.textValue(order.phone),
      representative: this.textValue(order.representative),
      comments: this.textValue(order.comments),
    };
  }

  private toUpdateRequest(draft: OrderEditForm): UpdateOrderRequest {
    return {
      orderNumber: draft.orderNumber.trim(),
      surgeryDate: this.nullableText(draft.surgeryDate),
      shippingDate: this.nullableText(draft.shippingDate),
      clientCode: this.nullableText(draft.clientCode),
      pickupDate: this.nullableText(draft.pickupDate),
      shipTo: this.nullableText(draft.shipTo),
      orderRef: this.nullableText(draft.orderRef),
      patient: this.nullableText(draft.patient),
      transport: this.nullableText(draft.transport),
      surgeon: this.nullableText(draft.surgeon),
      contact: this.nullableText(draft.contact),
      phone: this.nullableText(draft.phone),
      representative: this.nullableText(draft.representative),
      comments: this.nullableText(draft.comments),
    };
  }

  private textValue(value: string | null): string {
    return value ?? '';
  }

  private nullableText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    return 'Il backend non ha risposto correttamente.';
  }
}
