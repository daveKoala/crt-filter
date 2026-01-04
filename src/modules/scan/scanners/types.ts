export interface CTLogEntry {
  leaf_input: string;
  extra_data: string;
}

export interface CTLogResponse {
  entries: CTLogEntry[];
}

export interface SignedTreeHead {
  tree_size: number;
  timestamp: number;
  sha256_root_hash: string;
  tree_head_signature: string;
}

export type CTEntryType = "x509" | "precert" | "unknown";

export interface CertificateData {
  cert_id: string;
  issuer: string;
  common_name: string;
  name_values: string;
  not_after: string;
  not_before: string;
  entry_timestamp?: number;
  entry_type?: CTEntryType;
}

export interface ProviderConfig {
  google?: string[];
  cloudflare?: string[];
  digicert?: string[];
  letsencrypt?: string[];
  sectigo?: string[];
}
