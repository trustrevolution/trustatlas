#!/usr/bin/env python3
"""
Caucasus Barometer ETL Job

Processes CRRC Caucasus Barometer data for Armenia and Georgia.
Provides interpersonal and institutional trust data.

Data source: https://caucasusbarometer.org/
Coverage: Armenia, Georgia (2008-2024)

Trust measures:
- GALLTRU: Generalized trust (1-10 scale, 1=can't be too careful, 10=most people can be trusted)
- TRU* variables: Trust in institutions (5-point categorical scale)
"""

import sys
from pathlib import Path
from typing import List

import click
import pandas as pd
import numpy as np

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation

# Country mapping
CB_COUNTRY_MAP = {
    "Armenia": "ARM",
    "Georgia": "GEO",
    "Azerbaijan": "AZE",
}

# Institutional trust value mapping
INST_TRUST_MAP = {
    "Fully distrust": 1,
    "Rather distrust": 2,
    "Neither trust nor distrust": 3,
    "Rather trust": 4,
    "Fully trust": 5,
}


def scale_1_10_to_100(value):
    """Convert 1-10 trust scale to 0-100."""
    return (value - 1) / 9 * 100


def scale_1_5_to_100(value):
    """Convert 1-5 trust scale to 0-100."""
    return (value - 1) / 4 * 100


class CaucasusBarometerProcessor(BaseProcessor):
    """Processor for Caucasus Barometer data."""

    SOURCE_NAME = "CaucasusBarometer"

    def download(self, year: int) -> Path:
        """Check for Caucasus Barometer data file."""
        cb_dir = self.raw_data_dir / "caucasus"
        dta_files = list(cb_dir.glob("*.dta"))

        if not dta_files:
            raise FileNotFoundError(
                f"No Caucasus Barometer data found in {cb_dir}. "
                "Download from https://caucasusbarometer.org/en/downloads/"
            )

        # Return most recent file
        sorted_files = sorted(dta_files, key=lambda p: p.stat().st_mtime)
        return Path(sorted_files[-1])

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Caucasus Barometer Stata data to observations."""
        observations = []

        print(f"Reading {data_path.name}...")
        df = pd.read_stata(data_path)
        print(f"Loaded {len(df)} responses")

        # Data year from filename or default
        data_year = 2024

        # Key columns
        country_col = "COUNTRY"
        interpersonal_col = "GALLTRU"  # Generalized trust 1-10
        # Key institutional trust columns
        inst_cols = ["TRUEXEC", "TRUPARL", "TRUCRTS"]  # Executive, Parliament, Courts

        for country_name, iso3 in CB_COUNTRY_MAP.items():
            country_df = df[df[country_col] == country_name]
            if len(country_df) == 0:
                continue

            sample_n = len(country_df)

            # Interpersonal trust (GALLTRU)
            if interpersonal_col in df.columns:
                trust_values = country_df[interpersonal_col]
                # Convert categorical to numeric (filter out non-numeric like "Don't know")
                numeric_values = pd.to_numeric(
                    trust_values.astype(str), errors="coerce"
                )
                valid_trust = numeric_values.dropna()
                valid_trust = valid_trust[(valid_trust >= 1) & (valid_trust <= 10)]

                if len(valid_trust) >= 50:
                    mean_trust = float(valid_trust.mean())
                    score_100 = float(scale_1_10_to_100(mean_trust))

                    observations.append(
                        Observation(
                            iso3=iso3,
                            year=data_year,
                            source=self.SOURCE_NAME,
                            trust_type="interpersonal",
                            raw_value=round(mean_trust, 2),
                            raw_unit="mean 1-10 scale",
                            score_0_100=round(score_100, 1),
                            sample_n=int(len(valid_trust)),
                            method_notes=f"Caucasus Barometer {data_year}, GALLTRU: Generalized trust",
                            source_url="https://caucasusbarometer.org/",
                            methodology="4point",
                        )
                    )

            # Institutional trust - composite of key government institutions
            inst_values = []
            for col in inst_cols:
                if col in df.columns:
                    col_vals = country_df[col].map(INST_TRUST_MAP)
                    valid = col_vals.dropna()
                    if len(valid) >= 50:
                        inst_values.append(float(valid.mean()))

            if len(inst_values) >= 2:
                mean_inst = float(np.mean(inst_values))
                score_100 = float(scale_1_5_to_100(mean_inst))

                observations.append(
                    Observation(
                        iso3=iso3,
                        year=data_year,
                        source=self.SOURCE_NAME,
                        trust_type="institutional",
                        raw_value=round(mean_inst, 2),
                        raw_unit="mean 1-5 scale",
                        score_0_100=round(score_100, 1),
                        sample_n=int(sample_n),
                        method_notes=f"Caucasus Barometer {data_year}, Average of TRUEXEC/TRUPARL/TRUCRTS",
                        source_url="https://caucasusbarometer.org/",
                    )
                )

        return observations


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process Caucasus Barometer data."""
    processor = CaucasusBarometerProcessor()
    cb_dir = processor.raw_data_dir / "caucasus"

    if not cb_dir.exists():
        cb_dir.mkdir(parents=True)
        print(f"Created {cb_dir}")
        print("Please download data from https://caucasusbarometer.org/en/downloads/")
        sys.exit(1)

    try:
        data_path = processor.download(year or 2024)
        print(f"Processing: {data_path.name}")

        observations = processor.process(data_path, year or 2024)

        if year:
            observations = [o for o in observations if o.year == year]

        by_type: dict[str, int] = {}
        for obs in observations:
            by_type[obs.trust_type] = by_type.get(obs.trust_type, 0) + 1

        print(f"Found {len(observations)} observations")
        print(f"By type: {by_type}")

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
