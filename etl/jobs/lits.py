#!/usr/bin/env python3
"""
EBRD Life in Transition Survey (LiTS) ETL Job

Processes LiTS data for Eastern Europe, Central Asia, and comparator countries.
Provides interpersonal and institutional trust data for 37 economies.

Data source: https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html
Coverage: 37 countries, 2006-2023 (Wave IV is 2022-23)

Trust measures:
- q402: "People can be trusted" (interpersonal trust, 1-5 scale)
- q403a-n: Trust in institutions (presidency, government, courts, etc.)
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

# LiTS country name to ISO3 mapping
LITS_COUNTRY_MAP = {
    "Albania": "ALB",
    "Armenia": "ARM",
    "Azerbaijan": "AZE",
    "Belarus": "BLR",
    "Bosnia and Herzegovina": "BIH",
    "Bulgaria": "BGR",
    "Croatia": "HRV",
    "Czech Republic": "CZE",
    "Estonia": "EST",
    "Georgia": "GEO",
    "Germany": "DEU",  # Comparator
    "Greece": "GRC",
    "Hungary": "HUN",
    "Jordan": "JOR",
    "Kazakhstan": "KAZ",
    "Kosovo": "KSV",
    "Kyrgyz Republic": "KGZ",
    "Latvia": "LVA",
    "Lebanon": "LBN",
    "Lithuania": "LTU",
    "Moldova": "MDA",
    "Mongolia": "MNG",
    "Montenegro": "MNE",
    "Morocco": "MAR",
    "North Macedonia": "MKD",
    "Poland": "POL",
    "Romania": "ROU",
    "Russia": "RUS",
    "Serbia": "SRB",
    "Slovak Republic": "SVK",
    "Slovenia": "SVN",
    "Tajikistan": "TJK",
    "Tunisia": "TUN",
    "Turkey": "TUR",
    "Uzbekistan": "UZB",
    "West Bank & Gaza": "PSE",
    "Algeria": "DZA",
}

# Trust value text to numeric mapping
TRUST_VALUE_MAP = {
    "Complete distrust": 1,
    "Some distrust": 2,
    "Neither trust nor distrust": 3,
    "Some trust": 4,
    "Complete trust": 5,
}


# Trust scale: 1=Complete distrust, 5=Complete trust
# Convert to 0-100 scale: (value - 1) / 4 * 100
def scale_1_5_to_100(value):
    """Convert 1-5 trust scale to 0-100."""
    return (value - 1) / 4 * 100


class LiTSProcessor(BaseProcessor):
    """Processor for LiTS data."""

    SOURCE_NAME = "LiTS"

    def download(self, year: int) -> Path:
        """Check for LiTS data file."""
        lits_dir = self.raw_data_dir / "lits"
        csv_path: Path = lits_dir / "lits_iv.csv"

        if not csv_path.exists():
            raise FileNotFoundError(
                f"No LiTS data found at {csv_path}. "
                "Download from https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html"
            )

        return csv_path

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process LiTS CSV data to observations."""
        observations = []

        # Read CSV with low_memory=False to handle mixed types
        print(f"Reading {data_path.name}...")
        df = pd.read_csv(data_path, low_memory=False)
        print(f"Loaded {len(df)} responses")

        # LiTS IV was conducted in 2022-2023
        data_year = 2023

        # Columns of interest
        interpersonal_col = "q402"  # People can be trusted
        _institutional_cols = {  # Reserved for future institutional trust extraction
            "q403a": "Presidency",
            "q403b": "Government/Cabinet",
            "q403c": "Regional government",
            "q403d": "Local government",
            "q403e": "Parliament",
            "q403f": "Courts",
            "q403g": "Political parties",
            "q403h": "Armed forces",
            "q403i": "Police",
            "q403j": "Banks/financial system",
            "q403k": "Foreign investors",
            "q403l": "Religious institutions",
            "q403m": "Scientific institutions",
            "q403n": "Public health authorities",
        }

        # Convert text trust values to numeric
        def to_numeric(series):
            """Convert text trust values to numeric 1-5 scale."""
            return series.map(TRUST_VALUE_MAP)

        # Process by country
        for country_name, iso3 in LITS_COUNTRY_MAP.items():
            # Filter to this country
            country_df = df[df["country"] == country_name]

            if len(country_df) == 0:
                continue

            sample_n = len(country_df)

            # Interpersonal trust (q402)
            if interpersonal_col in df.columns:
                trust_values = to_numeric(country_df[interpersonal_col])
                # Filter valid responses (1-5)
                valid_trust = trust_values.dropna()
                valid_trust = valid_trust[(valid_trust >= 1) & (valid_trust <= 5)]

                if len(valid_trust) >= 50:  # Minimum sample size
                    mean_trust = float(valid_trust.mean())
                    score_100 = float(scale_1_5_to_100(mean_trust))

                    observations.append(
                        Observation(
                            iso3=iso3,
                            year=data_year,
                            source=self.SOURCE_NAME,
                            trust_type="interpersonal",
                            raw_value=round(mean_trust, 2),
                            raw_unit="mean 1-5 scale",
                            score_0_100=round(score_100, 1),
                            sample_n=int(len(valid_trust)),
                            method_notes="LiTS IV (2022-23), Q402: People can be trusted",
                            source_url="https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html",
                            methodology="4point",
                        )
                    )

            # Institutional trust - composite of key government institutions
            # Average of government, parliament, courts
            key_inst_cols = [
                "q403b",
                "q403e",
                "q403f",
            ]  # Government, Parliament, Courts
            inst_values = []

            for col in key_inst_cols:
                if col in df.columns:
                    col_vals = to_numeric(country_df[col])
                    valid = col_vals.dropna()
                    valid = valid[(valid >= 1) & (valid <= 5)]
                    if len(valid) >= 50:
                        inst_values.append(valid.mean())

            if len(inst_values) >= 2:  # Need at least 2 of 3 institutions
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
                        method_notes="LiTS IV (2022-23), Average of Q403b,e,f (govt/parliament/courts)",
                        source_url="https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html",
                    )
                )

            # Financial trust (q403j: Banks/financial system)
            financial_col = "q403j"
            if financial_col in df.columns:
                fin_values = to_numeric(country_df[financial_col])
                valid_fin = fin_values.dropna()
                valid_fin = valid_fin[(valid_fin >= 1) & (valid_fin <= 5)]

                if len(valid_fin) >= 50:  # Minimum sample size
                    mean_fin = float(valid_fin.mean())
                    score_100 = float(scale_1_5_to_100(mean_fin))

                    observations.append(
                        Observation(
                            iso3=iso3,
                            year=data_year,
                            source=self.SOURCE_NAME,
                            trust_type="financial",
                            raw_value=round(mean_fin, 2),
                            raw_unit="mean 1-5 scale",
                            score_0_100=round(score_100, 1),
                            sample_n=int(len(valid_fin)),
                            method_notes="LiTS IV (2022-23), Q403j: Banks/financial system",
                            source_url="https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html",
                        )
                    )

        return observations


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process EBRD Life in Transition Survey data."""
    processor = LiTSProcessor()
    lits_dir = processor.raw_data_dir / "lits"

    if not lits_dir.exists():
        lits_dir.mkdir(parents=True)
        print(f"Created {lits_dir}")
        print(
            "Please download LiTS data from https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html"
        )
        sys.exit(1)

    try:
        data_path = processor.download(year or 2023)
        print(f"Processing: {data_path.name}")

        observations = processor.process(data_path, year or 2023)

        # Filter by year if specified
        if year:
            observations = [o for o in observations if o.year == year]

        # Count by type
        by_type: dict[str, int] = {}
        for obs in observations:
            by_type[obs.trust_type] = by_type.get(obs.trust_type, 0) + 1

        print(f"Found {len(observations)} observations")
        print(
            f"Countries: {len(observations) // 2 if len(by_type) == 2 else len(observations)}"
        )
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
