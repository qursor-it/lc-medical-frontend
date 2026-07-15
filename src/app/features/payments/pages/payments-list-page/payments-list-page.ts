import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import {
  PaidOrderItem,
  PaidOrderItemsPageResponse,
} from '../../../../core/models/paid-order-item.models';
import { PaidOrderItemsService } from '../../../../core/services/paid-order-items.service';

@Component({
  selector: 'app-payments-list-page',
  imports: [
    ButtonModule,
    DatePickerModule,
    FormsModule,
    PaginatorModule,
    RouterLink,
    TableModule,
    TagModule,
  ],
  templateUrl: './payments-list-page.html',
})
export class PaymentsListPage implements OnInit {
  private readonly paidOrderItemsService = inject(PaidOrderItemsService);
  private readonly messages = inject(MessageService);

  protected readonly payments = signal<PaidOrderItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly monthDate = signal<Date | null>(null);

  protected readonly resultLabel = computed(() => {
    const total = this.totalItems();
    return total === 1 ? '1 pagamento' : `${total} pagamenti`;
  });
  protected readonly hasSearch = computed(() => this.appliedSearch().length > 0);
  protected readonly pageOrders = computed(
    () => new Set(this.payments().map((payment) => payment.orderNumber)).size,
  );
  protected readonly pageTotal = computed(() =>
    this.payments().reduce((total, payment) => total + (payment.lineTotal ?? 0), 0),
  );

  ngOnInit(): void {
    this.loadPayments();
  }

  protected loadPayments(): void {
    this.loading.set(true);

    this.paidOrderItemsService
      .getPaidOrderItems(this.page(), this.size(), this.appliedSearch(), this.monthParam())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.applyPageResponse(response),
        error: (error: HttpErrorResponse) => {
          this.applyPageResponse(null);
          this.messages.add({
            severity: 'error',
            summary: 'Pagamenti non caricati',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected onPageChange(event: PaginatorState): void {
    this.page.set(event.page ?? 0);
    this.size.set(event.rows ?? this.size());
    this.loadPayments();
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected applySearch(): void {
    this.appliedSearch.set(this.searchText().trim());
    this.page.set(0);
    this.loadPayments();
  }

  protected clearSearch(): void {
    this.searchText.set('');
    this.appliedSearch.set('');
    this.page.set(0);
    this.loadPayments();
  }

  protected onMonthChange(date: Date | null): void {
    this.monthDate.set(date);
    this.page.set(0);
    this.loadPayments();
  }

  private monthParam(): string {
    const date = this.monthDate();
    if (!date) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

  private applyPageResponse(response: PaidOrderItemsPageResponse | null): void {
    this.payments.set(response?.items ?? []);
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
