# Stopping Strategies

Pluggable strategies for controlling when CT log scans should stop.

## Overview

The stopping strategy pattern allows you to customize when a scan should terminate. This is useful for:

- **Resource management**: Limit how much data you process
- **Testing**: Run quick scans with limited data
- **Different use cases**: Stop when you've found enough certificates vs. scanning exhaustively

## Available Strategies

### 1. ConsecutiveOldBatchesStrategy (Default)

Stops after N consecutive batches contain >X% old certificates.

**Best for**: Production scans of CT logs (handles non-chronological data well)

```typescript
import { ConsecutiveOldBatchesStrategy } from './strategies';

// Stop after 5 consecutive batches with >90% old certs
const strategy = new ConsecutiveOldBatchesStrategy(5, 90);

const scanner = ScannerFactory.createScanner('google', db, {
  window: '12months',
  domains: ['.ac.uk'],
  logName: 'us1/argon2025h2',
  stoppingStrategy: strategy
});
```

**Parameters:**
- `maxConsecutiveOldBatches` (default: 5): How many consecutive "old" batches before stopping
- `oldPercentageThreshold` (default: 90): What percentage of old certs makes a batch "old"

### 2. FixedBatchStrategy

Stops after scanning a fixed number of batches.

**Best for**: Testing, limiting resource usage, or sampling

```typescript
import { FixedBatchStrategy } from './strategies';

// Stop after scanning 100 batches (100,000 entries at default batch size)
const strategy = new FixedBatchStrategy(100);
```

**Parameters:**
- `maxBatches` (default: 1000): Maximum number of batches to scan

### 3. CertificateCountStrategy

Stops after finding a target number of matching certificates.

**Best for**: When you only need a sample of certificates

```typescript
import { CertificateCountStrategy } from './strategies';

// Stop after finding 10,000 certificates
const strategy = new CertificateCountStrategy(10000);
```

**Parameters:**
- `targetCount` (default: 10000): Stop after finding this many certificates

### 4. CompositeStrategy

Combines multiple strategies with OR logic (stops when ANY strategy triggers).

**Best for**: Setting multiple stop conditions

```typescript
import {
  CompositeStrategy,
  FixedBatchStrategy,
  CertificateCountStrategy
} from './strategies';

// Stop if EITHER:
// - We've scanned 500 batches, OR
// - We've found 5,000 certificates
const strategy = new CompositeStrategy([
  new FixedBatchStrategy(500),
  new CertificateCountStrategy(5000)
]);
```

## Creating Custom Strategies

Extend the `StoppingStrategy` base class:

```typescript
import { StoppingStrategy, BatchInfo, StoppingDecision } from './strategies';

export class TimeBasedStrategy extends StoppingStrategy {
  private startTime: number = 0;
  private readonly maxDurationMs: number;

  constructor(maxMinutes: number) {
    super();
    this.maxDurationMs = maxMinutes * 60 * 1000;
  }

  reset(): void {
    this.startTime = Date.now();
  }

  shouldStop(batchInfo: BatchInfo): StoppingDecision {
    const elapsed = Date.now() - this.startTime;

    if (elapsed >= this.maxDurationMs) {
      return {
        shouldStop: true,
        reason: `Scan exceeded time limit of ${this.maxDurationMs}ms`,
        metadata: { elapsedMs: elapsed }
      };
    }

    return { shouldStop: false };
  }

  getDescription(): string {
    return `Stop after ${this.maxDurationMs / 60000} minutes`;
  }
}
```

## Usage Examples

### Quick test scan
```typescript
// Scan only 10 batches for testing
const scanner = ScannerFactory.createScanner('google', db, {
  window: '1month',
  domains: ['.ac.uk'],
  logName: 'us1/argon2025h2',
  stoppingStrategy: new FixedBatchStrategy(10)
});
```

### Find a sample of certificates
```typescript
// Get first 1000 certificates and stop
const scanner = ScannerFactory.createScanner('letsencrypt', db, {
  window: '3months',
  domains: ['.edu'],
  logName: '2025h2',
  stoppingStrategy: new CertificateCountStrategy(1000)
});
```

### Production scan with safety limits
```typescript
// Stop after 5 consecutive old batches OR 10,000 batches (whichever comes first)
const scanner = ScannerFactory.createScanner('cloudflare', db, {
  window: '24months',
  domains: ['.gov'],
  logName: 'nimbus2025',
  stoppingStrategy: new CompositeStrategy([
    new ConsecutiveOldBatchesStrategy(5, 90),
    new FixedBatchStrategy(10000)
  ])
});
```

## Default Behavior

If no stopping strategy is provided, scanners use:
```typescript
new ConsecutiveOldBatchesStrategy(5, 90)
```

This stops after 5 consecutive batches with >90% old certificates, which works well for most CT log scanning scenarios.

## Testing

All strategies have comprehensive unit tests in `stopping-strategy.test.ts`. Run them with:

```bash
npm test
```
