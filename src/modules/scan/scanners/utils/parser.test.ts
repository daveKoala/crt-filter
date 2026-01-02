import { X509Certificate } from "crypto";
import { expect } from "chai";
import getEntries from "./mockData/get-entries";
import {
  parseCertificate,
  getCommonName,
  formatIssuer,
  getNameValues,
} from "./parser";
import type { CertificateData } from "../types";

describe("parseCertificate", () => {
  describe("Integration: Parsing Base64 encoded blobs", () => {
    it("should parse CT log entries and return valid certificate data", () => {
      getEntries.entries.forEach((entry) => {
        const parsed = parseCertificate(entry.leaf_input, entry.extra_data, []);

        if (parsed !== null) {
          // Validate required fields exist
          expect(parsed).to.have.all.keys(
            "cert_id",
            "issuer",
            "common_name",
            "name_values",
            "not_before",
            "not_after"
          );

          // Validate cert_id format (SHA256 = 64 hex chars)
          expect(parsed.cert_id).to.match(/^[a-f0-9]{64}$/);

          // Validate non-empty strings
          expect(parsed.common_name).to.not.be.empty;
          expect(parsed.issuer).to.not.be.empty;
          expect(parsed.name_values).to.not.be.empty;
        }
      });
    });
  });

  describe("Unit: getCommonName", () => {
    it("should extract CN from certificate subject", () => {
      const mockCert = {
        subject: "C=US\nST=California\nO=Example Corp\nCN=example.com",
      } as X509Certificate;

      const result = getCommonName(mockCert);
      expect(result).to.equal("example.com");
    });

    it("should return empty string when CN is not found", () => {
      const mockCert = {
        subject: "C=US\nO=Example Corp",
      } as X509Certificate;

      const result = getCommonName(mockCert);
      expect(result).to.equal("");
    });

    it("should handle CN at the beginning of subject", () => {
      const mockCert = {
        subject: "CN=example.com\nC=US\nO=Example Corp",
      } as X509Certificate;

      const result = getCommonName(mockCert);
      expect(result).to.equal("example.com");
    });
  });

  describe("Unit: formatIssuer", () => {
    it("should replace newlines with comma-space", () => {
      const input = "C=US\nO=Let's Encrypt\nCN=E8";
      const result = formatIssuer(input);
      expect(result).to.equal("C=US, O=Let's Encrypt, CN=E8");
    });

    it("should remove escaped backslashes from commas", () => {
      const input = "C=US\nO=Cloudflare\\, Inc.\nCN=Cloudflare Inc RSA CA-2";
      const result = formatIssuer(input);
      expect(result).to.equal(
        "C=US, O=Cloudflare, Inc., CN=Cloudflare Inc RSA CA-2"
      );
    });
  });

  describe("Unit: getNameValues", () => {
    it("should extract single DNS name from subjectAltName", () => {
      const mockCert = {
        subjectAltName: "DNS:example.com",
      } as X509Certificate;

      const result = getNameValues(mockCert);
      expect(result).to.deep.equal(["example.com"]);
    });

    it("should extract multiple DNS names from subjectAltName", () => {
      const mockCert = {
        subjectAltName:
          "DNS:example.com, DNS:www.example.com, DNS:mail.example.com",
      } as X509Certificate;

      const result = getNameValues(mockCert);
      expect(result).to.deep.equal([
        "example.com",
        "www.example.com",
        "mail.example.com",
      ]);
    });

    it("should fallback to CN when no subjectAltName exists", () => {
      const mockCert = {
        subjectAltName: undefined,
        subject: "C=US\nCN=example.com",
      } as X509Certificate;

      const result = getNameValues(mockCert);
      expect(result).to.deep.equal(["example.com"]);
    });

    it("should ignore non-DNS entries in subjectAltName", () => {
      const mockCert = {
        subjectAltName: "DNS:example.com, IP:192.168.1.1, DNS:www.example.com",
      } as X509Certificate;

      const result = getNameValues(mockCert);
      expect(result).to.deep.equal(["example.com", "www.example.com"]);
    });
  });
});
