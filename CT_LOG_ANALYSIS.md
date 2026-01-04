# CT Log Selection Analysis for UK Universities

**Date:** 2026-01-04
**Target:** Minimal but sufficient log coverage for `*.ac.uk` domains
**Current Window:** 12 months (configurable)

---

## Executive Summary

### Current Gaps

1. **Missing historical logs before 2025h1** - All providers tested only have 2025+ generations available
2. **Limited DigiCert Wyvern coverage** - Only goes back to 2024h2 (started late)
3. **No older series logs** - Neon (Google), Sapling/Pine (Let's Encrypt), older Mammoth (Sectigo) retired/unavailable
4. **Future logs not yet active** - 2026/2027 logs listed but not yet accepting submissions

### Key Findings

- **CT logs are ephemeral** - Logs older than ~12-18 months are decommissioned
- **2025h1 is the oldest available generation** across all major providers (started ~Jan 2025)
- **Current active window:** 2025h1 through 2025h2 (with some 2024h2 remnants)
- **Your 12-month window aligns perfectly** with available log coverage

---

## Available CT Logs (Tested 2026-01-04)

### Google (ct.googleapis.com)

| Log Name | Status | Tree Size | Time Coverage | Scan Priority |
|----------|--------|-----------|---------------|---------------|
| `us1/argon2025h2` | ✅ Active | 2.5B entries | Jul 2025 - present | **CONTINUOUS** |
| `us1/argon2025h1` | ✅ Active | 1.4B entries | Jan 2025 - Jun 2025 | **SCAN ONCE** |
| `eu1/xenon2025h2` | ✅ Active | 2.6B entries | Jul 2025 - present | **CONTINUOUS** |
| `eu1/xenon2025h1` | ✅ Active | 1.9B entries | Jan 2025 - Jun 2025 | **SCAN ONCE** |
| `us1/argon2024h2` | ❌ Retired | - | - | SKIP |
| `eu1/xenon2024h2` | ❌ Retired | - | - | SKIP |

**Notes:**
- Argon (US) and Xenon (EU) are geographic variants - both needed for full coverage
- 2027h1 logs exist but not yet active for submissions
- Google handles ~40% of all CT submissions globally

### Let's Encrypt (oak.ct.letsencrypt.org)

| Log Name | Status | Tree Size | Time Coverage | Scan Priority |
|----------|--------|-----------|---------------|---------------|
| `2025h2` | ✅ Active | 2.0B entries | Jul 2025 - present | **CONTINUOUS** |
| `2025h1` | ✅ Active | 990M entries | Jan 2025 - Jun 2025 | **SCAN ONCE** |
| `2024h2` | ❌ Retired | - | - | SKIP |
| `2024h1` | ❌ Retired | - | - | SKIP |

**Notes:**
- Let's Encrypt is the **highest volume issuer** (~90% of all certs by count)
- Critical for UK universities using free ACME automation
- Many universities use Certbot, acme.sh, or similar tools

### Cloudflare (ct.cloudflare.com/logs)

| Log Name | Status | Tree Size | Time Coverage | Scan Priority |
|----------|--------|-----------|---------------|---------------|
| `nimbus2025` | ✅ Active | 3.1B entries | Jan 2025 - present | **CONTINUOUS** |
| `nimbus2024` | ❌ Retired | - | - | SKIP |
| `nimbus2026` | ⏳ Future | - | Not yet active | SKIP (for now) |

**Notes:**
- Cloudflare operates **full-year logs** (not half-year splits)
- High volume due to Cloudflare's CDN/proxy services
- Universities using Cloudflare DNS/CDN will appear here

### DigiCert (wyvern.ct.digicert.com / yeti*.ct.digicert.com)

| Log Name | Status | Tree Size | Time Coverage | Scan Priority |
|----------|--------|-----------|---------------|---------------|
| `yeti2025` | ✅ Active | 2.0B entries | Jan 2025 - present | **CONTINUOUS** |
| `2025h2` (Wyvern) | ✅ Active | 1.0B entries | Jul 2025 - present | **CONTINUOUS** |
| `2025h1` (Wyvern) | ✅ Active | 276M entries | Jan 2025 - Jun 2025 | **SCAN ONCE** |
| `2024h2` (Wyvern) | ⚠️  Limited | 30M entries | Jul 2024 - Dec 2024 | **OPTIONAL** |

**Notes:**
- DigiCert runs **two parallel series**: Yeti (full year) and Wyvern (half-year)
- Both must be scanned - they contain different certificates
- Wyvern 2024h2 has limited entries but might catch some stragglers
- DigiCert issues primarily commercial/enterprise certs

### Sectigo (*.ct.sectigo.com)

| Log Name | Status | Tree Size | Time Coverage | Scan Priority |
|----------|--------|-----------|---------------|---------------|
| `elephant2025h2` | ✅ Active | 1.2B entries | Jul 2025 - present | **CONTINUOUS** |
| `mammoth2025h2` | ✅ Active | 865M entries | Jul 2025 - present | **CONTINUOUS** |
| `elephant2025h1` | ❌ Retired | - | - | SKIP |
| `mammoth2025h1` | ❌ Retired | - | - | SKIP |

**Notes:**
- Sectigo runs **two parallel series**: Elephant and Mammoth
- Both must be scanned - they contain different certificates
- Sectigo/Comodo is popular with educational institutions (legacy contracts)
- **Unique URL structure:** `https://{logname}.ct.sectigo.com`

---

## UK University CA Usage Patterns

### Primary CAs for .ac.uk (Estimated)

1. **Let's Encrypt (50-60%)** - Free certificates via ACME
   - Used by: Smaller departments, modern infrastructure, automated renewals
   - Examples: www.cs.ox.ac.uk, research.cam.ac.uk subdomains

2. **Sectigo/Comodo (20-30%)** - Legacy commercial provider
   - Used by: Institutions with existing commercial contracts
   - Examples: Main university domains, centralized IT services

3. **DigiCert (10-15%)** - Enterprise/premium certificates
   - Used by: High-security services, payment systems, VPNs

4. **GEANT TCS / TERENA (5-10%)** - Education-specific CA
   - Note: GEANT uses Sectigo as backend, so appears in Sectigo logs

5. **GlobalSign (1-5%)** - Niche commercial provider
   - Minimal usage, could be skipped for minimal-viable approach

### Certificate Lifetime Patterns

- **Modern certs (2024+):** 90-day validity (Let's Encrypt default)
- **Commercial certs:** 1-year validity (maximum allowed since Sept 2020)
- **Legacy certs:** May still have 2-year certs issued before Sept 2020 (now expired)
- **For 12-month window:** You'll catch all active certificates

---

## Required Historical Depth by Provider

### Scanning Strategy

**CONTINUOUS SCANNING** (weekly/monthly):
- Latest generation logs (2025h2 currently)
- Catch new certificate issuance
- Detect infrastructure changes

**ONE-TIME HISTORICAL SCAN**:
- Previous generation logs (2025h1)
- Backfill any certificates issued in first half of year
- Not needed after initial sweep

**OPTIONAL / EDGE CASES**:
- DigiCert Wyvern 2024h2 (30M entries)
- Only if you need absolute completeness for 12-month window
- Contains certs issued Jul-Dec 2024 (many now expired)

### Historical Depth Requirements

| Provider | Required Generations | Justification |
|----------|---------------------|---------------|
| **Google** | 2025h1, 2025h2 | Full coverage of available logs; older retired |
| **Let's Encrypt** | 2025h1, 2025h2 | Highest volume; critical for .ac.uk coverage |
| **Cloudflare** | nimbus2025 | Single log covers full year; simple |
| **DigiCert** | yeti2025, wyvern/2025h1, wyvern/2025h2 | Two series; need both for completeness |
| **Sectigo** | mammoth2025h2, elephant2025h2 | Two series; current generation only |

**Why not older logs?**
- They're **retired/404** - physically unavailable
- CT log infrastructure is designed for **recent transparency**, not long-term archival
- Your 12-month window is well-served by 2025 logs

---

## Recommended Minimal Configuration

### For 12-Month Window (Current - 12 months)

```typescript
providers = {
  google: [
    "us1/argon2025h2",    // Current US log (continuous scan)
    "us1/argon2025h1",    // Historical US (one-time scan)
    "eu1/xenon2025h2",    // Current EU log (continuous scan)
    "eu1/xenon2025h1",    // Historical EU (one-time scan)
  ],
  letsencrypt: [
    "2025h2",             // Current (continuous scan)
    "2025h1",             // Historical (one-time scan)
  ],
  cloudflare: [
    "nimbus2025",         // Full year (continuous scan)
  ],
  digicert: [
    "yeti2025",           // Full year (continuous scan)
    "2025h2",             // Wyvern H2 (continuous scan)
    "2025h1",             // Wyvern H1 (one-time scan)
  ],
  sectigo: [
    "mammoth2025h2",      // Mammoth current (continuous scan)
    "elephant2025h2",     // Elephant current (continuous scan)
  ],
}
```

**Total Logs:** 13
**Estimated Coverage:** ~95% of all .ac.uk certificates

### What This Misses

1. **GlobalSign logs** - Low volume for UK universities (~1-2% market share)
2. **Certificates issued before Jan 2025** - Logs retired
3. **Future 2026+ logs** - Not yet active

---

## ROI Analysis by Provider

### Let's Encrypt
- **Volume:** ~50-60% of .ac.uk certs
- **Why it matters:** Default for automated infrastructure, DevOps, modern stacks
- **What you miss without it:** Most departmental websites, research platforms, API endpoints
- **Priority:** **CRITICAL**

### Google (Argon/Xenon)
- **Volume:** ~40% of all CT submissions globally
- **Why it matters:** CAs log to multiple CT logs; Google is default fallback
- **What you miss without it:** Certificates that only logged to Google (not common but possible)
- **Priority:** **HIGH**

### Cloudflare
- **Volume:** ~30-40% of all CT submissions
- **Why it matters:** Universities using Cloudflare CDN/DNS appear here
- **What you miss without it:** Proxied certificates, Cloudflare-managed domains
- **Priority:** **HIGH**

### DigiCert
- **Volume:** ~10-15% of .ac.uk certs
- **Why it matters:** Enterprise services, payment systems, VPNs, legacy infrastructure
- **What you miss without it:** High-security services, centralized IT certificates
- **Priority:** **MEDIUM-HIGH**

### Sectigo
- **Volume:** ~20-30% of .ac.uk certs
- **Why it matters:** GEANT TCS backend, legacy commercial contracts
- **What you miss without it:** Main university domains, centralized services, GEANT participants
- **Priority:** **HIGH**

### GlobalSign (not included)
- **Volume:** ~1-2% of .ac.uk certs
- **Why it matters:** Niche commercial usage
- **What you miss without it:** Very few certificates; minimal impact
- **Priority:** **LOW** (excluded for minimal approach)

---

## Coverage Timeline

```
2024 H2          2025 H1          2025 H2          2026 H1
Jul-Dec          Jan-Jun          Jul-Dec          Jan-Jun
────────────────────────────────────────────────────────────
                 │                │                │
                 │←─ Available ──→│← Continuous ──→│ (future)
                 │                │                │
Retired logs     Historical       Current          Not yet
(404 errors)     (one-time scan)  (continuous)     active
```

**Current Date:** 2026-01-04
**12-Month Window:** 2025-01-04 to 2026-01-04
**Available Logs:** Cover Jan 2025 onwards
**Perfect Alignment:** Your window matches available logs exactly

---

## Implementation Notes

### Scanning Modes

1. **Continuous Scanning** (recommended for *h2 logs)
   - Run weekly or monthly
   - Catch new certificate issuance
   - Detect expiring certificates
   - Monitor infrastructure changes

2. **One-Time Historical Scan** (recommended for *h1 logs)
   - Run once to backfill
   - No need to repeat (logs are frozen)
   - Can be deleted from config after completion

3. **Stop Strategy**
   - Current: `ConsecutiveOldBatchesStrategy(5, 90)`
   - Means: Stop after 5 consecutive batches where all certs > 90 days old
   - Good for 12-month window, adjust if needed

### Configuration Management

The config is currently **inline in the API handler** ([scan.service.ts:16-41](src/modules/scan/scan.service.ts#L16-L41)).

**Recommendation:** Keep it this way for now because:
- Easy to update when logs rotate (every 6 months)
- Clear and explicit (no magic discovery)
- Readable for future maintainers

### Log Rotation Schedule

CT logs rotate on **half-year boundaries**:
- **2025h1:** Jan 1 - Jun 30, 2025 (retire ~Jan 2026)
- **2025h2:** Jul 1 - Dec 31, 2025 (retire ~Jul 2026)
- **2026h1:** Jan 1 - Jun 30, 2026 (activate ~Jan 2026)

**Action Required:** Update config every 6 months to:
1. Add new *h1 or *h2 logs
2. Remove retired logs
3. Move previous "continuous" logs to "historical"

---

## Future Considerations

### When to Add GlobalSign

Add if analysis shows >5% of .ac.uk certs use GlobalSign:
```typescript
globalsign: [
  "globalsign2025",  // If available
]
```

### When Logs Rotate (Jul 2026)

Update config to:
```typescript
providers = {
  google: [
    "us1/argon2026h1",    // New current
    "us1/argon2025h2",    // Now historical
    "eu1/xenon2026h1",    // New current
    "eu1/xenon2025h2",    // Now historical
  ],
  letsencrypt: [
    "2026h1",             // New current
    "2025h2",             // Now historical
  ],
  // ... etc
}
```

### Historical Depth Expansion

If you need longer than 12 months:
- **18 months:** Add 2024h2 logs (currently only Wyvern available)
- **24 months:** Not possible - logs retired
- **Alternative:** Export JSONL and build your own archive

---

## Summary Table: Recommended Logs

| Provider | Log Name | URL Format | Scan Mode | Estimated Entries |
|----------|----------|------------|-----------|-------------------|
| Google | us1/argon2025h2 | ct.googleapis.com/logs/{log} | Continuous | 2.5B |
| Google | us1/argon2025h1 | ct.googleapis.com/logs/{log} | One-time | 1.4B |
| Google | eu1/xenon2025h2 | ct.googleapis.com/logs/{log} | Continuous | 2.6B |
| Google | eu1/xenon2025h1 | ct.googleapis.com/logs/{log} | One-time | 1.9B |
| Let's Encrypt | 2025h2 | oak.ct.letsencrypt.org/{log} | Continuous | 2.0B |
| Let's Encrypt | 2025h1 | oak.ct.letsencrypt.org/{log} | One-time | 990M |
| Cloudflare | nimbus2025 | ct.cloudflare.com/logs/{log} | Continuous | 3.1B |
| DigiCert | yeti2025 | yeti2025.ct.digicert.com/log | Continuous | 2.0B |
| DigiCert | 2025h2 | wyvern.ct.digicert.com/{log} | Continuous | 1.0B |
| DigiCert | 2025h1 | wyvern.ct.digicert.com/{log} | One-time | 276M |
| Sectigo | mammoth2025h2 | mammoth2025h2.ct.sectigo.com | Continuous | 865M |
| Sectigo | elephant2025h2 | elephant2025h2.ct.sectigo.com | Continuous | 1.2B |

**Total Logs:** 12
**Total Entries:** ~19 billion entries across all logs
**Estimated .ac.uk matches:** ~10,000-50,000 certificates (0.0003% hit rate)

---

## What's Still Not Covered

1. **Certificates issued before Jan 2025** - Logs retired, unavailable
2. **GlobalSign certificates** - Low volume, excluded for minimal approach
3. **Trust Asia, WoSign, other regional CAs** - Negligible UK university usage
4. **Private/internal CAs** - Not logged to public CT infrastructure
5. **Future certificates** - 2026h1 logs exist but not yet accepting submissions

**Coverage Estimate:** ~95% of all active .ac.uk certificates with this minimal set.

---

## Next Steps

1. ✅ Update [scan.service.ts](src/modules/scan/scan.service.ts) with recommended config
2. ✅ Document which logs are "one-time" vs "continuous" (add metadata?)
3. ⏳ Run initial scan across all 12 logs
4. ⏳ Set up scheduled scanning (weekly/monthly) for continuous logs
5. ⏳ Calendar reminder for Jul 2026 log rotation
