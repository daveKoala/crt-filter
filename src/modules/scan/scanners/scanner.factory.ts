import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import { GoogleScanner } from './google.scanner';
import { CloudflareScanner } from './cloudflare.scanner';
import { DigiCertScanner } from './digicert.scanner';

export type ScannerProvider = 'google' | 'cloudflare' | 'digicert';

export class ScannerFactory {
  /**
   * Create a scanner instance based on the provider type
   */
  static createScanner(
    provider: ScannerProvider,
    db: Database,
    config: ScannerConfig
  ): BaseScanner {
    switch (provider) {
      case 'google':
        return new GoogleScanner(db, config);
      case 'cloudflare':
        return new CloudflareScanner(db, config);
      case 'digicert':
        return new DigiCertScanner(db, config);
      default:
        throw new Error(`Unknown scanner provider: ${provider}`);
    }
  }

  /**
   * Create multiple scanner instances from provider configuration
   */
  static createScannersFromConfig(
    db: Database,
    window: string,
    domains: string[],
    providers: {
      google?: string[];
      cloudflare?: string[];
      digicert?: string[];
    }
  ): BaseScanner[] {
    const scanners: BaseScanner[] = [];

    // Create Google scanners
    if (providers.google && providers.google.length > 0) {
      for (const logName of providers.google) {
        scanners.push(
          ScannerFactory.createScanner('google', db, {
            window,
            domains,
            logName,
          })
        );
      }
    }

    // Create Cloudflare scanners
    if (providers.cloudflare && providers.cloudflare.length > 0) {
      for (const logName of providers.cloudflare) {
        scanners.push(
          ScannerFactory.createScanner('cloudflare', db, {
            window,
            domains,
            logName,
          })
        );
      }
    }

    // Create DigiCert scanners
    if (providers.digicert && providers.digicert.length > 0) {
      for (const logName of providers.digicert) {
        scanners.push(
          ScannerFactory.createScanner('digicert', db, {
            window,
            domains,
            logName,
          })
        );
      }
    }

    return scanners;
  }
}
