# CT Log Configuration Guide

## Single Source of Truth

All CT log configuration is now centralized in **[ct-logs.config.ts](ct-logs.config.ts)**.

This file is the **single source of truth** for:
- Which CT logs to scan
- Log metadata (descriptions, time periods, tree sizes)
- Scanning modes (continuous vs historical)

## How to Update Logs

### When logs rotate (every 6 months)

Edit [ct-logs.config.ts](ct-logs.config.ts) to:

1. **Add new logs** for the new period (e.g., 2026h1)
2. **Move current logs** from 'continuous' to 'historical' mode
3. **Remove old logs** that are >18 months old or retired

**Example (July 2026 rotation):**

```typescript
// Before (January 2026):
{
  id: 'us1/argon2025h2',
  description: 'Google Argon US (current)',
  period: 'Jul 2025 - present',
  mode: 'continuous',  // ← Currently scanning
}

// After (July 2026):
{
  id: 'us1/argon2025h2',
  description: 'Google Argon US (H2 2025)',
  period: 'Jul 2025 - Dec 2025',
  mode: 'historical',  // ← Changed to historical (scan once)
},
{
  id: 'us1/argon2026h1',  // ← NEW
  description: 'Google Argon US (current)',
  period: 'Jan 2026 - Jun 2026',
  mode: 'continuous',
}
```

### To add optional logs (e.g., 2023 for deeper history)

Uncomment the optional sections in [ct-logs.config.ts](ct-logs.config.ts):

```typescript
// Optional: 2023 logs for 36-month depth (uncomment if needed)
{
  id: 'argon2023',
  description: 'Google Argon (2023)',
  period: 'Jan 2023 - Dec 2023',
  mode: 'historical',
  treeSize: '1.8B',
},
```

## Available Functions

### `DEFAULT_PROVIDER_CONFIG`
Complete list of all configured logs (both continuous and historical).

**Use:** Default for API endpoints, full scans.

```typescript
import { DEFAULT_PROVIDER_CONFIG } from './ct-logs.config';

const providers = DEFAULT_PROVIDER_CONFIG;
// {
//   google: ['us1/argon2025h2', 'eu1/xenon2025h2', ...],
//   cloudflare: ['nimbus2025'],
//   ...
// }
```

### `getContinuousLogs()`
Only logs marked as 'continuous' (for regular monitoring).

**Use:** Weekly/monthly scans for new certificates.

```typescript
import { getContinuousLogs } from './ct-logs.config';

const continuousLogs = getContinuousLogs();
// {
//   google: ['us1/argon2025h2', 'eu1/xenon2025h2'],
//   cloudflare: ['nimbus2025'],
//   digicert: ['yeti2025', '2025h2'],
//   ...
// }
```

### `getHistoricalLogs()`
Only logs marked as 'historical' (for one-time backfill).

**Use:** Initial historical scan, then remove from regular scans.

```typescript
import { getHistoricalLogs } from './ct-logs.config';

const historicalLogs = getHistoricalLogs();
// {
//   google: ['us1/argon2025h1', 'eu1/xenon2025h1', 'us1/argon2024', 'eu1/xenon2024'],
//   digicert: ['2025h1', '2024h2'],
//   ...
// }
```

### `getLogMetadata(provider, logId)`
Get metadata for a specific log.

**Use:** Display log info, debugging.

```typescript
import { getLogMetadata } from './ct-logs.config';

const metadata = getLogMetadata('google', 'us1/argon2025h2');
// {
//   id: 'us1/argon2025h2',
//   description: 'Google Argon US (current)',
//   period: 'Jul 2025 - present',
//   mode: 'continuous',
//   treeSize: '2.5B'
// }
```

### `getTotalLogCount()`
Count total number of configured logs.

```typescript
import { getTotalLogCount } from './ct-logs.config';

console.log(getTotalLogCount()); // 15
```

## Maintenance Schedule

| Date | Action | Details |
|------|--------|---------|
| **Jan 2026** | Review | Verify 2025h2 logs still active |
| **Jul 2026** | **Update** | Add 2026h1 logs, move 2025h2 to historical |
| **Jan 2027** | **Update** | Add 2027h1 logs, remove 2024 logs |
| **Every 6 months** | Review | Update based on log rotations |

## Where Configuration is Used

1. **[scan.service.ts](scan.service.ts)**
   - `all()` endpoint: Uses `DEFAULT_PROVIDER_CONFIG`
   - `testEndpoints()`: Uses `DEFAULT_PROVIDER_CONFIG`

2. **API requests**
   - Clients can override with custom provider config
   - Falls back to `DEFAULT_PROVIDER_CONFIG` if not specified

## Migration Notes

**Before centralization:**
- Configuration duplicated in 3 places
- Had to update multiple locations when logs rotated
- Risk of inconsistency between test and production configs

**After centralization:**
- Single file to update: [ct-logs.config.ts](ct-logs.config.ts)
- All endpoints automatically use updated config
- Metadata included for documentation/debugging
- Helper functions for filtering by scan mode

## Testing After Updates

After updating [ct-logs.config.ts](ct-logs.config.ts):

```bash
# 1. Verify TypeScript compilation
npm run build

# 2. Test endpoint availability
curl -X POST http://localhost:8080/test-endpoints

# 3. Run a small scan to verify
curl -X POST http://localhost:8080/scan \
  -H "Content-Type: application/json" \
  -d '{
    "window": "1month",
    "domains": [".ac.uk"]
  }'
```

## Example: Custom Scan Modes

You can create custom scanning strategies:

```typescript
// Scan only current logs (no historical backfill)
import { getContinuousLogs } from './ct-logs.config';

const response = await fetch('http://localhost:8080/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    window: '3months',
    domains: ['.ac.uk'],
    providers: getContinuousLogs()  // Only continuous logs
  })
});

// Scan only historical logs (one-time backfill)
import { getHistoricalLogs } from './ct-logs.config';

const response = await fetch('http://localhost:8080/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    window: '12months',
    domains: ['.ac.uk'],
    providers: getHistoricalLogs()  // Only historical logs
  })
});
```

---

**Questions?** See [CT_LOG_SELECTION.md](../../../CT_LOG_SELECTION.md) for detailed analysis.
