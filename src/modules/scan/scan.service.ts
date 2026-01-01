import type { Request, Response, NextFunction} from 'express'
import axios from 'axios'
import db from '../../db/database'
import { X509Certificate } from 'crypto'

interface CTLogEntry {
    leaf_input: string;
    extra_data: string;
}

interface CTLogResponse {
    entries: CTLogEntry[];
}

interface SignedTreeHead {
    tree_size: number;
    timestamp: number;
    sha256_root_hash: string;
    tree_head_signature: string;
}

interface CertificateData {
    cert_id: string;
    cert_name: string;
    name_values: string;
    expiry_date: string;
    not_before: string;
}

interface ProviderConfig {
    google?: string[];
    cloudflare?: string[];
    digicert?: string[];
}

// Global domains filter - configurable per scan
let currentDomains: string[] = ['.ac.uk'];

export const all = (req: Request, res: Response, next: NextFunction): void => {
    try{
        console.log('POST /scan endpoint hit');

        // Defaults: scan all providers, 13 months, .ac.uk domains
        const {
            window = '13months',
            domains = ['.ac.uk'],
            providers = {
                google: ['us1/argon2025h2'],
                cloudflare: ['nimbus2025'],
                digicert: ['yeti2025', 'nessie2025']
            }
        } = req.body as {
            window?: string;
            domains?: string[];
            providers?: ProviderConfig;
        };

        console.log('Request body:', { window, domains, providers });

        // Set global domains filter for this scan
        currentDomains = domains;

        const scanPromises: Promise<void>[] = [];

        // Google scans
        if (providers.google && providers.google.length > 0) {
            for (const log of providers.google) {
                console.log(`Starting Google scan with log: ${log}`);
                scanPromises.push(
                    scanCTLog(window, 'https://ct.googleapis.com/logs', log)
                        .then(() => console.log(`Google ${log} scan completed`))
                        .catch((error: unknown) => console.error(`Google ${log} error:`, error))
                );
            }
        }

        // Cloudflare scans
        if (providers.cloudflare && providers.cloudflare.length > 0) {
            for (const log of providers.cloudflare) {
                console.log(`Starting Cloudflare scan with log: ${log}`);
                scanPromises.push(
                    scanCTLog(window, 'https://ct.cloudflare.com/logs', log)
                        .then(() => console.log(`Cloudflare ${log} scan completed`))
                        .catch((error: unknown) => console.error(`Cloudflare ${log} error:`, error))
                );
            }
        }

        // DigiCert scans
        if (providers.digicert && providers.digicert.length > 0) {
            for (const log of providers.digicert) {
                console.log(`Starting DigiCert scan with log: ${log}`);
                const baseUrl = `https://${log}.ct.digicert.com/log`;
                scanPromises.push(
                    scanCTLog(window, baseUrl, '')
                        .then(() => console.log(`DigiCert ${log} scan completed`))
                        .catch((error: unknown) => console.error(`DigiCert ${log} error:`, error))
                );
            }
        }

        // All scans running in parallel
        Promise.all(scanPromises)
            .then(() => console.log('All scans completed successfully'))
            .catch((error: unknown) => console.error('Some scans failed:', error));

        res.status(200).json({
            message: 'Scans started',
            window,
            domains,
            providers,
            totalScans: scanPromises.length
        })
    }catch(error){
        console.error(error)
        res.status(500).json({ error: 'Failed to start scans' })
    }

}

const parseCertificate = (leafInput: string, extraData: string): CertificateData | null => {
    try {
        // Use extra_data which contains the full certificate chain
        // First certificate in chain is the one we want
        const extraDecoded = Buffer.from(extraData, 'base64');

        // Validate minimum length
        if (extraDecoded.length < 3) {
            return null;
        }

        // Extra data format: 3-byte length + certificate + more certs
        const certLength = (extraDecoded[0] << 16) | (extraDecoded[1] << 8) | extraDecoded[2];

        // Validate cert length
        if (certLength === 0 || certLength > extraDecoded.length - 3) {
            return null;
        }

        const certData = extraDecoded.slice(3, 3 + certLength);

        // Use Node's built-in X509Certificate
        const cert = new X509Certificate(certData);

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

        if (domains.length === 0) return null;

        // Filter for configured domains
        const hasMatchingDomain = domains.some(domain =>
            currentDomains.some(targetDomain =>
                domain.endsWith(targetDomain) || domain === targetDomain.replace('.', '')
            )
        );

        // DEBUG: Log first few domains to see what we're filtering
        if (Math.random() < 0.001) { // Log ~0.1% of certificates
            console.log('Sample certificate domains:', domains.slice(0, 3).join(', '));
            console.log('Matches target domains:', hasMatchingDomain);
        }

        if (!hasMatchingDomain) return null;

        const certName = domains[0] || 'unknown';
        const nameValues = domains.join(', ');

        return {
            cert_id: Buffer.from(leafInput).slice(0, 32).toString('hex'),
            cert_name: certName,
            name_values: nameValues,
            expiry_date: cert.validTo,
            not_before: cert.validFrom
        };
    } catch (error: unknown) {
        // Silently skip invalid certificates (common in CT logs with precerts and special entries)
        // Only log if it's an unexpected error type
        if (error instanceof Error && !error.message.includes('PEM routines')) {
            console.error('Unexpected error parsing certificate:', error.message);
        }
        return null;
    }
}

const saveCertificate = (cert: CertificateData): void => {
    const stmt = db.prepare(`
        INSERT INTO certificates (cert_id, cert_name, name_values, expiry_date, not_before)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(cert.cert_id, cert.cert_name, cert.name_values, cert.expiry_date, cert.not_before);
}

export const testGoogleScan = async (): Promise<void> => {
    console.log('testGoogleScan called directly');
    // Use us1/argon2025h2 - a current usable Google CT log
    return scanCTLog('14months', 'https://ct.googleapis.com/logs', 'us1/argon2025h2');
}

export const parseTimeWindow = (window: string): number => {
    const now = Date.now();
    const match = window.match(/^(\d+)(month|year|day)s?$/i);
    if (!match) return now - (6 * 30 * 24 * 60 * 60 * 1000); // Default 6 months

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    let milliseconds = 0;
    switch(unit) {
        case 'day': milliseconds = value * 24 * 60 * 60 * 1000; break;
        case 'month': milliseconds = value * 30 * 24 * 60 * 60 * 1000; break;
        case 'year': milliseconds = value * 365 * 24 * 60 * 60 * 1000; break;
    }

    return now - milliseconds;
}

const scanCTLog = async (window: string, baseUrl: string, logName: string): Promise<void> => {
    const batchSize = 1000;

    // Construct URLs properly (handle DigiCert's different URL structure)
    const logPath = logName ? `/${logName}` : '';
    const sthUrl = `${baseUrl}${logPath}/ct/v1/get-sth`;
    const sthResponse = await axios.get<SignedTreeHead>(sthUrl);
    const treeSize = sthResponse.data.tree_size;

    console.log(`Tree size: ${treeSize}, scanning backwards from latest entries`);

    // Calculate time cutoff
    const cutoffTime = parseTimeWindow(window);
    console.log(`Looking for certs newer than: ${new Date(cutoffTime).toISOString()}`);

    // Start from the most recent entries
    let currentIndex = treeSize - 1;
    const maxBatches = 1000; // Allow scanning far back if needed

    console.log({scanCTLog: 'start', baseUrl, logName})

    let totalAcUkFound = 0;
    let totalSaved = 0;
    let totalParseErrors = 0;

    for (let batch = 0; batch < maxBatches; batch++) {
        const end = currentIndex;
        const start = Math.max(0, currentIndex - batchSize + 1);

        const url = `${baseUrl}${logPath}/ct/v1/get-entries?start=${start}&end=${end}`;

        console.log(`Fetching entries ${start} to ${end}...`);

        try {
            const response = await axios.get<CTLogResponse>(url);
            const entries = response.data.entries;

            if (!entries || entries.length === 0) {
                console.log('No more entries found');
                break;
            }

            let savedCount = 0;
            let parsedCount = 0;
            let certsNewerThanCutoff = 0;
            let parseErrors = 0;

            for (const entry of entries) {
                const cert = parseCertificate(entry.leaf_input, entry.extra_data);
                if (cert) {
                    parsedCount++;

                    // Check if certificate is newer than cutoff (using notBefore date)
                    const certIssuedTime = new Date(cert.not_before).getTime();
                    if (certIssuedTime >= cutoffTime) {
                        certsNewerThanCutoff++;
                        try {
                            saveCertificate(cert);
                            savedCount++;
                        } catch (err) {
                            console.error('Error saving certificate:', err);
                        }
                    }
                } else {
                    parseErrors++;
                }
            }

            totalAcUkFound += parsedCount;
            totalSaved += savedCount;
            totalParseErrors += parseErrors;

            console.log(`Processed ${entries.length} entries, ${parseErrors} parse errors, found ${parsedCount} *.ac.uk certs, ${certsNewerThanCutoff} within time window, saved ${savedCount} certificates`);

            // Stop if this batch had no certificates within the time window
            if (parsedCount > 0 && certsNewerThanCutoff === 0) {
                console.log('Reached cutoff date - no certificates in this batch are within the time window, stopping');
                break;
            }

            // Move backwards
            currentIndex = start - 1;

            // Check if we've gone back far enough (approximate check)
            if (currentIndex < (treeSize - (maxBatches * batchSize))) {
                console.log('Scanned far enough back, stopping');
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(`Error fetching CT log: ${error.message}`);
            } else {
                console.error('Error fetching CT log:', error);
            }
            break;
        }
    }

    console.log(`Scan complete. Final index: ${currentIndex}`);
    console.log(`Summary: Found ${totalAcUkFound} *.ac.uk certificates, saved ${totalSaved}, parse errors: ${totalParseErrors}`);
}