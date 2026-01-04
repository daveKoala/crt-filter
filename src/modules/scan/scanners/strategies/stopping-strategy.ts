/**
 * Data about the current batch being processed
 */
export interface BatchInfo {
  batchNumber: number;
  totalEntries: number;
  certsNewerThanCutoff: number;
  certsOlderThanCutoff: number;
  totalCertsChecked: number;
  cutoffTime: number;
  oldestEntryTimestamp: number | null;
}

/**
 * Result of evaluating whether to stop scanning
 */
export interface StoppingDecision {
  shouldStop: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Abstract base class for stopping strategies
 */
export abstract class StoppingStrategy {
  /**
   * Reset the strategy state (called at the start of each scan)
   */
  abstract reset(): void;

  /**
   * Evaluate whether scanning should stop based on the current batch
   * @param batchInfo Information about the current batch
   * @returns Decision on whether to stop and why
   */
  abstract shouldStop(batchInfo: BatchInfo): StoppingDecision;

  /**
   * Get a description of this strategy
   */
  abstract getDescription(): string;
}
