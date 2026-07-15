import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import {
  InvoiceDetail,
  InvoiceListItem,
  InvoicePageResponse,
  UpdateInvoiceRequest,
} from '../../../../core/models/invoice.models';
import { InvoicesService } from '../../../../core/services/invoices.service';

type InvoiceEditForm = Record<keyof UpdateInvoiceRequest, string>;

@Component({
  selector: 'app-invoices-list-page',
  imports: [ButtonModule, DatePickerModule, DialogModule, FormsModule, PaginatorModule, TableModule],
  templateUrl: './invoices-list-page.html',
})
export class InvoicesListPage implements OnInit {
  private readonly invoicesService = inject(InvoicesService);
  private readonly messages = inject(MessageService);

  protected readonly invoices = signal<InvoiceListItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detailSaving = signal(false);
  protected readonly detailDeleting = signal(false);
  protected readonly detailVisible = signal(false);
  protected readonly selectedInvoice = signal<InvoiceDetail | null>(null);
  protected readonly editing = signal(false);
  protected readonly editDraft = signal<InvoiceEditForm | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(20);
  protected readonly totalItems = signal(0);
  protected readonly skeletonRows = Array.from({ length: 8 });
  protected readonly searchText = signal('');
  protected readonly appliedSearch = signal('');
  protected readonly deepSearch = signal(false);
  protected readonly monthDate = signal<Date | null>(null);
  protected readonly resultLabel = computed(() => {
    const total = this.totalItems();
    return total === 1 ? '1 risultato' : `${total} risultati`;
  });
  protected readonly hasSearch = computed(() => this.appliedSearch().length > 0);

  ngOnInit(): void {
    this.loadInvoices();
  }

  protected loadInvoices(): void {
    this.loading.set(true);

    this.invoicesService
      .getInvoices(
        this.page(),
        this.size(),
        this.appliedSearch(),
        this.deepSearch(),
        this.monthParam(),
      )
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

  protected onMonthChange(date: Date | null): void {
    this.monthDate.set(date);
    this.page.set(0);
    this.loadInvoices();
  }

  private monthParam(): string {
    const date = this.monthDate();
    if (!date) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  protected openDetail(invoice: InvoiceListItem): void {
    this.detailVisible.set(true);
    this.detailLoading.set(true);
    this.selectedInvoice.set(null);
    this.editing.set(false);
    this.editDraft.set(null);

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
    this.editing.set(false);
    this.editDraft.set(null);
  }

  protected startEdit(detail: InvoiceDetail): void {
    this.editDraft.set(this.toEditForm(detail));
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
    this.editDraft.set(null);
  }

  protected updateDraft(field: keyof UpdateInvoiceRequest, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)
      .value;
    this.editDraft.update((draft) => (draft ? { ...draft, [field]: value } : draft));
  }

  protected saveEdit(detail: InvoiceDetail): void {
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
    this.invoicesService
      .updateInvoice(detail.id, this.toUpdateRequest(draft))
      .pipe(finalize(() => this.detailSaving.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedInvoice.set(updated);
          this.editing.set(false);
          this.editDraft.set(null);
          this.updateListItem(updated);
          this.messages.add({ severity: 'success', summary: 'Fattura aggiornata' });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Fattura non aggiornata',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected deleteInvoice(detail: InvoiceDetail): void {
    if (!window.confirm(`Eliminare la fattura ${detail.invoiceNumber || detail.id}?`)) {
      return;
    }

    this.detailDeleting.set(true);
    this.invoicesService
      .deleteInvoice(detail.id)
      .pipe(finalize(() => this.detailDeleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDetail();
          this.loadInvoices();
          this.messages.add({ severity: 'success', summary: 'Fattura eliminata' });
        },
        error: (error: HttpErrorResponse) => {
          this.messages.add({
            severity: 'error',
            summary: 'Fattura non eliminata',
            detail: this.errorMessage(error),
          });
        },
      });
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

  protected inputClass(): string {
    return 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  protected textareaClass(): string {
    return 'mt-1 min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  private applyPageResponse(response: InvoicePageResponse | null): void {
    this.invoices.set(response?.items ?? []);
    this.page.set(response?.page ?? this.page());
    this.size.set(response?.size ?? this.size());
    this.totalItems.set(response?.totalItems ?? 0);
  }

  private updateListItem(invoice: InvoiceDetail): void {
    this.invoices.update((items) =>
      items.map((item) =>
        item.id === invoice.id
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              orderNumber: invoice.orderNumber,
              clientCode: invoice.clientCode,
              total: invoice.total,
            }
          : item,
      ),
    );
  }

  private toEditForm(invoice: InvoiceDetail): InvoiceEditForm {
    return {
      invoiceNumber: this.textValue(invoice.invoiceNumber),
      invoiceType: this.textValue(invoice.invoiceType),
      clientCode: this.textValue(invoice.clientCode),
      invoiceDate: this.textValue(invoice.invoiceDate),
      dueDate: this.textValue(invoice.dueDate),
      orderNumber: this.textValue(invoice.orderNumber),
      totalWithoutDiscount: this.numberValue(invoice.totalWithoutDiscount),
      discount: this.numberValue(invoice.discount),
      amountExVat: this.numberValue(invoice.amountExVat),
      vat: this.numberValue(invoice.vat),
      total: this.numberValue(invoice.total),
      bank: this.textValue(invoice.bank),
      iban: this.textValue(invoice.iban),
      buyerName: this.textValue(invoice.buyerName),
      buyerAddress: this.textValue(invoice.buyerAddress),
      buyerVat: this.textValue(invoice.buyerVat),
      surgeon: this.textValue(invoice.surgeon),
      patient: this.textValue(invoice.patient),
      representative: this.textValue(invoice.representative),
      cupCode: this.textValue(invoice.cupCode),
      cigCode: this.textValue(invoice.cigCode),
    };
  }

  private toUpdateRequest(draft: InvoiceEditForm): UpdateInvoiceRequest {
    return {
      invoiceNumber: this.nullableText(draft.invoiceNumber),
      invoiceType: this.nullableText(draft.invoiceType),
      clientCode: this.nullableText(draft.clientCode),
      invoiceDate: this.nullableText(draft.invoiceDate),
      dueDate: this.nullableText(draft.dueDate),
      orderNumber: draft.orderNumber.trim(),
      totalWithoutDiscount: this.nullableNumber(draft.totalWithoutDiscount),
      discount: this.nullableNumber(draft.discount),
      amountExVat: this.nullableNumber(draft.amountExVat),
      vat: this.nullableNumber(draft.vat),
      total: this.nullableNumber(draft.total),
      bank: this.nullableText(draft.bank),
      iban: this.nullableText(draft.iban),
      buyerName: this.nullableText(draft.buyerName),
      buyerAddress: this.nullableText(draft.buyerAddress),
      buyerVat: this.nullableText(draft.buyerVat),
      surgeon: this.nullableText(draft.surgeon),
      patient: this.nullableText(draft.patient),
      representative: this.nullableText(draft.representative),
      cupCode: this.nullableText(draft.cupCode),
      cigCode: this.nullableText(draft.cigCode),
    };
  }

  private textValue(value: string | null): string {
    return value ?? '';
  }

  private numberValue(value: number | null): string {
    return value == null ? '' : String(value);
  }

  private nullableText(value: string): string | null {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }

  private nullableNumber(value: string): number | null {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return 'Operazione non riuscita. Controlla la connessione e riprova.';
  }
}
