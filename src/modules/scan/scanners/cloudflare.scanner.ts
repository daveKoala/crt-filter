import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class CloudflareScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    return 'https://ct.cloudflare.com/logs';
  }

  protected getProviderName(): string {
    return 'Cloudflare';
  }

  protected parseCertificate(leafInput: string, extraData: string): CertificateData | null {
    return parseCertificate(leafInput, extraData, this.config.domains);
  }
}
