import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs';

import {
  AgentCommissionSummary,
  CommissionSummaryResponse,
} from '../../../../core/models/order.models';
import { OrdersService } from '../../../../core/services/orders.service';

@Component({
  selector: 'app-agent-commissions-page',
  imports: [ButtonModule, DatePickerModule, FormsModule, TableModule],
  templateUrl: './agent-commissions-page.html',
})
export class AgentCommissionsPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly messages = inject(MessageService);

  protected readonly loading = signal(false);
  protected readonly summary = signal<CommissionSummaryResponse | null>(null);
  protected readonly monthDate = signal<Date | null>(null);
  protected readonly expandedAgent = signal<string | null>(null);

  protected readonly agents = computed(() => this.summary()?.agents ?? []);

  protected toggleAgent(row: AgentCommissionSummary): void {
    const key = this.agentKey(row);
    this.expandedAgent.set(this.expandedAgent() === key ? null : key);
  }

  protected isExpanded(row: AgentCommissionSummary): boolean {
    return this.expandedAgent() === this.agentKey(row);
  }

  protected formatMonth(value: string | null): string {
    if (!value) {
      return 'Mese non determinato';
    }

    const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(
      new Date(`${value}-01`),
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private agentKey(row: AgentCommissionSummary): string {
    return row.agentId != null ? String(row.agentId) : row.agentName;
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.ordersService
      .getCommissionSummary(this.monthParam())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: HttpErrorResponse) => {
          this.summary.set(null);
          this.messages.add({
            severity: 'error',
            summary: 'Compensi non caricati',
            detail: this.errorMessage(error),
          });
        },
      });
  }

  protected onMonthChange(value: Date | null): void {
    this.monthDate.set(value ?? null);
    this.expandedAgent.set(null);
    this.load();
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

  private monthParam(): string {
    const date = this.monthDate();
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
