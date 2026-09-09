import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { Customer } from '../models/customer.models';
import { environment } from '../../../environments/environment';

/**
 * Clienti selezionabili come filtro su ordini e pagamenti (derivati, non un'anagrafica:
 * vedi CustomerDirectoryService lato backend). La lista cambia solo con gli import, quindi
 * viene memoizzata per sessione: evita di rifare tre query aggregate a ogni apertura del
 * filtro su ordini e pagamenti. {@link invalidate} va chiamato dopo un import riuscito.
 */
@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private cache$: Observable<Customer[]> | null = null;

  getCustomers(): Observable<Customer[]> {
    if (!this.cache$) {
      this.cache$ = this.http
        .get<Customer[]>(`${environment.apiBaseUrl}/customers`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.cache$;
  }

  invalidate(): void {
    this.cache$ = null;
  }
}
