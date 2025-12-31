import { expect } from 'chai';

describe('Domain Filter Logic', () => {
    // Test the same logic used in parseCertificate
    const testAcUkFilter = (domains: string[]): boolean => {
        return domains.some(domain => domain.endsWith('.ac.uk') || domain === 'ac.uk');
    };

    describe('.ac.uk domain matching', () => {
        it('should match exact .ac.uk domain', () => {
            const domains = ['example.ac.uk'];
            expect(testAcUkFilter(domains)).to.be.true;
        });

        it('should match subdomain of .ac.uk', () => {
            const domains = ['subdomain.example.ac.uk'];
            expect(testAcUkFilter(domains)).to.be.true;
        });

        it('should match just ac.uk', () => {
            const domains = ['ac.uk'];
            expect(testAcUkFilter(domains)).to.be.true;
        });

        it('should match when .ac.uk is among other domains', () => {
            const domains = ['example.com', 'university.ac.uk', 'example.org'];
            expect(testAcUkFilter(domains)).to.be.true;
        });

        it('should NOT match .com domains', () => {
            const domains = ['example.com'];
            expect(testAcUkFilter(domains)).to.be.false;
        });

        it('should NOT match .co.uk domains', () => {
            const domains = ['example.co.uk'];
            expect(testAcUkFilter(domains)).to.be.false;
        });

        it('should NOT match partial matches', () => {
            const domains = ['notac.uk'];
            expect(testAcUkFilter(domains)).to.be.false;
        });

        it('should NOT match if .ac.uk is in middle of domain', () => {
            const domains = ['ac.uk.example.com'];
            expect(testAcUkFilter(domains)).to.be.false;
        });

        it('should handle multiple subdomains', () => {
            const domains = ['www.library.oxford.ac.uk'];
            expect(testAcUkFilter(domains)).to.be.true;
        });

        it('should handle empty array', () => {
            const domains: string[] = [];
            expect(testAcUkFilter(domains)).to.be.false;
        });
    });

    describe('CN regex extraction', () => {
        // Test the CN extraction regex
        const extractCN = (subject: string): string | null => {
            const cnMatch = subject.match(/CN=([^,\n]+)/);
            return cnMatch ? cnMatch[1] : null;
        };

        it('should extract CN from simple subject', () => {
            const subject = 'CN=example.ac.uk';
            expect(extractCN(subject)).to.equal('example.ac.uk');
        });

        it('should extract CN from complex subject', () => {
            const subject = 'C=GB, ST=England, L=Oxford, O=University, CN=www.ox.ac.uk';
            expect(extractCN(subject)).to.equal('www.ox.ac.uk');
        });

        it('should extract CN when it has spaces', () => {
            const subject = 'CN=University of Oxford, O=Oxford, C=GB';
            expect(extractCN(subject)).to.equal('University of Oxford');
        });

        it('should return null when no CN present', () => {
            const subject = 'C=GB, O=Company';
            expect(extractCN(subject)).to.be.null;
        });

        it('should handle CN with special characters', () => {
            const subject = 'CN=*.example.ac.uk, O=Org';
            expect(extractCN(subject)).to.equal('*.example.ac.uk');
        });
    });
});
