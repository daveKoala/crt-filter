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
    return 'https://oak.ct.letsencrypt.org';
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
