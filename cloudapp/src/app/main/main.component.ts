import { Component, OnInit } from '@angular/core';
import { AlmaUsersService } from '../core/alma-users.service';
import { ReaderSummary, SheetReader, UploadResult } from '../core/models';
import { SheetService } from '../core/sheet.service';

type View = 'loading' | 'notConfigured' | 'ready' | 'error';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  view: View = 'loading';
  errorText = '';
  checkedAt = '';

  pending: SheetReader[] = [];
  results: UploadResult[] = [];
  confirmUpload = false;
  uploading = false;
  progress = 0;

  cleanupList: ReaderSummary[] = [];
  cleanupState: 'idle' | 'checking' | 'confirm' | 'removing' = 'idle';
  cleanupNote = '';
  cleanupProgress = 0;

  constructor(private sheet: SheetService, private alma: AlmaUsersService) {}

  async ngOnInit() {
    try {
      const cfg = await this.sheet.loadConfig();
      if (!cfg) { this.view = 'notConfigured'; return; }
      await this.refresh();
    } catch (e: any) {
      this.fail(e);
    }
  }

  get busy() { return this.uploading || this.cleanupState === 'checking' || this.cleanupState === 'removing'; }
  get createdCount() { return this.results.filter(r => r.status === 'created').length; }
  get errorCount() { return this.results.filter(r => r.status === 'error').length; }

  async refresh() {
    this.view = 'loading';
    this.confirmUpload = false;
    try {
      this.pending = await this.sheet.pending();
      this.checkedAt = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      this.view = 'ready';
    } catch (e: any) {
      this.fail(e);
    }
  }

  async upload() {
    this.confirmUpload = false;
    this.uploading = true;
    this.results = [];
    this.progress = 0;
    const list = [...this.pending];
    for (const r of list) {                       // one at a time – keeps Alma load low
      this.results.push(await this.alma.upload(r));
      this.progress++;
    }
    try {
      await this.sheet.markDone(this.results);
    } catch (e: any) {
      this.results.push({ id: '', name: 'רישום בגיליון', status: 'error', message: e?.message || '' });
    }
    this.uploading = false;
    await this.refresh();
  }

  async startCleanup() {
    this.cleanupState = 'checking';
    this.cleanupNote = '';
    this.cleanupList = [];
    this.cleanupProgress = 0;
    try {
      const readers = await this.sheet.allReaders();
      for (const r of readers) {
        if (await this.alma.exists(r.id)) this.cleanupList.push(r);
        this.cleanupProgress++;
      }
      if (!this.cleanupList.length) {
        this.cleanupState = 'idle';
        this.cleanupNote = 'אין בגיליון קוראים שכבר קיימים ב־Alma';
      } else {
        this.cleanupState = 'confirm';
      }
    } catch (e: any) {
      this.cleanupState = 'idle';
      this.cleanupNote = e?.message || 'הבדיקה נכשלה';
    }
  }

  async doCleanup() {
    this.cleanupState = 'removing';
    try {
      const removed = await this.sheet.cleanup(this.cleanupList.map(r => r.id));
      this.cleanupNote = removed ? `הוסרו ${removed} שורות והועברו ללשונית ARCHIVE` : 'לא הוסרו שורות';
    } catch (e: any) {
      this.cleanupNote = e?.message || 'ההסרה נכשלה';
    }
    this.cleanupState = 'idle';
    this.cleanupList = [];
    await this.refresh();
  }

  cancelCleanup() {
    this.cleanupState = 'idle';
    this.cleanupList = [];
  }

  readers(n: number) { return n === 1 ? 'קורא אחד' : n + ' קוראים'; }

  private fail(e: any) {
    this.errorText = e?.message || 'שגיאה לא ידועה';
    this.view = 'error';
  }
}
