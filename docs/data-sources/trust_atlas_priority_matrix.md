# Trust Atlas Data Source Priority Matrix

Quick-reference ranking of data sources for Trust Atlas integration.

> **Update (2026-01):** Many sources previously listed as "to integrate" are already in the database as reference data. Regional barometers (Afro, Arab, Asian, Latino) have ETL processors but are excluded from pillars due to methodology differences. TRUE gaps are Reuters DNR (media trust) and Briq GPS (free Gallup-derived trust data).

---

## Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Relevance | 30% | How directly does this measure trust? |
| Uniqueness | 30% | Does this fill a gap vs. existing sources? |
| Accessibility | 40% | How easy is programmatic access? |

---

## Priority Rankings

### HIGH Priority (TRUE Gaps — Not Yet Integrated)

| Rank | Source | Rel | Uniq | Access | Score | Gap Filled |
|------|--------|-----|------|--------|-------|------------|
| 1 | **Reuters Digital News Report** | 9 | 10 | 7 | 8.5 | Media trust (47 countries) — NEW PILLAR |
| 2 | **Briq GPS** | 8 | 7 | 9 | 8.0 | Free trust data (76 countries, 0-10 scale) |

### Already Integrated (Reference Data — Excluded from Pillars)

| Source | ETL Job | Status | Reason for Exclusion |
|--------|---------|--------|---------------------|
| **Afrobarometer** | `afrobarometer.py` | ✅ In DB | Different scale/wording than WVS |
| **Arab Barometer** | `arabbarometer.py` | ✅ In DB | Different scale/wording than WVS |
| **Latinobarómetro** | `latinobarometro.py` | ✅ In DB | Methodology changes (25%→93% swings) |
| **Eurobarometer** | `eurobarometer.py` | ✅ In DB | Non-commercial license |
| **OECD Trust Survey** | `oecd.py` | ✅ In DB | Different institutional definitions |
| **Asian Barometer** | `asianbarometer.py` | ✅ In DB | Inverted scales in Wave 1-2 |

### MEDIUM Priority (Additional Coverage)

| Rank | Source | Rel | Uniq | Access | Score | Gap Filled |
|------|--------|-----|------|--------|-------|------------|
| 3 | **World Risk Poll** | 7 | 8 | 9 | 8.0 | Safety/risk perceptions (142+ countries) |
| 4 | **Wellcome Global Monitor** | 7 | 8 | 9 | 8.0 | Science/health trust (140+ countries) |
| 5 | **Pew Global Attitudes** | 8 | 6 | 7 | 7.0 | Cross-validation |

### LOW Priority (Limited Access or Value)

| Rank | Source | Rel | Uniq | Access | Score | Reason |
|------|--------|-----|------|--------|-------|--------|
| 6 | **Edelman Trust Barometer** | 9 | 6 | 5 | 6.5 | Public reports only; microdata unclear |
| 7 | **ECB Consumer Expectations** | 7 | 8 | 6 | 6.9 | Euro area only (6 countries) |
| 8 | Thales Digital Trust | 7 | 9 | 4 | 6.3 | Summary data only |

### Clarification: Gallup World Poll

**Status**: Core microdata requires subscription, but FREE alternatives exist:
- **Briq GPS** (ranked #2 above) — Trust data, 76 countries
- **World Risk Poll** (ranked #3 above) — 142+ countries
- **Wellcome Global Monitor** (ranked #4 above) — 140+ countries
- **University access**: Harvard, Yale, Penn, UVA offer mediated access

---

## Decision Matrix (Updated)

```
                    HIGH UNIQUENESS
                          │
     INTEGRATE NOW        │     ALREADY INTEGRATED
     ┌─────────────────────┼─────────────────────┐
     │ Reuters DNR ⊘       │ Afrobarometer 📊    │
     │ Briq GPS ⊘          │ Arab Barometer 📊   │
     │ World Risk Poll ⊘   │ Asian Barometer 📊  │
     │ Wellcome Global ⊘   │ Latinobarómetro 📊  │
HIGH │                     │ Eurobarometer 📊    │
ACC  │                     │                     │
     ├─────────────────────┼─────────────────────┤
     │ Pew Global ⊘        │ Edelman (contact)   │
     │                     │ Thales (summary)    │
LOW  │                     │                     │
ACC  │   NICE TO HAVE      │ RESTRICTED ACCESS   │
     └─────────────────────┴─────────────────────┘
                          │
                    LOW UNIQUENESS

Legend: ⊘ = Not integrated, 📊 = In DB as reference
```

---

## Recommended Action by Source

### Phase 1: TRUE Gaps (High Priority)

| Source | Action | Status |
|--------|--------|--------|
| **Reuters DNR** | Manual export from interactive tool | ⊘ Not integrated |
| **Briq GPS** | Download from briq-institute.org or gps.iza.org | ⊘ Not integrated |

### Phase 2: Additional Coverage

| Source | Action | Status |
|--------|--------|--------|
| **World Risk Poll** | Download from wrp.lrfoundation.org.uk | ⊘ Not integrated |
| **Wellcome Global Monitor** | Download from wellcome.org | ⊘ Not integrated |
| **Pew Global** | Register, selective download | ⊘ Not integrated |

### Already Done (Reference Data in Database)

| Source | ETL Job | Status |
|--------|---------|--------|
| Afrobarometer | `etl/jobs/afrobarometer.py` | ✅ Complete |
| Arab Barometer | `etl/jobs/arabbarometer.py` | ✅ Complete |
| Latinobarómetro | `etl/jobs/latinobarometro.py` | ✅ Complete |
| Eurobarometer | `etl/jobs/eurobarometer.py` | ✅ Complete |
| OECD Trust Survey | `etl/jobs/oecd.py` | ✅ Complete |
| Asian Barometer | `etl/jobs/asianbarometer.py` | ✅ Complete |

### Low Priority / Skip

| Source | Action | Reason |
|--------|--------|--------|
| Edelman | Contact trustinstitute@edelman.com | Microdata redistribution unclear |
| ECB CES | Skip | Too narrow (6 euro countries) |
| Thales | Reference only | Summary data only |

---

## Coverage Impact Analysis

### Current Trust Atlas Coverage
- **Interpersonal**: ~120 countries (WVS/EVS/GSS/ANES/CES)
- **Institutional**: ~100 countries (WVS/ANES/CES)
- **Governance**: ~180 countries (CPI/WGI/WJP/FH/V-Dem)
- **Reference data**: 22 sources including regional barometers (not in pillars)

### After Phase 1-2 Integration

| Pillar | Current | After Reuters DNR | After Briq GPS |
|--------|---------|-------------------|----------------|
| Interpersonal | ~120 | ~120 | +76 (0-10 scale) |
| Institutional | ~100 | ~100 | - |
| Governance | ~180 | ~180 | - |
| **Media Trust** | 0 | **~50 (NEW)** | - |

### Regional Barometers (Already in Database)

These sources are integrated as **reference data** but excluded from pillar calculations:

| Region | Source | Countries | Status | Why Excluded |
|--------|--------|-----------|--------|--------------|
| Africa | Afrobarometer | 38 | 📊 In DB | Different scale |
| MENA | Arab Barometer | 16 | 📊 In DB | Different scale |
| Latin America | Latinobarómetro | 18 | 📊 In DB | Methodology swings |
| Asia | Asian Barometer | 14 | 📊 In DB | Inverted scales |
| Europe | Eurobarometer | 27 | 📊 In DB | Non-commercial |

**Future consideration**: Could regional barometers be harmonized or used for within-source time series?

---

## Quick Reference: Source URLs

### TRUE Gaps (Not Yet Integrated)

| Source | Data Download URL |
|--------|-------------------|
| **Reuters DNR** | https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025 |
| **Briq GPS** | https://www.briq-institute.org/global-preferences/home or https://gps.iza.org |
| **World Risk Poll** | https://wrp.lrfoundation.org.uk/ |
| **Wellcome Global Monitor** | https://wellcome.org/reports/wellcome-global-monitor |
| Pew Global | https://www.pewresearch.org/global/datasets/ |

### Already Integrated (Reference Data)

| Source | Data Download URL | ETL Job |
|--------|-------------------|---------|
| Afrobarometer | https://www.afrobarometer.org/data/ | `afrobarometer.py` |
| Arab Barometer | https://www.arabbarometer.org/survey-data/data-downloads/ | `arabbarometer.py` |
| Latinobarómetro | https://www.latinobarometro.org/latinobarometro-2024 | `latinobarometro.py` |
| Eurobarometer | https://www.gesis.org/en/eurobarometer-data-service | `eurobarometer.py` |
| OECD Trust | https://www.oecd.org/en/data/datasets/oecd-trust-survey-data.html | `oecd.py` |
| Asian Barometer | http://www.asianbarometer.org/data | `asianbarometer.py` |

### Low Priority / Reference Only

| Source | URL |
|--------|-----|
| Edelman | https://www.edelman.com/trust/data-dashboard |
| ECB CES | https://www.ecb.europa.eu/stats/ecb_surveys/consumer_exp_survey/ |
