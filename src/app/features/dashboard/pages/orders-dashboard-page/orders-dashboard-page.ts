import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { OrderPaymentStatusResponse } from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-orders-dashboard-page',
  imports: [ButtonModule, PaginatorModule, TableModule, TagModule],
  templateUrl: './orders-dashboard-page.html',
})
export class OrdersDashboardPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);

  protected readonly orders = signal<OrderPaymentStatusResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly totalItems = signal(0);

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);

    this.ordersService.getOrders(this.page(), this.size()).subscribe({
      next: (response) => {
        this.orders.set(response.items);
        this.page.set(response.page);
        this.size.set(response.size);
        this.totalItems.set(response.totalItems);
      },
      error: (error: HttpErrorResponse) => {
        this.orders.set([]);
        this.messages.add({
          severity: 'error',
          summary: 'Ordini non caricati',
          detail: this.errorMessage(error),
        });
      },
      complete: () => this.loading.set(false),
    });
  }

  protected onPageChange(event: PaginatorState): void {
    this.page.set(event.page ?? 0);
    this.size.set(event.rows ?? this.size());
    this.loadOrders();
  }

  protected firstInvoiceNumber(order: OrderPaymentStatusResponse): string {
    return order.invoices[0]?.invoiceNumber ?? '-';
  }

  protected invoiceTotal(order: OrderPaymentStatusResponse): string {
    const total = order.invoices[0]?.total;
    if (total == null) {
      return '-';
    }

    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(total);
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
