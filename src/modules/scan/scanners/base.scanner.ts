import type { Database } from 'better-sqlite3';
import fs from 'fs';
import type { CertificateData, CTLogResponse, SignedTreeHead } from './types';
import type { LeafInputInfo } from './utils/parser';
import axios from 'axios';
import { parseLeafInput } from './utils/parser';
import { matchesDomainFilter } from './utils/domain-matcher';
import { StoppingStrategy, ConsecutiveOldBatchesStrategy } from './strategies';

export interface ScannerConfig {
  window: string;
  domains: string[];
  logName: string;
  stoppingStrategy?: StoppingStrategy;
}

export abstract class BaseScanner {
  protected db: Database;
  protected config: ScannerConfig;
  protected batchSize = 1000;
  protected maxBatches = 50000; // Increased from 1000 to allow scanning up to 50 million entries
  protected stoppingStrategy: StoppingStrategy;
  private jsonlPath: string | null;

  constructor(db: Database, config: ScannerConfig) {
    this.db = db;
    this.config = config;
    this.jsonlPath = process.env.CERT_JSONL_PATH?.trim() || null;

    // Use provided strategy or default to ConsecutiveOldBatchesStrategy
    this.stoppingStrategy = config.stoppingStrategy || new ConsecutiveOldBatchesStrategy(5, 90);
  }

  /**
   * Get the base URL for the CT log provider
   */
  protected abstract getBaseUrl(): string;

  /**
   * Get the provider name for logging
   */
  protected abstract getProviderName(): string;

  /**
   * Construct the full log path for API endpoints
   */
  protected getLogPath(): string {
    return this.config.logName ? `/${this.config.logName}` : '';
  }

  /**
   * Parse time window string to millisecond timestamp
   */
  protected parseTimeWindow(window: string): number {
    const now = Date.now();
    const match = window.match(/^(\d+)(month|year|day)s?$/i);
    if (!match) return now - (6 * 30 * 24 * 60 * 60 * 1000); // Default 6 months

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    let milliseconds = 0;
    switch (unit) {
      case 'day':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        milliseconds = value * 30 * 24 * 60 * 60 * 1000;
        break;
      case 'year':
        milliseconds = value * 365 * 24 * 60 * 60 * 1000;
        break;
    }

    return now - milliseconds;
  }

  /**
   * Check if certificate matches any of the configured domain filters
   */
  protected matchesDomainFilter(cert: CertificateData): boolean {
    return matchesDomainFilter(cert, this.config.domains);
  }

  /**
   * Save certificate to database
   */
  protected saveCertificate(cert: CertificateData): void {
    const stmt = this.db.prepare(`
      INSERT INTO certificates (
        cert_id,
        issuer,
        common_name,
        name_values,
        not_after,
        not_before,
        entry_timestamp,
        entry_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      cert.cert_id,
      cert.issuer,
      cert.common_name,
      cert.name_values,
      cert.not_after,
      cert.not_before,
      cert.entry_timestamp ?? null,
      cert.entry_type ?? null
    );

    if (this.jsonlPath) {
      try {
        const record = {
          ...cert,
          provider: this.getProviderName(),
          log_name: this.config.logName,
        };
        fs.appendFileSync(this.jsonlPath, `${JSON.stringify(record)}\n`, 'utf8');
      } catch (error) {
        console.error('Error writing JSONL:', error);
      }
    }
  }

  /**
   * Get the signed tree head from CT log
   */
  protected async getTreeSize(): Promise<number> {
    const baseUrl = this.getBaseUrl();
    const logPath = this.getLogPath();
    const sthUrl = `${baseUrl}${logPath}/ct/v1/get-sth`;

    const response = await axios.get<SignedTreeHead>(sthUrl);
    return response.data.tree_size;
  }

  /**
   * Fetch entries from CT log
   */
  protected async fetchEntries(start: number, end: number): Promise<CTLogResponse> {
    const baseUrl = this.getBaseUrl();
    const logPath = this.getLogPath();
    const url = `${baseUrl}${logPath}/ct/v1/get-entries?start=${start}&end=${end}`;

    const response = await axios.get<CTLogResponse>(url);
    return response.data;
  }

  /**
   * Main scan method - implemented by base class
   */
  public async scan(): Promise<void> {
    const providerName = this.getProviderName();
    const logName = this.config.logName;

    console.log(`Starting ${providerName} scan with log: ${logName}`);

    try {
      // Reset stopping strategy for each scan
      this.stoppingStrategy.reset();
      console.log(`Using stopping strategy: ${this.stoppingStrategy.getDescription()}`);

      const treeSize = await this.getTreeSize();
      console.log(`Tree size: ${treeSize}, scanning backwards from latest entries`);

      const cutoffTime = this.parseTimeWindow(this.config.window);
      console.log(`Looking for certs newer than: ${new Date(cutoffTime).toISOString()}`);

      let currentIndex = treeSize - 1;
      let totalFound = 0;
      let totalSaved = 0;
      let totalParseErrors = 0;

      for (let batch = 0; batch < this.maxBatches; batch++) {
        const end = currentIndex;
        const start = Math.max(0, currentIndex - this.batchSize + 1);

        console.log(`Fetching entries ${start} to ${end}...`);

        try {
          const data = await this.fetchEntries(start, end);
          const entries = data.entries;

          if (!entries || entries.length === 0) {
            console.log('No more entries found');
            break;
          }

          let savedCount = 0;
          let parsedCount = 0;
          let certsNewerThanCutoff = 0;
          let certsOlderThanCutoff = 0;
          let parseErrors = 0;
          let oldestEntryTimestamp: number | null = null;

          for (const entry of entries) {
            const leafInfo = parseLeafInput(entry.leaf_input);
            const entryTimestamp =
              typeof leafInfo.entry_timestamp === 'number'
                ? leafInfo.entry_timestamp
                : null;
            if (entryTimestamp !== null) {
              if (oldestEntryTimestamp === null || entryTimestamp < oldestEntryTimestamp) {
                oldestEntryTimestamp = entryTimestamp;
              }
            }

            const cert = await this.parseCertificate(
              entry.leaf_input,
              entry.extra_data,
              leafInfo
            );
            if (cert) {
              // Apply domain filter
              if (!this.matchesDomainFilter(cert)) {
                continue;
              }

              parsedCount++;

              const certIssuedTime =
                cert.entry_timestamp ?? new Date(cert.not_before).getTime();
              if (certIssuedTime >= cutoffTime) {
                certsNewerThanCutoff++;
                try {
                  this.saveCertificate(cert);
                  savedCount++;
                } catch (err) {
                  console.error('Error saving certificate:', err);
                }
              } else {
                certsOlderThanCutoff++;
              }
            } else {
              parseErrors++;
            }
          }

          totalFound += parsedCount;
          totalSaved += savedCount;
          totalParseErrors += parseErrors;

          console.log(
            `Processed ${entries.length} entries, ${parseErrors} parse errors, ` +
            `found ${parsedCount} matching certs, ${certsNewerThanCutoff} within time window, ` +
            `${certsOlderThanCutoff} older than cutoff, saved ${savedCount} certificates`
          );

          // Use stopping strategy to determine if we should stop
          const totalCertsChecked = certsNewerThanCutoff + certsOlderThanCutoff;
          const decision = this.stoppingStrategy.shouldStop({
            batchNumber: batch,
            totalEntries: entries.length,
            certsNewerThanCutoff,
            certsOlderThanCutoff,
            totalCertsChecked,
            cutoffTime,
            oldestEntryTimestamp,
          });

          if (decision.shouldStop) {
            console.log(`Stopping: ${decision.reason}`);
            if (decision.metadata) {
              console.log('Stop metadata:', decision.metadata);
            }
            break;
          }

          currentIndex = start - 1;

          if (currentIndex < (treeSize - (this.maxBatches * this.batchSize))) {
            console.log('Scanned far enough back, stopping');
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            console.error(`Error fetching CT log: ${error.message}`);
          } else {
            console.error('Error fetching CT log:', error);
          }
          break;
        }
      }

      console.log(`${providerName} ${logName} scan complete. Final index: ${currentIndex}`);
      console.log(
        `Summary: Found ${totalFound} matching certificates, ` +
        `saved ${totalSaved}, parse errors: ${totalParseErrors}`
      );

    } catch (error: unknown) {
      console.error(`${providerName} ${logName} error:`, error);
      throw error;
    }
  }

  /**
   * Parse certificate - to be implemented by subclasses or imported from utils
   */
  protected abstract parseCertificate(
    leafInput: string,
    extraData: string,
    leafInfo?: LeafInputInfo
  ): Promise<CertificateData | null> | CertificateData | null;
}
