# Trust Atlas: Vision & Roadmap

**Version:** 0.1 (Draft)
**Last Updated:** January 2025
**Status:** Strategic planning document

---

## Executive Summary

Trust Atlas measures trust across multiple dimensions using only open, programmatically accessible data. Our goal is not just to provide scores, but to **surface gaps and signals** that lead to meaningful conversations about trust—and empower builders creating solutions.

This document outlines the strategic vision, data architecture, and development roadmap.

---

## Core Thesis

### The Problem We're Solving

Trust data exists, but it's fragmented across dozens of sources with incompatible methodologies. Policymakers, researchers, journalists, and builders lack a unified view that answers:

1. **Where are trust deficits?** Not just low scores, but concerning patterns
2. **Is the problem perception or performance?** Citizens may distrust good institutions (communication gap) or trust bad ones (false confidence)
3. **What's changing?** Trend direction matters more than absolute levels
4. **What can be done?** Connect problems to builders and solutions

### The Insight

The most actionable signal isn't a score—it's a **gap**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         THE TRUST GAP                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   INSTITUTIONAL TRUST          vs.        GOVERNANCE QUALITY         │
│   (What citizens believe)                 (How institutions perform) │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ GAP TYPE              DIAGNOSIS           ACTION             │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │ High trust,           False confidence    Reform before      │   │
│   │ low quality           (propaganda works)  crisis hits        │   │
│   │                                                              │   │
│   │ Low trust,            Legitimacy crisis   Communication,     │   │
│   │ high quality          (cynicism)          transparency       │   │
│   │                                                              │   │
│   │ Low trust,            Systemic failure    Rebuild both       │   │
│   │ low quality                                                  │   │
│   │                                                              │   │
│   │ High trust,           Healthy system      Maintain           │   │
│   │ high quality                                                 │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

We don't prescribe "correct" trust levels. We surface where perception and reality diverge, and let users draw conclusions.

---

## Data Architecture

### Pillar Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TRUST ATLAS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CORE PILLARS (Map visualization, country comparison, trend analysis)           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ INTERPERSONAL│ │INSTITUTIONAL │ │  GOVERNANCE  │ │    MEDIA     │           │
│  │              │ │              │ │   QUALITY    │ │              │           │
│  │ "Most people │ │ Trust in     │ │ Institutional│ │ Trust in     │           │
│  │ can be       │ │ government,  │ │ performance  │ │ news media   │           │
│  │ trusted"     │ │ parliament   │ │ (expert)     │ │              │           │
│  │              │ │              │ │              │ │              │           │
│  │ WVS, EVS,    │ │ WVS, ANES,   │ │ CPI, WGI,    │ │ Reuters DNR, │           │
│  │ barometers   │ │ barometers   │ │ WJP, FH,V-Dem│ │ Eurobarometer│           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│                          │                │                                      │
│                          └────────────────┘                                      │
│                                  │                                               │
│                          TRUST-QUALITY GAP                                       │
│                     (Derived insight, key signal)                                │
│                                                                                  │
│  SUPPLEMENTARY INDICATORS (Country detail, not mapped)                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   SCIENCE    │ │  FINANCIAL   │ │   AI/TECH    │ │   DIGITAL    │           │
│  │    TRUST     │ │    TRUST     │ │    TRUST     │ │   PRIVACY    │           │
│  │              │ │              │ │              │ │              │           │
│  │ Wellcome,    │ │ WVS banks,   │ │ KPMG/Melb,   │ │ Future       │           │
│  │ WVS science  │ │ Findex ref   │ │ Stanford HAI │ │              │           │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Why This Structure?

| Design Choice | Rationale |
|---------------|-----------|
| **No composite index** | Different pillars have different rhythms (WVS ~5yr, governance annual). Combining creates artificial volatility. |
| **Trust vs Quality separation** | These measure different things. The gap between them IS the insight. |
| **Supplementary tier** | Important but narrow topics (AI, science) tracked without cluttering core analysis. |
| **Pillar independence** | Each pillar tells its own story. High interpersonal + low institutional = different problem than low both. |

---

## Coverage Analysis

### Current Data (v0.7.0)

| Tier | Countries | Criteria | Capabilities |
|------|-----------|----------|--------------|
| **Tier 1: Deep** | 48 | 5+ survey waves, rich media | Full gap analysis, trends, all pillars |
| **Tier 2: Good** | 57 | 3+ survey waves, some media | Gap analysis, limited trends |
| **Tier 3: Basic** | 52 | Survey + governance | Basic comparison, no gap |
| **Tier 4: Governance** | 48 | Indices only | Governance pillar only |
| **Tier 5: Sparse** | 5 | Minimal | Reference only |

**Total: 210 countries, 19,000+ observations**

### Tier 1 Countries (Full Analysis)

```
Americas (8):   ARG, BRA, CAN, CHL, COL, MEX, PER, USA
Europe (24):    AUT, BEL, BGR, CHE, CZE, DEU, DNK, ESP, FIN, FRA, GBR,
                GRC, HRV, HUN, IRL, ITA, NLD, NOR, POL, PRT, ROU, RUS, SVK, SWE
Asia (11):      CHN, HKG, IDN, IND, JPN, KOR, MYS, PHL, SGP, THA, TWN
Africa (3):     MAR, NGA, ZAF
Middle East (1): TUR
Oceania (1):    AUS
```

### Gap Analysis Feasibility

For **105 countries** (Tier 1 + Tier 2), we can compute:
- Institutional Trust vs Governance Quality gap
- Peer comparisons (regional, income group)
- Trend direction (where multi-wave data exists)

This represents **~85% of world population**.

---

## Signal Framework

### What We Surface

| Signal Type | Description | Defensibility |
|-------------|-------------|---------------|
| **Gap** | Trust is X points above/below governance quality | Internal consistency—no external norm needed |
| **Trend** | Trust changed X points over Y years | Factual, time-series based |
| **Peer Comparison** | Below/above regional or income-group average | Comparative, prompts "why different?" |
| **Threshold** | Below levels associated with X outcomes (cited research) | Academic literature, not our judgment |

### What We Don't Do

- Prescribe "correct" trust levels
- Rank countries in league tables (encourages gaming)
- Claim causation from correlation
- Hide uncertainty or data gaps

### Example Output

> "In Country X, governance quality scores 68 (above regional average), but institutional trust is 41 (below average). This 27-point gap suggests citizens don't perceive the quality that experts measure. Potential factors: media environment, recent political events, historical legacy. Compare with Country Y which closed a similar gap through [intervention]."

---

## Source Strategy

### Integrated Sources (Current)

| Pillar | Primary | Supplementary | Excluded |
|--------|---------|---------------|----------|
| Interpersonal | WVS | EVS, GSS, ANES, CES, Barometers | ESS, OECD (0-10 scale) |
| Institutional | WVS | ANES, CES, Barometers | EVS (inconsistent), ESS |
| Governance | CPI, WGI | WJP, Freedom House, V-Dem | — |
| Media | Reuters DNR, Eurobarometer | WVS press confidence | — |

### Sources Under Evaluation

| Source | Status | Fit | Notes |
|--------|--------|-----|-------|
| Briq GPS | Evaluate | Interpersonal (suppl.) | 76 countries, 2012, Gallup-based |
| Pew Global Attitudes | Evaluate | Interpersonal + Institutional | Free with registration, fills temporal gaps |
| World Risk Poll | Evaluate | Reference | 147 countries, trust questions TBD |
| Wellcome Global Monitor | Evaluate | Science (suppl.) | 140 countries, next release 2026 |
| KPMG AI Trust Study | Evaluate | AI Trust (suppl.) | 47 countries, annual |
| Stanford HAI AI Index | Integrate | AI Trust (suppl.) | Open access, authoritative |

### Excluded Sources

| Source | Reason |
|--------|--------|
| OECD Trust Survey | 0-10 scale inflates scores vs binary; microdata redistribution prohibited |
| ESS | 0-10 scale methodologically incompatible with WVS binary |
| Edelman Trust Barometer | Redistribution restricted; dashboard only |
| Gallup World Poll | Proprietary license |

---

## Product Vision

### Layer Model

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA INFRASTRUCTURE                                       │
│  • Pillar scores by country/year                                    │
│  • API access for programmatic queries                              │
│  • Bulk download (CSV) with attribution                             │
│  • Confidence intervals and provenance                              │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2: INSIGHT ENGINE                                            │
│  • Gap analysis: "Trust exceeds/lags quality by X"                  │
│  • Peer comparison: "vs. regional/income peers"                     │
│  • Trend alerts: "significant change detected"                      │
│  • Pattern matching: "similar trajectory to Country Y"              │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3: ACTION LAYER (Future)                                     │
│  • Problem framing for builders                                     │
│  • Solution directory: who's working on what                        │
│  • Impact tracking: did interventions move the needle               │
│  • Case studies: what worked in similar contexts                    │
└─────────────────────────────────────────────────────────────────────┘
```

### User Journeys

| User | They Ask | We Provide |
|------|----------|------------|
| **Policymaker** | "Where are our trust deficits?" | Gap analysis, peer comparison, trend direction |
| **Journalist** | "What's the story?" | Surprising gaps, significant changes, outliers |
| **Researcher** | "What explains variation?" | Time series, cross-country patterns, methodology docs |
| **NGO/Civil Society** | "Where should we intervene?" | Countries with specific gap profiles |
| **Builder** | "Where's the opportunity?" | Countries with addressable trust gaps, market sizing |
| **Investor** | "What's the risk?" | Trust trends, institutional quality trajectory |

---

## Roadmap

### Phase 1: Foundation (Current - v0.7)
- [x] Four core pillars operational
- [x] 19,000+ observations, 210 countries
- [x] Regional barometers integrated
- [x] Confidence tiers implemented
- [x] Basic API and web interface

### Phase 2: Gap Analysis (v0.8)
- [ ] Compute Trust-Governance gap for Tier 1+2 countries
- [ ] Add peer comparison (regional, income group)
- [ ] Surface trend direction where data supports
- [ ] Add gap visualization to country detail pages
- [ ] Document methodology for gap computation

### Phase 3: Supplementary Indicators (v0.9)
- [ ] Integrate Science Trust (Wellcome + WVS)
- [ ] Integrate Financial Trust (WVS E069_12 banks)
- [ ] Add AI/Technology Trust reference (Stanford HAI, KPMG)
- [ ] Display in country detail (not mapped)

### Phase 4: Source Expansion (v1.0)
- [ ] Evaluate and integrate Pew Global Attitudes
- [ ] Evaluate and integrate Briq GPS
- [ ] Evaluate World Risk Poll trust questions
- [ ] Improve temporal coverage for trend analysis

### Phase 5: Builder Ecosystem (v1.1+)
- [ ] Enhanced API with gap queries
- [ ] Problem framing documentation
- [ ] Case study library: what interventions worked
- [ ] Solution directory (who's building for trust)
- [ ] Impact tracking framework

---

## Design Principles

### Data Quality Over Coverage
Better to have high-confidence analysis for 100 countries than thin coverage for 200.

### Transparency Over Authority
Show our work. Expose uncertainty. Let users interpret.

### Actionability Over Academics
Surface insights that lead to conversations and interventions, not just papers.

### Open Over Proprietary
Only use sources with redistribution rights. Make our data available.

### Humility Over Prescription
We identify patterns, not prescribe solutions. Context matters.

---

## Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Countries with gap analysis | 100+ | Proves methodology works at scale |
| API usage (monthly) | Track | Builder adoption |
| Cited in policy/media | Track | Real-world influence |
| Data freshness | <3 years for Tier 1 | Relevance |
| Methodology transparency | Full documentation | Credibility |

---

## Known Data Gaps

### Financial Trust (Banks)

| Issue | Detail |
|-------|--------|
| **G7 freshness** | USA, Germany, France have 2017-2018 data (WVS Wave 7 timing) |
| **Eurobarometer** | Standard QA6 battery excludes banks—only covers government, parliament, media |
| **No annual source** | No open annual survey for bank trust globally |

**Mitigation:**
- Current: WVS E069_12 covers 104 countries (1990-2023)
- Future: EQLS 2026 will provide EU27 bank trust
- Evaluated: ECB Consumer Expectations Survey — excluded (0-10 scale, central bank focus ≠ commercial banks)

### Interpersonal Trust (Recent)

| Issue | Detail |
|-------|--------|
| **WVS Wave 8** | Not yet released—Wave 7 ended 2022 |
| **Regional barometers** | Fill gaps but with methodological differences |

---

## Open Questions

1. **Science Trust Pillar**: Promote from supplementary to core pillar? Wellcome has global coverage but triennial updates.

2. **Financial Trust Structure**: Keep as supplementary indicator, or expand Institutional to include sub-pillars (political, financial, judicial)?

3. **Gap Computation**: Use raw difference, z-scores, or regression residuals? Each has tradeoffs.

4. **Builder Layer**: Build ourselves or partner with existing platforms?

5. **Podcast Integration**: How to connect Trust Revolution conversations to specific data insights?

6. **ECB Trust Data**: *(Evaluated)* ECB Consumer Expectations Survey provides monthly Eurozone data (11 countries, since April 2020). However:
   - 0-10 scale incompatible with binary methodology
   - Measures central bank trust, not commercial bank trust
   - Limited to Eurozone (doesn't solve G7 freshness gap)

   **Decision**: Document as reference data, exclude from financial trust supplementary. See DATA_SOURCES.md for details.

---

## Related Documents

- [METHODOLOGY.md](./METHODOLOGY.md) - Current pillar definitions and scoring
- [DATA_SOURCES.md](./DATA_SOURCES.md) - Source documentation
- [AGENTS.md](../AGENTS.md) - Agent workflows and ETL processes
- [DATA_SOURCES_ROADMAP.md](./DATA_SOURCES_ROADMAP.md) - Source integration status

---

**Document History**
- v0.1 (Jan 2025): Initial draft based on strategic planning session
