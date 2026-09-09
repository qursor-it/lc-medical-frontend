import { Customer } from '../core/models/customer.models';

/**
 * Voce del p-select del filtro cliente: `value` è il codice, quello che va sull'URL/API.
 * `label` combina nome e codice in un unico campo cercabile (filterBy="label"), così la
 * ricerca nel select trova sia per nome sia per codice senza configurazione aggiuntiva.
 * Per i codici senza nome (mai visti come parte ordinante con un nome noto) il gruppo
 * dedotto dal prefisso (Ospedale pubblico/Clinica privata/Chirurgo) fa da sottotitolo.
 */
export interface CustomerOption {
  value: string;
  label: string;
  name: string | null;
  code: string;
  group: string | null;
}

export function toCustomerOptions(customers: Customer[]): CustomerOption[] {
  return customers.map((customer) => ({
    value: customer.code,
    label: customer.name ? `${customer.name} · ${customer.code}` : customer.code,
    name: customer.name,
    code: customer.code,
    group: customer.group,
  }));
}
