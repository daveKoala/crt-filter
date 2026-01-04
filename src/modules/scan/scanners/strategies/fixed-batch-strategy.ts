import { StoppingStrategy, BatchInfo, StoppingDecision } from './stopping-strategy';

/**
 * Strategy that stops after scanning a fixed number of batches
 * Useful for testing or limiting resource usage
 */
export class FixedBatchStrategy extends StoppingStrategy {
  private readonly maxBatches: number;

  constructor(maxBatches: number = 1000) {
    super();
    this.maxBatches = maxBatches;
  }

  reset(): void {
    // No state to reset
  }

  shouldStop(batchInfo: BatchInfo): StoppingDecision {
    if (batchInfo.batchNumber >= this.maxBatches) {
      return {
        shouldStop: true,
        reason: `Reached maximum batch limit of ${this.maxBatches}`,
        metadata: {
          batchesScanned: batchInfo.batchNumber,
        },
      };
    }

    return { shouldStop: false };
  }

  getDescription(): string {
    return `Stop after scanning ${this.maxBatches} batches`;
  }
}
