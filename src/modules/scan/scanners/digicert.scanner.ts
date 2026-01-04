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
    // DigiCert runs two series:
    // - Yeti: https://yeti{year}.ct.digicert.com/log (full year logs)
    // - Wyvern: https://wyvern.ct.digicert.com/{year}h{half} (half-year logs)

    if (this.config.logName.startsWith('yeti')) {
      // Yeti series: yeti2025 -> https://yeti2025.ct.digicert.com/log
      return `https://${this.config.logName}.ct.digicert.com/log`;
    } else {
      // Wyvern series: 2025h2 -> https://wyvern.ct.digicert.com/2025h2
      return `https://wyvern.ct.digicert.com/${this.config.logName}`;
    }
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
