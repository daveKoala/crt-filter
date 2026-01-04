import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import type { LeafInputInfo } from './utils/parser';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class LetsEncryptScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    // Let's Encrypt uses log name in the URL path
    return `https://oak.ct.letsencrypt.org/${this.config.logName}`;
  }

  /**
   * Let's Encrypt includes log name in base URL, so no additional path needed
   */
  protected getLogPath(): string {
    return '';
  }

  protected getProviderName(): string {
    return 'Let\'s Encrypt';
  }

  protected parseCertificate(
    leafInput: string,
    extraData: string,
    leafInfo?: LeafInputInfo
  ): CertificateData | null {
    return parseCertificate(leafInput, extraData, leafInfo);
  }
}
