#!/usr/bin/env python3
"""
Eurobarometer ETL Job

Processes Standard Eurobarometer data for EU institutional and media trust.
Provides trust in national government, parliament, justice system, and media.

Data source: GESIS Eurobarometer Data Service
https://www.gesis.org/en/eurobarometer-data-service

Coverage: 27 EU countries + candidate countries, 2024
Trust variables (QA6 battery):
- qa6_1: Trust in Media
- qa6_8: Trust in National Government
- qa6_9: Trust in National Parliament
- qa6_3: Trust in Justice/Legal System
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

from etl.common.base import BaseProcessor, Observation

# Eurobarometer ISO2 to ISO3 mapping
EB_COUNTRY_MAP = {
    "AT": "AUT",  # Austria
    "BE": "BEL",  # Belgium
    "BG": "BGR",  # Bulgaria
    "CY": "CYP",  # Cyprus
    "CZ": "CZE",  # Czech Republic
    "DE": "DEU",  # Germany
    "DK": "DNK",  # Denmark
    "EE": "EST",  # Estonia
    "ES": "ESP",  # Spain
    "FI": "FIN",  # Finland
    "FR": "FRA",  # France
    "GR": "GRC",  # Greece
    "HR": "HRV",  # Croatia
    "HU": "HUN",  # Hungary
    "IE": "IRL",  # Ireland
    "IT": "ITA",  # Italy
    "LT": "LTU",  # Lithuania
    "LU": "LUX",  # Luxembourg
    "LV": "LVA",  # Latvia
    "MT": "MLT",  # Malta
    "NL": "NLD",  # Netherlands
    "PL": "POL",  # Poland
    "PT": "PRT",  # Portugal
    "RO": "ROU",  # Romania
    "SE": "SWE",  # Sweden
    "SI": "SVN",  # Slovenia
    "SK": "SVK",  # Slovakia
    # Candidate countries
    "AL": "ALB",  # Albania
    "BA": "BIH",  # Bosnia and Herzegovina
    "ME": "MNE",  # Montenegro
    "MK": "MKD",  # North Macedonia
    "RS": "SRB",  # Serbia
    "TR": "TUR",  # Turkey
    "XK": "XKX",  # Kosovo
    "MD": "MDA",  # Moldova
    "UA": "UKR",  # Ukraine
    "GB": "GBR",  # United Kingdom (if present)
    "GB-GBN": "GBR",
    "GB-NIR": "GBR",
    "DE-W": "DEU",  # West Germany
    "DE-E": "DEU",  # East Germany
    "GE": "GEO",  # Georgia
    # Skip sub-regions
    "RS-KM": None,  # Serbia-Kosovo (counted in RS)
    "CY-TCC": None,  # Turkish Cypriot Community
}

# Trust value mapping: "Tend to trust" = 1, "Tend not to trust" = 0
TRUST_MAP = {
    "Tend to trust": 100,
    "Tend not to trust": 0,
}


class EurobarometerProcessor(BaseProcessor):
    """Processor for Eurobarometer data."""

    SOURCE_NAME = "Eurobarometer"

    def download(self, year: int) -> Path:
        """Check for Eurobarometer data file."""
        eb_dir = self.raw_data_dir / "eurobarometer"
        dta_files = list(eb_dir.glob("*.dta"))

        if not dta_files:
            raise FileNotFoundError(
                f"No Eurobarometer data found in {eb_dir}. "
                "Download from https://search.gesis.org/"
            )

        return dta_files[0]

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Eurobarometer Stata data to observations."""
        observations = []

        print(f"Reading {data_path.name}...")
        df = pd.read_stata(data_path)
        print(f"Loaded {len(df)} responses from {df['isocntry'].nunique()} countries")

        # Data year from filename or survey
        data_year = 2024

        # Key columns
        country_col = "isocntry"
        # Trust in institutions battery
        media_col = "qa6_1"  # Media
        govt_col = "qa6_8"  # National Government
        parl_col = "qa6_9"  # National Parliament
        just_col = "qa6_3"  # Justice/Legal System

        # Map country codes to ISO3
        df["iso3"] = df[country_col].map(
            lambda x: EB_COUNTRY_MAP.get(str(x)) if pd.notna(x) else None
        )

        # Report unmapped
        unmapped = df[df["iso3"].isna()][country_col].unique()
        for code in unmapped:
            if pd.notna(code) and str(code) not in EB_COUNTRY_MAP:
                print(f"Unmapped country: {code}")

        # Process by ISO3 (aggregates DE-W/DE-E into DEU, etc.)
        for iso3 in df["iso3"].dropna().unique():
            country_df = df[df["iso3"] == iso3]
            sample_n = len(country_df)

            # Calculate trust percentage for each institution
            trust_scores = []

            for col, inst_name in [
                (govt_col, "government"),
                (parl_col, "parliament"),
                (just_col, "justice"),
            ]:
                if col not in df.columns:
                    continue

                values = country_df[col].map(TRUST_MAP)
                valid = values.dropna()

                if len(valid) >= 50:
                    trust_scores.append(float(valid.mean()))

            # Create composite institutional trust score
            if len(trust_scores) >= 2:
                mean_trust = float(np.mean(trust_scores))

                observations.append(
                    Observation(
                        iso3=iso3,
                        year=data_year,
                        source=self.SOURCE_NAME,
                        trust_type="institutional",
                        raw_value=round(mean_trust, 1),
                        raw_unit="percent trust",
                        score_0_100=round(mean_trust, 1),
                        sample_n=int(sample_n),
                        method_notes="Eurobarometer 101.3 (Apr-May 2024), QA6: Trust in govt/parliament/justice",
                        source_url="https://www.gesis.org/en/eurobarometer-data-service",
                    )
                )

            # Create media trust observation
            if media_col in df.columns:
                media_values = country_df[media_col].map(TRUST_MAP)
                valid_media = media_values.dropna()

                if len(valid_media) >= 50:
                    media_trust = float(valid_media.mean())
                    observations.append(
                        Observation(
                            iso3=iso3,
                            year=data_year,
                            source=self.SOURCE_NAME,
                            trust_type="media",
                            raw_value=round(media_trust, 1),
                            raw_unit="percent trust",
                            score_0_100=round(media_trust, 1),
                            sample_n=int(len(valid_media)),
                            method_notes="Eurobarometer 101.3 (Apr-May 2024), QA6_1: Trust in Media",
                            source_url="https://www.gesis.org/en/eurobarometer-data-service",
                        )
                    )

        return observations


@click.command()
@click.option("--year", type=int, default=None, help="Filter to specific year")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process Eurobarometer data."""
    processor = EurobarometerProcessor()
    eb_dir = processor.raw_data_dir / "eurobarometer"

    if not eb_dir.exists():
        eb_dir.mkdir(parents=True)
        print(f"Created {eb_dir}")
        print("Please download Eurobarometer data from https://search.gesis.org/")
        sys.exit(1)

    try:
        data_path = processor.download(year or 2024)
        print(f"Processing: {data_path.name}")

        observations = processor.process(data_path, year or 2024)

        if year:
            observations = [o for o in observations if o.year == year]

        print(f"Found {len(observations)} observations")
        print(f"Countries: {len(observations)}")

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
