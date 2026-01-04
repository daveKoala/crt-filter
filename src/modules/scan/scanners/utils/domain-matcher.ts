import type { CertificateData } from '../types';

/**
 * Normalize a domain value by trimming, lowercasing, and removing trailing dots
 */
export function normalizeDomainValue(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '');
}

/**
 * Check if a domain matches any of the configured domain filters
 *
 * @param cert - Certificate data containing name_values (comma-separated domains)
 * @param domainFilters - Array of domain filters (e.g., [".ac.uk", ".edu"])
 * @returns true if the certificate matches any domain filter, false otherwise
 *
 * @example
 * // Certificate with name_values: "example.ac.uk,www.example.ac.uk"
 * matchesDomainFilter(cert, [".ac.uk"]) // returns true
 *
 * @example
 * // Certificate with name_values: "example.com"
 * matchesDomainFilter(cert, [".ac.uk"]) // returns false
 *
 * @example
 * // No filters - match everything
 * matchesDomainFilter(cert, []) // returns true
 */
export function matchesDomainFilter(
  cert: CertificateData,
  domainFilters: string[]
): boolean {
  // No filter = match everything
  if (domainFilters.length === 0) {
    return true;
  }

  // Parse certificate name_values (comma-separated domains)
  const nameValues = cert.name_values
    .split(',')
    .map(value => normalizeDomainValue(value))
    .filter(Boolean);

  // Check if any domain in the cert matches any filter
  return nameValues.some(domain =>
    domainFilters.some(filter => {
      const normalizedFilter = normalizeDomainValue(filter);
      if (!normalizedFilter) {
        return false;
      }

      // Ensure filter starts with a dot for suffix matching
      const suffix = normalizedFilter.startsWith('.')
        ? normalizedFilter
        : `.${normalizedFilter}`;

      return domain.endsWith(suffix);
    })
  );
}
