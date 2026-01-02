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

export interface CertificateData {
  cert_id: string;
  issuer: string;
  common_name: string;
  name_values: string;
  expiry_date: string;
  not_before: string;
}

export interface ProviderConfig {
  google?: string[];
  cloudflare?: string[];
  digicert?: string[];
}
