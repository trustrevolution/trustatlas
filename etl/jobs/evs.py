#!/usr/bin/env python3
"""
EVS ETL Job - European Values Study

Processes manually downloaded EVS data into the trust index database.

EVS uses the same question wording as WVS and shares a common variable dictionary
through the Integrated Values Surveys (IVS) initiative.

Supports:
1. EVS Trend File 1981-2017 (preferred): Contains all waves 1-5
   - Variables: A165 (interpersonal), E069_11/12/13 (institutional)

2. Individual wave files (fallback)

IMPORTANT: EVS data requires registration at GESIS.
Download from: https://europeanvaluesstudy.eu/ or https://www.gesis.org/en/european-values-study

EVS adds European coverage for countries with sparse/no WVS data:
Iceland, Malta, Northern Ireland, etc.
"""

import sys
from pathlib import Path
from typing import List, Optional
from collections import defaultdict

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


# EVS uses ISO 3166-1 numeric codes (same as WVS for overlap)
# This mapping covers European countries in EVS
EVS_COUNTRY_CODES = {
    8: "ALB",  # Albania
    20: "AND",  # Andorra
    40: "AUT",  # Austria
    51: "ARM",  # Armenia
    31: "AZE",  # Azerbaijan
    112: "BLR",  # Belarus
    56: "BEL",  # Belgium
    70: "BIH",  # Bosnia and Herzegovina
    100: "BGR",  # Bulgaria
    124: "CAN",  # Canada (in joint EVS/WVS dataset)
    191: "HRV",  # Croatia
    196: "CYP",  # Cyprus
    197: "CYP",  # Cyprus-TCC (Turkish Cypriot Community) -> CYP
    203: "CZE",  # Czechia
    208: "DNK",  # Denmark
    233: "EST",  # Estonia
    246: "FIN",  # Finland
    250: "FRA",  # France
    268: "GEO",  # Georgia
    276: "DEU",  # Germany
    300: "GRC",  # Greece
    348: "HUN",  # Hungary
    352: "ISL",  # Iceland
    372: "IRL",  # Ireland
    380: "ITA",  # Italy
    428: "LVA",  # Latvia
    440: "LTU",  # Lithuania
    442: "LUX",  # Luxembourg
    470: "MLT",  # Malta
    498: "MDA",  # Moldova
    499: "MNE",  # Montenegro
    528: "NLD",  # Netherlands
    807: "MKD",  # North Macedonia
    578: "NOR",  # Norway
    616: "POL",  # Poland
    620: "PRT",  # Portugal
    642: "ROU",  # Romania
    643: "RUS",  # Russia
    688: "SRB",  # Serbia
    703: "SVK",  # Slovakia
    705: "SVN",  # Slovenia
    724: "ESP",  # Spain
    752: "SWE",  # Sweden
    756: "CHE",  # Switzerland
    792: "TUR",  # Turkey
    804: "UKR",  # Ukraine
    826: "GBR",  # United Kingdom
    840: "USA",  # USA (in joint EVS/WVS dataset)
    909: "GBR",  # Northern Ireland -> GBR
    915: "XKX",  # Kosovo (using unofficial code)
}


class EVSProcessor(BaseProcessor):
    """Processor for European Values Study data."""

    SOURCE_NAME = "EVS"

    # Minimum sample size from methodology
    MIN_SAMPLE_SIZE = 300

    def download(self, year: int) -> Path:
        """
        EVS requires manual download - this method checks for available files.

        Priority:
        1. Trend file (contains all waves 1981-2017)
        2. Individual wave files

        Args:
            year: Not used for EVS (wave-based)

        Returns:
            Path to EVS data file

        Raises:
            FileNotFoundError: If EVS data not found
        """
        evs_dir = self.raw_data_dir / "evs"

        # Priority 1: Trend file (preferred - contains all waves)
        trend_patterns = [
            "EVS_Trend*.csv",
            "*Trend*.csv",
            "ZA*.csv",  # GESIS archive ID format
        ]
        for pattern in trend_patterns:
            files = list(evs_dir.glob(pattern))
            if files:
                print(f"Found EVS trend data at {files[0]}")
                self._is_trend_file = True
                return files[0]

        # Priority 2: SPSS/Stata files we can convert
        for ext in ["*.sav", "*.dta"]:
            files = list(evs_dir.glob(f"**/{ext}"))
            if files:
                return self._convert_to_csv(files[0])

        raise FileNotFoundError(
            f"\nEVS data not found. Manual download required:\n"
            f"1. Register at https://www.gesis.org/en/european-values-study\n"
            f"2. Download EVS Trend File 1981-2017 (or individual waves)\n"
            f"3. Export as CSV and place in: {evs_dir}/\n"
        )

    def _convert_to_csv(self, stata_path: Path) -> Path:
        """Convert SPSS/Stata file to CSV."""
        print(f"Converting {stata_path} to CSV...")

        if stata_path.suffix == ".dta":
            df = pd.read_stata(str(stata_path), convert_categoricals=False)
        else:
            # Try pyreadstat for SPSS
            try:
                import pyreadstat

                df, _ = pyreadstat.read_sav(str(stata_path))
            except ImportError:
                raise ImportError(
                    "pyreadstat required to read SPSS files. "
                    "Install with: pip install pyreadstat"
                )

        csv_path = stata_path.with_suffix(".csv")
        df.to_csv(csv_path, index=False)
        print(f"Saved CSV to {csv_path}")
        return csv_path

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process EVS survey data into observations.

        Args:
            input_path: Path to EVS CSV file
            year: Used for output year (EVS uses actual survey year)

        Returns:
            List of Observation objects
        """
        print(f"Loading EVS data from {input_path}...")
        print("(This may take a moment for large files)")

        return self._process_trend_file(input_path)

    def _process_trend_file(self, input_path: Path) -> List[Observation]:
        """Process EVS Trend file (all waves 1981-2017)."""
        # EVS Trend file columns (harmonized with WVS)
        # Try different column name conventions
        possible_cols = {
            "country": ["S003", "c_aession", "country"],
            "country_alpha": ["S003A", "c_aession_alpha", "COUNTRY_ALPHA"],
            "year": ["S020", "year", "s020"],
            "interpersonal": ["A165", "a165"],
            "inst_parliament": ["E069_11", "e069_11"],
            "inst_government": ["E069_12", "e069_12"],
            "inst_parties": ["E069_13", "e069_13"],
        }

        # Load with all potentially relevant columns
        try:
            df = pd.read_csv(input_path, low_memory=False)
        except Exception:
            # Try reading as Stata if CSV fails
            df = pd.read_stata(str(input_path), convert_categoricals=False)

        print(f"Loaded {len(df)} survey responses")

        # Find actual column names
        col_map = {}
        for key, candidates in possible_cols.items():
            for cand in candidates:
                if cand in df.columns:
                    col_map[key] = cand
                    break
                # Case-insensitive check
                matches = [c for c in df.columns if c.lower() == cand.lower()]
                if matches:
                    col_map[key] = matches[0]
                    break

        if "country" not in col_map and "country_alpha" not in col_map:
            raise ValueError(
                f"No country column found. Columns: {df.columns.tolist()[:20]}"
            )

        if "year" not in col_map:
            raise ValueError(
                f"No year column found. Columns: {df.columns.tolist()[:20]}"
            )

        observations = []

        # Use country_alpha if available, else numeric country code
        country_col = col_map.get("country_alpha", col_map.get("country"))
        year_col = col_map["year"]

        # Group by country AND year
        for (country_code, survey_year), group_df in df.groupby(
            [country_col, year_col]
        ):
            survey_year = int(survey_year)

            # Get ISO3 code
            if country_col == col_map.get("country_alpha"):
                iso3 = str(country_code) if len(str(country_code)) == 3 else None
            else:
                iso3 = self._get_iso3(country_code)

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_code))
                continue

            # Interpersonal trust (A165): 1=trust, 2=careful, negative=missing
            # NOTE: EVS is only used for interpersonal trust. Institutional trust
            # is excluded because EVS has inconsistent variable coverage across
            # country/years (E069_11 vs E069_13), leading to measurement mismatches.
            # WVS is the sole source for institutional trust pillar.
            if "interpersonal" in col_map:
                inter_obs = self._calc_interpersonal(
                    group_df, col_map["interpersonal"], iso3, survey_year
                )
                if inter_obs:
                    observations.append(inter_obs)

        print(f"Processed {len(observations)} EVS observations")
        return observations

    def _calc_interpersonal(
        self, df: pd.DataFrame, col: str, iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate interpersonal trust from A165."""
        if col not in df.columns:
            return None

        # Filter valid responses (1=trust, 2=careful)
        valid = df[col].dropna()
        valid = valid[valid.isin([1, 2])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # % saying "can trust" (code 1)
        trust_pct = float((valid == 1).mean() * 100)

        return Observation(
            iso3=iso3,
            year=year,
            source="EVS",
            trust_type="interpersonal",
            raw_value=round(trust_pct, 1),
            raw_unit="Percent trusting",
            score_0_100=round(trust_pct, 1),
            sample_n=len(valid),
            method_notes=f"EVS A165, n={len(valid)}",
            source_url="https://europeanvaluesstudy.eu/",
            methodology="binary",
        )

    def _calc_institutional(
        self, df: pd.DataFrame, cols: List[str], iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate institutional trust from E069_11/12/13."""
        var_scores = []
        total_n = 0

        for col in cols:
            if col not in df.columns:
                continue

            # Filter valid responses (1-4), negative values are missing
            valid = df[col].dropna()
            valid = valid[valid.isin([1, 2, 3, 4])]

            if len(valid) < 100:
                continue

            # Calculate % confident (codes 1 or 2 = "great deal" or "quite a lot")
            confident_pct = float(((valid == 1) | (valid == 2)).mean() * 100)
            var_scores.append(confident_pct)
            total_n = max(total_n, len(valid))

        if not var_scores or total_n < self.MIN_SAMPLE_SIZE:
            return None

        avg_score = sum(var_scores) / len(var_scores)

        return Observation(
            iso3=iso3,
            year=year,
            source="EVS",
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit="Percent confident",
            score_0_100=round(avg_score, 1),
            sample_n=total_n,
            method_notes=f"EVS E069 avg ({len(var_scores)} vars), n~{total_n}",
            source_url="https://europeanvaluesstudy.eu/",
        )

    def _get_iso3(self, country_code) -> Optional[str]:
        """Convert EVS country code to ISO3."""
        # Try numeric lookup (handles int, float, and numeric strings)
        try:
            code_int = int(float(country_code))
            if code_int in EVS_COUNTRY_CODES:
                return EVS_COUNTRY_CODES[code_int]
        except (ValueError, TypeError):
            pass

        # Try string lookup (3-letter codes)
        code_str = str(country_code)
        if len(code_str) == 3 and code_str.isalpha():
            return code_str.upper()

        # Fallback to country mapper
        return self.country_mapper.get_or_map(code_str)


@click.command()
@click.option("--year", default=2017, help="Output year (ignored for trend files)")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Run EVS ETL process."""

    processor = EVSProcessor()

    try:
        data_path = processor.download(year)
        observations = processor.process(data_path, year)

        # Count by type and year range
        by_type: dict[str, int] = defaultdict(int)
        years_by_type: dict[str, list[int]] = defaultdict(list)
        for obs in observations:
            by_type[obs.trust_type] += 1
            years_by_type[obs.trust_type].append(obs.year)

        print("\nEVS ETL summary:")
        for t, count in by_type.items():
            yrs = sorted(set(years_by_type[t]))
            if yrs:
                print(f"  {t}: {count} observations ({min(yrs)}-{max(yrs)})")
            else:
                print(f"  {t}: {count} observations")

        if processor.stats.get("unmapped_countries"):
            unique_unmapped = set(processor.stats["unmapped_countries"])
            print(f"\nUnmapped countries: {len(unique_unmapped)}")

        if not dry_run and observations:
            # Ensure countries exist before loading
            iso3_codes = {obs.iso3 for obs in observations}
            processor.ensure_countries_exist(iso3_codes)
            processor.load_to_database(observations)
            print("Saved to database")
        elif dry_run:
            print("Dry run - not saved")

    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    except Exception as e:
        print(f"EVS ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
