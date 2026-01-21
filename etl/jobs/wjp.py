#!/usr/bin/env python3
"""
World Justice Project Rule of Law Index ETL Job

Processes WJP Rule of Law Index data for governance quality measurement.
This provides an alternative/complement to WGI and CPI for the governance pillar.

Data source: https://worldjusticeproject.org/rule-of-law-index/
Coverage: 142 countries, 2012-2024

The WJP ROL Index measures rule of law based on 8 factors:
1. Constraints on Government Powers
2. Absence of Corruption
3. Open Government
4. Fundamental Rights
5. Order and Security
6. Regulatory Enforcement
7. Civil Justice
8. Criminal Justice

Scale: 0-1 (converted to 0-100)
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


class WJPProcessor(BaseProcessor):
    """Processor for WJP Rule of Law Index data."""

    SOURCE_NAME = "WJP"

    def download(self, year: int) -> Path:
        """Check for WJP data file."""
        wjp_dir = self.raw_data_dir / "wjp"
        data_files = list(wjp_dir.glob("*.xlsx"))

        if not data_files:
            raise FileNotFoundError(
                f"No WJP data found in {wjp_dir}. "
                "Download from https://worldjusticeproject.org/rule-of-law-index/"
            )

        return Path(data_files[0])

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process WJP Excel data to observations."""
        observations = []

        # Read the Historical Data sheet
        df = pd.read_excel(data_path, sheet_name="Historical Data")

        # Key columns
        year_col = "Year"
        iso_col = "Country Code"
        score_col = "WJP Rule of Law Index: Overall Score"
        corruption_col = "Factor 2: Absence of Corruption"

        for _, row in df.iterrows():
            iso3 = row.get(iso_col)
            if pd.isna(iso3) or not iso3:
                continue

            # Parse year (handle "2012-2013" format)
            year_val = row.get(year_col)
            if pd.isna(year_val):
                continue

            if isinstance(year_val, str) and "-" in year_val:
                # Use first year for ranges like "2012-2013"
                data_year = int(year_val.split("-")[0])
            else:
                data_year = int(year_val)

            # Overall Rule of Law score (0-1 scale)
            overall_score = row.get(score_col)
            if pd.notna(overall_score):
                observations.append(
                    Observation(
                        iso3=str(iso3),
                        year=data_year,
                        source=self.SOURCE_NAME,
                        trust_type="governance",
                        raw_value=round(float(overall_score), 3),
                        raw_unit="score 0-1",
                        score_0_100=round(float(overall_score) * 100, 1),
                        sample_n=None,
                        method_notes=f"WJP Rule of Law Index {data_year}",
                        source_url="https://worldjusticeproject.org/rule-of-law-index/",
                    )
                )

            # Absence of Corruption factor (0-1 scale) - alternative to CPI
            corruption_score = row.get(corruption_col)
            if pd.notna(corruption_score):
                observations.append(
                    Observation(
                        iso3=str(iso3),
                        year=data_year,
                        source=f"{self.SOURCE_NAME}-Corruption",
                        trust_type="governance",
                        raw_value=round(float(corruption_score), 3),
                        raw_unit="score 0-1",
                        score_0_100=round(float(corruption_score) * 100, 1),
                        sample_n=None,
                        method_notes=f"WJP Absence of Corruption {data_year}",
                        source_url="https://worldjusticeproject.org/rule-of-law-index/",
                    )
                )

        return observations


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process WJP Rule of Law Index data."""
    processor = WJPProcessor()
    wjp_dir = processor.raw_data_dir / "wjp"

    if not wjp_dir.exists():
        wjp_dir.mkdir(parents=True)
        print(f"Created {wjp_dir}")
        print(
            "Please download WJP data from https://worldjusticeproject.org/rule-of-law-index/"
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
        print(f"Years: {sorted(by_year.keys())}")
        print(f"Countries per year: {by_year.get(max(by_year.keys()), 0)} (latest)")

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
