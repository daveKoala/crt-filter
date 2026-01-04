import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import type { LeafInputInfo } from './utils/parser';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class DigiCertScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    // DigiCert Wyvern series uses URL structure: https://wyvern.ct.digicert.com/{logName}/
    return `https://wyvern.ct.digicert.com/${this.config.logName}`;
  }

  protected getProviderName(): string {
    return 'DigiCert';
  }

  /**
   * DigiCert includes log name in base URL, so no additional path needed
   */
  protected getLogPath(): string {
    return '';
  }

  protected parseCertificate(
    leafInput: string,
    extraData: string,
    leafInfo?: LeafInputInfo
  ): CertificateData | null {
    return parseCertificate(leafInput, extraData, leafInfo);
  }
}
