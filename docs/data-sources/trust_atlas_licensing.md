# Trust Atlas Licensing & Compliance Matrix

This document provides a definitive classification of data sources by licensing terms, commercial use permissions, and compliance requirements.

> **Update (2026-01):** Added free Gallup-derived datasets (Briq GPS, World Risk Poll, Wellcome). Corrected Gallup section — not fully proprietary; has free public datasets.

---

## Commercial Use Classification

### Fully Open (Commercial OK)

| Source | License | Attribution | Redistribution | Notes | Status |
|--------|---------|-------------|----------------|-------|--------|
| **Reuters Digital News Report** | CC BY | Required | Yes | "Encourage free, attributed reuse" | ⊘ Not integrated |
| **Briq GPS** | Open | Required | Yes | Gallup-derived trust data, 76 countries | ⊘ Not integrated |
| **World Risk Poll** | Open | Required | Yes | LRF-funded, 142+ countries | ⊘ Not integrated |
| **Wellcome Global Monitor** | Open | Required | Yes | Science/health trust, 140+ countries | ⊘ Not integrated |
| **Afrobarometer** | Open Data | Required | Yes | Free for all uses with attribution | 📊 Reference |
| **OECD Trust Survey** | OECD Terms | Required | Derived data yes | Check specific dataset terms | 📊 Reference |
| **Edelman Dashboard Data** | Custom | Required | Summary stats yes | Dashboard exports only | ⊘ Not integrated |

### Non-Commercial Only

| Source | License | Attribution | Redistribution | Notes | Status |
|--------|---------|-------------|----------------|-------|--------|
| **Eurobarometer (GESIS)** | Non-commercial academic | Required | No | Must cite both EB and GESIS | 📊 Reference |
| **Pew Research Center** | Non-commercial research | Required | No | Free registration | ⊘ Not integrated |
| **Latinobarómetro** | Non-commercial research | Required | **Prohibited** | Explicit redistribution ban | 📊 Reference |
| **Arab Barometer** | Academic/non-commercial | Required | No | Registration required | 📊 Reference |
| **Asian Barometer** | Academic research only | Required + bibliography | No | Application process | 📊 Reference |
| **ECB Consumer Expectations** | ECB Terms | Required | Aggregate only | Microdata requires proposal | ⊘ Not integrated |

### Restricted Access

| Source | License | Access | Notes |
|--------|---------|--------|-------|
| **Gallup World Poll (core)** | Proprietary | Subscription or university library | Free derivatives exist: Briq GPS, World Risk Poll, Wellcome |
| **Edelman Microdata** | Custom | Case-by-case | Contact trustinstitute@edelman.com; public reports available |

### Unclear/Needs Verification

| Source | Status | Action Required |
|--------|--------|-----------------|
| **Thales Digital Trust Index** | Report freely available | Confirm reuse terms for statistics |

---

## Detailed License Terms

### Reuters Institute Digital News Report

```
License: Creative Commons Attribution encouraged
Terms: "We encourage free, attributed reuse of our work within your
       own websites and presentations."
```

**Trust Atlas Compliance:**
- Display data: YES
- Store processed data: YES
- Attribute: Required (credit Reuters Institute for the Study of Journalism)
- Commercial: YES

---

### Eurobarometer via GESIS

```
License: Non-commercial academic use
Terms: Data may only be used for non-commercial purposes such as
       academic research and teaching. Users must register with GESIS.
       Citation of both Eurobarometer and GESIS required.
```

**Trust Atlas Compliance:**
- Display data: YES (Trust Atlas is non-commercial)
- Store processed data: YES (for academic/non-commercial)
- Attribute: Required (dual citation)
- Commercial: NO - if Trust Atlas commercializes, this data must be removed

---

### Afrobarometer

```
License: Open Data
Terms: "Afrobarometer's data on Africans' views on democracy, governance,
       and other issues are free for you to use."
       Attribution required. Contact datarequests@afrobarometer.org for
       geocoded or early-release data.
```

**Trust Atlas Compliance:**
- Display data: YES
- Store processed data: YES
- Attribute: Required
- Commercial: YES (verify with data use policy)

---

### Latinobarómetro

```
License: Non-commercial research and teaching
Terms: "The datasets are available for non-commercial research, teaching,
       and publications. Redistribution is prohibited: republishing
       Latinobarómetro data on other websites infringes property rights."
```

**Trust Atlas Compliance:**
- Display data: YES (display derived statistics, not raw data)
- Store processed data: YES (internally for processing)
- Attribute: Required
- Commercial: NO
- **CRITICAL**: Cannot redistribute raw microdata - must display only derived/aggregated statistics

---

### Pew Research Center

```
License: Non-commercial research
Terms: Free registration required. Data for non-commercial research
       and educational purposes only.
```

**Trust Atlas Compliance:**
- Display data: YES (non-commercial)
- Store processed data: YES
- Attribute: Required
- Commercial: NO

---

### Arab Barometer

```
License: Academic/non-commercial
Terms: "Data is for use by the applicant only. Must fill brief
       registration form. Personal data used for reporting purposes only."
```

**Trust Atlas Compliance:**
- Display data: YES
- Store processed data: YES
- Attribute: Required
- Commercial: Unclear - assume NO

---

### Asian Barometer Survey

```
License: Academic research only
Terms: "Data provided by Asian Barometer are to be used solely for
       academic research, education, policy-oriented analysis, or
       other pre-approved purposes. Applicants must provide bibliographies
       of any publications within one month of being published."
```

**Trust Atlas Compliance:**
- Display data: YES (academic project)
- Store processed data: YES
- Attribute: Required + send publication notice
- Commercial: NO
- **CRITICAL**: Must notify Asian Barometer of any publications using data

---

### OECD Trust Survey

```
License: OECD Terms
Terms: Aggregate data freely available via OECD.Stat. Microdata
       requires research proposal. Generally open for non-commercial use.
```

**Trust Atlas Compliance:**
- Display data: YES (aggregate)
- Store processed data: YES
- Attribute: Required
- Commercial: Check specific dataset terms

---

### Edelman Trust Barometer

```
License: Custom (dashboard vs microdata)
Dashboard: Freely accessible, exports allowed
Microdata: Contact trustinstitute@edelman.com for academic access
```

**Trust Atlas Compliance:**
- Display data: YES (dashboard data)
- Store processed data: YES (dashboard exports)
- Attribute: Required
- Commercial: Dashboard summary YES; microdata case-by-case

---

## Attribution Requirements Summary

### Minimum Attribution Format

```markdown
## Data Sources

**Media Trust**: Reuters Institute Digital News Report [YEAR]
**European Institutional Trust**: Eurobarometer via GESIS
**African Institutional Trust**: Afrobarometer Round [X]
**Latin American Trust**: Latinobarómetro [YEAR]
**MENA Institutional Trust**: Arab Barometer Wave [X]
**Asian Institutional Trust**: Asian Barometer Wave [X]
```

### Full Citation Examples

**Reuters Institute:**
```
Newman, N., et al. (2025). Reuters Institute Digital News Report 2025.
Reuters Institute for the Study of Journalism.
```

**Eurobarometer:**
```
European Commission (2024). Standard Eurobarometer 101. Brussels:
European Commission, Directorate-General for Communication.
GESIS Data Archive, Cologne. ZA8843 Data file Version 1.0.0.
```

**Afrobarometer:**
```
Afrobarometer Data, [Country(ies)], Round [X], [Year(s)],
available at http://www.afrobarometer.org
```

---

## Compliance Checklist for Trust Atlas

### Before Adding New Source

- [ ] Document license type
- [ ] Verify commercial use permitted (or confirm Trust Atlas non-commercial status)
- [ ] Document attribution requirements
- [ ] Confirm redistribution terms
- [ ] Register/apply if required
- [ ] Set up attribution display in UI

### Ongoing Compliance

- [ ] Maintain source attribution on all visualizations
- [ ] Include data source citations in methodology page
- [ ] Track publication notifications (Asian Barometer)
- [ ] Monitor for license changes in source terms
- [ ] Remove data if Trust Atlas commercializes (non-commercial sources)

---

## Risk Assessment

### Low Risk Sources
- Reuters Institute (CC BY)
- Afrobarometer (Open)
- OECD aggregate data

### Medium Risk Sources
- Eurobarometer, Pew, Arab Barometer (non-commercial requirement)
- If Trust Atlas remains non-commercial: OK
- If commercialized: Must remove or renegotiate

### High Risk Sources
- Latinobarómetro (redistribution prohibited)
- Asian Barometer (publication notification required)
- Action: Display only aggregated/derived statistics, not raw data

### Not Viable for Integration
- Gallup World Poll (subscription cost prohibitive)
