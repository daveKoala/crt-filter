import { expect } from 'chai';
import { X509Certificate } from 'crypto';

describe('Real CT Log Entry Parsing', () => {
    it('should parse real Cisco Meraki certificate from CT log', () => {
        // Real CT log entry from Google CT
        const leafInput = "AAAAAAGDVgkjDQABGUIjMNe++V5+Oj0iDybPHPoFZBo3KkQeXR+6l1vJW34AA2AwggNcoAMCAQICEALPy+ZUsQ2DquoDlfjVP5EwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCVVMxHDAaBgNVBAoTE0Npc2NvIFN5c3RlbXMsIEluYy4xGDAWBgNVBAMTD0Npc2NvIE1lcmFraSBDQTAeFw0yMjA5MTkwMDAwMDBaFw0yMzA5MTgyMzU5NTlaMH8xCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQHEw1TYW4gRnJhbmNpc2NvMRQwEgYDVQQKEwtNZXJha2ksIExMQzEtMCsGA1UEAwwkKi5jNDhiYTM2MDU3NGQuZGV2aWNlcy5tZXJha2kuZGlyZWN0MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE8G2FbEJKyqV0xSFw5gvSa5Ea4XkMb5YAqL1G8wBScGC8EstmHu+y4tmZbTsjaSqMsqE2bLODd6i27XBQgK9WTlnLaj/10dPzeo7gDvIZV2Com+Ee0q3Bbyzokw5r78cuo4IB0jCCAc4wHwYDVR0jBBgwFoAUY2GVVXb0FBalNOOwPXMQN/zKg40wHQYDVR0OBBYEFG5gjzc3MZg8QNVPfkC1uuy1OhvpMC8GA1UdEQQoMCaCJCouYzQ4YmEzNjA1NzRkLmRldmljZXMubWVyYWtpLmRpcmVjdDAOBgNVHQ8BAf8EBAMCB4AwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMG0GA1UdHwRmMGQwMKAuoCyGKmh0dHA6Ly9jcmwzLmRpZ2ljZXJ0LmNvbS9DaXNjb01lcmFraUNBLmNybDAwoC6gLIYqaHR0cDovL2NybDQuZGlnaWNlcnQuY29tL0Npc2NvTWVyYWtpQ0EuY3JsMD4GA1UdIAQ3MDUwMwYGZ4EMAQICMCkwJwYIKwYBBQUHAgEWG2h0dHA6Ly93d3cuZGlnaWNlcnQuY29tL0NQUzBvBggrBgEFBQcBAQRjMGEwJAYIKwYBBQUHMAGGGGh0dHA6Ly9vY3NwLmRpZ2ljZXJ0LmNvbTA5BggrBgEFBQcwAoYtaHR0cDovL2NhY2VydHMuZGlnaWNlcnQuY29tL0Npc2NvTWVyYWtpQ0EuY3J0MAwGA1UdEwEB/wQCMAAAAA==";
        const extraData = "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";

        // Parse the certificate data (same logic as parseCertificate function)
        const extraDecoded = Buffer.from(extraData, 'base64');

        // Extract certificate length and data
        const certLength = (extraDecoded[0] << 16) | (extraDecoded[1] << 8) | (extraDecoded[2]);
        const certData = extraDecoded.slice(3, 3 + certLength);

        // Parse with X509Certificate
        const cert = new X509Certificate(certData);

        // Extract domains
        const domains: string[] = [];

        // Get Subject CN
        const subject = cert.subject;
        if (subject) {
            const cnMatch = subject.match(/CN=([^,\n]+)/);
            if (cnMatch) {
                domains.push(cnMatch[1]);
            }
        }

        // Get Subject Alternative Names
        const san = cert.subjectAltName;
        if (san) {
            const dnsNames = san.split(', ').filter(name => name.startsWith('DNS:'));
            domains.push(...dnsNames.map(name => name.replace('DNS:', '')));
        }

        console.log('\n=== Real Certificate Parsing Result ===');
        console.log('Subject:', subject);
        console.log('SAN:', san);
        console.log('Extracted domains:', domains);
        console.log('Valid from:', cert.validFrom);
        console.log('Valid to:', cert.validTo);
        console.log('Issuer:', cert.issuer);

        // Build CertificateData object (what would be returned if it passed .ac.uk filter)
        const certData_obj = {
            cert_id: Buffer.from(leafInput, 'base64').slice(0, 32).toString('hex'),
            cert_name: domains[0] || 'unknown',
            name_values: domains.join(', '),
            expiry_date: cert.validTo,
            valid_date: cert.validFrom
        };

        console.log('\n=== CertificateData Object ===');
        console.log(JSON.stringify(certData_obj, null, 2));
        console.log('=====================================\n');

        // Assertions
        expect(domains).to.include('*.c48ba360574d.devices.meraki.direct');
        expect(cert.validFrom).to.equal('Sep 19 00:00:00 2022 GMT');
        expect(cert.validTo).to.equal('Sep 18 23:59:59 2023 GMT');
        expect(certData_obj.cert_name).to.equal('*.c48ba360574d.devices.meraki.direct');

        // Test .ac.uk filter (should be false for this certificate)
        const hasAcUk = domains.some(domain => domain.endsWith('.ac.uk') || domain === 'ac.uk');
        expect(hasAcUk).to.be.false;
    });
});
