import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import { InvoiceDetail, InvoiceListItem, InvoicePageResponse } from '../../../../core/models/invoice.models';
import { InvoicesService } from '../../../../core/services/invoices.service';

@Component({
  selector: 'app-invoices-list-page',
  imports: [ButtonModule, DialogModule, PaginatorModule, TableModule],
  templateUrl: './invoices-list-page.html',
})
export class InvoicesListPage implements OnInit {
  private readonly invoicesService = inject(InvoicesService);
  private readonly messages = inject(MessageService);

  protected readonly invoices = signal<InvoiceListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detailVisible = signal(false);
  protected readonly selectedInvoice = signal<InvoiceDetail | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly deepSearch = signal(false);

  ngOnInit(): void {
    this.loadInvoices();
  }

  protected loadInvoices(): void {
    this.loading.set(true);

    this.invoicesService
      .getInvoices(this.page(), this.size(), this.appliedSearch(), this.deepSearch())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.applyPageResponse(response),
        error: (error: HttpErrorResponse) => {
          this.applyPageResponse(null);
          this.messages.add({
            severity: 'error',
            summary: 'Fatture non caricate',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected onPageChange(event: PaginatorState): void {
    this.page.set(event.page ?? 0);
    this.size.set(event.rows ?? this.size());
    this.loadInvoices();
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected applySearch(): void {
    this.appliedSearch.set(this.searchText().trim());
    this.page.set(0);
    this.loadInvoices();
  }

  protected toggleDeepSearch(): void {
    this.deepSearch.update((value) => !value);
    this.page.set(0);
    if (this.appliedSearch()) {
      this.loadInvoices();
    }
  }

  protected clearSearch(): void {
    this.searchText.set('');
    this.appliedSearch.set('');
    this.page.set(0);
    this.loadInvoices();
  }

  protected openDetail(invoice: InvoiceListItem): void {
    this.detailVisible.set(true);
    this.detailLoading.set(true);
    this.selectedInvoice.set(null);

    this.invoicesService
      .getInvoiceDetail(invoice.id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (detail) => this.selectedInvoice.set(detail),
        error: (error: HttpErrorResponse) => {
          this.detailVisible.set(false);
          this.messages.add({
            severity: 'error',
            summary: 'Dettaglio fattura non caricato',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected closeDetail(): void {
    this.detailVisible.set(false);
    this.selectedInvoice.set(null);
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

  protected detailSerialsCount(invoice: InvoiceDetail): number {
    return invoice.lines.reduce((total, line) => total + (line.seriali?.length ?? 0), 0);
  }

  private applyPageResponse(response: InvoicePageResponse | null): void {
    this.invoices.set(response?.items ?? []);
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
