import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AppSettings, DangerCounts, DangerDataset, PurgeResult } from '../models/settings.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${environment.apiBaseUrl}/settings`);
  }

  updateSettings(request: AppSettings): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${environment.apiBaseUrl}/settings`, request);
  }

  getDangerCounts(): Observable<DangerCounts> {
    return this.http.get<DangerCounts>(`${environment.apiBaseUrl}/settings/danger`);
  }

  purgeDataset(dataset: DangerDataset): Observable<PurgeResult> {
    return this.http.delete<PurgeResult>(`${environment.apiBaseUrl}/settings/danger/${dataset}`);
  }
}
