# Trust Atlas: New Source Integration Design

This document outlines the optimal integration path for new data sources, including architectural decisions about pillars vs. dimensions.

---

## Executive Summary

**Recommendation**: Add Reuters DNR as a **4th pillar (media_trust)**, not as a dimension within existing pillars.

**Rationale**:
1. Media trust measures a distinct construct (information ecosystem) from interpersonal (social capital), institutional (political trust), and governance (objective quality)
2. Trust Atlas philosophy emphasizes pillar independence—no composite scores
3. Roadmap already plans this as "Phase 4: New Pillars"
4. Single-source pillars are acceptable (governance started this way)

---

## Integration Paths Evaluated

### Option A: 4th Pillar (Recommended)

Add `media_trust` as a peer to existing pillars.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Interpersonal│  │Institutional│  │ Governance  │  │ Media Trust │
│   (WVS)     │  │   (WVS)     │  │(CPI/WGI/...)│  │(Reuters DNR)│
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
      ↓                ↓                ↓                ↓
   Survey           Survey           Expert           Survey
   (binary)         (binary)        indices          (0-100)
```

**Pros**:
- Conceptually clean—media is independent construct
- Follows established pillar patterns
- UI/API already support N pillars with minor changes
- Confidence tier logic adapts (A=4 pillars, B=3, C=2, etc.)

**Cons**:
- Requires changes across 7 layers (~15 files) ✓ Done
- Homepage layout updated to 4 pillars ✓ Done
- Started with Reuters, now has 3 sources (Reuters, Eurobarometer, WVS)

### Option B: Dimension Within Institutional

Treat media trust as a sub-dimension of institutional trust.

```
┌─────────────────────────────────────────────────┐
│              Institutional Trust                │
│  ┌───────────────┐  ┌───────────────┐          │
│  │  Government   │  │    Media      │          │
│  │   (WVS)       │  │ (Reuters DNR) │          │
│  └───────────────┘  └───────────────┘          │
└─────────────────────────────────────────────────┘
```

**Pros**:
- No new pillar UI/schema changes
- Could use `trust_subtype` column

**Cons**:
- Conceptually wrong—media != government institutions
- WVS institutional questions don't cover media
- Edelman model treats media as separate (4 pillars: business, gov, media, NGO)
- Obscures distinct trend lines

### Option C: Separate "Dimensions" Layer

Create hierarchical structure: Pillars → Dimensions → Sources.

```
Pillar: Trust
├── Dimension: Social
│   └── interpersonal (WVS, EVS)
├── Dimension: Political
│   ├── institutional (WVS)
│   └── governance (CPI, WGI)
└── Dimension: Information
    └── media_trust (Reuters DNR)
```

**Pros**:
- Most flexible architecture
- Supports future expansion (science trust, financial trust)

**Cons**:
- Major refactor of entire codebase
- Breaks existing API contract
- Over-engineering for current needs
- No academic consensus on dimension hierarchy

**Verdict**: Option C is interesting for v2.0 but premature now.

---

## Recommended: Option A Implementation

### Phase 1: Database Schema

```sql
-- db/migrations/010_add_media_trust.sql

-- Add media_trust column to country_year
ALTER TABLE country_year
ADD COLUMN IF NOT EXISTS media_trust NUMERIC
  CHECK (media_trust >= 0 AND media_trust <= 100);

-- Add media trust type to observations
ALTER TABLE observations
  DROP CONSTRAINT IF EXISTS observations_trust_type_check;

ALTER TABLE observations
  ADD CONSTRAINT observations_trust_type_check
  CHECK (trust_type IN (
    'interpersonal', 'institutional', 'governance',
    'cpi', 'wgi', 'oecd', 'derived', 'freedom', 'vdem', 'wjp',
    'media'  -- NEW
  ));

-- Add Reuters DNR to source_metadata
INSERT INTO source_metadata (source, name, url, license, commercial_ok) VALUES
  ('Reuters_DNR', 'Reuters Digital News Report',
   'https://reutersinstitute.politics.ox.ac.uk', 'CC BY', true)
ON CONFLICT (source) DO NOTHING;
```

### Phase 2: ETL Pipeline

**File**: `etl/pipelines/assemble.py`

```python
# Add to pillar_weights (rebalance)
self.pillar_weights = {
    "interpersonal": 0.30,   # Was 0.40
    "institutional": 0.30,   # Was 0.40
    "governance": 0.20,      # Unchanged
    "media_trust": 0.20,     # NEW
}

# Add to source_weights
self.source_weights["media_trust"] = {
    "Reuters_DNR": 1.0,  # Single source initially
}

# Add to trust_type_to_pillar mapping
self.trust_type_to_pillar["media"] = "media_trust"
```

**New ETL Job**: `etl/jobs/reuters_dnr.py`
- Manual data export from Reuters interactive tool
- Parse country-level "Trust in news" percentages
- Store as `trust_type='media'`, `source='Reuters_DNR'`

### Phase 3: API Routes

**File**: `api/src/routes/trends.ts`

```typescript
// Update validation arrays (3 locations)
const validPillars = ['interpersonal', 'institutional', 'governance', 'media_trust']

// Add query logic for media_trust
} else if (pillar === 'media_trust') {
  // Reuters DNR only for now
  query = `WHERE o.trust_type = 'media' AND o.source = 'Reuters_DNR'`
}
```

**File**: `api/src/routes/country.ts`

```typescript
// Add media_trust to SELECT
SELECT year, interpersonal, institutional, governance, media_trust, ...
```

### Phase 4: Web Layer

**File**: `web/lib/design-tokens.ts`

```typescript
export const PILLARS: Record<Pillar, PillarConfig> = {
  // ... existing pillars ...
  media_trust: {
    label: 'Media Trust',
    shortLabel: 'Media',
    description: 'Trust in news media',
    colorHex: '#6366f1',  // Indigo
    tailwindText: 'text-indigo-400',
    tailwindBg: 'from-indigo-500 to-indigo-400',
  },
}
```

**File**: `web/app/explore/page.tsx`

```typescript
export type Pillar = 'interpersonal' | 'institutional' | 'governance' | 'media_trust'
```

**File**: `web/components/FilterBar.tsx`

```typescript
import { Newspaper } from 'lucide-react'

const PILLAR_ICONS = {
  interpersonal: Users,
  institutional: Building2,
  governance: Scale,
  media_trust: Newspaper,  // NEW
}

const PILLAR_ORDER: Pillar[] = ['interpersonal', 'institutional', 'governance', 'media_trust']
```

### Phase 5: Homepage Redesign

Current 3-column grid becomes 4-column or 2x2:

```tsx
// Option A: 4-column on large screens
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

// Option B: 2x2 grid
<div className="grid grid-cols-2 gap-6">
```

---

## Briq GPS Integration (Separate Decision)

Briq GPS provides interpersonal trust on a 0-10 scale (like ESS), not binary (like WVS).

**Options**:

1. **Convert to binary-equivalent**: Map 0-10 to 0-100, but flag as different methodology
2. **Keep as reference data**: Like ESS, Afrobarometer—useful for validation but excluded from pillar
3. **Create separate "detailed scale" view**: Show both binary and 0-10 sources

**Recommendation**: Option 2 initially. Add to reference data, validate against WVS, then decide on harmonization.

---

## Future Considerations

### Potential 5th/6th Pillars

| Source | Potential Pillar | Coverage | Priority |
|--------|-----------------|----------|----------|
| World Risk Poll | Safety/Risk Trust | 142 countries | Medium |
| Wellcome Global Monitor | Science Trust | 140 countries | Medium |
| Edelman (if access) | Business Trust | 28 countries | Low |

### Architecture for N Pillars

If Trust Atlas grows beyond 4 pillars, consider:

1. **Pillar metadata table** instead of hardcoded config
2. **Dynamic UI** that reads pillar list from API
3. **Flexible confidence tiers** (now updated for 4 pillars with per-pillar tiers)

This refactor is premature for 4 pillars but worth planning for v2.0.

---

## Implementation Checklist

### Phase 1: Reuters DNR ETL ✓
- [x] Export Reuters DNR 2015-2025 data
- [x] Create `etl/jobs/reuters_dnr.py` processor
- [x] Add to observations table with `trust_type='media'`
- [x] Validate country coverage (46 countries)

### Phase 2: Schema + API ✓
- [x] Add `media` column to country_year (renamed from media_trust)
- [x] Create aggregate_media.py pipeline with 3-source weighting
- [x] Update API validation arrays
- [x] Add media to TypeScript interfaces
- [x] Test `/trends/global?pillar=media`

### Phase 3: Web UI ✓
- [x] Add to design-tokens.ts
- [x] Update Pillar type union
- [x] Add icon to FilterBar/ExplorePanel (responsive design)
- [x] Redesign homepage to four pillars
- [x] Update methodology page

### Phase 4: Documentation ✓
- [x] Update README.md (4 pillars)
- [x] Update METHODOLOGY.md
- [x] Update methodology.yaml to v0.6.0
- [x] Add Reuters DNR, Eurobarometer to source inventory

---

## Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Media trust structure | **4th pillar** | Conceptually distinct, follows existing patterns |
| Briq GPS | **Reference data** | Different scale, needs methodology review |
| Architecture refactor | **Defer to v2.0** | 4 pillars manageable with current design |
| Implementation order | **ETL → API → Web** | Backend first, validate data before UI |
