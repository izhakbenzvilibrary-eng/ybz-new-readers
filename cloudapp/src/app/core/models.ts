/** Configuration saved by an administrator in the app's Configuration page. */
export interface AppConfig {
  scriptUrl: string;
  secret: string;
}

/** One reader row coming from the Google sheet (ALMA_EXPORT). */
export interface SheetReader {
  id: string;
  first: string;
  last: string;
  phone: string;
  lang: string;
  phoneType: string;
  email: string;
  emailType: string;
  group: string;
  password: string;
}

export interface ReaderSummary {
  id: string;
  name: string;
}

export type UploadStatus = 'created' | 'exists' | 'error';

export interface UploadResult {
  id: string;
  name: string;
  status: UploadStatus;
  message: string;
}
