import { Injectable } from '@angular/core';
import { CloudAppConfigService } from '@exlibris/exl-cloudapp-angular-lib';
import { firstValueFrom } from 'rxjs';
import { AppConfig, ReaderSummary, SheetReader, UploadResult } from './models';

/**
 * Talks to the library's Google Apps Script web app.
 * The URL and secret are institution configuration (set by an admin in Alma),
 * never part of the source code.
 */
@Injectable({ providedIn: 'root' })
export class SheetService {
  private config?: AppConfig;

  constructor(private configService: CloudAppConfigService) {}

  async loadConfig(): Promise<AppConfig | null> {
    const c = await firstValueFrom(this.configService.get());
    this.config = c && c.scriptUrl && c.secret ? (c as AppConfig) : undefined;
    return this.config ?? null;
  }

  async pending(): Promise<SheetReader[]> {
    return (await this.call<{ pending: SheetReader[] }>('pendingFull')).pending;
  }

  async allReaders(): Promise<ReaderSummary[]> {
    return (await this.call<{ readers: ReaderSummary[] }>('allReaders')).readers;
  }

  async markDone(results: UploadResult[]): Promise<void> {
    if (!results.length) return;
    const slim = results.map(r => ({ id: r.id, name: r.name, status: r.status, message: r.message.slice(0, 200) }));
    await this.call('markDone', { r: JSON.stringify(slim) });
  }

  async cleanup(ids: string[]): Promise<number> {
    return (await this.call<{ removed: number }>('cleanup', { ids: ids.join(',') })).removed;
  }

  private async call<T>(action: string, extra: Record<string, string> = {}): Promise<T> {
    if (!this.config) throw new Error('האפליקציה לא הוגדרה – יש לבקש ממנהל Alma למלא את דף ההגדרות (Configuration).');
    const params = new URLSearchParams({ key: this.config.secret, action, t: String(Date.now()), ...extra });
    let res: Response;
    try {
      res = await fetch(this.config.scriptUrl + '?' + params.toString());
    } catch {
      throw new Error('אין חיבור לגיליון Google – בדקו את כתובת הסקריפט ואת החיבור לאינטרנט.');
    }
    const text = await res.text();
    if (text.startsWith('ERROR')) {
      throw new Error(text.includes('bad key') ? 'המפתח הסודי שגוי (דף ההגדרות).' : text);
    }
    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error('תשובה לא צפויה מהסקריפט. ודאו שהסקריפט עודכן ופורסם בגרסה חדשה.'); }
    if (data.error) throw new Error(data.error);
    return data as T;
  }
}
