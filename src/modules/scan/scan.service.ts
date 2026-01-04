import type { Request, Response, NextFunction } from "express";
import db from "../../db/database";
import { ScannerFactory } from "./scanners";
import type { ProviderConfig } from "./scanners/types";

export const all = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log("POST /scan endpoint hit");

    // Defaults: scan all providers, 12 months, .ac.uk domains
    // Updated with 2025 active CT logs
    const {
      window = "12months",
      domains = [".ac.uk"],
      providers = {
        google: [
          "us1/argon2025h2", // Current, expires Jan 2026
          "eu1/xenon2025h2", // Current, expires Jan 2026
          "us1/argon2027h1", // Future-ready
          "eu1/xenon2027h1", // Future-ready
        ],
        cloudflare: [
          "nimbus2025", // Current
          "nimbus2026", // Future-ready
          "nimbus2027", // Future-ready
        ],
        digicert: [
          "2025h2", // Wyvern series
          "2026h1",
          "2026h2",
        ],
        letsencrypt: [
          "2025h2", // Oak series (current generation)
          "2026h1",
          "2026h2",
        ],
        sectigo: [
          "elephant2025h2", // Elephant series (current generation)
          "elephant2026h1",
        ],
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

/**
 * Test all CT log endpoints to verify they are accessible
 * Returns status for each provider's get-sth and get-entries endpoints
 */
export const testEndpoints = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const axios = (await import("axios")).default;

  const defaultProviders = {
    google: ["us1/argon2025h2", "eu1/xenon2025h2"],
    cloudflare: ["nimbus2025"],
    digicert: ["2025h2"],
    letsencrypt: ["2025h2"],
    sectigo: ["elephant2025h2"],
  };

  const results: Record<
    string,
    Array<{
      log: string;
      getSthUrl: string;
      getSthStatus: string;
      getEntriesUrl: string;
      getEntriesStatus: string;
      treeSize?: number;
      error?: string;
    }>
  > = {
    google: [],
    cloudflare: [],
    digicert: [],
    letsencrypt: [],
    sectigo: [],
  };

  // Test Google logs
  for (const logName of defaultProviders.google) {
    const baseUrl = `https://ct.googleapis.com/logs/${logName}`;
    const getSthUrl = `${baseUrl}/ct/v1/get-sth`;
    const getEntriesUrl = `${baseUrl}/ct/v1/get-entries?start=0&end=0`;

    try {
      const sthResponse = await axios.get(getSthUrl, { timeout: 5000 });
      const entriesResponse = await axios.get(getEntriesUrl, { timeout: 5000 });

      results.google.push({
        log: logName,
        getSthUrl,
        getSthStatus: "✅ Success",
        getEntriesUrl,
        getEntriesStatus: "✅ Success",
        treeSize: sthResponse.data.tree_size,
      });
    } catch (error: unknown) {
      results.google.push({
        log: logName,
        getSthUrl,
        getSthStatus: "❌ Failed",
        getEntriesUrl,
        getEntriesStatus: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test Cloudflare logs
  for (const logName of defaultProviders.cloudflare) {
    const baseUrl = `https://ct.cloudflare.com/logs/${logName}`;
    const getSthUrl = `${baseUrl}/ct/v1/get-sth`;
    const getEntriesUrl = `${baseUrl}/ct/v1/get-entries?start=0&end=0`;

    try {
      const sthResponse = await axios.get(getSthUrl, { timeout: 5000 });
      const entriesResponse = await axios.get(getEntriesUrl, { timeout: 5000 });

      results.cloudflare.push({
        log: logName,
        getSthUrl,
        getSthStatus: "✅ Success",
        getEntriesUrl,
        getEntriesStatus: "✅ Success",
        treeSize: sthResponse.data.tree_size,
      });
    } catch (error: unknown) {
      results.cloudflare.push({
        log: logName,
        getSthUrl,
        getSthStatus: "❌ Failed",
        getEntriesUrl,
        getEntriesStatus: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test DigiCert logs
  for (const logName of defaultProviders.digicert) {
    const baseUrl = `https://wyvern.ct.digicert.com/${logName}`;
    const getSthUrl = `${baseUrl}/ct/v1/get-sth`;
    const getEntriesUrl = `${baseUrl}/ct/v1/get-entries?start=0&end=0`;

    try {
      const sthResponse = await axios.get(getSthUrl, { timeout: 5000 });
      const entriesResponse = await axios.get(getEntriesUrl, { timeout: 5000 });

      results.digicert.push({
        log: logName,
        getSthUrl,
        getSthStatus: "✅ Success",
        getEntriesUrl,
        getEntriesStatus: "✅ Success",
        treeSize: sthResponse.data.tree_size,
      });
    } catch (error: unknown) {
      results.digicert.push({
        log: logName,
        getSthUrl,
        getSthStatus: "❌ Failed",
        getEntriesUrl,
        getEntriesStatus: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test Let's Encrypt logs
  for (const logName of defaultProviders.letsencrypt) {
    const baseUrl = `https://oak.ct.letsencrypt.org/${logName}`;
    const getSthUrl = `${baseUrl}/ct/v1/get-sth`;
    const getEntriesUrl = `${baseUrl}/ct/v1/get-entries?start=0&end=0`;

    try {
      const sthResponse = await axios.get(getSthUrl, { timeout: 5000 });
      const entriesResponse = await axios.get(getEntriesUrl, { timeout: 5000 });

      results.letsencrypt.push({
        log: logName,
        getSthUrl,
        getSthStatus: "✅ Success",
        getEntriesUrl,
        getEntriesStatus: "✅ Success",
        treeSize: sthResponse.data.tree_size,
      });
    } catch (error: unknown) {
      results.letsencrypt.push({
        log: logName,
        getSthUrl,
        getSthStatus: "❌ Failed",
        getEntriesUrl,
        getEntriesStatus: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Test Sectigo logs
  for (const logName of defaultProviders.sectigo) {
    const baseUrl = `https://${logName}.ct.sectigo.com`;
    const getSthUrl = `${baseUrl}/ct/v1/get-sth`;
    const getEntriesUrl = `${baseUrl}/ct/v1/get-entries?start=0&end=0`;

    try {
      const sthResponse = await axios.get(getSthUrl, { timeout: 5000 });
      const entriesResponse = await axios.get(getEntriesUrl, { timeout: 5000 });

      results.sectigo.push({
        log: logName,
        getSthUrl,
        getSthStatus: "✅ Success",
        getEntriesUrl,
        getEntriesStatus: "✅ Success",
        treeSize: sthResponse.data.tree_size,
      });
    } catch (error: unknown) {
      results.sectigo.push({
        log: logName,
        getSthUrl,
        getSthStatus: "❌ Failed",
        getEntriesUrl,
        getEntriesStatus: "❌ Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  res.status(200).json({
    message: "CT log endpoint tests completed",
    results,
    summary: {
      google: {
        total: results.google.length,
        success: results.google.filter((r) => r.getSthStatus.includes("✅"))
          .length,
      },
      cloudflare: {
        total: results.cloudflare.length,
        success: results.cloudflare.filter((r) => r.getSthStatus.includes("✅"))
          .length,
      },
      digicert: {
        total: results.digicert.length,
        success: results.digicert.filter((r) => r.getSthStatus.includes("✅"))
          .length,
      },
      letsencrypt: {
        total: results.letsencrypt.length,
        success: results.letsencrypt.filter((r) =>
          r.getSthStatus.includes("✅")
        ).length,
      },
      sectigo: {
        total: results.sectigo.length,
        success: results.sectigo.filter((r) => r.getSthStatus.includes("✅"))
          .length,
      },
    },
  });
};
