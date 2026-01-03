import { X509Certificate, createHash } from "crypto";
import type { CertificateData, CTEntryType } from "../types";

export type LeafInputInfo = {
  entry_type: CTEntryType;
  entry_timestamp?: number;
  cert_der?: Buffer;
};

const normalizeDomainName = (value: string): string => {
  return value.trim().toLowerCase().replace(/\.+$/, "");
};

export const parseLeafInput = (leafInput: string): LeafInputInfo => {
  try {
    const decoded = Buffer.from(leafInput, "base64");

    if (decoded.length < 12) {
      return { entry_type: "unknown" };
    }

    const timestamp =
      decoded.readUInt32BE(2) * 2 ** 32 + decoded.readUInt32BE(6);
    const entryType = decoded.readUInt16BE(10);

    if (entryType === 0) {
      const certLengthOffset = 12;
      if (decoded.length >= certLengthOffset + 3) {
        const certLength =
          (decoded[certLengthOffset] << 16) |
          (decoded[certLengthOffset + 1] << 8) |
          decoded[certLengthOffset + 2];
        const certStart = certLengthOffset + 3;

        if (certLength > 0 && decoded.length >= certStart + certLength) {
          return {
            entry_type: "x509",
            entry_timestamp: timestamp,
            cert_der: decoded.subarray(certStart, certStart + certLength),
          };
        }
      }

      return { entry_type: "x509", entry_timestamp: timestamp };
    }

    if (entryType === 1) {
      return { entry_type: "precert", entry_timestamp: timestamp };
    }

    return { entry_type: "unknown", entry_timestamp: timestamp };
  } catch {
    return { entry_type: "unknown" };
  }
};

const parseFirstCertFromExtraData = (extraData: string): Buffer | null => {
  const decoded = Buffer.from(extraData, "base64");

  // CT extra_data: 3-byte length prefix + DER cert + chain
  if (decoded.length < 3) return null;

  const certLength = (decoded[0] << 16) | (decoded[1] << 8) | decoded[2];

  if (certLength <= 0 || certLength > decoded.length - 3) {
    return null;
  }

  return decoded.subarray(3, 3 + certLength);
};

/**
 * Extracts the leaf X509 certificate from CT entry data and
 * returns normalized certificate metadata.
 */
export const parseCertificate = (
  leafInput: string,
  extraData: string,
  leafInfo?: LeafInputInfo
): CertificateData | null => {
  try {
    const entryInfo = leafInfo ?? parseLeafInput(leafInput);
    let certDer: Buffer | null = null;

    if (entryInfo.entry_type === "x509" && entryInfo.cert_der) {
      certDer = entryInfo.cert_der;
    } else {
      certDer = parseFirstCertFromExtraData(extraData);
    }

    if (!certDer) return null;

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
      entry_timestamp: entryInfo.entry_timestamp,
      entry_type: entryInfo.entry_type,
    };

    return response;
  } catch {
    // CT logs regularly contain:
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
  return match ? match[1].trim() : "";
};

/**
 * Extract DNS names from SANs (preferred) or CN (fallback).
 */
export const getNameValues = (cert: X509Certificate): string[] => {
  const domains = new Set<string>();

  // Subject Alternative Names (authoritative)
  if (cert.subjectAltName) {
    for (const entry of cert.subjectAltName.split(/,\s*/)) {
      if (entry.startsWith("DNS:")) {
        const normalized = normalizeDomainName(entry.slice(4));
        if (normalized) {
          domains.add(normalized);
        }
      }
    }
  }

  if (cert.subject) {
    const commonName = getCommonName(cert);
    const normalized = normalizeDomainName(commonName);
    if (normalized) {
      domains.add(normalized);
    }
  }

  return Array.from(domains);
};
