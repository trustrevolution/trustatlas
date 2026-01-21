#!/usr/bin/env python3
"""
Latinobarómetro ETL Job

Processes Latinobarómetro survey data for trust measurements in Latin America.

Data source: https://www.latinobarometro.org/
Requires free registration to download data files.

Trust Variables (vary significantly by year):
- Interpersonal trust: P9, P10, SP9, etc. (1-2 or 1-3 scale)
- Institutional trust: P11, P13, etc. (1-4 scale)

Country identification: idenpa or pais (ISO numeric codes)
"""

import sys
from pathlib import Path
from typing import List, Optional, Tuple
from collections import defaultdict

import click
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation


# ISO numeric codes to ISO alpha-3 for Latin American countries
LATINO_COUNTRY_CODES = {
    32: "ARG",  # Argentina
    68: "BOL",  # Bolivia
    76: "BRA",  # Brazil
    152: "CHL",  # Chile
    170: "COL",  # Colombia
    188: "CRI",  # Costa Rica
    214: "DOM",  # Dominican Republic
    218: "ECU",  # Ecuador
    222: "SLV",  # El Salvador
    320: "GTM",  # Guatemala
    340: "HND",  # Honduras
    484: "MEX",  # Mexico
    558: "NIC",  # Nicaragua
    591: "PAN",  # Panama
    600: "PRY",  # Paraguay
    604: "PER",  # Peru
    858: "URY",  # Uruguay
    862: "VEN",  # Venezuela
}


class LatinobarometroProcessor(BaseProcessor):
    """Processor for Latinobarómetro survey data."""

    SOURCE_NAME = "Latinobarometro"
    MIN_SAMPLE_SIZE = 300

    # Comprehensive variable name patterns by era
    # Order matters - more specific patterns first
    INTERPERSONAL_VAR_PATTERNS = [
        # Modern format (2010+)
        "p9stgbs",
        "p9stgbsa",
        "p9stgbs_a",
        "p9stgbsc_a",
        # Mid-2000s format
        "p9st",
        "p10st",
        "p9n",
        "p10n",
        # Early 2000s format
        "p9no2",
        "p10no2",
        # 1990s format
        "sp9",
        "sp9a",
        "sp10",
    ]

    INSTITUTIONAL_VAR_PATTERNS = [
        # Modern format (2010+)
        "p11stgbs_a",
        "p11stgbs_b",
        "p11stgbs",
        "p11stgbsc",
        # Mid-2000s format
        "p11st",
        "p13st_a",
        "p13st_b",
        "p11cbs",
        # Early 2000s format
        "p11no2",
        # 1990s format
        "nsp11",
        "np11",
    ]

    COUNTRY_VARS = ["idenpa", "pais"]

    def download(self, year: int) -> Path:
        """Check for Latinobarómetro data files."""
        latino_dir = self.raw_data_dir / "latinobarometro"
        for pattern in [f"*{year}*Eng*.dta", f"*{year}*eng*.dta", f"*{year}*.dta"]:
            data_files = list(latino_dir.glob(f"**/{pattern}"))
            if data_files:
                eng_files = [f for f in data_files if "eng" in f.name.lower()]
                return Path(eng_files[0]) if eng_files else data_files[0]
        raise FileNotFoundError(
            f"No Latinobarómetro data found for {year} in {latino_dir}. "
            "Please download from https://www.latinobarometro.org/"
        )

    def _find_column(self, df: pd.DataFrame, patterns: List[str]) -> Optional[str]:
        """Find a column from a list of patterns (case-insensitive)."""
        df_cols_lower: dict[str, str] = {c.lower(): c for c in df.columns}
        for pattern in patterns:
            if pattern.lower() in df_cols_lower:
                return df_cols_lower[pattern.lower()]
        return None

    def _detect_trust_scale(self, data: pd.Series) -> Tuple[str, float, float]:
        """
        Detect the scale of a trust variable and return (scale_type, min_valid, max_valid).

        Returns:
            scale_type: "binary" (1-2), "ternary" (1-3), "quaternary" (1-4)
            min_valid: minimum valid value
            max_valid: maximum valid value
        """
        # Filter to positive values only (negative are typically missing codes)
        valid = data[data > 0]
        if len(valid) == 0:
            return "unknown", 1, 2

        max_val = valid.max()

        if max_val <= 2:
            return "binary", 1, 2
        elif max_val <= 3:
            return "ternary", 1, 3
        elif max_val <= 4:
            return "quaternary", 1, 4
        else:
            # Likely a different question with larger scale
            return "unknown", 1, 2

    def _calculate_trust_percentage(
        self, data: pd.Series, scale_type: str, min_val: float, max_val: float
    ) -> Optional[float]:
        """
        Calculate trust percentage based on scale type.

        For interpersonal trust:
        - binary (1-2): 1=trust, 2=careful → count 1s
        - ternary (1-3): 1=trust, 2=careful, 3=depends → count 1s
        - quaternary (1-4): 1-2=trust, 3-4=no trust → count 1-2s

        For institutional trust:
        - quaternary (1-4): 1-2=trust (a lot/some), 3-4=no trust → count 1-2s
        """
        # Filter to valid range
        valid = data[(data >= min_val) & (data <= max_val)]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        if scale_type in ("binary", "ternary"):
            # Trust = value 1
            trust_pct = (valid == 1).mean() * 100
        elif scale_type == "quaternary":
            # Trust = values 1 or 2
            trust_pct = (valid <= 2).mean() * 100
        else:
            return None

        return float(trust_pct)

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Latinobarómetro data to observations."""
        observations = []

        # Read data file
        try:
            df = pd.read_stata(str(data_path), convert_categoricals=False)
        except Exception as e:
            print(f"  Error reading {data_path}: {e}")
            return []

        # Find country column
        country_col = self._find_column(df, self.COUNTRY_VARS)
        if not country_col:
            print(f"  Country column not found in {data_path.name}")
            return []

        # Find trust variables
        interp_col = self._find_column(df, self.INTERPERSONAL_VAR_PATTERNS)
        inst_cols = []
        for pattern in self.INSTITUTIONAL_VAR_PATTERNS:
            col = self._find_column(df, [pattern])
            if col and col not in inst_cols:
                inst_cols.append(col)
                if len(inst_cols) >= 2:  # Only need 2 for averaging
                    break

        # Get unique countries
        countries = df[country_col].dropna().unique()

        for country_val in countries:
            # Get ISO3 code
            try:
                iso3 = LATINO_COUNTRY_CODES.get(int(country_val))
            except (ValueError, TypeError):
                continue

            if not iso3:
                continue

            country_data = df[df[country_col] == country_val]
            n = len(country_data)

            if n < self.MIN_SAMPLE_SIZE:
                continue

            # Process interpersonal trust
            if interp_col:
                interp_data = country_data[interp_col].dropna()
                scale_type, min_val, max_val = self._detect_trust_scale(interp_data)

                if scale_type != "unknown":
                    trust_pct = self._calculate_trust_percentage(
                        interp_data, scale_type, min_val, max_val
                    )
                    if trust_pct is not None:
                        valid_count = len(
                            interp_data[
                                (interp_data >= min_val) & (interp_data <= max_val)
                            ]
                        )
                        observations.append(
                            Observation(
                                iso3=iso3,
                                year=int(year),
                                source=self.SOURCE_NAME,
                                trust_type="interpersonal",
                                raw_value=round(trust_pct, 1),
                                raw_unit="% most people can be trusted",
                                score_0_100=round(trust_pct, 1),
                                sample_n=int(valid_count),
                                method_notes=f"Latinobarómetro {year} {interp_col} ({scale_type}), n={valid_count}",
                                source_url="https://www.latinobarometro.org",
                                methodology="4point",
                            )
                        )

            # Process institutional trust
            inst_scores = []
            inst_n = 0
            for col in inst_cols:
                col_data = country_data[col].dropna()
                scale_type, min_val, max_val = self._detect_trust_scale(col_data)

                if scale_type == "quaternary":
                    trust_pct = self._calculate_trust_percentage(
                        col_data, scale_type, min_val, max_val
                    )
                    if trust_pct is not None:
                        valid_count = len(
                            col_data[(col_data >= min_val) & (col_data <= max_val)]
                        )
                        inst_scores.append(trust_pct)
                        inst_n = max(inst_n, valid_count)

            if inst_scores:
                avg_inst = sum(inst_scores) / len(inst_scores)
                observations.append(
                    Observation(
                        iso3=iso3,
                        year=int(year),
                        source=self.SOURCE_NAME,
                        trust_type="institutional",
                        raw_value=round(avg_inst, 1),
                        raw_unit="% trust a lot/some",
                        score_0_100=round(avg_inst, 1),
                        sample_n=int(inst_n),
                        method_notes=f"Latinobarómetro {year} institutional avg, n={inst_n}",
                        source_url="https://www.latinobarometro.org",
                    )
                )

        return observations


def find_year_from_path(data_path: Path) -> Optional[int]:
    """Extract year from file path or filename."""
    import re

    # Try filename first
    match = re.search(r"(\d{4})", data_path.name)
    if match:
        year = int(match.group(1))
        if 1995 <= year <= 2030:
            return year
    # Try parent directory
    for parent in data_path.parents:
        match = re.search(r"(\d{4})", parent.name)
        if match:
            year = int(match.group(1))
            if 1995 <= year <= 2030:
                return year
    return None


@click.command()
@click.option("--year", type=int, default=None, help="Specific year to process")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process Latinobarómetro data."""
    processor = LatinobarometroProcessor()
    latino_dir = processor.raw_data_dir / "latinobarometro"

    # Get all English data files
    data_files = list(latino_dir.glob("**/*[Ee]ng*.dta"))
    if not data_files:
        data_files = list(latino_dir.glob("**/*.dta"))

    if not data_files:
        print(f"No Latinobarómetro data found in {latino_dir}")
        sys.exit(1)

    # Deduplicate by year (prefer English versions)
    files_by_year: dict[int, Path] = {}
    for data_path in data_files:
        file_year = find_year_from_path(data_path)
        if file_year:
            if file_year in files_by_year:
                if (
                    "eng" in data_path.name.lower()
                    and "eng" not in files_by_year[file_year].name.lower()
                ):
                    files_by_year[file_year] = data_path
            else:
                files_by_year[file_year] = data_path

    all_observations = []

    for file_year, data_path in sorted(files_by_year.items()):
        if year and file_year != year:
            continue

        print(f"Processing {file_year}: {data_path.name}")

        try:
            observations = processor.process(data_path, file_year)
            all_observations.extend(observations)

            by_type: dict[str, int] = defaultdict(int)
            for obs in observations:
                by_type[obs.trust_type] += 1

            for t, count in by_type.items():
                print(f"  {t}: {count} countries")
        except Exception as e:
            print(f"  Error: {e}")
            continue

    # Deduplicate
    seen = {}
    for obs in all_observations:
        key = (obs.iso3, obs.year, obs.source, obs.trust_type)
        seen[key] = obs
    deduped = list(seen.values())

    print(
        f"\nTotal: {len(deduped)} observations (deduped from {len(all_observations)})"
    )

    if not dry_run and deduped:
        processor.load_to_database(deduped)
        print("Saved to database")
    elif dry_run:
        print("Dry run - not saved")


if __name__ == "__main__":
    main()
