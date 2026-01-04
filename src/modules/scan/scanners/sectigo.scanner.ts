import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import type { LeafInputInfo } from './utils/parser';
import { parseCertificate } from './utils/parser';
import type { CertificateData } from './types';

export class SectigoScanner extends BaseScanner {
  constructor(db: Database, config: ScannerConfig) {
    super(db, config);
  }

  protected getBaseUrl(): string {
    // Sectigo Elephant series uses URL structure: https://{logName}.ct.sectigo.com
    return `https://${this.config.logName}.ct.sectigo.com`;
  }

  protected getProviderName(): string {
    return 'Sectigo';
  }

  /**
   * Sectigo includes log name in base URL, so no additional path needed
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
