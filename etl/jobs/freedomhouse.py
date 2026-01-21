#!/usr/bin/env python3
"""
Freedom House Freedom in the World ETL Job

Processes Freedom House data for political rights and civil liberties measurement.
Provides a democracy/freedom proxy that can complement governance indicators.

Data source: https://freedomhouse.org/report/freedom-world
Coverage: 211 countries/territories, 2013-2024

The Freedom in the World index measures:
- Political Rights (1-7 scale, 1=most free)
- Civil Liberties (1-7 scale, 1=most free)
- Total Score (0-100, 100=most free)

Status categories: F=Free, PF=Partly Free, NF=Not Free
"""

import sys
from pathlib import Path
from typing import List

import click
import pandas as pd

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation

# Freedom House country names to ISO3 mapping (for non-standard names)
FH_COUNTRY_MAP = {
    "Abkhazia": None,  # Disputed territory
    "Crimea": None,  # Disputed territory
    "Eastern Donbas": None,  # Disputed territory
    "Gaza Strip": None,  # Territory
    "Hong Kong": "HKG",
    "Indian Kashmir": None,  # Disputed territory
    "Kosovo": "KSV",
    "Nagorno-Karabakh": None,  # Disputed territory
    "Northern Cyprus": None,  # Disputed territory
    "Pakistani Kashmir": None,  # Disputed territory
    "Puerto Rico": "PRI",
    "South Ossetia": None,  # Disputed territory
    "Tibet": None,  # Disputed territory
    "Transnistria": None,  # Disputed territory
    "West Bank": None,  # Territory
    "Western Sahara": "ESH",
}


class FreedomHouseProcessor(BaseProcessor):
    """Processor for Freedom House data."""

    SOURCE_NAME = "FreedomHouse"

    def download(self, year: int) -> Path:
        """Check for Freedom House data file."""
        data_path: Path = self.raw_data_dir / "freedomhouse.xlsx"
        if not data_path.exists():
            raise FileNotFoundError(
                f"No Freedom House data found at {data_path}. "
                "Download from https://freedomhouse.org/report/freedom-world"
            )
        return data_path

    def _get_iso3(self, country_name: str) -> str | None:
        """Convert country name to ISO3 code."""
        # Check special mappings first
        if country_name in FH_COUNTRY_MAP:
            return FH_COUNTRY_MAP[country_name]

        # Try pycountry
        try:
            import pycountry

            # Try exact match
            country = pycountry.countries.get(name=country_name)
            if country:
                result: str = country.alpha_3
                return result

            # Try fuzzy search
            results = pycountry.countries.search_fuzzy(country_name)
            if results:
                fuzzy_result: str = results[0].alpha_3  # type: ignore[attr-defined]
                return fuzzy_result
        except Exception:
            pass

        return None

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Freedom House Excel data to observations."""
        observations = []

        df = pd.read_excel(data_path, sheet_name="FIW13-24", header=1)

        for _, row in df.iterrows():
            country = row.get("Country/Territory")
            if pd.isna(country):
                continue

            # Skip territories
            if row.get("C/T") == "t":
                continue

            edition = row.get("Edition")
            if pd.isna(edition):
                continue

            data_year = int(edition)

            # Get ISO3
            iso3 = self._get_iso3(str(country))
            if not iso3:
                continue

            # Total score (0-100, higher is better)
            # Skip invalid scores (some countries like Syria have -1)
            total = row.get("Total")
            if pd.notna(total) and 0 <= float(total) <= 100:
                observations.append(
                    Observation(
                        iso3=iso3,
                        year=data_year,
                        source=self.SOURCE_NAME,
                        trust_type="freedom",
                        raw_value=int(total),
                        raw_unit="score 0-100",
                        score_0_100=float(total),
                        sample_n=None,
                        method_notes=f"Freedom House FIW {data_year}, Status: {row.get('Status', 'N/A')}",
                        source_url="https://freedomhouse.org/report/freedom-world",
                    )
                )

        return observations


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process Freedom House Freedom in the World data."""
    processor = FreedomHouseProcessor()

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
        print(f"Years: {sorted(by_year.keys())}")
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
