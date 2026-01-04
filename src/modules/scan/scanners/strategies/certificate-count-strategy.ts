import { StoppingStrategy, BatchInfo, StoppingDecision } from './stopping-strategy';

/**
 * Strategy that stops after finding a target number of matching certificates
 * Useful when you only need a sample of certificates
 */
export class CertificateCountStrategy extends StoppingStrategy {
  private totalCertsFound = 0;
  private readonly targetCount: number;

  constructor(targetCount: number = 10000) {
    super();
    this.targetCount = targetCount;
  }

  reset(): void {
    this.totalCertsFound = 0;
  }

  shouldStop(batchInfo: BatchInfo): StoppingDecision {
    this.totalCertsFound += batchInfo.certsNewerThanCutoff;

    if (this.totalCertsFound >= this.targetCount) {
      return {
        shouldStop: true,
        reason: `Found ${this.totalCertsFound} certificates (target: ${this.targetCount})`,
        metadata: {
          certificatesFound: this.totalCertsFound,
          targetCount: this.targetCount,
        },
      };
    }

    return { shouldStop: false };
  }

  getDescription(): string {
    return `Stop after finding ${this.targetCount} matching certificates`;
  }
}
