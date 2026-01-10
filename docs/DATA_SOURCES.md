# Data Sources

This document describes all data sources used in Trust Atlas, including access methods, licensing, coverage, and data quality considerations.

> **Important:** As of methodology v0.7.0, WVS-family sources (WVS, EVS, GSS, ANES, CES) take precedence for survey pillars. Regional barometers (Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer) are now integrated as supplementary sources, filling coverage gaps where WVS-family data doesn't exist. ESS remains excluded (0-10 scale incompatible). EVS is included for interpersonal but excluded from institutional (inconsistent variable coverage).

## Source Selection Criteria

Trust Atlas uses only **open-access** data sources. This means:

1. **Freely Available:** No paid subscription or purchase required
2. **Accessible:** Via API, bulk download, or public URL (some require free registration)
3. **Redistributable:** License permits derived works
4. **Documented:** Clear methodology and variable definitions
5. **Regularly Updated:** Active maintenance and publication

**Note:** Some sources (WVS, ESS, regional barometers) require free registration before downloading data. This is acceptable as long as there is no paywall.

## Approved Sources

### 1. World Values Survey (WVS)

**Overview:**
The World Values Survey is a global research project that explores people's values and beliefs, including trust in other people and institutions.

| Attribute | Value |
|-----------|-------|
| **Organization** | World Values Survey Association |
| **Coverage** | Global (uneven, ~100 countries per wave) |
| **Cadence** | Wave-based (~5 years between waves) |
| **Format** | CSV, SPSS, Stata (bulk download) |
| **License** | Custom terms (allows academic/non-commercial use) |
| **URL** | https://www.worldvaluessurvey.org/ |

**Key Variables:**

| Variable | Question | Trust Type |
|----------|----------|------------|
| Q57 | "Most people can be trusted" vs "Need to be very careful" | Interpersonal |
| Q71 | Confidence in the government | Institutional |
| Q72 | Confidence in parliament | Institutional |
| Q73 | Confidence in political parties | Institutional |
| Q76 | Confidence in the civil service | Institutional |

**Processing Notes:**
- Responses are converted to percent who trust
- Q57: Code 1 = trust, Code 2 = don't trust
- Q71-76: Codes 1-2 = trust ("great deal" + "quite a lot"), Codes 3-4 = don't trust
- Sample sizes typically 1,000-3,000 per country

**Data Access:**
1. Register at worldvaluessurvey.org
2. Download time-series dataset (all waves)
3. Place in `data/raw/wvs/`
4. Run `make etl-wvs YEAR=2022`

---

### 2. European Social Survey (ESS)

> **Note:** ESS data is ingested but **excluded from pillar calculations** as of v0.3.0 due to scale differences (0-10 vs binary).

**Overview:**
The European Social Survey measures attitudes, beliefs, and behavior patterns across European countries.

| Attribute | Value |
|-----------|-------|
| **Organization** | ESS ERIC |
| **Coverage** | Europe (~30 countries) |
| **Cadence** | Biennial |
| **Format** | CSV, SPSS, Stata (API + download) |
| **License** | CC BY-NC-SA 4.0 |
| **URL** | https://www.europeansocialsurvey.org/ |

**Key Variables:**

| Variable | Question | Scale | Trust Type |
|----------|----------|-------|------------|
| ppltrst | "Most people can be trusted" | 0-10 | Interpersonal |
| pplfair | "Most people try to be fair" | 0-10 | Interpersonal |
| pplhlp | "Most people try to be helpful" | 0-10 | Interpersonal |
| trstprl | Trust in parliament | 0-10 | Institutional |
| trstplt | Trust in politicians | 0-10 | Institutional |
| trstlgl | Trust in legal system | 0-10 | Institutional |

**Processing Notes:**
- 0-10 scale converted to 0-100 by multiplying by 10
- Interpersonal trust uses mean of ppltrst, pplfair, pplhlp
- Institutional trust uses mean of trstprl, trstplt, trstlgl
- Sample sizes typically 1,500-2,500 per country

**Data Access:**
1. API endpoint: `https://ess-search.nsd.no/`
2. Or download rounds from ESS website
3. Place in `data/raw/ess/`
4. Run `make etl-ess YEAR=2021`

---

### 3. OECD Trust Indicators

> **Note:** OECD data is ingested but **excluded from pillar calculations** as of v0.3.0. Used for reference only.

**Overview:**
OECD's Government at a Glance includes trust in government metrics for OECD member countries.

| Attribute | Value |
|-----------|-------|
| **Organization** | Organisation for Economic Co-operation and Development |
| **Coverage** | OECD members (~38 countries) |
| **Cadence** | Irregular (typically annual) |
| **Format** | CSV, XML (OECD.Stat API) |
| **License** | OECD Terms of Use |
| **URL** | https://stats.oecd.org/ |

**Key Variables:**

| Variable | Description | Trust Type |
|----------|-------------|------------|
| GOV_TRUST | Trust in national government | Institutional |

**Processing Notes:**
- Data already in percentage format
- High-quality, standardized methodology
- Limited to OECD members

**Data Access:**
1. Query OECD.Stat API
2. Dataset: `GOV`
3. Run `make etl-oecd YEAR=2023`

---

### 4. Transparency International CPI

**Overview:**
The Corruption Perceptions Index ranks countries by perceived levels of public sector corruption.

| Attribute | Value |
|-----------|-------|
| **Organization** | Transparency International |
| **Coverage** | Global (~180 countries) |
| **Cadence** | Annual |
| **Format** | Excel, CSV |
| **License** | CC BY 4.0 (datasets), CC BY-ND 4.0 (reports/content) |
| **URL** | https://www.transparency.org/cpi |

**Key Variables:**

| Variable | Description | Scale |
|----------|-------------|-------|
| CPI Score | Corruption Perceptions Index | 0-100 |

**Processing Notes:**
- Already on 0-100 scale (100 = very clean)
- Aggregates 13+ expert and survey sources
- High global coverage
- CPI datasets are CC BY 4.0 (allows modification); reports/content are CC BY-ND 4.0

**Data Access:**
1. Download from transparency.org or DataHub fallback
2. Place in `data/raw/cpi/{year}/`
3. Run `make etl-cpi YEAR=2024`

---

### 5. World Bank WGI

**Overview:**
The Worldwide Governance Indicators capture six dimensions of governance quality.

| Attribute | Value |
|-----------|-------|
| **Organization** | World Bank |
| **Coverage** | Global (~200 countries) |
| **Cadence** | Annual |
| **Format** | JSON (API), CSV, Excel |
| **License** | CC BY 4.0 |
| **URL** | https://info.worldbank.org/governance/wgi/ |

**Key Variables:**

| Variable | Description | Used |
|----------|-------------|------|
| CC.EST | Control of Corruption | Yes |
| GE.EST | Government Effectiveness | Yes |
| RL.EST | Rule of Law | Yes |
| VA.EST | Voice and Accountability | No |
| PS.EST | Political Stability | No |
| RQ.EST | Regulatory Quality | No |

**Processing Notes:**
- Original scale: -2.5 to +2.5
- Normalized: `((x + 2.5) / 5) * 100`
- GTI uses average of CC, GE, RL (most relevant to trust/integrity)
- Very high global coverage

**Data Access:**
1. World Bank API: `https://api.worldbank.org/v2/`
2. Run `make etl-wgi YEAR=2023`

---

### 6. World Justice Project Rule of Law Index (WJP)

**Overview:**
The WJP Rule of Law Index measures how rule of law is experienced and perceived across 142 countries.

| Attribute | Value |
|-----------|-------|
| **Organization** | World Justice Project |
| **Coverage** | Global (~142 countries) |
| **Cadence** | Annual |
| **Format** | Excel, CSV |
| **License** | CC BY-NC-ND 4.0 |
| **URL** | https://worldjusticeproject.org/rule-of-law-index |

**Key Variables:**

| Variable | Description | Scale |
|----------|-------------|-------|
| Overall Score | Rule of Law Index | 0-1 (rescaled to 0-100) |
| Factor 2 | Absence of Corruption | 0-1 (rescaled to 0-100) |

**Processing Notes:**
- 0-1 scale multiplied by 100 for normalization
- Both overall score and corruption sub-index used separately
- High methodological rigor with standardized surveys

**Data Access:**
1. Download from worldjusticeproject.org
2. Place in `data/raw/wjp/`
3. Run `make etl-wjp YEAR=2024`

---

### 7. Freedom House

**Overview:**
Freedom House scores political rights and civil liberties globally.

| Attribute | Value |
|-----------|-------|
| **Organization** | Freedom House |
| **Coverage** | Global (~195 countries) |
| **Cadence** | Annual |
| **Format** | Excel, CSV |
| **License** | CC BY 4.0 |
| **URL** | https://freedomhouse.org/report/freedom-world |

**Key Variables:**

| Variable | Description | Scale |
|----------|-------------|-------|
| Total Score | Freedom in the World | 0-100 |

**Processing Notes:**
- Already on 0-100 scale (100 = most free)
- Combines political rights (0-40) and civil liberties (0-60)
- Used as 10% weight in governance pillar

**Data Access:**
1. Download from freedomhouse.org
2. Place in `data/raw/freedom_house/`
3. Run `make etl-fh YEAR=2024`

---

### 8. V-Dem (Varieties of Democracy)

**Overview:**
V-Dem provides detailed democracy indicators based on expert assessments.

| Attribute | Value |
|-----------|-------|
| **Organization** | V-Dem Institute, University of Gothenburg |
| **Coverage** | Global (~180 countries) |
| **Cadence** | Annual |
| **Format** | CSV, R, Stata |
| **License** | CC BY-SA 4.0 |
| **URL** | https://www.v-dem.net/ |

**Key Variables:**

| Variable | Description | Scale |
|----------|-------------|-------|
| v2x_corr | Political corruption index | 0-1 (inverted and rescaled) |
| v2x_rule | Rule of law index | 0-1 (rescaled to 0-100) |

**Processing Notes:**
- 0-1 scale multiplied by 100 for normalization
- Corruption index inverted (1 - value) so higher = less corrupt
- Long historical coverage (back to 1900 for some indicators)
- Used as 10% weight in governance pillar

**Data Access:**
1. Download from v-dem.net
2. Place in `data/raw/vdem/`
3. Run `make etl-vdem YEAR=2024`

---

### 9. European Values Study (EVS)

> **Note:** EVS is used for **interpersonal trust only** as of v0.4.0. EVS uses the same A165 question and binary scale as WVS. Excluded from institutional trust due to inconsistent variable coverage across country/years.

**Overview:**
The European Values Study is a large-scale, cross-national survey on basic human values in Europe.

| Attribute | Value |
|-----------|-------|
| **Organization** | European Values Study Foundation |
| **Coverage** | Europe (~47 countries) |
| **Cadence** | Wave-based (~9 years between waves) |
| **Format** | CSV, SPSS, Stata (bulk download) |
| **License** | CC BY-NC-SA 4.0 |
| **URL** | https://europeanvaluesstudy.eu/ |

**Key Variables:**

| Variable | Question | Trust Type |
|----------|----------|------------|
| A165 | "Most people can be trusted" vs "Need to be very careful" | Interpersonal |

**Processing Notes:**
- Uses identical A165 variable coding as WVS
- WVS takes precedence when both have data for same country/year
- EVS supplements coverage for European country/years not in WVS
- Institutional trust variables excluded (E069_11 inconsistent across waves)

**Data Access:**
1. Register at europeanvaluesstudy.eu
2. Download longitudinal dataset
3. Place in `data/raw/evs/`
4. Run `make etl-evs`

---

### 10. General Social Survey (GSS)

**Overview:**
The GSS has tracked American public opinion since 1972, including trust measures.

| Attribute | Value |
|-----------|-------|
| **Organization** | NORC at University of Chicago |
| **Coverage** | USA only |
| **Cadence** | Annual (with gaps) |
| **Format** | Stata (.dta), SPSS |
| **License** | Public domain |
| **URL** | https://gss.norc.org/ |

**Key Variables:**

| Variable | Question | Trust Type |
|----------|----------|------------|
| TRUST | "Can most people be trusted?" | Interpersonal |
| CONTRUST | Trust in Congress | Institutional |
| CONPRESS | Trust in press | Institutional |
| CONFINAN | Trust in financial institutions | Institutional |

**Processing Notes:**
- Long time series (1972-present)
- Enables USA historical analysis
- Requires manual download due to file format

**Data Access:**
1. Download cumulative file from gss.norc.org
2. Place in `data/raw/gss/`
3. Run `make etl-gss`

---

### 11. American National Election Studies (ANES)

**Overview:**
ANES has tracked political attitudes in the USA since 1948.

| Attribute | Value |
|-----------|-------|
| **Organization** | University of Michigan |
| **Coverage** | USA only |
| **Cadence** | Election years (biennial/quadrennial) |
| **Format** | Stata (.dta), SPSS |
| **License** | CC0 (public domain) |
| **URL** | https://electionstudies.org/ |

**Key Variables:**

| Variable | Question | Trust Type |
|----------|----------|------------|
| V201377 | Trust in people | Interpersonal |
| V201233 | Trust in federal government | Institutional |
| V201378 | Trust in other political party | Partisan |

**Processing Notes:**
- Longest US political attitude time series
- Unique partisan trust measures
- Election-year focused

**Data Access:**
1. Download from electionstudies.org
2. Place in `data/raw/anes/`

---

### 12. Regional Barometers

> **Note:** As of v0.7.0, regional barometers are **integrated as supplementary sources** for interpersonal and institutional trust. They fill coverage gaps where WVS-family sources don't exist. WVS takes precedence when both sources have data.

#### Afrobarometer

| Attribute | Value |
|-----------|-------|
| **Coverage** | ~35 African countries |
| **Cadence** | Irregular (~3 year rounds) |
| **License** | Free for non-commercial use |
| **URL** | https://www.afrobarometer.org/ |

#### Arab Barometer

| Attribute | Value |
|-----------|-------|
| **Coverage** | ~15 Arab countries |
| **Cadence** | Irregular |
| **License** | Free for non-commercial use |
| **URL** | https://www.arabbarometer.org/ |

#### Asian Barometer

| Attribute | Value |
|-----------|-------|
| **Coverage** | ~18 Asian countries |
| **Cadence** | Wave-based |
| **License** | Free with registration |
| **URL** | https://www.asianbarometer.org/ |

#### Latinobarómetro

| Attribute | Value |
|-----------|-------|
| **Coverage** | ~18 Latin American countries |
| **Cadence** | Annual |
| **License** | Free with registration |
| **URL** | https://www.latinobarometro.org/ |

**Processing Notes:**
- Regional barometers extend survey coverage beyond WVS
- Similar trust questions; ETL jobs normalize variable names and scales across waves
- Requires manual download and registration
- **Integrated as supplementary sources** (v0.7.0) with source priority: WVS > EVS > GSS/ANES > Barometers

---

## Prohibited Sources

The following sources are **explicitly excluded** due to licensing restrictions:

### Gallup World Poll

| Reason | Detail |
|--------|--------|
| **License** | Proprietary, requires subscription |
| **Cost** | ~$50,000+/year for full access |
| **Redistribution** | Not permitted |

Despite excellent global coverage and methodology, the proprietary license makes it unsuitable for an open data project.

---

## Pillar Source Summary

As of methodology v0.7.0:

| Pillar | Primary Sources | Supplementary Sources | Excluded |
|--------|-----------------|----------------------|----------|
| Interpersonal | WVS, EVS, GSS, ANES, CES | Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer | ESS (0-10 scale) |
| Institutional | WVS, ANES, CES | Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer | EVS, ESS, OECD |
| Media | Reuters DNR (40%), Eurobarometer (40%), WVS (20%) | — | — |
| Governance | CPI (20%), WGI (20%), WJP (20%), WJP-Corruption (20%), Freedom House (10%), V-Dem (10%) | — | — |

Primary sources take precedence; supplementary sources fill gaps where primary data doesn't exist.

---

## Supplementary Indicators

Supplementary indicators track important trust dimensions that don't fit core pillars. They're displayed in country detail views but not mapped.

### Financial Trust (Banks)

**Source:** WVS E069_12 (Confidence in Banks)

| Attribute | Value |
|-----------|-------|
| **Coverage** | 104 countries |
| **Years** | 1990-2023 |
| **Observations** | 280 |
| **Scale** | 4-point Likert → % confident |
| **Status** | Supplementary indicator |

**Processing:** Calculated as % expressing "a great deal" or "quite a lot" of confidence in banks. Same methodology as institutional trust variables.

**Known Gaps:**

| Region | Issue |
|--------|-------|
| **G7 countries** | Most recent data is 2017-2018 (WVS Wave 7 timing) |
| **EU coverage** | Eurobarometer QA6 battery excludes banks |
| **Annual updates** | No annual open source for bank trust |

**Potential Future Sources:**

| Source | Status | Notes |
|--------|--------|-------|
| EQLS (Eurofound) | Wait for 2026 | EU27 coverage, includes bank trust |
| DNB Trust Survey | Netherlands only | Annual, single country |

---

### Central Bank Trust (ECB Consumer Expectations Survey)

> **Status:** Under evaluation. Methodologically distinct from commercial bank trust (WVS E069_12).

**Source:** ECB Consumer Expectations Survey (CES)

| Attribute | Value |
|-----------|-------|
| **Organization** | European Central Bank |
| **Coverage** | 11 Eurozone countries |
| **Cadence** | Monthly (since April 2020) |
| **Format** | CSV microdata |
| **License** | Scientific/non-commercial use only |
| **URL** | https://www.ecb.europa.eu/stats/ecb_surveys/consumer_exp_survey/ |

**Trust Variables:**

| Variable | Question | Scale |
|----------|----------|-------|
| Trust in ECB | "How much do you trust the ECB?" | 0-10 |
| Trust in national central bank | "How much do you trust [national CB]?" | 0-10 |
| Trust in European institutions | EU Parliament, Commission, UN | 0-10 |

**Country Coverage:**

| Phase | Countries | Since |
|-------|-----------|-------|
| Initial | DEU, FRA, ITA, ESP, NLD, BEL | April 2020 |
| Expansion | AUT, FIN, PRT, GRC, IRL | 2022 |

**Methodological Notes:**
- **Scale incompatibility**: 0-10 scale systematically differs from WVS binary approach
- **Different construct**: Central bank trust ≠ commercial bank trust
- **Panel structure**: Tracks same respondents over time (unlike Eurobarometer)
- **Monthly frequency**: Enables granular temporal analysis
- **Central Banking Module**: Trust questions in August annual module (first released April 2025)

**Integration Assessment:**

| Factor | Assessment |
|--------|------------|
| Scale | 0-10 (incompatible with binary methodology) |
| Coverage | 11 countries (Eurozone only) |
| Freshness | Monthly updates (excellent) |
| Access | Free CSV download |
| Construct | Central bank trust (distinct from commercial bank) |

**Recommendation:** Load as reference data, excluded from financial trust supplementary indicator. Potentially valuable for Eurozone-specific analysis of central bank trust, but methodologically distinct from commercial bank confidence measured by WVS E069_12.

---

### Edelman Trust Barometer

| Reason | Detail |
|--------|--------|
| **License** | Restricted redistribution |
| **Access** | Summary reports only (not microdata) |
| **Methodology** | Not fully documented |

Edelman provides aggregate results but not country-level data suitable for GTI calculation.

---

## Source Comparison

### Coverage Matrix

| Source | Global | Europe | USA | Africa | Asia | MENA | LatAm |
|--------|--------|--------|-----|--------|------|------|-------|
| WVS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| EVS | - | ✓ | - | - | - | - | - |
| ESS | - | ✓ | - | - | - | - | - |
| OECD | ✓* | ✓ | ✓ | - | ✓* | - | ✓* |
| CPI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WGI | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WJP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FH | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| V-Dem | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GSS | - | - | ✓ | - | - | - | - |
| Afro | - | - | - | ✓ | - | - | - |
| Arab | - | - | - | - | - | ✓ | - |
| Asian | - | - | - | - | ✓ | - | - |
| Latino | - | - | - | - | - | - | ✓ |

*OECD members only

### Methodology Comparison

| Source | Type | Sample | Question Format |
|--------|------|--------|-----------------|
| WVS | Survey | 1,000-3,000 | 2-point Likert |
| EVS | Survey | 1,000-2,000 | 2-point Likert |
| ESS | Survey | 1,500-2,500 | 11-point scale |
| OECD | Survey | Varies | Percentage |
| CPI | Expert | N/A | Aggregated score |
| WGI | Expert | N/A | Aggregated estimate |
| WJP | Expert+Survey | ~1,000 | Aggregated score |
| FH | Expert | N/A | Aggregated score |
| V-Dem | Expert | N/A | Aggregated estimate |
| GSS | Survey | ~2,000 | Mixed formats |

### Update Frequency

| Source | Typical Delay | Latest Available |
|--------|--------------|------------------|
| CPI | 2 months | 2024 |
| WGI | 6 months | 2023 |
| WJP | 3-4 months | 2024 |
| FH | 2-3 months | 2024 |
| V-Dem | 3-4 months | 2024 |
| OECD | 3-6 months | Varies |
| WVS | 1-2 years | Wave 7 (2017-2022) |
| EVS | 1-2 years | Wave 5 (2017-2021) |
| ESS | 6-12 months | Round 10 (2020-2022) |

---

## Data Quality Considerations

### Source Reliability

| Source | Reliability | Notes |
|--------|-------------|-------|
| CPI | High | Aggregates 13+ sources, peer-reviewed |
| WGI | High | World Bank methodology, well-documented |
| WJP | High | Rigorous methodology, combines expert and survey |
| FH | High | Long track record, consistent methodology |
| V-Dem | High | Academic project, extensive expert coding |
| WVS | Medium-High | Academic oversight, some wave inconsistencies |
| EVS | Medium-High | Same methodology as WVS, European focus |
| ESS | High | Rigorous methodology, European focus |
| OECD | High | Standardized across members |
| GSS | High | Long track record, academic standard |
| Barometers | Medium | Varies by organization |

### Known Issues

1. **WVS Wave Breaks:** Question wording changed between waves
2. **ESS Coverage Gaps:** Some countries skip rounds
3. **CPI Methodology Changes:** Pre-2012 scores not comparable
4. **OECD Selection Bias:** Only wealthier countries included
5. **Barometer Timing:** Survey periods vary by country

### Handling Missing Data

The GTI handles data gaps through:

1. **Graceful Degradation:** Two-pillar or proxy-only calculations
2. **Confidence Tiering:** Lower confidence for incomplete data
3. **Regional Barometers:** Fill WVS/ESS gaps
4. **Interpolation:** Avoided (only uses actual observations)

---

## License Summary

| Source | License | Commercial Use | Modification | Attribution |
|--------|---------|----------------|--------------|-------------|
| WVS | Custom | Non-commercial | Yes | Required |
| ESS | CC BY-NC-SA 4.0 | Non-commercial | Yes (ShareAlike) | Required |
| OECD | OECD Terms | Yes | Yes | Required |
| CPI | CC BY 4.0 (data) | Yes | Yes | Required |
| WGI | CC BY 4.0 | Yes | Yes | Required |
| GSS | Public Domain | Yes | Yes | Encouraged |
| ANES | CC0 | Yes | Yes | No |

---

## Adding New Sources

When evaluating a new source:

1. **Check License:** Must permit redistribution
2. **Assess Coverage:** Does it fill gaps?
3. **Verify Methodology:** Is it documented and rigorous?
4. **Test Access:** Can data be downloaded programmatically?
5. **Map Variables:** Identify trust-related questions
6. **Define Normalization:** How to convert to 0-100 scale

See [ETL_PIPELINE.md](./ETL_PIPELINE.md) for implementation details.

---

## Contextual Data Sources

These are **not trust measures**—they provide environmental context for correlation analysis.

### DataReportal (Digital Penetration)

**Overview:**
Social media penetration data from We Are Social + Meltwater partnership. Used for correlation analysis with trust pillars, not as a trust measure.

| Attribute | Value |
|-----------|-------|
| **Organization** | We Are Social + Meltwater |
| **Coverage** | Global (~170 countries) |
| **Cadence** | Annual |
| **Format** | CSV (via World Population Review) |
| **License** | Public Statistics |
| **URL** | https://datareportal.com/ |

**Indicator:**
- `social_media_penetration` - Platform-reported user identities as % of population

**Known Limitations:**
- Based on advertising reach, not surveys
- May include duplicate/bot accounts
- Figures not directly comparable across years (methodology changes)
- Can exceed 100% for small territories (excluded)

**Data Access:**
1. Download from World Population Review
2. Place CSV in `data/raw/datareportal/`
3. Run `python -m etl.jobs.wpr_social_media --csv <path>`

**API Endpoint:**
```
GET /indicators/digital?iso3=FIN,USA&year=2024
```

---

## Related Documentation

- [METHODOLOGY.md](./METHODOLOGY.md) - How sources are weighted
- [ETL_PIPELINE.md](./ETL_PIPELINE.md) - Data processing
- [ASSUMPTIONS.md](./ASSUMPTIONS.md) - Design decisions
