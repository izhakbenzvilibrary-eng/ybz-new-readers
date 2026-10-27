import { Injectable } from '@angular/core';
import { CloudAppRestService, HttpMethod, RestErrorResponse } from '@exlibris/exl-cloudapp-angular-lib';
import { firstValueFrom } from 'rxjs';
import { SheetReader, UploadResult } from './models';

/** Alma user operations, performed as the logged-in staff user (no API key). */
@Injectable({ providedIn: 'root' })
export class AlmaUsersService {
  constructor(private rest: CloudAppRestService) {}

  /** GET /almaws/v1/users/{user_id} – true if any unique identifier matches. */
  async exists(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.rest.call({
        url: '/users/' + encodeURIComponent(id),
        queryParams: { user_id_type: 'all_unique', view: 'brief' }
      }));
      return true;
    } catch (e) {
      const err = e as RestErrorResponse;
      if (err.status === 400 || err.status === 404) return false;   // "user not found"
      throw new Error(err.message || 'שגיאה בבדיקת הקורא ב־Alma');
    }
  }

  /** POST /almaws/v1/users – creates the reader. */
  async create(r: SheetReader): Promise<void> {
    await firstValueFrom(this.rest.call({
      url: '/users',
      method: HttpMethod.POST,
      requestBody: this.toAlmaUser(r)
    }));
  }

  async upload(r: SheetReader): Promise<UploadResult> {
    const name = (r.first + ' ' + r.last).trim();
    try {
      if (await this.exists(r.id)) {
        return { id: r.id, name, status: 'exists', message: 'הקורא כבר רשום ב־Alma' };
      }
      await this.create(r);
      return { id: r.id, name, status: 'created', message: '' };
    } catch (e: any) {
      return { id: r.id, name, status: 'error', message: e?.message || 'שגיאה לא ידועה' };
    }
  }

  private toAlmaUser(r: SheetReader): any {
    const user: any = {
      record_type: { value: 'PUBLIC' },
      account_type: { value: 'INTERNAL' },
      status: { value: 'ACTIVE' },
      primary_id: r.id,
      first_name: r.first,
      last_name: r.last,
      user_group: { value: r.group },
      preferred_language: { value: r.lang || 'he' },
      contact_info: { address: [], email: [], phone: [] }
    };
    if (r.password) user.password = r.password;
    if (r.email) {
      user.contact_info.email.push({
        email_address: r.email, preferred: true,
        email_type: [{ value: r.emailType || 'personal' }]
      });
    }
    if ((r.phone || '').replace(/\D/g, '').length >= 6) {
      user.contact_info.phone.push({
        phone_number: r.phone, preferred: true,
        phone_type: [{ value: r.phoneType || 'mobile' }]
      });
    }
    return user;
  }
}
