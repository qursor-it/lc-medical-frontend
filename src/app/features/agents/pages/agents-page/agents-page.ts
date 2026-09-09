import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { finalize } from 'rxjs';

import {
  AgentCommissionSummary,
  AgentOrderCommission,
  AgentPaymentStatus,
  CommissionSummaryResponse,
} from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-agents-page',
  imports: [ButtonModule, DatePickerModule, FormsModule, SelectModule, TableModule, TagModule],
  templateUrl: './agents-page.html',
})
export class AgentsPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly summary = signal<CommissionSummaryResponse | null>(null);
  protected readonly fromDate = signal<Date | null>(null);
  protected readonly toDate = signal<Date | null>(null);
  protected readonly preset = signal<string | null>('all');
  protected readonly expandedAgent = signal<string | null>(null);
  protected readonly expandedMonths = signal<ReadonlySet<string>>(new Set());
  protected readonly skeletonRows = Array.from({ length: 8 });

  protected readonly presetOptions = [
    { label: 'Tutto', value: 'all' },
    { label: 'Anno corrente', value: 'currentYear' },
    { label: 'Anno precedente', value: 'previousYear' },
    { label: 'Ultimi 3 mesi', value: 'last3' },
    { label: 'Ultimi 6 mesi', value: 'last6' },
  ];

  protected readonly agents = computed(() => this.summary()?.agents ?? []);

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
      .getCommissionSummary(this.paramString(this.fromDate()), this.paramString(this.toDate()))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
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
    this.router.navigate(['/orders'], { queryParams: { search: order.orderNumber } });
  }

  /** Apre gli ordini del cliente. Ferma la propagazione: la riga ha già un click su openOrder. */
  protected openCustomer(order: AgentOrderCommission, event: Event): void {
    event.stopPropagation();
    if (!order.clientCode) {
      return;
    }
    this.router.navigate(['/orders'], { queryParams: { customer: order.clientCode } });
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

  protected paymentStatusLabel(status: AgentPaymentStatus | null | undefined): string {
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
    status: AgentPaymentStatus | null | undefined,
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

  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.error === 'string') {
      return error.error.error;
    }

    return 'Operazione non riuscita. Controlla la connessione e riprova.';
  }
}
