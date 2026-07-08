import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { OrderListItem, OrderPaymentStatusResponse, PageResponse } from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-orders-list-page',
  imports: [ButtonModule, DialogModule, PaginatorModule, TableModule, TagModule],
  templateUrl: './orders-list-page.html',
})
export class OrdersListPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);

  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detailVisible = signal(false);
  protected readonly selectedOrder = signal<OrderPaymentStatusResponse | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly deepSearch = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);

    this.ordersService
      .getOrders(this.page(), this.size(), this.appliedSearch(), this.deepSearch())
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

  protected openDetail(order: OrderListItem): void {
    this.detailVisible.set(true);
    this.detailLoading.set(true);
    this.selectedOrder.set(null);

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

  private applyPageResponse(response: PageResponse<OrderListItem> | null): void {
    this.orders.set(response?.items ?? []);
    this.page.set(response?.page ?? this.page());
    this.size.set(response?.size ?? this.size());
    this.totalItems.set(response?.totalItems ?? 0);
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
