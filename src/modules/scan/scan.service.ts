import type { Request, Response, NextFunction } from "express";
import db from "../../db/database";
import { ScannerFactory } from "./scanners";
import type { ProviderConfig } from "./scanners/types";

export const all = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log("POST /scan endpoint hit");

    // Defaults: scan all providers, 13 months, .ac.uk domains
    const {
      window = "24months",
      domains = [".ac.uk"],
      providers = {
        google: ["us1/argon2025h2", "us2/argon2025h2"],
        cloudflare: ["nimbus2025", "nimbus2025-2"],
        digicert: ["yeti2025", "nessie2025"],
      },
    } = req.body as {
      window?: string;
      domains?: string[];
      providers?: ProviderConfig;
    };

    console.log("Request body:", { window, domains, providers });

    // Create scanners using the factory
    const scanners = ScannerFactory.createScannersFromConfig(
      db,
      window,
      domains,
      providers
    );

    // Execute all scans in parallel
    const scanPromises = scanners.map((scanner) =>
      scanner.scan().catch((error: unknown) => {
        console.error("Scanner error:", error);
      })
    );

    // All scans running in parallel
    Promise.all(scanPromises)
      .then(() => console.log("All scans completed successfully"))
      .catch((error: unknown) => console.error("Some scans failed:", error));

    res.status(200).json({
      message: "Scans started",
      window,
      domains,
      providers,
      totalScans: scanPromises.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start scans" });
  }
};

export const testGoogleScan = async (): Promise<void> => {
  console.log("testGoogleScan called directly");

  // Create a Google scanner instance for testing
  const scanner = ScannerFactory.createScanner("google", db, {
    window: "14months",
    domains: [".ac.uk"],
    logName: "us1/argon2025h2",
  });

  return scanner.scan();
};
