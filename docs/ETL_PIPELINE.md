# ETL Pipeline

This document describes the Extract-Transform-Load pipeline for ingesting trust data from external sources into the Global Trust Index database.

## Overview

The ETL pipeline follows a processor pattern where each data source has a dedicated processor class that extends `BaseProcessor`. All processors share common functionality for downloading, validating, staging, and loading data.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ETL Pipeline Flow                                 │
│                                                                              │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌───────┐ │
│  │Download │────▶│ Process │────▶│Validate │────▶│  Stage  │────▶│ Load  │ │
│  │         │     │         │     │         │     │         │     │       │ │
│  │ API/CSV │     │Normalize│     │  QA     │     │  CSV    │     │  DB   │ │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘     └───────┘ │
│       │               │               │               │               │     │
│       ▼               ▼               ▼               ▼               ▼     │
│  data/raw/       List[Obs]       Warnings      data/staging/    observations│
│  {source}/                                      {src}_{yr}.csv     table    │
│  {year}/                                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
etl/
├── jobs/                     # Source-specific processors
│   ├── cpi.py               # Transparency International CPI
│   ├── wgi.py               # World Bank Governance Indicators
│   ├── oecd.py              # OECD Trust Indicators
│   ├── wvs.py               # World Values Survey
│   ├── ess.py               # European Social Survey
│   ├── gss.py               # General Social Survey (USA)
│   ├── afrobarometer.py     # African countries
│   ├── arabbarometer.py     # Arab countries
│   └── asianbarometer.py    # Asian countries
├── pipelines/
│   └── assemble.py          # GTI score computation
├── common/
│   ├── base.py              # BaseProcessor abstract class
│   ├── scaling.py           # Normalization functions
│   ├── countries.py         # ISO code mapping
│   └── http.py              # HTTP client utilities
├── tests/
│   ├── test_scaling.py
│   ├── test_countries.py
│   └── conftest.py
└── requirements.txt
```

## The Observation Data Model

All data flows through the `Observation` dataclass, which represents a single trust measurement:

```python
@dataclass
class Observation:
    iso3: str           # ISO 3166-1 alpha-3 country code
    year: int           # Data collection year
    source: str         # Source identifier ("CPI", "WGI", "WVS", etc.)
    trust_type: str     # Pillar classification
    raw_value: float    # Original value in source's native scale
    raw_unit: str       # Description of the original scale
    score_0_100: float  # Normalized to 0-100 (ALWAYS use this)
    sample_n: int|None  # Survey sample size (for surveys only)
    method_notes: str   # How the value was calculated
    source_url: str     # Link to source documentation
```

### Trust Types

| Value | Description | Typical Sources |
|-------|-------------|-----------------|
| `interpersonal` | Trust in other people | WVS, ESS, GSS |
| `institutional` | Trust in government/institutions | WVS, ESS, OECD |
| `governance` | Institutional quality composite | Computed from CPI+WGI |
| `cpi` | Corruption Perceptions Index | CPI (raw) |
| `wgi` | World Governance Indicators | WGI (raw) |
| `oecd` | OECD trust data | OECD |
| `derived` | Computed or interpolated | Various |

## BaseProcessor Class

All ETL jobs extend `BaseProcessor`, which provides:

### Initialization

```python
class BaseProcessor(ABC):
    SOURCE_NAME: str = "unknown"  # Override in subclass
    TRUST_TYPE: str = "unknown"   # Override in subclass

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.raw_data_dir = self.project_root / "data" / "raw"
        self.staging_dir = self.project_root / "data" / "staging"
        self.reference_dir = self.project_root / "data" / "reference"

        self.country_mapper = CountryMapper()
        self.http_client = ResilientHTTPClient()

        self.stats = {
            "countries_processed": 0,
            "observations_created": 0,
            "unmapped_countries": [],
            "warnings": [],
        }
```

### Abstract Methods (Must Override)

```python
@abstractmethod
def download(self, year: int) -> Path:
    """Download raw data for the specified year.

    Returns:
        Path to downloaded file
    """
    pass

@abstractmethod
def process(self, input_path: Path, year: int) -> List[Observation]:
    """Process raw data into observations.

    Returns:
        List of Observation objects
    """
    pass
```

### Provided Methods

| Method | Description |
|--------|-------------|
| `validate_observation(obs)` | Check score bounds, ISO3 validity, sample sizes |
| `save_staging_data(observations, year)` | Write intermediate CSV to staging directory |
| `load_to_database(observations)` | Upsert observations to PostgreSQL |
| `ensure_countries_exist(iso3_codes)` | Pre-insert missing countries |
| `run(year, skip_download)` | Execute full ETL pipeline |
| `get_db_connection()` | Get PostgreSQL connection from env vars |

### The run() Pipeline

```python
def run(self, year: int, skip_download: bool = False) -> Dict[str, Any]:
    """Run the complete ETL pipeline."""

    # 1. Download raw data (or use existing)
    if skip_download:
        raw_path = self._get_expected_raw_path(year)
    else:
        raw_path = self.download(year)

    # 2. Process into observations
    observations = self.process(raw_path, year)

    # 3. Validate all observations
    for obs in observations:
        warnings = self.validate_observation(obs)
        self.stats["warnings"].extend(warnings)

    # 4. Ensure countries exist in database
    iso3_codes = {obs.iso3 for obs in observations}
    self.ensure_countries_exist(iso3_codes)

    # 5. Save staging data (for auditability)
    self.save_staging_data(observations, year)

    # 6. Load to database (upsert)
    self.load_to_database(observations)

    return self.stats
```

## Normalization Functions

All values must be normalized to 0-100 scale. The `etl/common/scaling.py` module provides standard transformations:

### scale_0_10_to_percent

Converts 0-10 scale to 0-100:

```python
def scale_0_10_to_percent(value: float) -> float:
    return value * 10

# Usage: ESS trust variables (ppltrst, trstprl, etc.)
# Example: 5.8 → 58.0
```

### scale_wgi

Converts World Bank WGI scale (-2.5 to +2.5) to 0-100:

```python
def scale_wgi(value: float) -> float:
    return ((value + 2.5) / 5) * 100

# Examples:
# -2.5 → 0.0   (worst governance)
#  0.0 → 50.0  (average governance)
# +2.5 → 100.0 (best governance)
```

### scale_likert_4_to_percent

Converts 4-point Likert responses to percent who trust:

```python
def scale_likert_4_to_percent(
    responses: Dict[int, int],
    trust_codes: tuple = (1,)
) -> Optional[float]:
    trust_count = sum(responses.get(code, 0) for code in trust_codes)
    total = sum(responses.values())
    return (trust_count / total) * 100 if total > 0 else None

# Usage: WVS Q57 (interpersonal trust)
# - 1 = "Most people can be trusted"
# - 2 = "Need to be very careful"
# Example: {1: 400, 2: 600} → 40.0%

# Usage: WVS Q71-76 (institutional trust)
# - 1 = "A great deal", 2 = "Quite a lot" → trust
# - 3 = "Not very much", 4 = "None at all" → distrust
# Example: {1: 200, 2: 300, 3: 300, 4: 200} with trust_codes=(1,2) → 50.0%
```

### Utility Functions

```python
def clamp_score(value: float, min_val=0.0, max_val=100.0) -> float:
    """Clamp score to valid range."""
    return max(min_val, min(max_val, value))

def validate_score(value: float, source: str = "unknown") -> float:
    """Validate score is within 0-100 range, raise if not."""
    if value < 0 or value > 100:
        raise ValueError(f"Score {value} from {source} is outside valid range")
    return value
```

## Source-Specific Processors

### CPI Processor (cpi.py)

**Source:** Transparency International Corruption Perceptions Index
**Trust Type:** `cpi` (maps to governance pillar)
**Format:** Excel (from TI) or CSV (from DataHub fallback)
**Normalization:** Already 0-100

```python
class CPIProcessor(BaseProcessor):
    SOURCE_NAME = "CPI"
    TRUST_TYPE = "governance"

    TI_URLS = {
        2024: "https://files.transparency.org/.../CPI2024.xlsx",
        2023: "https://files.transparency.org/.../CPI2023.xlsx",
        # ...
    }

    def download(self, year: int) -> Path:
        # Try TI direct download first
        # Fall back to DataHub if TI fails
        pass

    def process(self, input_path: Path, year: int) -> List[Observation]:
        # Auto-detect format (TI Excel vs DataHub CSV)
        # Map country names to ISO3
        # CPI is already 0-100, minimal transformation
        pass
```

### WGI Processor (wgi.py)

**Source:** World Bank Worldwide Governance Indicators
**Trust Type:** `wgi` (maps to governance pillar)
**Format:** JSON via World Bank API
**Normalization:** `((x + 2.5) / 5) * 100`

**Indicators Used:**
- `CC.EST` - Control of Corruption
- `GE.EST` - Government Effectiveness
- `RL.EST` - Rule of Law

The processor averages these three indicators to produce a single governance score.

### OECD Processor (oecd.py)

**Source:** OECD Trust Indicators
**Trust Type:** `oecd` (maps to institutional pillar)
**Format:** CSV via OECD.Stat API
**Normalization:** Already 0-100 (percent who trust)

### WVS Processor (wvs.py)

**Source:** World Values Survey
**Trust Type:** `interpersonal`, `institutional`, `media`
**Format:** Bulk CSV download (manual)
**Normalization:** Likert to percent

**Key Variables:**
- Q57: General interpersonal trust
- Q71-76: Trust in institutions (government, parliament, etc.)

**Note:** WVS data requires manual download due to terms of use. Place files in `data/raw/wvs/`.

### ESS Processor (ess.py)

**Source:** European Social Survey
**Trust Type:** `interpersonal`, `institutional`
**Format:** CSV via NSD API
**Normalization:** 0-10 scale → percent (×10)

**Key Variables:**
- `ppltrst`: Interpersonal trust (0-10)
- `trstprl`: Trust in parliament (0-10)
- `trstplt`: Trust in politicians (0-10)

### GSS Processor (gss.py)

**Source:** General Social Survey (USA only)
**Trust Type:** `interpersonal`, `institutional`
**Format:** Stata .dta file (manual download)
**Normalization:** Likert to percent

## Assembly Pipeline

The assembly pipeline (`etl/pipelines/assemble.py`) computes GTI scores from individual observations.

### GTIAssembler Class

```python
class GTIAssembler:
    # GTI pillar weights from methodology.yaml
    pillar_weights = {
        "interpersonal": 0.3,
        "institutional": 0.4,
        "governance": 0.3,
    }

    # Source weights within each pillar
    source_weights = {
        "governance": {
            "CPI": 0.5,
            "WGI": 0.5,
        },
        "interpersonal": {
            "WVS": 0.6,
            "ESS": 0.4,
        },
        "institutional": {
            "WVS": 0.4,
            "ESS": 0.3,
            "OECD": 0.3,
        },
    }
```

### Assembly Steps

1. **Fetch Pillar Scores**
   - Query observations for the target year
   - Group by country and pillar
   - Compute weighted average per pillar using source weights

2. **Compute Confidence Tiers**
   - Assign per-pillar confidence based on data recency
   - No composite index (pillars displayed independently)

3. **Save Country-Year Scores**
   - Upsert to `country_year` table

### Confidence Tier Logic

Each pillar gets its own confidence tier:

```python
def compute_confidence_tier(pillar_data):
    """Assign confidence tier based on data recency."""
    if not pillar_data:
        return None  # No data for this pillar

    years_old = current_year - pillar_data.latest_year

    if years_old <= 3:
        return "A"  # High confidence - recent data
    elif years_old <= 7:
        return "B"  # Moderate confidence - older data
    else:
        return "C"  # Estimate - stale data
```

**Note:** We do not compute a composite GTI score. Each pillar is displayed independently to avoid artificial volatility from mixing survey data (~5-year cycles) with annual governance data.

## Running ETL Jobs

### Via Makefile

```bash
# Individual sources
make etl-cpi YEAR=2024
make etl-wgi YEAR=2024
make etl-oecd YEAR=2024
make etl-wvs YEAR=2024
make etl-ess YEAR=2024

# Governance combo (CPI + WGI)
make etl-gov YEAR=2024

# All sources + assemble
make etl-all YEAR=2024

# Assembly only
make assemble YEAR=2024 SOURCES=CPI,WGI
```

### Direct Python

```bash
# Run a specific processor
cd etl
python -m jobs.cpi --year 2024

# Run assembly
python -m pipelines.assemble --year 2024 --sources CPI,WGI
```

### Common Options

| Option | Description |
|--------|-------------|
| `--year YYYY` | Target year (default: current year) |
| `--skip-download` | Use existing raw data |
| `--sources SRC1,SRC2` | Filter to specific sources (assembly only) |

## Adding a New Data Source

### Step 1: Create Processor Class

```python
# etl/jobs/newsource.py
from etl.common.base import BaseProcessor, Observation

class NewSourceProcessor(BaseProcessor):
    SOURCE_NAME = "NEWSOURCE"
    TRUST_TYPE = "interpersonal"  # or "institutional" or "governance"

    def download(self, year: int) -> Path:
        """Download raw data from source API or URL."""
        output_dir = self.raw_data_dir / self.SOURCE_NAME.lower() / str(year)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / "data.csv"

        # Fetch data...
        response = self.http_client.get(f"https://api.source.org/data/{year}")
        output_path.write_bytes(response.content)

        return output_path

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """Parse raw data into Observation objects."""
        observations = []
        df = pd.read_csv(input_path)

        for _, row in df.iterrows():
            # Map country name to ISO3
            iso3 = self.country_mapper.get_iso3(row["country"])
            if not iso3:
                self.stats["unmapped_countries"].append(row["country"])
                continue

            # Normalize to 0-100
            raw_value = row["trust_score"]
            normalized = scale_your_source(raw_value)

            observations.append(Observation(
                iso3=iso3,
                year=year,
                source=self.SOURCE_NAME,
                trust_type=self.TRUST_TYPE,
                raw_value=raw_value,
                raw_unit="Description of original scale",
                score_0_100=normalized,
                sample_n=row.get("sample_size"),
                method_notes="Normalization method applied",
                source_url="https://source.org/methodology",
            ))

        return observations


if __name__ == "__main__":
    import click

    @click.command()
    @click.option("--year", default=2024)
    @click.option("--skip-download", is_flag=True)
    def main(year, skip_download):
        processor = NewSourceProcessor()
        stats = processor.run(year, skip_download)
        print(f"Processed {stats['observations_created']} observations")

    main()
```

### Step 2: Add Makefile Target

```makefile
etl-newsource:
    python3 etl/jobs/newsource.py --year $(YEAR)
```

### Step 3: Update Source Weights (if needed)

If the source contributes to pillar scores, update `etl/pipelines/assemble.py`:

```python
source_weights = {
    "interpersonal": {
        "WVS": 0.5,
        "ESS": 0.3,
        "NEWSOURCE": 0.2,  # Add new source
    },
}
```

### Step 4: Add to Source Metadata

```sql
INSERT INTO source_metadata (source, description, cadence, coverage, license, access_mode)
VALUES ('NEWSOURCE', 'New Source Description', 'Annual', 'Global', 'CC BY 4.0', 'API');
```

### Step 5: Add Tests

```python
# etl/tests/test_newsource.py
from etl.jobs.newsource import NewSourceProcessor

def test_process_valid_data(sample_csv):
    processor = NewSourceProcessor()
    observations = processor.process(sample_csv, 2024)

    assert len(observations) > 0
    assert all(0 <= obs.score_0_100 <= 100 for obs in observations)
```

## Data Quality Checks

The pipeline includes several validation layers:

### Observation Validation

```python
def validate_observation(self, obs: Observation) -> List[str]:
    warnings = []

    # Score bounds (raises if invalid)
    if obs.score_0_100 < 0 or obs.score_0_100 > 100:
        raise ValueError(f"Score {obs.score_0_100} outside [0, 100]")

    # ISO3 validity
    if not self.country_mapper.validate_iso3(obs.iso3):
        warnings.append(f"ISO3 '{obs.iso3}' not in reference data")

    # Sample size
    if obs.sample_n is not None and obs.sample_n < 300:
        warnings.append(f"Low sample size: n={obs.sample_n}")

    return warnings
```

### Tracked Statistics

Each processor run returns statistics:

```python
stats = {
    "year": 2024,
    "source": "CPI",
    "countries_processed": 180,
    "observations_created": 180,
    "unmapped_countries": ["Taiwan", "Kosovo"],
    "warnings": ["Low sample size for XXX: n=250"],
    "success": True,
}
```

## Debugging

### Check Staging Files

```bash
# View intermediate output
head -20 data/staging/cpi_2024.csv

# Count observations
wc -l data/staging/*.csv
```

### Query Database

```bash
# Check loaded observations
psql $POSTGRES_URL -c "
    SELECT source, trust_type, COUNT(*), AVG(score_0_100)
    FROM observations
    WHERE year = 2024
    GROUP BY source, trust_type
"
```

### Re-run Assembly

```bash
# With specific sources
make assemble YEAR=2024 SOURCES=CPI

# Check results
psql $POSTGRES_URL -c "
    SELECT iso3, gti, confidence_tier
    FROM country_year
    WHERE year = 2024
    ORDER BY gti DESC
    LIMIT 10
"
```

## Related Documentation

- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema
- [METHODOLOGY.md](./METHODOLOGY.md) - GTI calculation details
- [DATA_SOURCES.md](./DATA_SOURCES.md) - Source documentation
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflows
