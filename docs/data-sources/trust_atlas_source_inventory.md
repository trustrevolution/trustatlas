# Trust Atlas Data Source Inventory

This document catalogs data sources for Trust Atlas, including integration status.

**Legend:**
- ✅ **Integrated (pillar)** — Used for pillar score calculations
- 📊 **Integrated (reference)** — In database but excluded from pillars due to methodology
- ⊘ **Not integrated** — Potential future addition

---

## Media & Information Trust Sources

### Reuters Institute Digital News Report ⊘

**Status**: ⊘ **Not integrated — HIGH PRIORITY (main gap for media trust pillar)**

**Organization**: Reuters Institute for the Study of Journalism, University of Oxford
**URL**: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025
**Coverage**: 47 countries (2024), 40+ countries (2025); annual since 2012
**Update Frequency**: Annual (January)
**Trust Variables**:
- General trust in news (% who trust most news most of the time)
- Trust by news source type (TV, print, online, social)
- Trust in specific outlets
- Information verification behaviors

#### Access Method
- [x] Direct download (PDF report)
- [x] Interactive data tool (build custom charts)
- [ ] API available
- [ ] R/Python package exists
- [ ] Registration required
- [ ] Subscription/payment required

#### Technical Details
- File formats: PDF report, interactive web tool with PNG/data export
- Bulk download: Limited to report and chart exports
- Programmatic access: None documented
- Authentication: None required for public data

#### Licensing
- License type: CC BY encouraged ("We encourage free, attributed reuse")
- Commercial use permitted: Yes (with attribution)
- Attribution requirements: Credit Reuters Institute
- Redistribution allowed: Yes with attribution

#### Data Quality
- Methodology: YouGov online survey, nationally representative quotas
- Sample: ~95,000 respondents across 47 markets (2024)
- Weighting: Age, gender, region, education, political vote
- Limitations: Online panel only, may underrepresent offline populations

#### Integration Priority
- Relevance score: **9/10** (directly measures media trust)
- Uniqueness score: **10/10** (only comprehensive global media trust source)
- Accessibility score: **7/10** (interactive tool, but no bulk API)
- **Overall priority: HIGH**

#### Notes
- Fills major gap: Trust Atlas has no media trust pillar currently
- Interactive tool allows country comparisons but requires manual export
- Consider scraping or contacting for bulk data access

---

### Edelman Trust Barometer ⊘

**Status**: ⊘ **Not integrated — Public reports available, microdata restricted**

**Organization**: Edelman Trust Institute
**URL**: https://www.edelman.com/trust/2025/trust-barometer
**Coverage**: 28 countries; annual since 2001
**Update Frequency**: Annual (January release)
**Trust Variables**:
- Trust Index (average of 4 institutions)
- Trust in Business, Government, Media, NGOs
- Trust in CEOs, journalists, government officials
- AI trust measures (since 2024)

#### Access Method
- [x] Direct download (PDF reports)
- [x] Data dashboard (limited export)
- [ ] API available
- [ ] R/Python package exists
- [x] Registration required (for full dataset)
- [ ] Subscription/payment required (case-by-case for academics)

#### Technical Details
- File formats: PDF, Excel export from dashboard
- Bulk download: Dashboard allows Excel export of selected data
- Programmatic access: None
- Authentication: Dashboard is public; full microdata requires application

#### Licensing
- License type: Custom (contact for academic use)
- Commercial use permitted: Dashboard data yes; microdata unclear
- Attribution requirements: Yes
- Redistribution allowed: No for microdata; dashboard exports yes

#### Data Quality
- Methodology: 30-minute online survey, 1,150 respondents per country
- Sample: ~33,000 total across 28 markets
- Weighting: Gender, age, region, race/ethnicity
- Limitations: Educated/high-income skew in informed public sample

#### Integration Priority
- Relevance score: **9/10** (comprehensive trust across 4 pillars)
- Uniqueness score: **6/10** (overlaps with WVS/EVS institutional trust)
- Accessibility score: **5/10** (dashboard limited, microdata restricted)
- **Overall priority: MEDIUM-HIGH**

#### Notes
- Dashboard at https://www.edelman.com/trust/data-dashboard exports 2012-2025
- Contact trustinstitute@edelman.com for academic data access
- AI trust module is unique and valuable

---

## Government & Institutional Trust Sources

### OECD Trust Survey 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/oecd.py`**

**Organization**: OECD
**URL**: https://www.oecd.org/en/data/datasets/oecd-trust-survey-data.html
**Coverage**: 30 OECD countries + Brazil (2023 wave); biennial since 2021
**Update Frequency**: Biennial
**Trust Variables**:
- Trust in national government
- Trust in local government
- Trust in civil service
- Trust in parliament, courts, police
- Drivers of trust (competence, values, openness)

#### Access Method
- [x] Direct download (aggregate data via OECD.Stat)
- [ ] API available (OECD.Stat SDMX API)
- [ ] R/Python package exists
- [ ] Registration required
- [ ] Proposal/application required (for microdata)
- [ ] Subscription/payment required

#### Technical Details
- File formats: CSV, Excel via OECD.Stat; PDF report
- Bulk download: Yes for aggregate data
- Programmatic access: OECD.Stat SDMX API
- Authentication: None for aggregate; proposal for microdata

#### Licensing
- License type: OECD Terms (generally open for non-commercial)
- Commercial use permitted: Check specific dataset terms
- Attribution requirements: Yes
- Redistribution allowed: Derived data yes

#### Data Quality
- Methodology: Online survey, ~2,000 per country
- Sample: ~60,000 total across 30 countries (2023)
- Weighting: Nationally representative
- Limitations: OECD countries only (high-income bias)

#### Integration Priority
- Relevance score: **9/10** (rich institutional trust drivers)
- Uniqueness score: **7/10** (more detailed than WVS but fewer countries)
- Accessibility score: **8/10** (aggregate data readily available)
- **Overall priority: HIGH**

#### Notes
- Complements WVS with richer driver analysis
- API access via OECD.Stat makes automation possible
- 2025 wave planned for ~30 countries

---

### Eurobarometer (via GESIS) 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/eurobarometer.py`**

**Organization**: European Commission / GESIS
**URL**: https://www.gesis.org/en/eurobarometer-data-service
**Coverage**: 27 EU countries + candidates; since 1973
**Update Frequency**: 2-4 times per year
**Trust Variables**:
- Trust in national institutions (parliament, government, justice, police, army)
- Trust in EU institutions (Parliament, Commission, ECB, etc.)
- Trust in media (press, radio, TV, internet, social networks)
- Interpersonal trust

#### Access Method
- [x] Direct download (SPSS, Stata)
- [ ] API available
- [x] R package exists (`gesisdata`)
- [x] Registration required (free GESIS account)
- [ ] Subscription/payment required

#### Technical Details
- File formats: SPSS (.sav), Stata (.dta)
- Bulk download: Yes, individual waves or trend files
- Programmatic access: `gesisdata` R package
- Authentication: Free GESIS registration

#### Licensing
- License type: Non-commercial academic use
- Commercial use permitted: No
- Attribution requirements: Yes (cite Eurobarometer and GESIS)
- Redistribution allowed: No

#### Data Quality
- Methodology: Face-to-face interviews (shifting to mixed-mode)
- Sample: ~1,000 per country per wave, ~27,000 per wave
- Weighting: Post-stratification weights provided
- Limitations: EU focus limits global applicability

#### Integration Priority
- Relevance score: **9/10** (comprehensive EU institutional + media trust)
- Uniqueness score: **8/10** (longest time series, media trust unique)
- Accessibility score: **8/10** (R package, free registration)
- **Overall priority: HIGH**

#### Notes
- Trust in Institutions trend file covers 1985-2024
- `gesisdata` R package enables programmatic download
- Non-commercial restriction may limit some uses
- Excellent complement to WVS for European coverage

---

### Pew Research Center Global Attitudes ⊘

**Status**: ⊘ **Not integrated**

**Organization**: Pew Research Center
**URL**: https://www.pewresearch.org/global/
**Coverage**: 50+ countries; various waves since 2002
**Update Frequency**: Multiple surveys per year
**Trust Variables**:
- Trust in government
- Trust in news media
- Trust in science
- Trust in religious institutions
- Interpersonal trust

#### Access Method
- [x] Direct download (SPSS)
- [ ] API available
- [x] R package exists (`pewdata`)
- [x] Registration required (free)
- [ ] Subscription/payment required

#### Technical Details
- File formats: SPSS (.sav)
- Bulk download: Yes, per survey wave
- Programmatic access: `pewdata` R package
- Authentication: Free registration

#### Licensing
- License type: Non-commercial research
- Commercial use permitted: No
- Attribution requirements: Yes
- Redistribution allowed: No

#### Data Quality
- Methodology: Mixed (face-to-face, phone, online depending on country)
- Sample: Typically 1,000-2,000 per country
- Weighting: Provided
- Limitations: Not all waves cover all countries; trust not in every wave

#### Integration Priority
- Relevance score: **8/10** (trust in multiple domains)
- Uniqueness score: **6/10** (overlaps with WVS but different timing)
- Accessibility score: **7/10** (R package available)
- **Overall priority: MEDIUM-HIGH**

#### Notes
- Global Indicators Database at https://www.pewresearch.org/global/database/
- Wave 40 (trust & democracy), Wave 42 (science), Wave 62 (media) most relevant
- Good for cross-validation with WVS

---

## Regional Barometer Sources

### Afrobarometer 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/afrobarometer.py`**
*Excluded from pillars due to different scales/question wording than WVS-family*

**Organization**: Afrobarometer Network
**URL**: https://www.afrobarometer.org/data/
**Coverage**: 38 African countries; since 1999 (Round 9 ongoing)
**Update Frequency**: Approximately every 2-3 years
**Trust Variables**:
- Trust in president, parliament, courts, police, army
- Trust in electoral commission
- Trust in traditional leaders
- Interpersonal trust

#### Access Method
- [x] Direct download (SPSS, Excel)
- [x] Online analysis tool
- [ ] API available
- [ ] R/Python package exists
- [ ] Registration required (for basic data)
- [x] Application required (for geocoded/early data)

#### Technical Details
- File formats: SPSS (.sav), Excel via online tool
- Bulk download: Yes, merged multi-country datasets available
- Programmatic access: None
- Authentication: None for public data

#### Licensing
- License type: Open data (with attribution)
- Commercial use permitted: Yes (check policy)
- Attribution requirements: Yes
- Redistribution allowed: Yes with attribution

#### Data Quality
- Methodology: Face-to-face interviews, nationally representative
- Sample: 1,200-2,400 per country
- Weighting: Provided
- Limitations: Africa only

#### Integration Priority
- Relevance score: **8/10** (comprehensive institutional trust)
- Uniqueness score: **9/10** (best African coverage)
- Accessibility score: **9/10** (open, easy download)
- **Overall priority: HIGH**

#### Notes
- Already listed as reference source in Trust Atlas
- Should be elevated to primary source for African institutional trust
- Merged datasets simplify multi-country analysis

---

### Arab Barometer 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/arabbarometer.py`**
*Excluded from pillars due to different scales/question wording than WVS-family*

**Organization**: Arab Barometer / Princeton University
**URL**: https://www.arabbarometer.org/survey-data/data-downloads/
**Coverage**: 16 Arab countries; since 2006 (Wave VIII: 2023-24)
**Update Frequency**: Approximately every 2 years
**Trust Variables**:
- Trust in government, parliament, courts, police, army
- Trust in religious leaders
- Trust in media
- Interpersonal trust

#### Access Method
- [x] Direct download (SPSS, Stata)
- [x] Online analysis tool
- [ ] API available
- [ ] R/Python package exists
- [x] Registration required (brief form)
- [ ] Subscription/payment required

#### Technical Details
- File formats: SPSS, Stata, plus online analysis
- Bulk download: Yes
- Programmatic access: None
- Authentication: Brief registration form

#### Licensing
- License type: Academic/non-commercial
- Commercial use permitted: Unclear
- Attribution requirements: Yes
- Redistribution allowed: No

#### Data Quality
- Methodology: Face-to-face interviews
- Sample: ~1,000-2,000 per country
- Weighting: Provided
- Limitations: Arab world only; some countries difficult to survey

#### Integration Priority
- Relevance score: **8/10** (comprehensive institutional + media trust)
- Uniqueness score: **9/10** (only systematic Arab region coverage)
- Accessibility score: **8/10** (easy download after registration)
- **Overall priority: HIGH**

#### Notes
- Wave VIII (2023-24) is most recent
- Fills major gap in MENA region coverage
- Online analysis tool useful for quick exploration

---

### Latinobarómetro 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/latinobarometro.py`**
*Excluded from pillars due to methodology changes that produced 25%→93% swings*

**Organization**: Corporación Latinobarómetro
**URL**: https://www.latinobarometro.org/latContents.jsp
**Coverage**: 18 Latin American countries; since 1995
**Update Frequency**: Annual
**Trust Variables**:
- Trust in government, congress, judiciary, police, military
- Trust in church, media, political parties
- Interpersonal trust
- Satisfaction with democracy

#### Access Method
- [x] Direct download (SPSS, Stata, R, SAS, CSV)
- [ ] API available
- [ ] R/Python package exists
- [x] Registration required (accept terms)
- [ ] Subscription/payment required

#### Technical Details
- File formats: SPSS, Stata, R, SAS, CSV, Excel
- Bulk download: Yes, annual files
- Programmatic access: None
- Authentication: Accept end-user agreement

#### Licensing
- License type: Non-commercial research/teaching
- Commercial use permitted: No
- Attribution requirements: Yes
- Redistribution allowed: No (explicitly prohibited)

#### Data Quality
- Methodology: Face-to-face interviews
- Sample: ~1,000-1,200 per country
- Weighting: Provided
- Limitations: Latin America only

#### Integration Priority
- Relevance score: **8/10** (comprehensive institutional trust)
- Uniqueness score: **9/10** (best Latin American coverage)
- Accessibility score: **8/10** (multiple formats, easy download)
- **Overall priority: HIGH**

#### Notes
- Latinobarómetro 2024 now available
- Time series back to 1995 enables trend analysis
- Redistribution prohibition means we display but don't redistribute raw data

---

### Asian Barometer Survey 📊

**Status**: 📊 **Integrated (reference) — ETL: `etl/jobs/asianbarometer.py`**
*Excluded from pillars due to inverted scales in Wave 1-2 (10% vs 95% in later waves)*

**Organization**: Hu Fu Center for East Asia Democratic Studies, National Taiwan University
**URL**: http://www.asianbarometer.org/data
**Coverage**: 14-18 Asian countries; 5 waves since 2001
**Update Frequency**: Approximately every 3-4 years
**Trust Variables**:
- Trust in government, parliament, courts, police, military
- Trust in media
- Trust in NGOs
- Interpersonal trust

#### Access Method
- [ ] Direct download
- [ ] API available
- [ ] R/Python package exists
- [x] Registration/application required
- [ ] Subscription/payment required

#### Technical Details
- File formats: SPSS, Stata (upon approval)
- Bulk download: No (application per dataset)
- Programmatic access: None
- Authentication: Application with research justification

#### Licensing
- License type: Academic research only
- Commercial use permitted: No
- Attribution requirements: Yes (bibliography submission required)
- Redistribution allowed: No

#### Data Quality
- Methodology: Face-to-face interviews
- Sample: ~1,000-1,500 per country
- Weighting: Provided
- Limitations: Application process slower; Asia focus

#### Integration Priority
- Relevance score: **8/10** (comprehensive institutional trust)
- Uniqueness score: **8/10** (best systematic Asian coverage)
- Accessibility score: **5/10** (application required)
- **Overall priority: MEDIUM-HIGH**

#### Notes
- Contact asianbarometer@ntu.edu.tw for data access
- Wave 1 available via online analysis without application
- More restrictive than other barometers

---

## Financial System Trust Sources

### ECB Consumer Expectations Survey

**Organization**: European Central Bank
**URL**: https://www.ecb.europa.eu/stats/ecb_surveys/consumer_exp_survey/html/index.en.html
**Coverage**: 6 largest euro area countries; since 2020
**Update Frequency**: Monthly
**Trust Variables**:
- Trust in ECB (0-10 scale)
- Trust in European Parliament, Commission
- Trust in national central bank
- Trust in United Nations

#### Access Method
- [x] Direct download (aggregate statistics)
- [ ] API available
- [ ] R/Python package exists
- [ ] Registration required
- [x] Proposal required (for microdata)

#### Technical Details
- File formats: Excel, PDF
- Bulk download: Aggregate yes; microdata requires proposal
- Programmatic access: Limited
- Authentication: None for aggregate

#### Licensing
- License type: ECB terms
- Commercial use permitted: Aggregate yes
- Attribution requirements: Yes
- Redistribution allowed: Aggregate yes

#### Data Quality
- Methodology: Online panel
- Sample: 10,000 respondents across 6 countries
- Weighting: Provided
- Limitations: Euro area only, limited country coverage

#### Integration Priority
- Relevance score: **7/10** (central bank trust is niche)
- Uniqueness score: **8/10** (only systematic central bank trust data)
- Accessibility score: **6/10** (aggregate easy, microdata harder)
- **Overall priority: MEDIUM**

#### Notes
- Useful for financial system trust pillar if we expand there
- Monthly frequency unusual - could track trust dynamics
- Limited geographic coverage is main weakness

---

### Gallup World Poll ⊘

**Status**: ⊘ **Not integrated — Core microdata requires subscription, but FREE alternatives exist**

**Organization**: Gallup
**URL**: https://www.gallup.com/analytics/318923/world-poll-public-datasets.aspx
**Coverage**: 140+ countries; since 2006
**Update Frequency**: Annual
**Trust Variables**:
- Confidence in financial institutions/banks
- Confidence in national government
- Confidence in judiciary
- Confidence in military, police

#### Access Method
- [x] **FREE PUBLIC DATASETS AVAILABLE** (see below)
- [x] Institutional subscription for full microdata
- [x] University library access (Harvard, Yale, Penn, UVA, Brown)

#### FREE Gallup-Derived Datasets

| Dataset | Coverage | Trust Variable | URL |
|---------|----------|----------------|-----|
| **Briq Global Preferences Survey (GPS)** | 76 countries | Interpersonal trust (0-10 scale) | https://www.briq-institute.org/global-preferences/home |
| **Lloyd's Register Foundation World Risk Poll** | 142+ countries | Safety/risk perceptions | https://wrp.lrfoundation.org.uk/ |
| **Wellcome Global Monitor** | 140+ countries | Science and health trust | https://wellcome.org/reports/wellcome-global-monitor |
| **World Bank Global Findex** | 140+ countries | Financial behavior | https://www.worldbank.org/en/publication/globalfindex |

#### Technical Details
- **Briq GPS**: Freely downloadable, includes unique identifiers to merge with 2012 World Poll
- **World Risk Poll**: Biennial, freely downloadable
- **Wellcome**: Every 3-4 years, freely downloadable
- Full microdata: Gallup Analytics subscription or university mediated access

#### Licensing
- Free datasets: Open access with attribution
- Full microdata: Proprietary subscription
- University access: Harvard, Yale, Penn, UVA, Brown offer affiliate access

#### Integration Priority
- Relevance score: **9/10** (comprehensive global coverage)
- Uniqueness score: **7/10** (overlaps with WVS confidence questions)
- Accessibility score: **7/10** (free derivatives available!)
- **Overall priority: MEDIUM-HIGH** (GPS trust data is freely available)

#### Notes
- **Briq GPS is high priority** — free trust data for 76 countries
- GPS uses 0-10 scale (like ESS), would need separate handling
- World Risk Poll offers complementary safety/risk trust measures
- Full Gallup subscription still valuable for institutional access

---

## Technology & Digital Trust Sources

### Thales Consumer Digital Trust Index

**Organization**: Thales Group
**URL**: https://cpl.thalesgroup.com/2024/digital-trust-index
**Coverage**: 12 countries; annual since 2023
**Update Frequency**: Annual
**Trust Variables**:
- Trust in digital services by industry (banking, healthcare, government, social media)
- Data privacy trust
- AI impact concerns
- Brand trust in digital context

#### Access Method
- [x] Direct download (report PDF)
- [ ] API available
- [ ] R/Python package exists
- [ ] Registration required
- [ ] Subscription/payment required

#### Technical Details
- File formats: PDF report with charts
- Bulk download: No (summary statistics only)
- Programmatic access: None
- Authentication: None

#### Licensing
- License type: Unclear (report is freely available)
- Commercial use permitted: Likely yes for cited statistics
- Attribution requirements: Yes
- Redistribution allowed: Charts/stats yes; report check terms

#### Data Quality
- Methodology: Online survey, ~12,000 respondents
- Sample: ~1,000 per country
- Weighting: Unknown
- Limitations: Limited country coverage; no microdata

#### Integration Priority
- Relevance score: **7/10** (digital trust is growing area)
- Uniqueness score: **9/10** (few digital trust sources exist)
- Accessibility score: **4/10** (summary data only)
- **Overall priority: LOW-MEDIUM**

#### Notes
- Useful for understanding digital trust landscape
- Cannot integrate raw data; report statistics only
- May inspire variables to seek from other sources

---

### Edelman Trust Barometer - AI Module

**Organization**: Edelman
**URL**: https://www.edelman.com/trust/2025/trust-barometer
**Coverage**: 28 countries; since 2024
**Update Frequency**: Annual
**Trust Variables**:
- Trust in AI technology
- Trust in tech companies developing AI
- Trust in AI governance
- AI adoption comfort levels

#### Access Method
- [x] Via Edelman dashboard (see above entry)

#### Integration Priority
- Relevance score: **8/10** (AI trust is emerging priority)
- Uniqueness score: **9/10** (few systematic AI trust measures)
- Accessibility score: **5/10** (dashboard export)
- **Overall priority: MEDIUM**

#### Notes
- Part of main Edelman Trust Barometer
- Dashboard exports include AI-related questions since 2024
- Innovation trust module unique to Edelman

---

## Summary Priority Matrix

### Already Integrated (Reference Data)

| Source | Status | ETL Job | Why Not in Pillars |
|--------|--------|---------|-------------------|
| Afrobarometer | 📊 Reference | `afrobarometer.py` | Different scale/wording |
| Arab Barometer | 📊 Reference | `arabbarometer.py` | Different scale/wording |
| Asian Barometer | 📊 Reference | `asianbarometer.py` | Inverted scales in Wave 1-2 |
| Latinobarómetro | 📊 Reference | `latinobarometro.py` | Methodology changes |
| Eurobarometer | 📊 Reference | `eurobarometer.py` | Non-commercial license |
| OECD Trust Survey | 📊 Reference | `oecd.py` | Different definitions |
| ESS | 📊 Reference | `ess.py` | 0-10 scale |

### TRUE Gaps (Not Yet Integrated)

| Source | Relevance | Uniqueness | Accessibility | Overall | Priority |
|--------|-----------|------------|---------------|---------|----------|
| **Reuters Digital News Report** | 9 | 10 | 7 | **HIGH** | #1 - Media trust pillar |
| **Briq GPS (Gallup-derived)** | 8 | 7 | 9 | **HIGH** | #2 - Free trust data, 76 countries |
| **World Risk Poll** | 7 | 8 | 9 | **MEDIUM** | Safety/risk perceptions |
| **Wellcome Global Monitor** | 7 | 8 | 9 | **MEDIUM** | Science/health trust |
| Pew Global Attitudes | 8 | 6 | 7 | **MEDIUM** | Cross-validation |
| Edelman Trust Barometer | 9 | 6 | 5 | **LOW** | Microdata restricted |
| ECB Consumer Expectations | 7 | 8 | 6 | **LOW** | Euro area only |

---

## Recommended Next Steps

### Phase 1: New Sources (High Priority)
1. **Reuters Digital News Report** — Foundation for MEDIA TRUST pillar
2. **Briq GPS** — Free interpersonal trust data, 76 countries (0-10 scale)

### Phase 2: Expand Reference Coverage
3. **World Risk Poll** — Safety/risk perceptions, 142+ countries
4. **Wellcome Global Monitor** — Science/health trust, 140+ countries
5. **Pew Global Attitudes** — Cross-validation with WVS

### Phase 3: Review Methodology Constraints
Consider whether regional barometers (already in DB) could be:
- Harmonized to WVS scale for select countries
- Used for time-series analysis within single source
- Elevated to supplementary status for specific regions

### Not Recommended
- **Edelman microdata** — Contact for access, but likely restricted
- **Thales** — Summary data only
- **ECB CES** — Too narrow (6 euro countries)
