# CT Log Configuration - Quick Reference

## 📍 Single Source of Truth

**[src/modules/scan/ct-logs.config.ts](src/modules/scan/ct-logs.config.ts)** ← Edit this file ONLY

## 🔧 Current Configuration (15 logs)

```
Google (6):     argon2025h2, xenon2025h2, argon2025h1, xenon2025h1, argon2024, xenon2024
Cloudflare (1): nimbus2025
DigiCert (4):   yeti2025, wyvern/2025h2, wyvern/2025h1, wyvern/2024h2
Let's Encrypt (2): oak/2025h2, oak/2025h1
Sectigo (2):    mammoth2025h2, elephant2025h2
```

## 📅 Next Maintenance: July 2026

**What to do:**
1. Open [ct-logs.config.ts](src/modules/scan/ct-logs.config.ts)
2. Add new 2026h1 logs (copy pattern from 2025h2)
3. Change 2025h2 logs from `mode: 'continuous'` to `mode: 'historical'`
4. Remove 2024 logs (optional - for cleanup)
5. Run `npm run build` to verify
6. Test: `curl -X POST http://localhost:8080/test-endpoints`

## 🎯 Coverage

| Time Period | Coverage |
|-------------|----------|
| Jul 2025 - Now | ✅ ~100% |
| Jan 2025 - Jun 2025 | ✅ ~80% (no Sectigo) |
| Jul 2024 - Dec 2024 | ⚠️ ~40% (Google + DigiCert only) |
| Jan 2024 - Jun 2024 | ⚠️ ~30% (Google only) |

## 🚀 Usage Examples

### Get all logs (default)
```typescript
import { DEFAULT_PROVIDER_CONFIG } from './ct-logs.config';
```

### Get only continuous logs (for weekly scans)
```typescript
import { getContinuousLogs } from './ct-logs.config';
const continuous = getContinuousLogs();
// Returns only logs marked as mode: 'continuous'
```

### Get only historical logs (for one-time backfill)
```typescript
import { getHistoricalLogs } from './ct-logs.config';
const historical = getHistoricalLogs();
// Returns only logs marked as mode: 'historical'
```

## 📝 Key Points

✅ **One file to maintain** - No more copy/paste between functions
✅ **Metadata included** - Descriptions, time periods, tree sizes
✅ **Type-safe** - TypeScript checks everything
✅ **Helper functions** - Easy filtering by scan mode
✅ **Self-documenting** - Comments explain what each log covers

## 📚 Full Documentation

- **[CT_LOG_SELECTION.md](CT_LOG_SELECTION.md)** - Complete analysis & justification
- **[src/modules/scan/README_CONFIG.md](src/modules/scan/README_CONFIG.md)** - Configuration guide
- **[SUMMARY.md](SUMMARY.md)** - What changed summary

## ⚡ Testing

```bash
# Build
npm run build

# Test endpoints
curl -X POST http://localhost:8080/test-endpoints

# Run scan
curl -X POST http://localhost:8080/scan \
  -H "Content-Type: application/json" \
  -d '{"window": "12months", "domains": [".ac.uk"]}'
```

---

**Last Updated:** 2026-01-04
**Next Review:** 2026-07-01
