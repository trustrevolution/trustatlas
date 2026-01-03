# Data Sources Roadmap

**Status:** Active priorities for expanding Trust Atlas coverage.

## Immediate Priorities

### Governance Pillar Expansion

| Source | Coverage | Access | Priority | Notes |
|--------|----------|--------|----------|-------|
| **World Justice Project (WJP)** | 142 countries, 2015-2024 | Bulk CSV | High | Rule of Law Index. Already in methodology.yaml as supplementary. Provides sub-indicators for accountability, corruption, regulatory enforcement. |
| **Freedom House** | 195 countries, 1973-2024 | Bulk CSV | High | Freedom in the World scores. Political rights + civil liberties. Long time series. |
| **V-Dem** | 202 countries, 1789-2023 | API + CSV | High | Varieties of Democracy. Rich institutional quality indicators. Academic gold standard. Already have raw file (`data/raw/vdem_v15.csv`). |

### USA Deep Coverage

| Source | Coverage | Access | Priority | Notes |
|--------|----------|--------|----------|-------|
| **General Social Survey (GSS)** | USA, 1972-2024 | Bulk download | High | Longest-running US trust time series. Annual/biennial. Already in methodology as approved source. |
| **ANES** | USA, 1958-2024 | Bulk download | High | American National Election Studies. Trust in government series. Election-year data. |

### Regional Barometers ✅ Integrated

Methodology audit completed January 2025. ETL jobs handle variable name and scale differences across waves.

| Source | Coverage | Access | Status | Notes |
|--------|----------|--------|--------|-------|
| **Afrobarometer** | 39 African countries, 2015-2023 | Bulk CSV | ✅ Loaded | Rounds 6-9, variable mappings in ETL job |
| **Latinobarometer** | 18 Latin American countries, 1996-2024 | Bulk CSV | ✅ Loaded | Auto-detects binary/ternary/quaternary scales |
| **Asian Barometer** | 15 Asian countries, 2001-2024 | Bulk CSV | ✅ Loaded | Waves 1-6, country detection robust |
| **Arab Barometer** | 12 MENA countries, 2006-2023 | Bulk CSV | ✅ Loaded | Waves 1-8, handles multi-part wave 6 |

## Current Status

**As of January 2025:** All priority sources loaded. 19,111 observations across 210 countries.

| Source | Raw Data | ETL Job | Loaded | Observations | Countries | Years |
|--------|----------|---------|--------|--------------|-----------|-------|
| V-Dem | `data/raw/vdem/` | `etl/jobs/vdem.py` | ✅ | 4,387 | 176 | 2000-2024 |
| WGI | `data/raw/wgi/` | `etl/jobs/wgi.py` | ✅ | 3,284 | 206 | 2008-2023 |
| WJP | `data/raw/wjp/` | `etl/jobs/wjp.py` | ✅ | 2,682 | 142 | 2012-2024 |
| Freedom House | `data/raw/freedomhouse.xlsx` | `etl/jobs/freedomhouse.py` | ✅ | 2,264 | 189 | 2013-2024 |
| WVS | `data/raw/wvs/` | `etl/jobs/wvs.py` | ✅ | 605 | 108 | 1981-2023 |
| EVS | `data/raw/evs/` | `etl/jobs/evs.py` | ✅ | 149 | 47 | 1981-2021 |
| GSS | `data/raw/gss/` | `etl/jobs/gss.py` | ✅ | 63 | 1 (USA) | 1972-2024 |
| ANES | `data/raw/anes/` | `etl/jobs/anes.py` | ✅ | 46 | 1 (USA) | 1958-2024 |
| **Afrobarometer** | `data/raw/afrobarometer/` | `etl/jobs/afrobarometer.py` | ✅ | 231 | 39 | 2015-2023 |
| **Latinobarometer** | `data/raw/latinobarometro/` | `etl/jobs/latinobarometro.py` | ✅ | 511 | 18 | 1996-2024 |
| **Asian Barometer** | `data/raw/asianbarometer/` | `etl/jobs/asianbarometer.py` | ✅ | 156 | 15 | 2001-2024 |
| **Arab Barometer** | `data/raw/arabbarometer/` | `etl/jobs/arabbarometer.py` | ✅ | 167 | 12 | 2006-2023 |

## Next Steps

1. ~~**Run governance ETL jobs** - WJP, Freedom House, V-Dem~~ ✅ Done
2. ~~**Run USA ETL jobs** - GSS, ANES~~ ✅ Done
3. ~~**Load WGI multi-year** - 2008-2023 now loaded~~ ✅ Done
4. ~~**Run assembly pipeline** - country_year populated~~ ✅ Done (3,864 rows, 210 countries, 2000-2024)
5. **Validate barometer data** - Review methodology before loading

## Source Evaluation Criteria

Before adding any source:

- [ ] Programmatic access (API or bulk download)
- [ ] Open license allowing redistribution
- [ ] Consistent methodology across time
- [ ] Documented question wording
- [ ] Sample sizes available
- [ ] No paywall (Gallup, Edelman excluded)

## Related Documentation

- [METHODOLOGY.md](./METHODOLOGY.md) - Current approved sources
- [DATA_SOURCES.md](./DATA_SOURCES.md) - Detailed source documentation
- [validation/owid-benchmark-2025-01.md](./validation/owid-benchmark-2025-01.md) - Validation approach
