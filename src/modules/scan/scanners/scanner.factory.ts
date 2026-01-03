import type { Database } from 'better-sqlite3';
import { BaseScanner, ScannerConfig } from './base.scanner';
import { GoogleScanner } from './google.scanner';
import { CloudflareScanner } from './cloudflare.scanner';
import { DigiCertScanner } from './digicert.scanner';
import { LetsEncryptScanner } from './letsencrypt.scanner';
import { SectigoScanner } from './sectigo.scanner';
import { GlobalSignScanner } from './globalsign.scanner';

export type ScannerProvider = 'google' | 'cloudflare' | 'digicert' | 'letsencrypt' | 'sectigo' | 'globalsign';

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
      case 'letsencrypt':
        return new LetsEncryptScanner(db, config);
      case 'sectigo':
        return new SectigoScanner(db, config);
      case 'globalsign':
        return new GlobalSignScanner(db, config);
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
      letsencrypt?: string[];
      sectigo?: string[];
      globalsign?: string[];
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

    // Create Let's Encrypt scanners
    if (providers.letsencrypt && providers.letsencrypt.length > 0) {
      for (const logName of providers.letsencrypt) {
        scanners.push(
          ScannerFactory.createScanner('letsencrypt', db, {
            window,
            domains,
            logName,
          })
        );
      }
    }

    // Create Sectigo scanners
    if (providers.sectigo && providers.sectigo.length > 0) {
      for (const logName of providers.sectigo) {
        scanners.push(
          ScannerFactory.createScanner('sectigo', db, {
            window,
            domains,
            logName,
          })
        );
      }
    }

    // Create GlobalSign scanners
    if (providers.globalsign && providers.globalsign.length > 0) {
      for (const logName of providers.globalsign) {
        scanners.push(
          ScannerFactory.createScanner('globalsign', db, {
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
