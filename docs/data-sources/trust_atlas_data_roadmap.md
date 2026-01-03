# Trust Atlas Data Source Implementation Roadmap

This document outlines the phased approach to integrating new data sources into Trust Atlas.

> **Update (2026-01):** Regional barometers (Phases 1-2) are already integrated as reference data but excluded from pillars due to methodology differences. The TRUE remaining work is Reuters DNR (media trust pillar) and newly-discovered free Gallup-derived datasets (Briq GPS, World Risk Poll, Wellcome).

---

## Executive Summary

Trust Atlas currently has 22 data sources in the database:
- **Pillar sources**: WVS, EVS, GSS, ANES, CES (survey) + CPI, WGI, WJP, FH, V-Dem (governance)
- **Reference sources**: Afrobarometer, Arab Barometer, Asian Barometer, Latinobarómetro, Eurobarometer, OECD, ESS, LAPOP, Caucasus Barometer, LiTS, EU-SILC

**Remaining work:**
1. **Media Trust Pillar** - Reuters Digital News Report (TRUE gap)
2. **Free Gallup-derived data** - Briq GPS, World Risk Poll, Wellcome (newly discovered)
3. **Methodology review** - Could regional barometers be harmonized for pillar use?

---

## Phase 1: Regional Barometer Integration ✅ COMPLETE

> **Status**: All regional barometers are integrated as reference data. They are excluded from pillar calculations due to methodology differences (see methodology.yaml).

### 1.1 Afrobarometer ✅

**Status**: Integrated as reference data — `etl/jobs/afrobarometer.py`

**Tasks**:
- [x] Download merged Round 8/9 dataset from https://www.afrobarometer.org/data/
- [x] Map variables to Trust Atlas schema
- [x] Create `etl/jobs/afrobarometer.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to different scale/wording than WVS

**Data Mapping**:
| Afrobarometer Variable | Trust Atlas Variable | Transformation |
|------------------------|---------------------|----------------|
| Q43A (Trust president) | institutional_trust | 4-point to 0-100 |
| Q43B (Trust parliament) | institutional_trust | 4-point to 0-100 |
| Q43E (Trust courts) | institutional_trust | 4-point to 0-100 |
| Q43F (Trust police) | institutional_trust | 4-point to 0-100 |
| Q84 (Trust most people) | interpersonal_trust | Binary % |

**Scale Conversion**:
```python
# Afrobarometer 4-point scale: 0=Not at all, 1=Just a little, 2=Somewhat, 3=A lot
# Convert to 0-100: score = (value / 3) * 100
def afrobarometer_to_percent(value):
    return (value / 3) * 100
```

---

### 1.2 Arab Barometer ✅

**Status**: Integrated as reference data — `etl/jobs/arabbarometer.py`

**Tasks**:
- [x] Register and download Wave VIII dataset
- [x] Map variables to Trust Atlas schema
- [x] Create `etl/jobs/arabbarometer.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to different scale/wording than WVS

**Countries in DB**: Iraq, Jordan, Kuwait, Lebanon, Mauritania, Morocco, Palestine, Tunisia

---

### 1.3 Latinobarómetro ✅

**Status**: Integrated as reference data — `etl/jobs/latinobarometro.py`

**Tasks**:
- [x] Accept terms and download 2024 Stata file
- [x] Map variables to Trust Atlas schema
- [x] Create `etl/jobs/latinobarometro.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to methodology changes (25%→93% swings)

**Countries in DB**: Argentina, Bolivia, Brazil, Chile, Colombia, Costa Rica, Dominican Republic, Ecuador, El Salvador, Guatemala, Honduras, Mexico, Nicaragua, Panama, Paraguay, Peru, Uruguay, Venezuela

---

## Phase 2: European & Media Trust Expansion (Partially Complete)

### 2.1 Eurobarometer via GESIS ✅

**Status**: Integrated as reference data — `etl/jobs/eurobarometer.py`

**Tasks**:
- [x] Register for GESIS account
- [x] Download Trust in Institutions data
- [x] Create `etl/jobs/eurobarometer.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to non-commercial license

**Note**: Media trust time series available but not currently extracted

---

### 2.2 Reuters Digital News Report ⊘ TRUE GAP

**Status**: ⊘ **NOT INTEGRATED — Main opportunity for MEDIA TRUST pillar**

**Goal**: Establish media trust pillar

**Tasks**:
- [ ] Navigate to https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025
- [ ] Use interactive tool to export trust data by country
- [ ] Manual data collection (no API):
  - Export "Trust in news" by country
  - Export "Trust in news sources" breakdown
- [ ] Create `etl/jobs/reuters_dnr.py` processor
- [ ] Store in new `media_trust` trust_type

**Schema Extension**:
```sql
-- Add media trust type if not exists
ALTER TABLE observations
  DROP CONSTRAINT IF EXISTS observations_trust_type_check;

ALTER TABLE observations
  ADD CONSTRAINT observations_trust_type_check
  CHECK (trust_type IN (
    'interpersonal', 'institutional', 'governance',
    'cpi', 'wgi', 'oecd', 'derived',
    'media'  -- NEW
  ));
```

**Priority**: HIGH — Only comprehensive global media trust source

---

### 2.3 Pew Global Attitudes ⊘

**Status**: ⊘ Not integrated

**Goal**: Cross-validation + additional trust measures

**Tasks**:
- [ ] Register at https://www.pewresearch.org/profile/registration/
- [ ] Identify relevant waves via Global Indicators Database
- [ ] Download Spring 2024 survey if trust questions included
- [ ] Create `etl/jobs/pew_global.py` processor
- [ ] Use primarily for validation against WVS

**Priority**: Medium — useful for cross-validation

---

## Phase 3: Advanced Sources (Partially Complete)

### 3.1 OECD Trust Survey ✅

**Status**: Integrated as reference data — `etl/jobs/oecd.py`

**Tasks**:
- [x] Access OECD.Stat for aggregate data
- [x] Create `etl/jobs/oecd.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to different institutional definitions

---

### 3.2 Asian Barometer ✅

**Status**: Integrated as reference data — `etl/jobs/asianbarometer.py`

**Tasks**:
- [x] Obtained Wave 5 dataset
- [x] Create `etl/jobs/asianbarometer.py` processor
- [x] Data loaded to observations table
- [x] Excluded from pillars due to inverted scales in Wave 1-2

**Countries in DB**: Taiwan, Hong Kong, China, Japan, South Korea, Mongolia, Philippines, Thailand, Singapore, Indonesia, Vietnam, Malaysia, Myanmar, Cambodia

---

### 3.3 Briq Global Preferences Survey (GPS) ⊘ NEW HIGH PRIORITY

**Status**: ⊘ **NOT INTEGRATED — Free Gallup-derived trust data**

**Goal**: Add free interpersonal trust data from 76 countries

**Tasks**:
- [ ] Download from https://www.briq-institute.org/global-preferences/home or https://gps.iza.org
- [ ] Extract trust variable (0-10 Likert scale)
- [ ] Create `etl/jobs/briq_gps.py` processor
- [ ] Determine handling: separate scale or convert to WVS-compatible?

**Data Details**:
- 76 countries, 80,000 respondents
- Trust measured on 0-10 Likert scale (like ESS)
- Collected via 2012 Gallup World Poll
- Free and open access

**Priority**: HIGH — Free trust data with global coverage

---

### 3.4 Lloyd's Register Foundation World Risk Poll ⊘

**Status**: ⊘ Not integrated

**Goal**: Safety and risk perceptions

**Tasks**:
- [ ] Download from https://wrp.lrfoundation.org.uk/
- [ ] Create `etl/jobs/world_risk_poll.py` processor
- [ ] Consider for future "risk trust" pillar

**Coverage**: 142+ countries, biennial

---

### 3.5 Wellcome Global Monitor ⊘

**Status**: ⊘ Not integrated

**Goal**: Science and health trust

**Tasks**:
- [ ] Download from https://wellcome.org/reports/wellcome-global-monitor
- [ ] Create `etl/jobs/wellcome.py` processor
- [ ] Consider for future "science trust" pillar

**Coverage**: 140+ countries

---

### 3.6 Edelman Academic Data ⊘

**Status**: ⊘ Not integrated — Public reports available, microdata unclear

**Goal**: 25-year institutional trust time series

**Tasks**:
- [ ] Email trustinstitute@edelman.com requesting academic data access
- [ ] Explain Trust Atlas as non-commercial open data project
- [ ] If approved: Create `etl/jobs/edelman.py` processor
- [ ] If denied: Continue using dashboard exports only

**Priority**: LOW — Microdata access uncertain

---

## Phase 4: New Pillars (Month 3+)

### 4.1 Media Trust Pillar

**Components**:
- Reuters Digital News Report (primary)
- Eurobarometer media questions (EU validation)
- Pew media trust questions (US validation)

**Methodology**:
```yaml
media:
  description: "Trust in news media and information sources"
  sources:
    - source: Reuters_DNR
      weight: 1.0  # Primary source
  validation:
    - Eurobarometer
    - Pew
  notes: "Single-source pillar until additional media trust data available"
```

### 4.2 Financial Trust Pillar (Future)

**Potential Components**:
- ECB Consumer Expectations Survey (EU)
- Gallup confidence in banks (if accessible via World Bank)
- Edelman trust in financial services

**Status**: Deprioritized due to limited open data availability

---

## Technical Requirements

### ETL Infrastructure Updates

```python
# New base class method for barometer-style surveys
class BarometerProcessor(BaseProcessor):
    """Base class for regional barometer surveys (Afro/Arab/Latino/Asian)"""

    def scale_to_100(self, value: float, scale_type: str) -> float:
        """Convert various barometer scales to 0-100"""
        if scale_type == "4point":
            return (value / 3) * 100  # 0-3 scale
        elif scale_type == "5point":
            return (value / 4) * 100  # 1-5 scale
        elif scale_type == "10point":
            return value * 10  # 0-10 scale
        elif scale_type == "binary":
            return value * 100  # 0/1 scale
        else:
            raise ValueError(f"Unknown scale type: {scale_type}")
```

### Database Schema Updates

```sql
-- Add source_metadata for new sources
INSERT INTO source_metadata (source, name, url, license, commercial_ok) VALUES
  ('AFRO', 'Afrobarometer', 'https://www.afrobarometer.org', 'Open Data', true),
  ('ARAB', 'Arab Barometer', 'https://www.arabbarometer.org', 'Academic', false),
  ('LATINO', 'Latinobarómetro', 'https://www.latinobarometro.org', 'Non-commercial', false),
  ('ASIAN', 'Asian Barometer', 'http://www.asianbarometer.org', 'Academic', false),
  ('EB', 'Eurobarometer', 'https://www.gesis.org/eurobarometer', 'Non-commercial', false),
  ('REUTERS', 'Reuters DNR', 'https://reutersinstitute.politics.ox.ac.uk', 'CC BY', true),
  ('PEW', 'Pew Global', 'https://www.pewresearch.org', 'Non-commercial', false),
  ('OECD_TRUST', 'OECD Trust Survey', 'https://www.oecd.org', 'OECD Terms', true),
  ('EDELMAN', 'Edelman Trust Barometer', 'https://www.edelman.com', 'Custom', false);
```

---

## Success Metrics

### Phase 1 ✅ COMPLETE
- [x] 38 African countries added via Afrobarometer
- [x] 8+ MENA countries added via Arab Barometer
- [x] 18 Latin American countries added via Latinobarómetro
- [x] ETL jobs automated and documented
- [x] **Note**: Data is reference-only (not in pillars)

### Phase 2 PARTIAL
- [x] Eurobarometer integrated
- [ ] Reuters DNR trust integrated for 40+ countries ← **TRUE GAP**
- [ ] Media trust pillar launched

### Phase 3 PARTIAL
- [x] Asian coverage: 14+ countries via Asian Barometer
- [x] OECD data loaded
- [ ] Briq GPS integrated (76 countries, 0-10 scale) ← **NEW PRIORITY**
- [ ] All sources documented

### Remaining Goals:
- [ ] Reuters DNR → Media trust pillar
- [ ] Briq GPS → Interpersonal trust expansion
- [ ] Decision on regional barometer methodology harmonization

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Application denied (Asian Barometer) | Rely on existing sources for Asia; try again with stronger justification |
| Non-commercial restriction conflict | Keep Trust Atlas non-commercial; document sources to remove if commercializing |
| Data format changes | Version-pin processors; monitor source websites |
| Scale incompatibility | Document all transformations; validate against known benchmarks |
| Missing countries in regional barometers | Document coverage gaps; don't interpolate |

---

## Timeline Summary (Updated Jan 2026)

### Completed ✅

| Sources | Status |
|---------|--------|
| Afrobarometer, Arab Barometer, Latinobarómetro | ✅ Reference data in DB |
| Eurobarometer, OECD, Asian Barometer | ✅ Reference data in DB |

### Remaining Work

| Priority | Source | Action |
|----------|--------|--------|
| **HIGH** | Reuters DNR | Manual export → media trust pillar |
| **HIGH** | Briq GPS | Download → interpersonal trust (0-10 scale) |
| Medium | World Risk Poll | Download → safety/risk perceptions |
| Medium | Wellcome | Download → science/health trust |
| Low | Pew Global | Register → cross-validation |
| Low | Edelman | Contact for microdata |

### Key Decision

**Regional barometer harmonization?**
- Currently: reference data only (excluded from pillars)
- Options: harmonize scales, within-source time series, or separate regional views
