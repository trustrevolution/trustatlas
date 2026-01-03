#!/usr/bin/env python3
"""
LAPOP AmericasBarometer ETL Job

Processes AmericasBarometer survey data for trust measurements in the Americas.
This source is critical for Caribbean coverage (Jamaica, Trinidad, Barbados, etc.)
which Latinobarómetro does not include.

Data source: https://www.vanderbilt.edu/lapop/
Requires free registration to download data files.

Trust Variables (consistent across waves):
- IT1: Interpersonal trust (1-4 scale: 1=very trustworthy, 4=untrustworthy)
- B21A: Trust in president/prime minister (1-7 scale: 1=not at all, 7=a lot)
- B13: Trust in national legislature/congress (1-7 scale)
- B10A: Trust in justice system (1-7 scale)
- B18: Trust in national police (1-7 scale)

Country identification: pais (numeric codes)

Coverage: 28+ countries including Caribbean nations
Years: 2004-2023
"""

import sys
from pathlib import Path
from typing import List, Optional
from collections import defaultdict
import re

import click
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


# LAPOP country codes to ISO alpha-3
# Source: LAPOP codebooks - pais variable
LAPOP_COUNTRY_CODES = {
    # North America
    1: "MEX",  # Mexico
    2: "GTM",  # Guatemala
    3: "SLV",  # El Salvador
    4: "HND",  # Honduras
    5: "NIC",  # Nicaragua
    6: "CRI",  # Costa Rica
    7: "PAN",  # Panama
    8: "COL",  # Colombia
    9: "ECU",  # Ecuador
    10: "BOL",  # Bolivia
    11: "PER",  # Peru
    12: "PRY",  # Paraguay
    13: "CHL",  # Chile
    14: "URY",  # Uruguay
    15: "BRA",  # Brazil
    16: "VEN",  # Venezuela
    17: "ARG",  # Argentina
    21: "DOM",  # Dominican Republic
    22: "HTI",  # Haiti
    23: "JAM",  # Jamaica - KEY CARIBBEAN
    24: "GUY",  # Guyana - KEY CARIBBEAN
    25: "TTO",  # Trinidad and Tobago - KEY CARIBBEAN
    26: "BLZ",  # Belize
    27: "SUR",  # Suriname - KEY CARIBBEAN
    28: "BHS",  # Bahamas - KEY CARIBBEAN
    29: "BRB",  # Barbados - KEY CARIBBEAN
    40: "USA",  # United States
    41: "CAN",  # Canada
    # Alternative codes seen in some waves
    100: "MEX",
    101: "GTM",
    102: "SLV",
    103: "HND",
    104: "NIC",
    105: "CRI",
    106: "PAN",
}


class LAPOPProcessor(BaseProcessor):
    """Processor for LAPOP AmericasBarometer survey data."""

    SOURCE_NAME = "LAPOP"
    MIN_SAMPLE_SIZE = 300

    # Variable patterns for trust questions
    # IT1: Interpersonal trust (1-4 scale, 1=trustworthy, 4=untrustworthy)
    INTERPERSONAL_VARS = ["it1", "it1r"]

    # Institutional trust (1-7 scale, 1=not at all, 7=a lot)
    INSTITUTIONAL_VARS = {
        "president": ["b21a", "b21"],  # Trust in president/PM
        "legislature": ["b13", "b13a"],  # Trust in congress/parliament
        "government": ["b14", "b14a"],  # Trust in national government
    }

    COUNTRY_VAR = "pais"
    YEAR_VAR = "year"
    WAVE_VAR = "wave"

    def download(self, year: int) -> Path:
        """Check for LAPOP data files."""
        lapop_dir = self.raw_data_dir / "lapop"

        # Try to find data file for specific year or merged dataset
        patterns = [
            f"*{year}*.dta",
            f"*{year}*.sav",
            "*merged*.dta",
            "*Grand_Merge*.dta",
            "*.dta",
        ]

        for pattern in patterns:
            data_files = list(lapop_dir.glob(f"**/{pattern}"))
            if data_files:
                return data_files[0]

        raise FileNotFoundError(
            f"No LAPOP data found in {lapop_dir}. "
            "Please download from https://www.vanderbilt.edu/lapop/raw-data.php"
        )

    def _find_column(self, df: pd.DataFrame, patterns: List[str]) -> Optional[str]:
        """Find a column from a list of patterns (case-insensitive)."""
        df_cols_lower = {c.lower(): c for c in df.columns}
        for pattern in patterns:
            if pattern.lower() in df_cols_lower:
                return df_cols_lower[pattern.lower()]
        return None

    def _calculate_interpersonal_trust(self, data: pd.Series) -> Optional[float]:
        """
        Calculate interpersonal trust percentage from IT1 variable.

        IT1 scale: 1=very trustworthy, 2=somewhat trustworthy,
                   3=not very trustworthy, 4=untrustworthy
        Trust = responses 1 or 2 (trustworthy/somewhat trustworthy)
        """
        # Filter valid responses (1-4)
        valid = data[(data >= 1) & (data <= 4)]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # Trust = 1 or 2
        trust_pct = (valid <= 2).mean() * 100
        return float(trust_pct)

    def _calculate_institutional_trust(self, data: pd.Series) -> Optional[float]:
        """
        Calculate institutional trust percentage from B-series variables.

        B-series scale: 1=not at all, 7=a lot
        Trust = responses 5, 6, or 7 (somewhat to a lot)
        """
        # Filter valid responses (1-7)
        valid = data[(data >= 1) & (data <= 7)]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # Trust = 5, 6, or 7 (top 3 of 7-point scale)
        trust_pct = (valid >= 5).mean() * 100
        return float(trust_pct)

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process LAPOP data to observations."""
        observations = []

        # Read data file
        try:
            if data_path.suffix.lower() == ".sav":
                import pyreadstat

                df, _ = pyreadstat.read_sav(str(data_path))
            else:
                df = pd.read_stata(str(data_path), convert_categoricals=False)
        except Exception as e:
            print(f"  Error reading {data_path}: {e}")
            return []

        # Normalize column names to lowercase
        df.columns = df.columns.str.lower()

        # Find country column
        if self.COUNTRY_VAR not in df.columns:
            print(f"  Country column '{self.COUNTRY_VAR}' not found")
            return []

        # Find year column if this is a merged file
        year_col = None
        for ycol in [self.YEAR_VAR, self.WAVE_VAR, "año"]:
            if ycol in df.columns:
                year_col = ycol
                break

        # Find trust variables
        interp_col = self._find_column(df, self.INTERPERSONAL_VARS)

        inst_cols = {}
        for inst_type, patterns in self.INSTITUTIONAL_VARS.items():
            col = self._find_column(df, patterns)
            if col:
                inst_cols[inst_type] = col

        if not interp_col and not inst_cols:
            print(f"  No trust variables found in {data_path.name}")
            return []

        # Get unique countries
        countries = df[self.COUNTRY_VAR].dropna().unique()

        for country_val in countries:
            # Get ISO3 code
            try:
                iso3 = LAPOP_COUNTRY_CODES.get(int(country_val))
            except (ValueError, TypeError):
                continue

            if not iso3:
                continue

            country_data = df[df[self.COUNTRY_VAR] == country_val]

            # If merged file, process by year
            if year_col:
                years_in_data = country_data[year_col].dropna().unique()
                for data_year in years_in_data:
                    try:
                        data_year = int(data_year)
                    except (ValueError, TypeError):
                        continue

                    if data_year < 2004 or data_year > 2030:
                        continue

                    year_data = country_data[country_data[year_col] == data_year]
                    obs = self._process_country_year(
                        year_data, iso3, data_year, interp_col, inst_cols
                    )
                    observations.extend(obs)
            else:
                # Single year file
                obs = self._process_country_year(
                    country_data, iso3, year, interp_col, inst_cols
                )
                observations.extend(obs)

        return observations

    def _process_country_year(
        self,
        data: pd.DataFrame,
        iso3: str,
        year: int,
        interp_col: Optional[str],
        inst_cols: dict,
    ) -> List[Observation]:
        """Process a single country-year combination."""
        observations = []

        n = len(data)
        if n < self.MIN_SAMPLE_SIZE:
            return []

        # Process interpersonal trust
        if interp_col and interp_col in data.columns:
            interp_data = data[interp_col].dropna()
            trust_pct = self._calculate_interpersonal_trust(interp_data)

            if trust_pct is not None:
                valid_n = len(interp_data[(interp_data >= 1) & (interp_data <= 4)])
                observations.append(
                    Observation(
                        iso3=iso3,
                        year=int(year),
                        source=self.SOURCE_NAME,
                        trust_type="interpersonal",
                        raw_value=round(trust_pct, 1),
                        raw_unit="% trustworthy/somewhat trustworthy",
                        score_0_100=round(trust_pct, 1),
                        sample_n=int(valid_n),
                        method_notes=f"LAPOP {year} IT1, n={valid_n}",
                        source_url="https://www.vanderbilt.edu/lapop",
                        methodology="4point",
                    )
                )

        # Process institutional trust (average of available measures)
        inst_scores = []
        inst_n = 0
        inst_vars_used = []

        for inst_type, col in inst_cols.items():
            if col in data.columns:
                col_data = data[col].dropna()
                trust_pct = self._calculate_institutional_trust(col_data)

                if trust_pct is not None:
                    valid_n = len(col_data[(col_data >= 1) & (col_data <= 7)])
                    inst_scores.append(trust_pct)
                    inst_n = max(inst_n, valid_n)
                    inst_vars_used.append(col)

        if inst_scores:
            avg_inst = sum(inst_scores) / len(inst_scores)
            observations.append(
                Observation(
                    iso3=iso3,
                    year=int(year),
                    source=self.SOURCE_NAME,
                    trust_type="institutional",
                    raw_value=round(avg_inst, 1),
                    raw_unit="% trust (5-7 on 7-point scale)",
                    score_0_100=round(avg_inst, 1),
                    sample_n=int(inst_n),
                    method_notes=f"LAPOP {year} {'/'.join(inst_vars_used)} avg, n={inst_n}",
                    source_url="https://www.vanderbilt.edu/lapop",
                )
            )

        return observations


def find_year_from_path(data_path: Path) -> Optional[int]:
    """Extract year from file path or filename."""
    match = re.search(r"(20\d{2})", data_path.name)
    if match:
        year = int(match.group(1))
        if 2004 <= year <= 2030:
            return year
    for parent in data_path.parents:
        match = re.search(r"(20\d{2})", parent.name)
        if match:
            year = int(match.group(1))
            if 2004 <= year <= 2030:
                return year
    return None


@click.command()
@click.option("--year", type=int, default=None, help="Specific year to process")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process LAPOP AmericasBarometer data."""
    processor = LAPOPProcessor()
    lapop_dir = processor.raw_data_dir / "lapop"

    if not lapop_dir.exists():
        lapop_dir.mkdir(parents=True)
        print(f"Created {lapop_dir}")
        print(
            "Please download LAPOP data from https://www.vanderbilt.edu/lapop/raw-data.php"
        )
        sys.exit(1)

    # Get all data files
    data_files = list(lapop_dir.glob("**/*.dta")) + list(lapop_dir.glob("**/*.sav"))

    if not data_files:
        print(f"No LAPOP data found in {lapop_dir}")
        print("Please download from https://www.vanderbilt.edu/lapop/raw-data.php")
        sys.exit(1)

    all_observations = []

    # Process all data files
    for data_path in sorted(data_files):
        print(f"Processing: {data_path.name}")

        # Determine year from filename if single-year file
        file_year = find_year_from_path(data_path)
        process_year = year or file_year or 2023

        try:
            observations = processor.process(data_path, process_year)
            all_observations.extend(observations)

            # Count by country and type
            by_country: dict[str, dict[str, int]] = defaultdict(
                lambda: defaultdict(int)
            )
            for obs in observations:
                by_country[obs.iso3][obs.trust_type] += 1

            if by_country:
                countries_found = list(by_country.keys())
                print(
                    f"  Found {len(countries_found)} country(s): {', '.join(countries_found)}"
                )

        except Exception as e:
            print(f"  Error: {e}")
            import traceback

            traceback.print_exc()

    # Deduplicate by (iso3, year, source, trust_type)
    seen = {}
    for obs in all_observations:
        key = (obs.iso3, obs.year, obs.source, obs.trust_type)
        seen[key] = obs
    deduped = list(seen.values())

    print(
        f"\nTotal: {len(deduped)} observations (deduped from {len(all_observations)})"
    )

    # Show Caribbean coverage
    caribbean_obs = [
        o
        for o in deduped
        if o.iso3 in ["JAM", "TTO", "BRB", "BHS", "GUY", "SUR", "BLZ", "HTI"]
    ]
    if caribbean_obs:
        print(f"Caribbean observations: {len(caribbean_obs)}")
        caribbean_countries = set(o.iso3 for o in caribbean_obs)
        print(f"Caribbean countries: {', '.join(sorted(caribbean_countries))}")

    if not dry_run and deduped:
        processor.load_to_database(deduped)
        print("Saved to database")
    elif dry_run:
        print("Dry run - not saved")


if __name__ == "__main__":
    main()
