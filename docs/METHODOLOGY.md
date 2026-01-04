# Trust Atlas Methodology

This document describes the methodology for Trust Atlas, including pillar definitions, data sources, normalization procedures, and confidence scoring.

**Current Version:** 0.7.0

## Overview

Trust Atlas tracks four independent pillars of trust. Each pillar is displayed separately—no composite index is computed.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                    TRUST ATLAS                                         │
│                              Four Independent Pillars                                  │
├───────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│   │  INTERPERSONAL  │  │  INSTITUTIONAL  │  │   GOVERNANCE    │  │      MEDIA      │  │
│   │                 │  │                 │  │                 │  │                 │  │
│   │ "Most people    │  │ Trust in govt   │  │ Quality proxy   │  │ Trust in news   │  │
│   │  can be trusted"│  │ & institutions  │  │                 │  │                 │  │
│   │                 │  │                 │  │                 │  │                 │  │
│   │ WVS-family:     │  │ WVS-family:     │  │ • CPI (20%)     │  │ • Reuters (40%) │  │
│   │ • WVS           │  │ • WVS           │  │ • WGI (20%)     │  │ • Eurobar (40%) │  │
│   │ • EVS           │  │ • ANES (USA)    │  │ • WJP (20%)     │  │ • WVS (20%)     │  │
│   │ • GSS/ANES/CES  │  │ • CES (Canada)  │  │ • FH/V-Dem (20%)│  │                 │  │
│   │ + Barometers    │  │ + Barometers    │  │                 │  │                 │  │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                        │
│   Each pillar scored 0-100. No composite score computed.                              │
│                                                                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Why No Composite Index?

Previous methodology (v0.2.0) computed a weighted composite score. This was deprecated because:

1. **Conceptual mixing**: Combining survey trust with governance proxies obscures what's actually being measured
2. **Methodology conflicts**: Different sources use different scales and question wordings
3. **Interpretability**: A single number hides whether trust issues are interpersonal, institutional, or governance-related

The pillar-independent approach lets users see each dimension clearly.

## The Four Pillars

### 1. Interpersonal Trust

**Definition:** The degree to which individuals trust other people in their society.

**Core Question:** "Generally speaking, would you say that most people can be trusted, or that you need to be very careful in dealing with people?"

**Sources:**
| Source | Variable | Countries | Years | Role |
|--------|----------|-----------|-------|------|
| World Values Survey (WVS) | A165 | 108 | 1981-2023 | Primary |
| European Values Study (EVS) | A165 | 47 | 1981-2021 | Supplementary |
| General Social Survey (GSS) | trust | 1 (USA) | 1972-2024 | Primary (USA) |
| American National Election Studies (ANES) | trust | 1 (USA) | 1958-2024 | Supplementary (USA) |
| Canadian Election Study (CES) | pes21_trust | 1 (Canada) | 2008-2021 | Primary (Canada) |
| Afrobarometer | Q84 | 39 | 2015-2023 | Fills gaps (Africa) |
| Latinobarometer | P11ST.A | 18 | 1996-2024 | Fills gaps (Latin America) |
| Asian Barometer | Q22 | 15 | 2001-2024 | Fills gaps (Asia) |
| Arab Barometer | Q201 | 12 | 2006-2023 | Fills gaps (MENA) |

WVS-family sources share identical question wording and binary response scale. Regional barometers use compatible binary trust questions; ETL jobs normalize variable names and scales across waves.

**Source Precedence:** WVS takes precedence when both WVS and another source have data for the same country/year. Source priority: WVS > EVS > GSS/ANES/CES > Barometers.

**Excluded Sources:**
- European Social Survey (ESS) - uses 0-10 scale, not comparable
- OECD Trust Indicators - different scale and institutional definitions

### 2. Institutional Trust

**Definition:** The degree to which citizens trust their national government and key institutions.

**Core Question:** Trust in parliament, government, legal system, and other state institutions.

**Sources:**
| Source | Variable | Countries | Role |
|--------|----------|-----------|------|
| World Values Survey (WVS) | E069_11 | Global | Primary |
| American National Election Studies (ANES) | trust_gov | USA | Primary (USA) |
| Canadian Election Study (CES) | cps21_fed_gov_sat | Canada | Primary (Canada) |
| Afrobarometer | Q43A-H | 39 | Fills gaps (Africa) |
| Latinobarometer | P13ST series | 18 | Fills gaps (Latin America) |
| Asian Barometer | Q7-Q12 | 15 | Fills gaps (Asia) |
| Arab Barometer | Q201A series | 12 | Fills gaps (MENA) |

**Source Precedence:** WVS > ANES/CES > Barometers.

**Excluded Sources:**
- **European Values Study (EVS)** - Inconsistent variable coverage across country/years. Some EVS waves use E069_11 (parliament/government), others only have E069_13 (political parties). This creates measurement mismatches—e.g., CZE 1991 shows 47.7% government trust (WVS) vs 23.8% party trust (EVS). These measure different constructs and cannot be reconciled.
- ESS, OECD Trust Indicators - different scales

### 3. Governance Quality

**Definition:** A proxy measure of institutional integrity based on expert assessments of corruption, rule of law, and government effectiveness.

**Note:** This pillar measures institutional quality, not trust. It serves as a supplementary indicator.

**Sources:**
| Source | Weight | Countries | Years | Scale |
|--------|--------|-----------|-------|-------|
| Transparency International CPI | 20% | 180+ | 2012-2024 | 0-100 |
| World Bank WGI | 20% | 206 | 2008-2023 | -2.5 to +2.5 → 0-100 |
| World Justice Project (WJP) | 20% | 142 | 2012-2024 | 0-100 |
| WJP Corruption Sub-index | 20% | 142 | 2012-2024 | 0-100 |
| Freedom House | 10% | 189 | 2013-2024 | 0-100 |
| V-Dem | 10% | 176 | 2000-2024 | 0-100 |

**Calculation:**
Weighted average of available sources. Missing sources have their weight redistributed proportionally among available sources.

### 4. Media Trust

**Definition:** The degree to which people trust news media in their country.

**Core Question:** "I think you can trust most news most of the time" (Reuters DNR)

**Sources:**
| Source | Weight | Countries | Years | Role |
|--------|--------|-----------|-------|------|
| Reuters Digital News Report | 40% | 47 | 2015-2025 | Primary (global) |
| Eurobarometer | 40% | 32 | 2024 | Primary (EU) |
| World Values Survey (WVS) | 20% | 100+ | 1981-2023 | Supplementary |

**Note:** Reuters DNR standardized its trust question methodology in 2015; reports from 2012-2014 used different methodology and are excluded.

**Question Wording Differences:**
- Reuters DNR: "I think you can trust most news most of the time" (agree/disagree)
- WVS: "Confidence in the press/television" (4-point scale)
- Eurobarometer: "Trust in institutions: Media" (tend to trust/not trust)

These measure similar but not identical constructs. Reuters DNR and Eurobarometer are preferred as primary sources; WVS media data serves as supplementary coverage for countries/years without Reuters/Eurobarometer data.

**Calculation:**
Weighted average of available sources with redistribution. If only WVS available, it gets 100% weight.

## Score Normalization

All values are normalized to a 0-100 scale:

| Original Scale | Formula | Example |
|---------------|---------|---------|
| Already 0-100 | `x` | CPI: 69 → 69 |
| Binary (trust/don't trust) | `(trust_count / total) × 100` | 40% trust → 40 |
| WGI (-2.5 to +2.5) | `((x + 2.5) / 5) × 100` | WGI: 0.5 → 60 |

## Confidence Tiers

Each pillar has its own confidence tier, reflecting the different data rhythms of each pillar type.

### Pillar-Specific Confidence

Following best practices from WGI and V-Dem, Trust Atlas uses **pillar-specific confidence tiers** rather than a single composite tier. This reflects that:

- Survey pillars (interpersonal, institutional) rely on 5-year WVS cycles
- Governance has annual data (CPI, WGI)
- Media has annual data (Reuters DNR, Eurobarometer)

### Survey Pillars (Interpersonal, Institutional)

| Tier | Criteria | Confidence Interval |
|------|----------|---------------------|
| **A** | WVS/EVS data ≤3 years old | ±5 points |
| **B** | WVS/EVS data 3-7 years old | ±10 points |
| **C** | No valid survey within 7 years | ±15 points |

### Governance Pillar

Always **Tier A** (±5 points) because CPI and WGI are updated annually.

### Media Pillar

Media uses different tier logic because Reuters DNR and Eurobarometer are annual sources, unlike the 5-year WVS cycle:

| Tier | Criteria | Confidence Interval |
|------|----------|---------------------|
| **A** | Reuters DNR or Eurobarometer ≤1 year old | ±5 points |
| **B** | Reuters/Eurobarometer 1-2 years old OR WVS ≤3 years old | ±10 points |
| **C** | No media data within 3 years | ±15 points |

### Data Age Decay

Survey data older than the grace period (3 years) is penalized:

```
decay = 0.03 × (data_age - 3)  # 3% per year after grace period
```

Maximum data age is 7 years. Older survey data is excluded.

## Data Quality Thresholds

### Minimum Sample Size

Survey data must have a sample size ≥300 to be included.

### Outlier Detection

Year-over-year changes exceeding 25 points are flagged for manual review. Large changes may indicate:
- Methodological breaks in the source data
- Data entry errors
- Genuine dramatic shifts (rare)

### Data Quality Sweep

The `make sweep` command runs automated quality checks:
- Statistical outliers (z-score > 3)
- YoY anomalies (> 15 point change)
- Cross-source conflicts
- Sample size issues
- Coverage gaps

Flagged observations are stored in `data_quality_flags` table for review.

## Methodology Versioning

| Version | Changes |
|---------|---------|
| 0.1.0 | Initial methodology |
| 0.2.0 | Weighted composite (40/40/20) |
| 0.3.0 | Pillar-independent. WVS-family only for survey pillars. No composite score. |
| 0.4.0 | Added EVS (same methodology as WVS). OWID benchmark validation. |
| 0.5.0 | Expanded governance sources: WJP, Freedom House, V-Dem now included with weighted averaging. WGI multi-year (2008-2023). |
| 0.6.0 | Added media trust pillar (Reuters DNR, Eurobarometer, WVS). Pillar-specific confidence tiers. |
| 0.7.0 | **Current.** Integrated regional barometers (Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer) as supplementary sources for interpersonal and institutional pillars. 19,000+ observations across 210 countries. |

## Interpretation Guide

### Score Ranges

| Range | Interpretation |
|-------|----------------|
| 75-100 | Very High: Strong trust/quality |
| 60-74 | High: Well-functioning |
| 45-59 | Moderate: Mixed signals |
| 30-44 | Low: Challenges present |
| 0-29 | Very Low: Significant issues |

### Comparability Notes

- Compare countries within the same confidence tier
- Compare pillar scores separately (don't mix interpersonal with governance)
- Regional patterns are more robust than individual rankings

### Limitations

1. **Survey Coverage Gaps:** WVS doesn't cover all countries equally
2. **Response Bias:** Self-reported trust may not reflect behavior
3. **Cultural Interpretation:** "Trust" concepts may vary across cultures
4. **Expert Assessment Bias:** CPI and WGI reflect expert perceptions
5. **Temporal Gaps:** Some countries have multi-year gaps between surveys

## Pipeline Validation

Our data processing pipeline has been validated against external sources to ensure accuracy.

### OWID Benchmark (January 2025)

We compared Trust Atlas WVS processing against Our World in Data's Integrated Values Surveys dataset. Results: **90.3% of observations within 3 percentage points**, confirming methodological alignment.

Minor discrepancies in 2022 data trace to data freshness—Trust Atlas processes WVS Wave 7 directly, which may not yet be fully incorporated into OWID's IVS merge.

**Full report:** [validation/owid-benchmark-2025-01.md](./validation/owid-benchmark-2025-01.md)

**Run the benchmark:**
```bash
python -m etl.validation.owid_benchmark --owid-csv <path-to-owid-csv>
```

## Related Documentation

- [DATA_SOURCES.md](./DATA_SOURCES.md) - Detailed source documentation
- [ETL_PIPELINE.md](./ETL_PIPELINE.md) - How data is processed
- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema
- [validation/](./validation/) - External validation reports
