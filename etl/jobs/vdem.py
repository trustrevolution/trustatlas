#!/usr/bin/env python3
"""
V-Dem (Varieties of Democracy) ETL Job

Processes V-Dem democracy indices as governance quality indicators.
Provides democracy scores that complement CPI, WGI, and Freedom House.

Data source: https://v-dem.net/data/the-v-dem-dataset/
Coverage: 179 countries, 1789-2024

Key indices (0-1 scale):
- v2x_polyarchy: Electoral Democracy Index
- v2x_libdem: Liberal Democracy Index
- v2x_partipdem: Participatory Democracy Index
- v2x_delibdem: Deliberative Democracy Index
- v2x_egaldem: Egalitarian Democracy Index
"""

import sys
from pathlib import Path
from typing import List

import click
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


class VDemProcessor(BaseProcessor):
    """Processor for V-Dem democracy data."""

    SOURCE_NAME = "V-Dem"

    def download(self, year: int) -> Path:
        """Check for V-Dem data file."""
        vdem_dir = self.raw_data_dir / "vdem"
        csv_files = list(vdem_dir.glob("*.csv"))

        if not csv_files:
            raise FileNotFoundError(
                f"No V-Dem data found in {vdem_dir}. "
                "Download from https://v-dem.net/data/the-v-dem-dataset/"
            )

        return csv_files[0]

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process V-Dem CSV data to observations."""
        observations = []

        print(f"Reading {data_path.name}...")
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} country-years")

        # Key columns
        country_col = "country_text_id"  # ISO3-like codes
        year_col = "year"

        # Liberal Democracy Index is the most comprehensive
        # Combines electoral democracy + liberal components (rule of law, constraints on executive)
        libdem_col = "v2x_libdem"

        # Filter to recent years (2000+) to keep dataset manageable
        df = df[df[year_col] >= 2000]

        for _, row in df.iterrows():
            country_code = row.get(country_col)
            data_year = row.get(year_col)

            if pd.isna(country_code) or pd.isna(data_year):
                continue

            # V-Dem uses some non-standard codes, map to ISO3
            iso3 = self._map_vdem_code(str(country_code))
            if not iso3:
                continue

            # Liberal Democracy Index (0-1 scale)
            libdem = row.get(libdem_col)
            if pd.notna(libdem):
                score_100 = float(libdem) * 100

                observations.append(
                    Observation(
                        iso3=iso3,
                        year=int(data_year),
                        source=self.SOURCE_NAME,
                        trust_type="freedom",
                        raw_value=round(float(libdem), 3),
                        raw_unit="score 0-1",
                        score_0_100=round(score_100, 1),
                        sample_n=None,
                        method_notes=f"V-Dem Liberal Democracy Index {int(data_year)}",
                        source_url="https://v-dem.net/",
                    )
                )

        return observations

    def _map_vdem_code(self, code: str) -> str | None:
        """Map V-Dem country codes to ISO3."""
        # V-Dem uses mostly ISO3 but has some exceptions
        vdem_map = {
            "PSG": "PSE",  # Palestine
            "ZZB": None,  # Zanzibar -> skip (part of Tanzania)
            "ZNZ": None,  # Zanzibar -> skip
            "SML": None,  # Somaliland -> skip (unrecognized)
            "HSD": None,  # Historical states
            "GMY": "DEU",  # Germany historical
            "YMD": "YEM",  # Yemen historical
            "VDR": "VNM",  # Vietnam historical
            "RVN": "VNM",  # Vietnam historical
            "YPR": "YEM",  # Yemen PDR
            "YAR": "YEM",  # Yemen Arab Republic
            "USS": "RUS",  # USSR -> Russia
            "YUG": "SRB",  # Yugoslavia -> Serbia
            "CSK": "CZE",  # Czechoslovakia -> Czech Republic
            "DDR": "DEU",  # East Germany
            "ETH": "ETH",  # Ethiopia
            "HAN": None,  # Hanover historical
            "HSE": None,  # Hesse historical
            "MEC": None,  # Mecklenburg historical
            "MOD": None,  # Modena historical
            "PAP": None,  # Papal States
            "PRM": None,  # Parma historical
            "BAV": None,  # Bavaria historical
            "BAD": None,  # Baden historical
            "SAX": None,  # Saxony historical
            "TUS": None,  # Tuscany historical
            "WRT": None,  # Wurttemberg historical
            "SIC": None,  # Two Sicilies historical
            "SAR": None,  # Sardinia historical
        }

        if code in vdem_map:
            return vdem_map[code]

        # Most codes are standard ISO3
        if len(code) == 3 and code.isalpha():
            return code

        return None


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process V-Dem democracy data."""
    processor = VDemProcessor()
    vdem_dir = processor.raw_data_dir / "vdem"

    if not vdem_dir.exists():
        vdem_dir.mkdir(parents=True)
        print(f"Created {vdem_dir}")
        print(
            "Please download V-Dem data from https://v-dem.net/data/the-v-dem-dataset/"
        )
        sys.exit(1)

    try:
        data_path = processor.download(year or 2024)
        print(f"Processing: {data_path.name}")

        observations = processor.process(data_path, year or 2024)

        # Filter by year if specified
        if year:
            observations = [o for o in observations if o.year == year]

        # Count by year
        by_year: dict[int, int] = {}
        for obs in observations:
            by_year[obs.year] = by_year.get(obs.year, 0) + 1

        print(f"Found {len(observations)} observations")
        print(f"Years: {min(by_year.keys())}-{max(by_year.keys())}")
        print(f"Countries per year: ~{sum(by_year.values()) // len(by_year)}")

        if not dry_run and observations:
            processor.load_to_database(observations)
            print("Saved to database")
        elif dry_run:
            print("Dry run - not saved")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
