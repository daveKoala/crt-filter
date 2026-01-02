import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class DigiCertScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    // DigiCert uses a different URL structure where the log name is in the subdomain
    return `https://${this.config.logName}.ct.digicert.com/log`;
  }

  protected getProviderName(): string {
    return 'DigiCert';
  }

  /**
   * DigiCert doesn't use additional log path since it's in the base URL
   */
  protected getLogPath(): string {
    return '';
  }

  protected parseCertificate(leafInput: string, extraData: string): CertificateData | null {
    return parseCertificate(leafInput, extraData, this.config.domains);
  }
}
