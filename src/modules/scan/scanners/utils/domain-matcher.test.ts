import { expect } from "chai";
import { normalizeDomainValue, matchesDomainFilter } from "./domain-matcher";
import type { CertificateData } from "../types";

describe("domain-matcher", () => {
  describe("normalizeDomainValue", () => {
    it("should trim whitespace", () => {
      expect(normalizeDomainValue("  example.com  ")).to.equal("example.com");
    });

    it("should convert to lowercase", () => {
      expect(normalizeDomainValue("Example.COM")).to.equal("example.com");
    });

    it("should remove trailing dots", () => {
      expect(normalizeDomainValue("example.com.")).to.equal("example.com");
      expect(normalizeDomainValue("example.com...")).to.equal("example.com");
    });

    it("should handle all transformations together", () => {
      expect(normalizeDomainValue("  Example.AC.UK..  ")).to.equal(
        "example.ac.uk"
      );
    });
  });

  describe("matchesDomainFilter", () => {
    const createCert = (nameValues: string): CertificateData => ({
      cert_id: "test123",
      issuer: "Test CA",
      common_name: "test.example.com",
      name_values: nameValues,
      not_after: "2026-01-01",
      not_before: "2025-01-01",
    });

    describe("No filters (empty array)", () => {
      it("should match everything when no filters are provided", () => {
        const cert = createCert("example.com");
        expect(matchesDomainFilter(cert, [])).to.be.true;
      });

      it("should match any domain when no filters are provided", () => {
        const cert = createCert("anything.anywhere.xyz");
        expect(matchesDomainFilter(cert, [])).to.be.true;
      });
    });

    describe("Single domain filter", () => {
      it("should match domain ending with .ac.uk", () => {
        const cert = createCert("oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match subdomain ending with .ac.uk", () => {
        const cert = createCert("www.oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should not match domain that doesn't end with .ac.uk", () => {
        const cert = createCert("example.com");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.false;
      });

      it("should not match partial suffix", () => {
        const cert = createCert("notac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.false;
      });

      it("should handle filter without leading dot", () => {
        const cert = createCert("example.ac.uk");
        expect(matchesDomainFilter(cert, ["ac.uk"])).to.be.true;
      });
    });

    describe("Multiple domains in certificate", () => {
      it("should match if ANY domain matches the filter", () => {
        const cert = createCert("example.com,oxford.ac.uk,test.org");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should not match if NO domains match the filter", () => {
        const cert = createCert("example.com,test.org,demo.net");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.false;
      });

      it("should match multiple .ac.uk domains", () => {
        const cert = createCert("oxford.ac.uk,cambridge.ac.uk,ucl.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });
    });

    describe("Multiple filters", () => {
      it("should match if domain matches ANY filter", () => {
        const cert = createCert("example.edu");
        expect(matchesDomainFilter(cert, [".ac.uk", ".edu"])).to.be.true;
      });

      it("should match .ac.uk with multiple filters", () => {
        const cert = createCert("oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk", ".edu", ".gov"])).to.be
          .true;
      });

      it("should not match if domain matches NONE of the filters", () => {
        const cert = createCert("example.com");
        expect(matchesDomainFilter(cert, [".ac.uk", ".edu", ".gov"])).to.be
          .false;
      });
    });

    describe("Case insensitivity", () => {
      it("should match regardless of domain case", () => {
        const cert = createCert("OXFORD.AC.UK");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match regardless of filter case", () => {
        const cert = createCert("oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".AC.UK"])).to.be.true;
      });

      it("should match with mixed case in both", () => {
        const cert = createCert("OxFoRd.Ac.Uk");
        expect(matchesDomainFilter(cert, [".Ac.Uk"])).to.be.true;
      });
    });

    describe("Whitespace handling", () => {
      it("should handle whitespace in name_values", () => {
        const cert = createCert("  oxford.ac.uk  ,  cambridge.ac.uk  ");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should handle whitespace in filters", () => {
        const cert = createCert("oxford.ac.uk");
        expect(matchesDomainFilter(cert, ["  .ac.uk  "])).to.be.true;
      });
    });

    describe("Edge cases", () => {
      it("should handle trailing dots in domain", () => {
        const cert = createCert("oxford.ac.uk.");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should handle empty strings in name_values", () => {
        const cert = createCert("oxford.ac.uk,,cambridge.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should not match empty name_values", () => {
        const cert = createCert("");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.false;
      });

      it("should handle wildcard domains", () => {
        const cert = createCert("*.oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should handle deep subdomains", () => {
        const cert = createCert("deep.sub.domain.oxford.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });
    });

    describe("Real-world UK university examples", () => {
      it("should match Oxford University", () => {
        const cert = createCert("www.ox.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match Cambridge University", () => {
        const cert = createCert("cam.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match University College London", () => {
        const cert = createCert("ucl.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match Imperial College", () => {
        const cert = createCert("imperial.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match Edinburgh University", () => {
        const cert = createCert("ed.ac.uk");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });
    });

    describe("Real-world edge case from your data", () => {
      it("should match cert with imperva.com in name_values", () => {
        // Based on your actual data: "think.edgehill.ac.uk,imperva.com"
        const cert = createCert("think.edgehill.ac.uk,imperva.com");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should match wildcard cert from your data", () => {
        // Based on your actual data: "*.uws.ac.uk,imperva.com"
        const cert = createCert("*.uws.ac.uk,imperva.com");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.true;
      });

      it("should not match imperva.com alone", () => {
        const cert = createCert("imperva.com");
        expect(matchesDomainFilter(cert, [".ac.uk"])).to.be.false;
      });
    });
  });
});
