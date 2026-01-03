# Assumptions & Design Decisions

This document captures the key assumptions, design decisions, trade-offs, and limitations of the Global Trust Index project. Understanding these helps users interpret GTI scores appropriately and informs future development.

## Core Assumptions

### 1. Trust is Measurable

**Assumption:** Trust can be meaningfully captured through survey questions and expert assessments.

**Evidence:**
- Decades of social science research validating trust measures
- Strong correlations between survey trust and behavioral outcomes
- Replication across different methodologies and cultures

**Limitations:**
- Self-reported trust may differ from behavioral trust
- Survey responses can be influenced by recent events
- "Trust" may have different cultural meanings

**Mitigation:**
- Use multiple sources with different methodologies
- Combine survey data with governance proxies
- Document confidence levels transparently

---

### 2. Trust is Comparable Across Countries

**Assumption:** A trust score of 60 in Denmark is meaningfully comparable to 60 in Japan.

**Evidence:**
- Standardized survey methodologies (WVS, ESS)
- Consistent question wording across translations
- Academic validation of cross-cultural comparisons

**Limitations:**
- Cultural response styles vary (acquiescence bias)
- "Government" means different things in different systems
- Translation may not capture identical concepts

**Mitigation:**
- Normalize all scores to 0-100 scale
- Use relative rankings within regions
- Highlight confidence tiers

---

### 3. Open-Access Data is Sufficient

**Assumption:** Freely available data sources (including those requiring free registration) provide adequate coverage and quality for a meaningful global index.

**Evidence:**
- WVS/ESS/Barometers cover 150+ countries
- CPI/WGI provide near-universal governance coverage
- Open sources are peer-reviewed and documented

**Limitations:**
- Gallup World Poll has better coverage (excluded due to paid subscription)
- Some regions have sparse survey data
- Data gaps in conflict zones and closed societies
- Some sources require manual download after free registration

**Mitigation:**
- Use governance proxy for countries without survey data
- Flag low-confidence scores (Tier C)
- Continuously add regional barometer sources
- Document manual download steps for registration-required sources

---

## Design Decisions

### D1: Four-Pillar Model

**Decision:** Track four independent pillars of trust (interpersonal, institutional, media, governance) without combining into a composite index.

**Rationale:**
- Captures different dimensions of societal trust
- Survey data (~5-year cycles) and governance data (annual) have different rhythms
- Combining creates artificial volatility; individual pillars tell clearer stories
- Balances subjective (survey) and objective (governance) measures

**Alternatives Considered:**
- Single composite index → Artificial volatility from mixed data frequencies
- Three pillars only → Missing media trust dimension
- Survey-only index → Missing countries with no surveys

**Trade-offs:**
- Complexity vs. comprehensiveness
- Single score vs. multidimensional understanding

---

### D2: Weighting Scheme (40-30-30)

**Decision:** Weight institutional trust at 40%, interpersonal and governance at 30% each.

**Rationale:**
- Institutional trust is most consistently measured
- Correlates strongly with policy outcomes
- Reflects central importance to governance

**Alternatives Considered:**
- Equal weights (33-33-33) → Simpler but arbitrary
- Survey-weighted (60-40 survey, no governance) → Missing coverage
- Governance-heavy → Not trust-specific

**Trade-offs:**
- Prioritizes institutional over interpersonal
- May underweight social capital in some contexts

---

### D3: Governance as Pillar (Not Just Fallback)

**Decision:** Include governance quality as a full pillar, not just a fallback when surveys are unavailable.

**Rationale:**
- Governance metrics (CPI, WGI) are highly reliable
- Provide objective counterweight to survey perceptions
- Enable universal coverage

**Alternatives Considered:**
- Survey-only with governance fallback → Tier inconsistency
- Governance as validation only → Wasted information

**Trade-offs:**
- Conflates "trust" with "trustworthiness"
- May inflate/deflate scores vs. pure survey measure

---

### D4: Source Weighting Within Pillars

**Decision:** Weight sources within each pillar (e.g., WVS 60% + ESS 40% for interpersonal).

**Rationale:**
- WVS has broader global coverage
- ESS has higher methodological rigor
- Weighting reflects relative strengths

**Alternatives Considered:**
- Use only one source per pillar → Simpler but less robust
- Equal weights → Ignores quality differences
- Coverage-based weights → Too complex

**Trade-offs:**
- Requires judgment calls on source quality
- May need updating as sources change

---

### D5: 7-Year Maximum Data Age

**Decision:** Exclude survey data older than 7 years from GTI calculation.

**Rationale:**
- Trust levels can change significantly over time
- Ensures scores reflect reasonably current conditions
- Balances coverage with currency

**Alternatives Considered:**
- 5 years → More current but worse coverage
- 10 years → Better coverage but outdated
- No limit → Misleading stale data

**Trade-offs:**
- Countries with old surveys drop to Tier C
- May undercount stable societies

---

### D6: Confidence Intervals (±5/±10/±15)

**Decision:** Display confidence intervals (e.g., "65 ± 5") rather than tier labels (A/B/C), following CPI and World Bank WGI methodology.

**Rationale:**
- Users understand "65 ± 5" intuitively as "probably between 60-70"
- Tier labels (A/B/C) confused users who thought they related to the score value
- Overlapping intervals communicate when differences are not statistically significant
- Follows established best practices from leading indices

**Interval Widths:**
- ±5: Recent surveys + governance (high confidence)
- ±10: Older surveys or partial coverage (medium confidence)
- ±15: Governance proxy only (lower confidence)

**Trade-offs:**
- More complex display than single number
- Requires user understanding of intervals

---

### D7: Staging Files for Auditability

**Decision:** Write intermediate CSV files to `data/staging/` before loading to database.

**Rationale:**
- Enables debugging without re-downloading
- Provides audit trail for data provenance
- Supports reproducibility

**Alternatives Considered:**
- Direct download-to-database → Faster but opaque
- Store in S3 only → Less accessible

**Trade-offs:**
- Additional disk usage
- Extra processing step

---

### D8: API-First Architecture

**Decision:** Serve all data through a REST API, not direct database access.

**Rationale:**
- Enables caching at CDN layer
- Provides stable interface for consumers
- Supports versioning and schema evolution

**Alternatives Considered:**
- GraphQL → More flexible but more complex
- Static JSON files → Simpler but less queryable
- Direct database → No abstraction layer

**Trade-offs:**
- Additional infrastructure component
- Network latency vs. direct access

---

### D9: Public, Unauthenticated API

**Decision:** Make all API endpoints public with no authentication required.

**Rationale:**
- All data is derived from public sources
- Maximizes accessibility and transparency
- Simplifies client integration

**Alternatives Considered:**
- API keys for rate limiting → Barriers to access
- Tiered access → Contradicts open data mission

**Trade-offs:**
- Potential for abuse/scraping
- May need rate limiting in future

---

### D10: PostgreSQL as Primary Store

**Decision:** Use PostgreSQL for all structured data storage.

**Rationale:**
- Excellent support for numeric data and JSONB
- Strong indexing for time-series queries
- Familiar and well-documented

**Alternatives Considered:**
- Time-series DB (TimescaleDB, InfluxDB) → Overkill for data volume
- Document DB (MongoDB) → Less suitable for relational data
- SQLite → Insufficient for production

**Trade-offs:**
- Requires managed database in production
- More complex than file-based storage

---

## Known Limitations

### L1: Survey Coverage Gaps

**Issue:** Many countries lack recent survey data, especially in:
- Sub-Saharan Africa
- Central Asia
- Pacific Islands
- Conflict zones

**Impact:** These countries receive Tier C (governance proxy only) scores.

**Mitigation:** Prioritize adding regional barometer sources.

---

### L2: English-Centric Sources

**Issue:** Most sources originate from Western academic institutions.

**Impact:** Potential bias in question framing and interpretation.

**Mitigation:** Include regional barometers with local expertise.

---

### L3: Lag in Data Availability

**Issue:** Survey data typically lags 1-2 years behind governance data.

**Impact:** GTI may not reflect very recent changes.

**Mitigation:**
- Clearly label data years
- Update as new data becomes available

---

### L4: Governance ≠ Trust

**Issue:** CPI and WGI measure institutional quality, not trust directly.

**Impact:** High governance + low trust (or vice versa) creates pillar conflicts.

**Mitigation:**
- Present pillars separately
- Note in confidence tier
- Explain in methodology

---

### L5: Single Annual Score

**Issue:** GTI provides one score per country per year.

**Impact:** Misses within-year variation and subnational differences.

**Mitigation:**
- Acknowledge limitation in documentation
- Future: Consider subnational data sources

---

### L6: No Causal Claims

**Issue:** GTI shows correlations, not causation.

**Impact:** Users may incorrectly infer policy recommendations.

**Mitigation:**
- Documentation disclaimers
- Present trends, not prescriptions

---

## Future Considerations

### Potential Enhancements

1. **Subnational Data:** Regional trust measures for large countries
2. **Sector Trust:** Healthcare, education, media trust dimensions
3. **Trend Predictions:** Time-series forecasting models
4. **Uncertainty Quantification:** Confidence intervals on scores
5. **User Contributions:** Crowdsourced data quality feedback

### Methodology Evolution

Any methodology changes will be:
- Versioned in `data/reference/methodology.yaml`
- Documented with rationale
- Applied consistently to historical data where possible
- Communicated to API consumers via `X-GTI-Version` header

### Data Source Roadmap

Priority sources to add:
1. Latinobarómetro (Latin America coverage)
2. Asian Barometer (East Asia coverage)
3. Pew Global Attitudes Survey (if license permits)
4. Eurobarometer (EU institutional trust)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-01 | Initial methodology (v0.1.0) | Project inception |
| 2024-02 | 7-year max data age | Balance coverage vs. currency |
| 2024-03 | Added regional barometers | Improve non-Western coverage |
| 2024-06 | GSS/ANES for USA deep-dive | Historical time series |

---

## References

- Zak, P. & Knack, S. (2001). Trust and Growth. *Economic Journal*.
- Bjørnskov, C. (2007). Determinants of Generalized Trust. *Public Choice*.
- Rothstein, B. & Stolle, D. (2008). The State and Social Capital. *Comparative Politics*.
- OECD (2017). *Trust and Public Policy*.
- World Values Survey (2020). *Methodological Annex*.

---

## Related Documentation

- [METHODOLOGY.md](./METHODOLOGY.md) - GTI calculation details
- [DATA_SOURCES.md](./DATA_SOURCES.md) - Source documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
