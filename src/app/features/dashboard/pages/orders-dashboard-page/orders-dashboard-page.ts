import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import { OrderListItem, PageResponse } from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-orders-dashboard-page',
  imports: [ButtonModule, RouterLink, TagModule],
  templateUrl: './orders-dashboard-page.html',
})
export class OrdersDashboardPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);

  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly size = signal(100);
  protected readonly totalItems = signal(0);
  protected readonly loadedItems = computed(() => this.orders().length);
  protected readonly paidOrders = computed(() => this.orders().filter((order) => order.paid).length);
  protected readonly unpaidOrders = computed(() => this.orders().filter((order) => !order.paid).length);
  protected readonly paidPercentage = computed(() => this.percentage(this.paidOrders(), this.loadedItems()));
  protected readonly unpaidPercentage = computed(() => this.percentage(this.unpaidOrders(), this.loadedItems()));
  protected readonly unpaidOrdersPreview = computed(() => this.orders().filter((order) => !order.paid).slice(0, 5));

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.loading.set(true);

    this.ordersService
      .getOrders(0, this.size())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.applyPageResponse(response);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.applyPageResponse(null);
            return;
          }

          this.applyPageResponse(null);
          this.messages.add({
            severity: 'error',
            summary: 'Ordini non caricati',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  private applyPageResponse(response: PageResponse<OrderListItem> | null): void {
    this.orders.set(response?.items ?? []);
    this.size.set(response?.size ?? this.size());
    this.totalItems.set(response?.totalItems ?? 0);
  }

  private percentage(value: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
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
