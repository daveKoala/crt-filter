import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class GoogleScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    return 'https://ct.googleapis.com/logs';
  }

  protected getProviderName(): string {
    return 'Google';
  }

  protected parseCertificate(leafInput: string, extraData: string): CertificateData | null {
    return parseCertificate(leafInput, extraData, this.config.domains);
  }
}
