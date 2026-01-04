import { StoppingStrategy, BatchInfo, StoppingDecision } from './stopping-strategy';

/**
 * Strategy that combines multiple strategies with OR logic
 * Stops when ANY of the sub-strategies says to stop
 */
export class CompositeStrategy extends StoppingStrategy {
  private readonly strategies: StoppingStrategy[];

  constructor(strategies: StoppingStrategy[]) {
    super();
    this.strategies = strategies;
  }

  reset(): void {
    this.strategies.forEach(strategy => strategy.reset());
  }

  shouldStop(batchInfo: BatchInfo): StoppingDecision {
    for (const strategy of this.strategies) {
      const decision = strategy.shouldStop(batchInfo);
      if (decision.shouldStop) {
        return {
          ...decision,
          reason: `[${strategy.getDescription()}] ${decision.reason}`,
        };
      }
    }

    return { shouldStop: false };
  }

  getDescription(): string {
    return `Composite: ${this.strategies.map(s => s.getDescription()).join(' OR ')}`;
  }
}
