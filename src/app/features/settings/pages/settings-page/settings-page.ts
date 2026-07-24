import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { finalize } from 'rxjs';

import { AppSettings, CommissionBase } from '../../../../core/models/settings.models';
import { SettingsService } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-settings-page',
  imports: [ButtonModule, FormsModule, SelectModule],
  templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly messages = inject(MessageService);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly commissionBase = signal<CommissionBase>('NET');
  protected readonly commissionRatePercent = signal(5);
  protected readonly vatRatePercent = signal(22);

  protected readonly isGross = computed(() => this.commissionBase() === 'GROSS');

  protected readonly commissionBaseOptions = [
    { label: 'Netto (imponibile)', value: 'NET' as CommissionBase },
    { label: 'Lordo (IVA inclusa)', value: 'GROSS' as CommissionBase },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.settingsService
      .getSettings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settings) => this.apply(settings),
        error: (error: HttpErrorResponse) => this.showError('Impostazioni non caricate', error),
      });
  }

  protected save(): void {
    const rate = this.commissionRatePercent();
    const vat = this.vatRatePercent();
    if (!this.isValidPercent(rate) || !this.isValidPercent(vat)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Valori non validi',
        detail: 'Le percentuali devono essere comprese tra 0 e 100.',
      });
      return;
    }

    this.saving.set(true);
    this.settingsService
      .updateSettings({
        commissionBase: this.commissionBase(),
        commissionRatePercent: rate,
        vatRatePercent: vat,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (settings) => {
          this.apply(settings);
          this.messages.add({ severity: 'success', summary: 'Impostazioni salvate' });
        },
        error: (error: HttpErrorResponse) => this.showError('Impostazioni non salvate', error),
      });
  }

  protected updateRate(event: Event): void {
    this.commissionRatePercent.set(Number((event.target as HTMLInputElement).value));
  }

  protected updateVat(event: Event): void {
    this.vatRatePercent.set(Number((event.target as HTMLInputElement).value));
  }

  protected inputClass(): string {
    return 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
  }

  private apply(settings: AppSettings): void {
    this.commissionBase.set(settings.commissionBase);
    this.commissionRatePercent.set(settings.commissionRatePercent);
    this.vatRatePercent.set(settings.vatRatePercent);
  }

  private isValidPercent(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 100;
  }

  private showError(summary: string, error: HttpErrorResponse): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail:
        typeof error.error?.error === 'string' ? error.error.error : 'Operazione non riuscita.',
    });
  }
}
