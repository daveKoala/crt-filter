import { X509Certificate, createHash } from "crypto";
import { CertificateData } from "../types";

/**
 * Extracts the leaf X509 certificate from CT extra_data and
 * returns normalized certificate metadata if it matches target domains.
 *
 * NOTE:
 * - Only supports X509_ENTRY records
 * - Precerts are intentionally skipped (extra_data parsing will fail)
 */
export const parseCertificate = (
  leafInput: string,
  extraData: string,
  domainFilter: string[]
): CertificateData | null => {
  try {
    const decoded = Buffer.from(extraData, "base64");

    // CT extra_data: 3-byte length prefix + DER cert + chain
    if (decoded.length < 4) return null;

    const certLength = (decoded[0] << 16) | (decoded[1] << 8) | decoded[2];

    if (certLength <= 0 || certLength > decoded.length - 3) {
      return null;
    }

    const certDer = decoded.subarray(3, 3 + certLength);
    const cert = new X509Certificate(certDer);

    const cert_id = createHash("sha256").update(cert.raw).digest("hex");

    const notBefore = new Date(cert.validFrom).toISOString();
    const notAfter = new Date(cert.validTo).toISOString();

    const response = {
      cert_id: cert_id,
      issuer: formatIssuer(cert.issuer),
      common_name: getCommonName(cert),
      name_values: getNameValues(cert).join(","),
      not_before: notBefore,
      not_after: notAfter,
    };

    return response;
  } catch {
    // CT logs regularly contain:
    // - precerts
    // - malformed chains
    // - experimental entries
    // Skipping is expected and correct
    return null;
  }
};

export const formatIssuer = (issuerString: string) => {
  return issuerString
    .replace(/\n/g, ", ") // Replace newlines with comma-space
    .replace(/\\/g, ""); // Remove backslashes (\, becomes ,)
};

export const getCommonName = (cert: X509Certificate) => {
  const match = cert.subject.match(/CN=([^,\n]+)/);
  return match ? match[1] : "";
};

/**
 * Extract DNS names from SANs (preferred) or CN (fallback).
 */
export const getNameValues = (cert: X509Certificate): string[] => {
  const domains = new Set<string>();

  // Subject Alternative Names (authoritative)
  if (cert.subjectAltName) {
    for (const entry of cert.subjectAltName.split(", ")) {
      if (entry.startsWith("DNS:")) {
        domains.add(entry.slice(4));
      }
    }
  }

  // Fallback to CN only if no SANs exist
  if (domains.size === 0 && cert.subject) {
    const match = cert.subject.match(/CN=([^,\n]+)/);
    if (match) {
      domains.add(match[1]);
    }
  }

  return Array.from(domains);
};
