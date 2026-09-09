import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import {
  PaidOrderItem,
  PaidOrderItemsPageResponse,
} from '../../../../core/models/paid-order-item.models';
import { CustomerOption, toCustomerOptions } from '../../../../shared/customer-options';
import { CustomersService } from '../../../../core/services/customers.service';
import { PaidOrderItemsService } from '../../../../core/services/paid-order-items.service';

@Component({
  selector: 'app-payments-list-page',
  imports: [
    ButtonModule,
    DatePickerModule,
    FormsModule,
    PaginatorModule,
    RouterLink,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './payments-list-page.html',
})
export class PaymentsListPage implements OnInit {
  private readonly paidOrderItemsService = inject(PaidOrderItemsService);
  private readonly customersService = inject(CustomersService);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);

  protected readonly payments = signal<PaidOrderItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly monthDate = signal<Date | null>(null);
  protected readonly customerOptions = signal<CustomerOption[]>([]);
  protected readonly customerFilter = signal<string | null>(null);

  protected readonly resultLabel = computed(() => {
    const total = this.totalItems();
    return total === 1 ? '1 pagamento' : `${total} pagamenti`;
  });
  protected readonly hasSearch = computed(() => this.appliedSearch().length > 0);
  protected readonly monthLabel = computed(() => this.formatMonthLabel(this.monthDate()));
  protected readonly pageOrders = computed(
    () => new Set(this.payments().map((payment) => payment.orderNumber)).size,
  );
  protected readonly pageTotal = computed(() =>
    this.payments().reduce((total, payment) => total + (payment.lineTotal ?? 0), 0),
  );
  // Fino a quando la lista clienti arriva, la chip mostra il codice grezzo dal queryParam.
  protected readonly selectedCustomerLabel = computed(() => {
    const code = this.customerFilter();
    if (!code) {
      return null;
    }
    const option = this.customerOptions().find((o) => o.value === code);
    return option?.name ? `${option.name} (${option.code})` : code;
  });

  ngOnInit(): void {
    const customer = this.route.snapshot.queryParamMap.get('customer');
    if (customer) {
      this.customerFilter.set(customer);
    }

    this.customersService.getCustomers().subscribe({
      next: (customers) => this.customerOptions.set(toCustomerOptions(customers)),
      error: () => this.customerOptions.set([]),
    });

    this.loadPayments();
  }

  protected loadPayments(): void {
    this.loading.set(true);

    this.paidOrderItemsService
      .getPaidOrderItems(
        this.page(),
        this.size(),
        this.appliedSearch(),
        this.monthParam(),
        this.customerFilter() ?? '',
      )
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

  protected onCustomerFilterChange(value: string | null): void {
    this.customerFilter.set(value || null);
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

  private formatMonthLabel(date: Date | null): string {
    if (!date) {
      return '';
    }

    const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(
      date,
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
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

    return 'Operazione non riuscita. Controlla la connessione e riprova.';
  }
}
