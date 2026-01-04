# AGENTS.md — Trust Atlas (Open Data)

> Owner: Trust Atlas — An open-source project from Trust Revolution
> Status: Draft v0.7
> Scope: Agent workflows for data ingestion, normalization, and API/UI support of Trust Atlas, built from programmatically accessible sources.

---

## 1) Mission & Constraints

**Mission:** Produce credible, transparent, and updateable trust measurements across four independent pillars (Interpersonal, Institutional, Media, Governance) using *only* open or programmatically accessible data sources.

**Key Design Decision:** We do **not** combine pillars into a composite index. Survey data (~5 year cycles) and governance data (annual) have different rhythms. Combining them creates artificial volatility. Individual pillars tell clearer stories.

**Out of Scope:** Proprietary sources requiring paid licenses (e.g., Gallup World Poll) and datasets without redistribution rights (e.g., full Edelman microdata). Where helpful, we may surface links or metadata but do not store restricted raw values.

**Quality Values:** Transparency, reproducibility, provenance, cautious interpolation, clear confidence flags.

---

## 2) Data Sources & Access Modes

> Agents must only use sources with documented public access (API or bulk download) and record access method per source.

### WVS-Family Sources (Primary for Survey Pillars)

**Interpersonal & Institutional Trust — Primary Sources:**
- **World Values Survey (WVS):** 108 countries, 1981-2023. Bulk CSV/SPSS by wave (free registration).
- **European Values Study (EVS):** 47 countries, 1981-2021. Same A165 question as WVS (interpersonal only).
- **General Social Survey (GSS):** USA only, 1972-2024. Public NORC data.
- **American National Election Studies (ANES):** USA only, 1958-2024. Public domain.
- **Canadian Election Study (CES):** Canada only, 2008-2021. Open access.

**Supplementary Sources (Fill Coverage Gaps):**
- **Afrobarometer:** 39 countries, 2015-2023. Fills gaps in Africa.
- **Latinobarometer:** 18 countries, 1996-2024. Fills gaps in Latin America.
- **Asian Barometer:** 15 countries, 2001-2024. Fills gaps in Asia.
- **Arab Barometer:** 12 countries, 2006-2023. Fills gaps in MENA.

**Source Priority:** WVS > EVS > GSS/ANES/CES > Regional Barometers. WVS takes precedence when multiple sources exist for the same country-year. ETL normalizes variable names and scales across barometer waves.

### Excluded Survey Sources (Scale Incompatibility)

The following sources are loaded but excluded from survey pillar calculations:
- **European Social Survey (ESS):** 39 countries, 2002-2023. 0-10 scale incompatible with binary.
- **OECD Trust Survey:** 32 OECD countries, 2021-2023. Different institutional definitions.
- **EU-SILC (Eurostat):** 37 European countries, 2013-2024. 0-10 scale.
- **LAPOP AmericasBarometer:** 8+ countries, 2006-2023. (Planned for integration)

**Governance Indices (Used for Governance Pillar):**
Weighted average: CPI (20%), WGI (20%), WJP (20%), WJP-Corruption (20%), Freedom House (10%), V-Dem (10%).
- **Transparency International CPI:** 180+ countries, 2012-2024. Annual CSV.
- **World Bank WGI:** 206 countries, 2008-2023. API + bulk CSV.
- **World Justice Project (WJP):** 142 countries, 2012-2024. Rule of Law Index.
- **Freedom House:** 189 countries, 2013-2024. Freedom in the World scores.
- **V-Dem:** 176 countries, 2000-2024. Varieties of Democracy indices.

**Media Trust Sources (Used for Media Pillar):**
Weighted average: Reuters DNR (40%), Eurobarometer (40%), WVS (20%).
- **Reuters Digital News Report:** 47 countries, 2015-2025. Annual online survey.
- **Eurobarometer:** 32 EU countries, 2024. Trust in institutions: Media.
- **World Values Survey:** 100+ countries, 1981-2023. Press confidence (E069_07/08).

### Prohibited/Conditional
- **Gallup World Poll:** proprietary; do not store/use unless explicit license is obtained.
- **Edelman Trust Barometer:** restricted redistribution; may store metadata/links only.

---

## 3) Conceptual Model

Trust Atlas measures trust across four **independent** pillars (not combined into a composite):

1. **Interpersonal Trust** — % agreeing *"Most people can be trusted."* (WVS-family + barometers)
2. **Institutional Trust** — % expressing confidence in national government (WVS-family + barometers)
3. **Media Trust** — % trusting news media (Reuters DNR, Eurobarometer, WVS)
4. **Governance Quality** — institutional quality/corruption measures (CPI, WGI, WJP, Freedom House, V-Dem)

All inputs are normalized to a 0–100 scale. Each pillar is computed per country-year with data provenance and confidence flags.

---

## 4) Normalization Rules (0–100)

- **Percent-based survey items** (e.g., WVS trust-in-people): `score = raw_percent` (0–100).
- **OECD/ESS institutional trust** (if percentage or 0–10 scale):
  - If 0–10: `score = raw * 10`.
  - If categorical, map to % trusting per instrument’s codebook.
- **TI CPI** (0–100, where higher = *less* corruption): use directly as a *positive* governance signal.
- **WGI** (−2.5…+2.5): rescale via `((raw + 2.5) / 5) * 100` for each selected dimension; if using both Rule of Law and Government Effectiveness, average them.

**Governance Pillar (GOV):** Weighted average of available sources: CPI (20%), WGI (20%), WJP (20%), WJP-Corruption (20%), Freedom House (10%), V-Dem (10%). Missing sources have weight redistributed.

---

## 5) Pillar Display (No Composite Index)

Each pillar is displayed independently:
- `INTER` = Interpersonal Trust (0–100)
- `INST` = Institutional Trust (0–100)
- `MEDIA` = Media Trust (0–100)
- `GOV` = Governance Quality (0–100)

**Why no composite?**
1. Survey data (WVS) is collected every 5-7 years; governance data is annual
2. Combining creates artificial volatility when one source updates
3. Different constructs: "Do you trust your neighbor?" vs "Is the government corrupt?"
4. The "trust paradox" — some societies show high interpersonal trust despite low governance scores
5. Separate pillars let researchers see nuances instead of hiding them in a single number

Legacy GTI calculations are deprecated. The `gti` column in `country_year` is no longer computed.

---

## 6) Time Handling & Confidence Decay

- **Survey waves:** assign to observed year. For intervening years, carry last value forward up to 3 years with no penalty. Beyond 3 years, apply confidence decay to the *pillar* (not the value) at −3% per elapsed year for the confidence metric only.
- **Annual indices (CPI, WGI, OECD where applicable):** use directly; no decay while current.

**Confidence tiers per country-year:**
- `A` = At least one *current* interpersonal or institutional survey value (≤3y old) **and** current governance proxy.
- `B` = Survey value older than 3y *or* only one survey pillar present, plus governance proxy.
- `C` = Governance proxy only (no valid survey items within 7y).

Store `confidence_score` (0–1) computed from recency and completeness; display tier alongside numeric score.

---

## 7) Data Schema (Postgres)

**countries**
- `iso3` (pk), `iso2`, `name`, `region`, `income_group`, `geom` (PostGIS)

**observations**
- `id` (pk), `iso3`, `year`, `source`, `trust_type` (`interpersonal|institutional|media|governance|cpi|wgi|derived`),
- `raw_value`, `raw_unit`, `score_0_100`, `sample_n`, `method_notes`, `source_url`, `ingested_at`

**country_year** (materialized view)
- `iso3`, `year`, `interpersonal`, `institutional`, `media`, `governance`, `confidence_score`, `confidence_tier`, `sources_used` (jsonb), `version`

**source_metadata**
- `source`, `description`, `cadence`, `coverage`, `license`, `access_mode`, `weighting_notes`

**data_quality_flags**
- `id` (pk), `observation_id` (fk → observations), `flag_type`, `severity` (`warning`|`error`)
- `details` (jsonb), `detected_at`, `resolved_at`, `resolution_notes`

Indexes: `(iso3, year)`, `(trust_type, year)`, GIN on `sources_used`, `(observation_id, flag_type)` unique, `(resolved_at)` partial where NULL.

---

## 8) API Contract (for UI & external users)

Base URL: `https://api.trustatlas.org`

- `GET /trends/global?pillar=interpersonal|institutional|governance` → latest scores by pillar
- `GET /country/{iso3}` → { series: pillars by year, sources_used[], confidence[] }
- `GET /trends/regions` → regional averages and breakdowns
- `GET /methodology` → current normalization/weights (versioned JSON/YAML)

**Headers/Caching:** `s-maxage=86400, stale-while-revalidate=604800`.

---

## 9) ETL Agent Responsibilities

**ETL::Discover**
- Poll source endpoints/pages for new releases (CPI, WGI annually; ESS/OECD per release; WVS/barometers per wave).
- Emit events to the ingest queue with `source`, `release_id`, `url`, `license`.

**ETL::Ingest**
- Download CSV/Excel/SPSS; log checksum + license text.
- Parse country names → ISO3 using a controlled mapping (store exceptions).
- Validate schema; coerce scales to canonical units.

**ETL::Transform**
- Normalize to 0–100 per rules (Section 4).
- Map variables to `interpersonal` / `institutional` categories using source-specific codebooks.
- Compute per-country pillar values and governance proxy.

**ETL::Assemble**
- Build `country_year` rows with pillar values.
- Compute confidence tier/score (Section 6).
- Upsert into DB; refresh materialized views.

**ETL::Publish**
- Trigger tile rebuild for new years (tippecanoe → MVT) and purge CDN cache.
- Post release notes with source versions and diffs (see Section 12).

---

## 10) Frontend Agent Responsibilities

- Render choropleth via vector tiles (`trust_core_{year}.mvt`).
- Provide filter modes: Core (GTI), Interpersonal, Institutional, CPI, WGI.
- Country panel shows latest values with provenance (source + year + link) and confidence tier.
- Comparison drawer for up to 4 countries.
- Accessibility: keyboard selection of countries, colorblind-safe palettes, high-contrast toggle.

---

## 11) QA & Data Ethics

- **Provenance:** every displayed value must show source + year in tooltips.
- **Licensing:** store and expose license strings; block export if license forbids redistribution.
- **Transparency:** publish methodology JSON used to compute each GTI release.

### Data Quality Sweep (`etl/data_quality/`)

Automated detection of data quality issues via `make sweep`:

| Check | Detects | Threshold |
|-------|---------|-----------|
| `statistical_outliers` | Scores outside expected ranges | Binary interpersonal >60%/<10%, Institutional >95%/<5% |
| `yoy_anomalies` | Sudden year-over-year changes | >25 points between consecutive years (≤5y apart) |
| `cross_source` | Sources disagreeing on same country/year | >30 point difference for same trust_type |
| `methodology_mismatch` | Scores outside expected range for methodology | Binary >55%, 4-point >80%, 0-10scale >70% |
| `sample_size` | Unreliable or missing sample sizes | n<100, n>100k, or NULL for survey data |
| `coverage_gaps` | Sources with suspiciously few countries | <5 countries (may indicate ETL bug) |
| `pillar_instability` | Pillar score jumps or source composition changes | >15pt change (warning), >25pt (error), or sources changed |

**Flag lifecycle:**
1. Sweep detects issue → creates flag in `data_quality_flags` with severity (`warning`/`error`)
2. Human reviews flag → investigates root cause
3. Fix applied (ETL correction, exclusion, or accepted as valid) → flag marked `resolved_at` with notes

**Commands:**
```bash
make sweep      # Full sweep: persist flags to DB + generate reports/quality_sweep.csv
make sweep-dry  # Report only, no DB writes
python -m etl.data_quality.sweep --check yoy_anomalies  # Run single check
```

---

## 12) Releases & Versioning

- Semantic versioning for methodology and data:
  - **Major**: changes to pillars/weights/scales.
  - **Minor**: source additions, mapping updates, country boundary adjustments.
  - **Patch**: bugfixes, data corrections.
- Create a signed **Release Note** per data drop: sources, versions, counts, known gaps.

---

## 13) Examples

**Example: Governance pillar (CPI & WGI)**
- CPI 62, WGI avg 0.8 → WGI_scaled = ((0.8 + 2.5) / 5) * 100 = 66.0
  GOV = 0.5 * 62 + 0.5 * 66 = **64.0**

**Example: Country with all three pillars**
- Interpersonal: 52% (WVS 2022)
- Institutional: 68% (WVS 2022)
- Governance: 64 (CPI+WGI 2024)

Each displayed independently. No composite score.

**Confidence tiering (illustrative)**
- Last interpersonal survey 2y old → no decay, Tier `A` if INST also ≤3y and GOV current.
- If surveys are >5y old → Tier `B`; proxy-only → `C`.

---

## 14) Agent Prompts (Codex)

**ETL::Discover (daily)**
- *“Check for new releases from TI CPI, WGI, OECD, ESS, WVS, Afrobarometer, Arab Barometer, Latinobarómetro, Asian Barometer. For each, if a new file or release ID exists, enqueue an ingest job with source, year, URL, and license.”*

**ETL::Ingest (per job)**
- *“Download the provided file. Validate against the source schema. Map countries to ISO3. Emit normalized observations with trust_type and score_0_100. Log provenance and checksums.”*

**ETL::Assemble (nightly)**
- *"For each country-year, compute pillar values (INTER, INST, GOV); compute confidence tier; upsert into `country_year`; refresh MVs; trigger tile rebuilds for updated years."*

**Frontend::Publish (on change)**
- *"Invalidate CDN for /tiles and /score for affected years; post a release note summarizing changes."*

---

## 15) Security & Compliance

- Store least-privilege credentials for APIs (OECD, WGI) in a secrets manager.
- Respect robots.txt and terms-of-use; avoid scraping sites without explicit permission.
- Provide a data removal path for sources that change their licenses.

---

## 16) Roadmap

1. **MVP**: GTI latest-year map, country panel, methodology page.  
2. **V1.1**: Time slider + trendlines; CPI/WGI overlays.  
3. **V1.2**: ESS & regional barometer toggles; comparison mode.  
4. **V1.3**: Download center (CSV/PNG) with license-aware gating.  
5. **V2.0**: Narrative “Story mode”; per-country briefs; API keys for partners.

---

## 17) Glossary

- **Trust Atlas**: The project name (formerly Global Trust Index)
- **INTER**: Interpersonal trust pillar (0–100)
- **INST**: Institutional trust pillar (0–100)
- **MEDIA**: Media trust pillar (0–100)
- **GOV**: Governance quality pillar (0–100)
- **Confidence Tier**: A/B/C data completeness/recency quality band

---

**End of AGENTS.md**

