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

interface CertificateData {
    cert_id: string;
    cert_name: string;
    name_values: string;
    expiry_date: string;
    valid_date: string;
}

export const all = (req: Request, res: Response, next: NextFunction): void => {

    try{
        console.log('POST /scan endpoint hit');

        const {logs, window} = req.body
        console.log('Request body:', { logs, window });

        // Fire off scan in background
        console.log('Starting googleScan...');
        googleScan(123450000, window, 'argon2023')
            .then(() => {
                console.log('googleScan completed successfully');
            })
            .catch(error => {
                console.error('Background scan error:', error);
            });

        res.status(200).json({
            message: 'Scan started',
            logs,
            window,
            startingIndex: 123450000
        })
    }catch(error){
        console.error(error)
        res.status(500).json({ error: 'Failed to start scan' })
    }

}

const parseCertificate = (leafInput: string, extraData: string): CertificateData | null => {
    try {
        // Use extra_data which contains the full certificate chain
        // First certificate in chain is the one we want
        const extraDecoded = Buffer.from(extraData, 'base64');

        // Extra data format: 3-byte length + certificate + more certs
        const certLength = (extraDecoded[0] << 16) | (extraDecoded[1] << 8) | extraDecoded[2];
        const certData = extraDecoded.slice(3, 3 + certLength);

        // Use Node's built-in X509Certificate
        const cert = new X509Certificate(certData);

        const domains: string[] = [];

        // Get Subject CN
        const subject = cert.subject;
        const cnMatch = subject.match(/CN=([^,\n]+)/);
        if (cnMatch) {
            domains.push(cnMatch[1]);
        }

        // Get Subject Alternative Names
        const san = cert.subjectAltName;
        if (san) {
            const dnsNames = san.split(', ').filter(name => name.startsWith('DNS:'));
            domains.push(...dnsNames.map(name => name.replace('DNS:', '')));
        }

        console.log(`Parsed domains: ${domains.length > 0 ? domains.join(', ') : 'NONE'}`);

        if (domains.length === 0) return null;

        // Temporarily disabled for testing - save ALL domains
        // const hasAcUk = domains.some(domain => domain.endsWith('.ac.uk') || domain === 'ac.uk');
        // if (!hasAcUk) return null;

        const certName = domains[0] || 'unknown';
        const nameValues = domains.join(', ');

        return {
            cert_id: Buffer.from(leafInput).slice(0, 32).toString('hex'),
            cert_name: certName,
            name_values: nameValues,
            expiry_date: cert.validTo,
            valid_date: cert.validFrom
        };
    } catch (error) {
        console.error('Error parsing certificate:', error);
        return null;
    }
}

const saveCertificate = (cert: CertificateData): void => {
    const stmt = db.prepare(`
        INSERT INTO certificates (cert_id, cert_name, name_values, expiry_date, valid_date)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(cert.cert_id, cert.cert_name, cert.name_values, cert.expiry_date, cert.valid_date);
}

export const testGoogleScan = async (): Promise<void> => {
    console.log('testGoogleScan called directly');
    return googleScan(123450000, '6months', 'argon2023');
}

const googleScan = async (startingIndex: number, window: string, logName: string = 'argon2023'): Promise<void> => {
    const batchSize = 1000;
    let currentIndex = startingIndex;
    const maxBatches = 10;

    console.log({googleScan: 'start'})

    for (let batch = 0; batch < maxBatches; batch++) {
        const start = currentIndex;
        const end = currentIndex + batchSize - 1;

        const url = `https://ct.googleapis.com/logs/${logName}/ct/v1/get-entries?start=${start}&end=${end}`;

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
            for (const entry of entries) {
                const cert = parseCertificate(entry.leaf_input, entry.extra_data);
                if (cert) {
                    parsedCount++;
                    console.log(`Found *.ac.uk cert: ${cert.cert_name}`);
                    try {
                        saveCertificate(cert);
                        savedCount++;
                        console.log(`Saved certificate ${savedCount}`);
                    } catch (err) {
                        console.error('Error saving certificate:', err);
                    }
                }
            }

            console.log(`Processed ${entries.length} entries, found ${parsedCount} *.ac.uk certs, saved ${savedCount} certificates`);

            currentIndex = end + 1;

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
}