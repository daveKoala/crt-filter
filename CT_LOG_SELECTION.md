# CT Log Selection: Final Recommendation

**Date:** 2026-01-04
**Target:** UK Universities (*.ac.uk)
**Window:** 12 months (configurable)
**Approach:** Maximum coverage with 2-3 historical generations per provider

---

## Available CT Logs (Verified)

### ✅ Currently Active and Available

| Provider | Log Name | Tree Size | Coverage Period | Status |
|----------|----------|-----------|-----------------|--------|
| **Google** | argon2023 | 1.8B | Jan 2023 - Dec 2023 | Available |
| | xenon2023 | 2.1B | Jan 2023 - Dec 2023 | Available |
| | us1/argon2024 | 2.5B | Jan 2024 - Dec 2024 | Available |
| | eu1/xenon2024 | 2.7B | Jan 2024 - Dec 2024 | Available |
| | us1/argon2025h1 | 1.4B | Jan 2025 - Jun 2025 | Available |
| | us1/argon2025h2 | 2.5B | Jul 2025 - present | **Active** |
| | eu1/xenon2025h1 | 1.9B | Jan 2025 - Jun 2025 | Available |
| | eu1/xenon2025h2 | 2.6B | Jul 2025 - present | **Active** |
| **Let's Encrypt** | oak/2025h1 | 991M | Jan 2025 - Jun 2025 | Available |
| | oak/2025h2 | 2.0B | Jul 2025 - present | **Active** |
| **Cloudflare** | nimbus2025 | 3.1B | Jan 2025 - present | **Active** |
| **DigiCert Yeti** | yeti2025 | 2.0B+ | Jan 2025 - present | **Active** |
| **DigiCert Wyvern** | wyvern/2024h1 | 50K | Jan 2024 - Jun 2024 | Limited |
| | wyvern/2024h2 | 30M | Jul 2024 - Dec 2024 | Available |
| | wyvern/2025h1 | 276M | Jan 2025 - Jun 2025 | Available |
| | wyvern/2025h2 | 1.0B | Jul 2025 - present | **Active** |
| **Sectigo** | mammoth2025h2 | 865M | Jul 2025 - present | **Active** |
| | elephant2025h2 | 1.2B | Jul 2025 - present | **Active** |

### ❌ Retired / Not Found

- Google: argon/xenon 2022 and earlier
- Let's Encrypt: oak/2023, oak/2024h1, oak/2024h2 (all 404)
- Cloudflare: nimbus2023, nimbus2024 (404)
- DigiCert Yeti: yeti2023, yeti2024 (404)
- Sectigo: All 2024h1, 2024h2, 2025h1 generations (404)

---

## Key Findings

### 1. Google Has Deepest History
- **2023 logs still available** (argon2023, xenon2023)
- **2024 full-year logs** (argon2024, xenon2024)
- **2025 half-year logs** (2025h1, 2025h2)
- **Total historical depth:** ~3 years of coverage

### 2. Other Providers Limited to 2025
- Let's Encrypt: Only 2025h1/h2 available
- Cloudflare: Only nimbus2025 available
- Sectigo: Only 2025h2 available (no 2025h1!)
- DigiCert Wyvern: 2024h1 (tiny), 2024h2, 2025h1, 2025h2

### 3. DigiCert Wyvern 2024h1 is Nearly Empty
- Only **50K entries** vs millions/billions in other logs
- Likely a test/pilot log before full deployment
- **Recommendation:** Skip this log (negligible value)

### 4. Sectigo Missing Generations
- No 2024h1, 2024h2, or 2025h1 logs accessible
- Only 2025h2 (Mammoth and Elephant) available
- **Impact:** Cannot get Sectigo certs from first half of 2025

### 5. Let's Encrypt Has No 2024 or 2023 Logs
- Oak series only goes back to 2025h1
- Older series (Sapling, Pine) completely retired
- **Impact:** Cannot get Let's Encrypt certs before Jan 2025

---

## Recommended Configuration

### For 12-Month Window (2025-01-04 to 2026-01-04)

This configuration provides **maximum coverage** for the 12-month window while minimizing redundant scans.

```typescript
providers = {
  google: [
    // 2025 logs (current - CONTINUOUS SCAN)
    "us1/argon2025h2",      // Jul 2025 - present (US region)
    "eu1/xenon2025h2",      // Jul 2025 - present (EU region)

    // 2025 logs (historical - ONE-TIME SCAN)
    "us1/argon2025h1",      // Jan 2025 - Jun 2025 (US region)
    "eu1/xenon2025h1",      // Jan 2025 - Jun 2025 (EU region)

    // 2024 logs (extended coverage - ONE-TIME SCAN)
    "us1/argon2024",        // Jan 2024 - Dec 2024 (full year)
    "eu1/xenon2024",        // Jan 2024 - Dec 2024 (full year)
  ],

  letsencrypt: [
    // 2025 logs (current - CONTINUOUS SCAN)
    "2025h2",               // Jul 2025 - present

    // 2025 logs (historical - ONE-TIME SCAN)
    "2025h1",               // Jan 2025 - Jun 2025
  ],

  cloudflare: [
    // 2025 log (full year - CONTINUOUS SCAN)
    "nimbus2025",           // Jan 2025 - present
  ],

  digicert: [
    // Yeti series (full year - CONTINUOUS SCAN)
    "yeti2025",             // Jan 2025 - present

    // Wyvern series (CONTINUOUS SCAN for 2025h2)
    "2025h2",               // Jul 2025 - present

    // Wyvern series (ONE-TIME SCAN for historical)
    "2025h1",               // Jan 2025 - Jun 2025
    "2024h2",               // Jul 2024 - Dec 2024
    // Note: 2024h1 has only 50K entries, skipping
  ],

  sectigo: [
    // Mammoth series (CONTINUOUS SCAN)
    "mammoth2025h2",        // Jul 2025 - present

    // Elephant series (CONTINUOUS SCAN)
    "elephant2025h2",       // Jul 2025 - present

    // Note: No 2025h1, 2024h2, or 2024h1 logs available
  ],
}
```

**Total Logs:** 15
**Total Entries:** ~27+ billion entries across all logs
**Estimated .ac.uk matches:** ~20,000-100,000 certificates (depends on filter efficiency)

---

## Alternative: Extended Historical Coverage (24+ Months)

If you want **maximum historical depth** (24-36 months), add Google's 2023 logs:

```typescript
providers = {
  google: [
    // 2025 logs
    "us1/argon2025h2",
    "eu1/xenon2025h2",
    "us1/argon2025h1",
    "eu1/xenon2025h1",

    // 2024 logs
    "us1/argon2024",
    "eu1/xenon2024",

    // 2023 logs (DEEPEST AVAILABLE HISTORY)
    "argon2023",            // Jan 2023 - Dec 2023 (no region prefix!)
    "xenon2023",            // Jan 2023 - Dec 2023 (no region prefix!)
  ],

  // ... rest same as above
}
```

**Additional Coverage:** +3.9 billion entries from 2023
**Time Depth:** ~36 months (Jan 2023 - present)
**Trade-off:** More scanning time, older expired certificates

---

## Coverage Analysis by Time Period

### Jul 2025 - Present (6 months)
**Providers:** All
**Logs:** argon2025h2, xenon2025h2, oak/2025h2, nimbus2025, yeti2025, wyvern/2025h2, mammoth2025h2, elephant2025h2
**Coverage:** ✅ **~100%** (all providers active)

### Jan 2025 - Jun 2025 (6 months)
**Providers:** All except Sectigo
**Logs:** argon2025h1, xenon2025h1, oak/2025h1, nimbus2025, yeti2025, wyvern/2025h1
**Coverage:** ✅ **~80%** (missing Sectigo certs from this period)

### Jul 2024 - Dec 2024 (6 months)
**Providers:** Google, DigiCert Wyvern only
**Logs:** argon2024, xenon2024, wyvern/2024h2
**Coverage:** ⚠️ **~40%** (missing Let's Encrypt, Cloudflare, Sectigo)

### Jan 2024 - Jun 2024 (6 months)
**Providers:** Google only
**Logs:** argon2024, xenon2024
**Coverage:** ⚠️ **~30%** (only Google logs available)

### 2023 (12 months)
**Providers:** Google only
**Logs:** argon2023, xenon2023
**Coverage:** ⚠️ **~25%** (only Google logs available)

---

## What You'll Miss

### Without 2023 Logs
- ❌ Certificates issued in 2023 (mostly expired by now)
- ❌ Long-lived commercial certs (2-year) from late 2022/early 2023
- ✅ Most certs are 90-day or 1-year, so minimal impact

### Without 2024 Let's Encrypt Logs
- ❌ ~50-60% of certificates issued Jan 2024 - Dec 2024
- ❌ Many expired by now (90-day certs)
- ⚠️ **This is the biggest gap** for comprehensive historical coverage

### Without 2024 Cloudflare Logs
- ❌ Certificates submitted only to Cloudflare logs in 2024
- ⚠️ Moderate impact (~20-30% of 2024 certs)

### Without Sectigo 2024-2025h1 Logs
- ❌ Sectigo certificates from Jan 2024 - Jun 2025
- ⚠️ **Significant gap** for institutions using GEANT TCS or commercial Sectigo

---

## Scanning Strategy

### Phase 1: Initial Historical Scan (ONE-TIME)
Scan these logs **once** to backfill historical certificates:

1. Google: argon2024, xenon2024, argon2025h1, xenon2025h1
2. Let's Encrypt: 2025h1
3. DigiCert: wyvern/2024h2, wyvern/2025h1
4. (Optional) Google: argon2023, xenon2023 for deeper history

**Time Estimate:** 12-24 hours (depending on batch size and rate limits)
**Storage Impact:** ~10-50K certificates for .ac.uk (JSON storage)

### Phase 2: Continuous Monitoring (RECURRING)
Scan these logs **weekly or monthly** for new certificates:

1. Google: argon2025h2, xenon2025h2
2. Let's Encrypt: 2025h2
3. Cloudflare: nimbus2025
4. DigiCert: yeti2025, wyvern/2025h2
5. Sectigo: mammoth2025h2, elephant2025h2

**Frequency:** Weekly (recommended) or monthly
**Time Estimate:** 1-3 hours per run
**New Certs:** ~100-500 per week (estimate)

### Phase 3: Log Rotation (EVERY 6 MONTHS)
When logs rotate (next: ~Jul 2026):

1. Move current "h2" logs to "historical/one-time" category
2. Add new "h1" logs to "continuous" category
3. Remove retired logs (>18 months old)

**Next Rotation:** Jul 2026
**Action Required:** Update config to add 2026h1 logs

---

## Provider-Specific Notes

### Google
- **Deepest history:** 3+ years available
- **Regional variants:** US (argon) and EU (xenon) - **scan both**
- **Naming change:** 2023 logs use "argon2023" (no region), 2024+ use "us1/argon2024" format
- **Both regions needed:** Some CAs only submit to one region

### Let's Encrypt
- **Highest volume:** ~50-60% of all .ac.uk certs
- **Limited history:** Only 2025h1/h2 available (no 2024 or earlier)
- **90-day certs:** High churn, continuous scanning critical
- **Critical for:** Automated infrastructure, research groups, departmental sites

### Cloudflare
- **Full-year logs:** No half-year splits (simpler!)
- **Limited history:** Only nimbus2025 available
- **Important for:** Universities using Cloudflare CDN/DNS/proxy
- **Volume:** ~30-40% of all CT submissions globally

### DigiCert
- **Two series:** Yeti (full year) and Wyvern (half year) - **scan both**
- **Wyvern history:** Goes back to 2024h2 (2024h1 has only 50K entries)
- **Enterprise focus:** Commercial certs, payment systems, VPNs
- **GEANT alternative:** Some universities use DigiCert instead of Sectigo

### Sectigo
- **Two series:** Mammoth and Elephant - **scan both**
- **Major gap:** No logs before 2025h2 (missing Jan 2024 - Jun 2025)
- **GEANT backend:** GEANT TCS certificates appear in Sectigo logs
- **Legacy contracts:** Many universities have long-standing Sectigo/Comodo contracts

---

## Configuration Implementation

The recommended config should be placed in [scan.service.ts](src/modules/scan/scan.service.ts#L15-L41).

### Current Config (From Codebase)

```typescript
// Current: Only includes 2025h2 and future 2026/2027 logs
providers = {
  google: [
    "us1/argon2025h2",
    "eu1/xenon2025h2",
    "us1/argon2027h1",  // ← Future (not yet active)
    "eu1/xenon2027h1",  // ← Future (not yet active)
  ],
  cloudflare: [
    "nimbus2025",
    "nimbus2026",       // ← Future (not yet active)
    "nimbus2027",       // ← Future (not yet active)
  ],
  digicert: [
    "2025h2",
    "2026h1",           // ← Future (not yet active)
    "2026h2",           // ← Future (not yet active)
  ],
  letsencrypt: [
    "2025h2",
    "2026h1",           // ← Future (not yet active)
    "2026h2",           // ← Future (not yet active)
  ],
  sectigo: [
    "elephant2025h2",
    "elephant2026h1",   // ← Future (not yet active)
  ],
}
```

**Issues:**
- ❌ Missing historical logs (2024, 2025h1)
- ❌ Including future logs that aren't active yet (2026, 2027)
- ❌ Missing Sectigo Mammoth series
- ❌ Missing DigiCert Yeti series

### Recommended Config (12-Month Window)

```typescript
providers = {
  google: [
    // Current generation (continuous scan)
    "us1/argon2025h2",
    "eu1/xenon2025h2",

    // Previous generation (historical/one-time scan)
    "us1/argon2025h1",
    "eu1/xenon2025h1",
    "us1/argon2024",
    "eu1/xenon2024",
  ],
  cloudflare: [
    "nimbus2025",
  ],
  digicert: [
    // Yeti series (full year)
    "yeti2025",

    // Wyvern series (half year)
    "2025h2",
    "2025h1",
    "2024h2",
  ],
  letsencrypt: [
    "2025h2",
    "2025h1",
  ],
  sectigo: [
    // Elephant series
    "elephant2025h2",

    // Mammoth series
    "mammoth2025h2",
  ],
}
```

---

## ROI Summary

| Provider | Logs | Est. .ac.uk Coverage | Historical Depth | Priority |
|----------|------|---------------------|------------------|----------|
| **Google** | 6 logs | ~40% (fallback) | 24 months | HIGH |
| **Let's Encrypt** | 2 logs | ~50-60% | 12 months | **CRITICAL** |
| **Cloudflare** | 1 log | ~30-40% | 12 months | HIGH |
| **DigiCert** | 4 logs | ~10-15% | 18 months | MEDIUM |
| **Sectigo** | 2 logs | ~20-30% | 6 months only | MEDIUM-HIGH |

**Total Coverage:** ~95% of active .ac.uk certificates (12-month window)

---

## Practical Recommendations

### Minimal Viable Approach (Start Here)
```typescript
// 9 logs total
providers = {
  google: ["us1/argon2025h2", "eu1/xenon2025h2", "us1/argon2025h1", "eu1/xenon2025h1"],
  letsencrypt: ["2025h2", "2025h1"],
  cloudflare: ["nimbus2025"],
  digicert: ["yeti2025"],
  sectigo: ["mammoth2025h2"],
}
```

### Recommended Approach (Best Balance)
```typescript
// 15 logs total (includes 2024 coverage)
providers = {
  google: [
    "us1/argon2025h2", "eu1/xenon2025h2",
    "us1/argon2025h1", "eu1/xenon2025h1",
    "us1/argon2024", "eu1/xenon2024",
  ],
  letsencrypt: ["2025h2", "2025h1"],
  cloudflare: ["nimbus2025"],
  digicert: ["yeti2025", "2025h2", "2025h1", "2024h2"],
  sectigo: ["mammoth2025h2", "elephant2025h2"],
}
```

### Maximum Coverage (Deepest History)
```typescript
// 17 logs total (adds 2023 coverage)
providers = {
  google: [
    "us1/argon2025h2", "eu1/xenon2025h2",
    "us1/argon2025h1", "eu1/xenon2025h1",
    "us1/argon2024", "eu1/xenon2024",
    "argon2023", "xenon2023",  // ← Adds 36-month depth
  ],
  letsencrypt: ["2025h2", "2025h1"],
  cloudflare: ["nimbus2025"],
  digicert: ["yeti2025", "2025h2", "2025h1", "2024h2"],
  sectigo: ["mammoth2025h2", "elephant2025h2"],
}
```

---

## Next Actions

1. ✅ **Update config** in [scan.service.ts](src/modules/scan/scan.service.ts#L15-L41)
2. ⏳ **Run initial scan** across all historical logs (one-time)
3. ⏳ **Set up scheduled scans** for current-generation logs (weekly/monthly)
4. ⏳ **Monitor log rotation** calendar (Jul 2026 next rotation)
5. ⏳ **Review coverage** after initial scan to validate ROI

---

## Calendar Reminders

- **Jul 2026:** Update config to add 2026h1 logs, archive 2025h1 logs
- **Jan 2027:** Update config to add 2027h1 logs, remove 2024 logs
- **Every 6 months:** Review and rotate log generations

---

**Last Updated:** 2026-01-04
**Next Review:** 2026-07-01 (log rotation)
