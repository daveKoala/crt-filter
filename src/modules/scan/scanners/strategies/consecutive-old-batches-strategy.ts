import { StoppingStrategy, BatchInfo, StoppingDecision } from './stopping-strategy';

/**
 * Strategy that stops after N consecutive batches with >90% old certificates
 * This is the default strategy that handles non-chronological CT logs well
 */
export class ConsecutiveOldBatchesStrategy extends StoppingStrategy {
  private consecutiveOldBatches = 0;
  private readonly maxConsecutiveOldBatches: number;
  private readonly oldPercentageThreshold: number;

  constructor(
    maxConsecutiveOldBatches: number = 5,
    oldPercentageThreshold: number = 90
  ) {
    super();
    this.maxConsecutiveOldBatches = maxConsecutiveOldBatches;
    this.oldPercentageThreshold = oldPercentageThreshold;
  }

  reset(): void {
    this.consecutiveOldBatches = 0;
  }

  shouldStop(batchInfo: BatchInfo): StoppingDecision {
    const { totalCertsChecked, certsOlderThanCutoff } = batchInfo;

    // If no certs were checked in this batch, don't count it
    if (totalCertsChecked === 0) {
      return { shouldStop: false };
    }

    const percentageOld = (certsOlderThanCutoff / totalCertsChecked) * 100;

    if (percentageOld > this.oldPercentageThreshold) {
      // This batch is mostly old certificates
      this.consecutiveOldBatches++;

      console.log(
        `Batch is ${percentageOld.toFixed(1)}% old certs ` +
        `(${this.consecutiveOldBatches}/${this.maxConsecutiveOldBatches} consecutive old batches)`
      );

      if (this.consecutiveOldBatches >= this.maxConsecutiveOldBatches) {
        return {
          shouldStop: true,
          reason: `${this.maxConsecutiveOldBatches} consecutive batches with >${this.oldPercentageThreshold}% old certificates`,
          metadata: {
            consecutiveOldBatches: this.consecutiveOldBatches,
            lastBatchPercentageOld: percentageOld,
          },
        };
      }
    } else {
      // This batch has newer certs, reset counter
      this.consecutiveOldBatches = 0;
    }

    return { shouldStop: false };
  }

  getDescription(): string {
    return `Stop after ${this.maxConsecutiveOldBatches} consecutive batches with >${this.oldPercentageThreshold}% old certificates`;
  }
}
