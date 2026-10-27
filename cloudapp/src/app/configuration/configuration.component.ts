import { Component, OnInit } from '@angular/core';
import { AlertService, CloudAppConfigService } from '@exlibris/exl-cloudapp-angular-lib';
import { firstValueFrom } from 'rxjs';

/** Institution-level configuration – visible in Alma only to administrators. */
@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['../main/main.component.scss']
})
export class ConfigurationComponent implements OnInit {
  scriptUrl = '';
  secret = '';
  saving = false;
  loaded = false;

  constructor(private config: CloudAppConfigService, private alert: AlertService) {}

  async ngOnInit() {
    const c = await firstValueFrom(this.config.get());
    this.scriptUrl = c?.scriptUrl || '';
    this.secret = c?.secret || '';
    this.loaded = true;
  }

  get valid() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(this.scriptUrl.trim()) && this.secret.trim().length > 0;
  }

  async save() {
    this.saving = true;
    try {
      await firstValueFrom(this.config.set({ scriptUrl: this.scriptUrl.trim(), secret: this.secret.trim() }));
      this.alert.success('ההגדרות נשמרו');
    } catch (e: any) {
      this.alert.error('השמירה נכשלה: ' + (e?.message || ''));
    } finally {
      this.saving = false;
    }
  }
}
