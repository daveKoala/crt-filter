/**
 * CT Log Configuration - Single Source of Truth
 *
 * This file contains the definitive list of CT logs to scan for certificate discovery.
 *
 * MAINTENANCE SCHEDULE:
 * - Review every 6 months when logs rotate (Jan/Jul)
 * - Next update: July 2026 (add 2026h1 logs, remove old 2024 logs)
 *
 * SCANNING MODES:
 * - CONTINUOUS: Scan regularly (weekly/monthly) for new certificates
 * - HISTORICAL: Scan once to backfill, then remove from continuous scans
 *
 * See CT_LOG_SELECTION.md for detailed analysis and justification.
 *
 * Last Updated: 2026-01-04
 */

import type { ProviderConfig } from './scanners/types';

export interface CTLogMetadata {
  /** Log identifier as used in URLs */
  id: string;
  /** Human-readable description */
  description: string;
  /** Time period this log covers */
  period: string;
  /** Whether to scan continuously or just once */
  mode: 'continuous' | 'historical';
  /** Estimated tree size (entries) */
  treeSize?: string;
}

export interface CTLogProviderMetadata {
  google: CTLogMetadata[];
  cloudflare: CTLogMetadata[];
  digicert: CTLogMetadata[];
  letsencrypt: CTLogMetadata[];
  sectigo: CTLogMetadata[];
}

/**
 * Complete CT log configuration with metadata
 * This is the master list - all other configs derive from this
 */
export const CT_LOGS_WITH_METADATA: CTLogProviderMetadata = {
  google: [
    // Current generation (continuous scan)
    {
      id: 'us1/argon2025h2',
      description: 'Google Argon US (current)',
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '2.5B',
    },
    {
      id: 'eu1/xenon2025h2',
      description: 'Google Xenon EU (current)',
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '2.6B',
    },

    // Previous generation (historical/one-time scan)
    {
      id: 'us1/argon2025h1',
      description: 'Google Argon US (H1 2025)',
      period: 'Jan 2025 - Jun 2025',
      mode: 'historical',
      treeSize: '1.4B',
    },
    {
      id: 'eu1/xenon2025h1',
      description: 'Google Xenon EU (H1 2025)',
      period: 'Jan 2025 - Jun 2025',
      mode: 'historical',
      treeSize: '1.9B',
    },

    // 2024 logs (historical/one-time scan)
    {
      id: 'us1/argon2024',
      description: 'Google Argon US (2024)',
      period: 'Jan 2024 - Dec 2024',
      mode: 'historical',
      treeSize: '2.5B',
    },
    {
      id: 'eu1/xenon2024',
      description: 'Google Xenon EU (2024)',
      period: 'Jan 2024 - Dec 2024',
      mode: 'historical',
      treeSize: '2.7B',
    },

    // Optional: 2023 logs for 36-month depth (uncomment if needed)
    // {
    //   id: 'argon2023',
    //   description: 'Google Argon (2023)',
    //   period: 'Jan 2023 - Dec 2023',
    //   mode: 'historical',
    //   treeSize: '1.8B',
    // },
    // {
    //   id: 'xenon2023',
    //   description: 'Google Xenon (2023)',
    //   period: 'Jan 2023 - Dec 2023',
    //   mode: 'historical',
    //   treeSize: '2.1B',
    // },
  ],

  cloudflare: [
    {
      id: 'nimbus2025',
      description: 'Cloudflare Nimbus 2025',
      period: 'Jan 2025 - present',
      mode: 'continuous',
      treeSize: '3.1B',
    },
    // Note: nimbus2024 and earlier are retired (404)
  ],

  digicert: [
    // Yeti series (full-year logs)
    {
      id: 'yeti2025',
      description: 'DigiCert Yeti 2025',
      period: 'Jan 2025 - present',
      mode: 'continuous',
      treeSize: '2.0B',
    },

    // Wyvern series (half-year logs)
    {
      id: '2025h2',
      description: 'DigiCert Wyvern H2 2025',
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '1.0B',
    },
    {
      id: '2025h1',
      description: 'DigiCert Wyvern H1 2025',
      period: 'Jan 2025 - Jun 2025',
      mode: 'historical',
      treeSize: '276M',
    },
    {
      id: '2024h2',
      description: 'DigiCert Wyvern H2 2024',
      period: 'Jul 2024 - Dec 2024',
      mode: 'historical',
      treeSize: '30M',
    },
    // Note: 2024h1 has only 50K entries, excluded
  ],

  letsencrypt: [
    {
      id: '2025h2',
      description: "Let's Encrypt Oak H2 2025",
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '2.0B',
    },
    {
      id: '2025h1',
      description: "Let's Encrypt Oak H1 2025",
      period: 'Jan 2025 - Jun 2025',
      mode: 'historical',
      treeSize: '991M',
    },
    // Note: 2024 and earlier logs are retired (404)
  ],

  sectigo: [
    // Mammoth series
    {
      id: 'mammoth2025h2',
      description: 'Sectigo Mammoth H2 2025',
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '865M',
    },

    // Elephant series
    {
      id: 'elephant2025h2',
      description: 'Sectigo Elephant H2 2025',
      period: 'Jul 2025 - present',
      mode: 'continuous',
      treeSize: '1.2B',
    },
    // Note: 2024 and 2025h1 logs not available (404)
  ],
};

/**
 * Default provider configuration for API endpoints
 * Extracted from metadata above
 */
export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  google: CT_LOGS_WITH_METADATA.google.map(log => log.id),
  cloudflare: CT_LOGS_WITH_METADATA.cloudflare.map(log => log.id),
  digicert: CT_LOGS_WITH_METADATA.digicert.map(log => log.id),
  letsencrypt: CT_LOGS_WITH_METADATA.letsencrypt.map(log => log.id),
  sectigo: CT_LOGS_WITH_METADATA.sectigo.map(log => log.id),
};

/**
 * Get only continuous scan logs (for regular monitoring)
 */
export function getContinuousLogs(): ProviderConfig {
  return {
    google: CT_LOGS_WITH_METADATA.google
      .filter(log => log.mode === 'continuous')
      .map(log => log.id),
    cloudflare: CT_LOGS_WITH_METADATA.cloudflare
      .filter(log => log.mode === 'continuous')
      .map(log => log.id),
    digicert: CT_LOGS_WITH_METADATA.digicert
      .filter(log => log.mode === 'continuous')
      .map(log => log.id),
    letsencrypt: CT_LOGS_WITH_METADATA.letsencrypt
      .filter(log => log.mode === 'continuous')
      .map(log => log.id),
    sectigo: CT_LOGS_WITH_METADATA.sectigo
      .filter(log => log.mode === 'continuous')
      .map(log => log.id),
  };
}

/**
 * Get only historical scan logs (for one-time backfill)
 */
export function getHistoricalLogs(): ProviderConfig {
  return {
    google: CT_LOGS_WITH_METADATA.google
      .filter(log => log.mode === 'historical')
      .map(log => log.id),
    cloudflare: CT_LOGS_WITH_METADATA.cloudflare
      .filter(log => log.mode === 'historical')
      .map(log => log.id),
    digicert: CT_LOGS_WITH_METADATA.digicert
      .filter(log => log.mode === 'historical')
      .map(log => log.id),
    letsencrypt: CT_LOGS_WITH_METADATA.letsencrypt
      .filter(log => log.mode === 'historical')
      .map(log => log.id),
    sectigo: CT_LOGS_WITH_METADATA.sectigo
      .filter(log => log.mode === 'historical')
      .map(log => log.id),
  };
}

/**
 * Get total number of logs configured
 */
export function getTotalLogCount(): number {
  return (
    CT_LOGS_WITH_METADATA.google.length +
    CT_LOGS_WITH_METADATA.cloudflare.length +
    CT_LOGS_WITH_METADATA.digicert.length +
    CT_LOGS_WITH_METADATA.letsencrypt.length +
    CT_LOGS_WITH_METADATA.sectigo.length
  );
}

/**
 * Get log metadata by provider and log ID
 */
export function getLogMetadata(
  provider: keyof ProviderConfig,
  logId: string
): CTLogMetadata | undefined {
  return CT_LOGS_WITH_METADATA[provider]?.find(log => log.id === logId);
}
