#!/usr/bin/env python3
"""
EU-SILC (European Union Statistics on Income and Living Conditions) ETL Job

Processes interpersonal trust data from Eurostat EU-SILC surveys.
This source adds Malta and provides additional EU coverage.

Data source: Eurostat API (ilc_pw03 - Trust in others)
Scale: 0-10 rating converted to 0-100 percentage

Coverage: 38 European countries including Malta, Kosovo, candidate countries
Years: 2013, 2018, 2021-2024
"""

import sys
from pathlib import Path
from typing import List
import requests

import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


# Eurostat country codes to ISO alpha-3
EUROSTAT_TO_ISO3 = {
    "AT": "AUT",  # Austria
    "BE": "BEL",  # Belgium
    "BG": "BGR",  # Bulgaria
    "CH": "CHE",  # Switzerland
    "CY": "CYP",  # Cyprus
    "CZ": "CZE",  # Czechia
    "DE": "DEU",  # Germany
    "DK": "DNK",  # Denmark
    "EE": "EST",  # Estonia
    "EL": "GRC",  # Greece
    "ES": "ESP",  # Spain
    "FI": "FIN",  # Finland
    "FR": "FRA",  # France
    "HR": "HRV",  # Croatia
    "HU": "HUN",  # Hungary
    "IE": "IRL",  # Ireland
    "IS": "ISL",  # Iceland
    "IT": "ITA",  # Italy
    "LT": "LTU",  # Lithuania
    "LU": "LUX",  # Luxembourg
    "LV": "LVA",  # Latvia
    "MT": "MLT",  # Malta - KEY TARGET
    "NL": "NLD",  # Netherlands
    "NO": "NOR",  # Norway
    "PL": "POL",  # Poland
    "PT": "PRT",  # Portugal
    "RO": "ROU",  # Romania
    "SE": "SWE",  # Sweden
    "SI": "SVN",  # Slovenia
    "SK": "SVK",  # Slovakia
    "UK": "GBR",  # United Kingdom
    "AL": "ALB",  # Albania
    "ME": "MNE",  # Montenegro
    "MK": "MKD",  # North Macedonia
    "RS": "SRB",  # Serbia
    "TR": "TUR",  # Turkey
    "XK": "KSV",  # Kosovo
}


class EUSILCProcessor(BaseProcessor):
    """Processor for EU-SILC trust data from Eurostat."""

    SOURCE_NAME = "EU-SILC"
    API_URL = (
        "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_pw03"
    )

    def download(self, year: int) -> dict:
        """Fetch EU-SILC trust data from Eurostat API."""
        params = {
            "format": "JSON",
            "lang": "EN",
            "sex": "T",  # Total (both sexes)
            "age": "Y_GE16",  # 16 years and over
            "isced11": "TOTAL",  # All education levels
        }

        response = requests.get(self.API_URL, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    def process(self, data: dict, year: int) -> List[Observation]:
        """Process Eurostat JSON response to observations."""
        observations = []

        values = data.get("value", {})
        dims = data.get("dimension", {})

        # Get dimension indices
        geo_idx = dims.get("geo", {}).get("category", {}).get("index", {})
        time_idx = dims.get("time", {}).get("category", {}).get("index", {})

        num_times = len(time_idx)

        for geo_code, geo_pos in geo_idx.items():
            # Skip aggregates
            if geo_code in ["EU27_2020", "EA20"]:
                continue

            iso3 = EUROSTAT_TO_ISO3.get(geo_code)
            if not iso3:
                continue

            for year_str, year_pos in time_idx.items():
                # Calculate flat index
                idx = str(geo_pos * num_times + year_pos)

                if idx not in values:
                    continue

                # Value is 0-10 rating, convert to 0-100
                raw_value = values[idx]
                score = raw_value * 10  # 0-10 -> 0-100

                data_year = int(year_str)

                observations.append(
                    Observation(
                        iso3=iso3,
                        year=data_year,
                        source=self.SOURCE_NAME,
                        trust_type="interpersonal",
                        raw_value=round(raw_value, 1),
                        raw_unit="rating 0-10",
                        score_0_100=round(score, 1),
                        sample_n=None,  # Not available in aggregated data
                        method_notes=f"EU-SILC {data_year} ilc_pw03, 16+ population",
                        source_url="https://ec.europa.eu/eurostat/databrowser/view/ilc_pw03",
                        methodology="0-10scale",
                    )
                )

        return observations


@click.command()
@click.option(
    "--year",
    type=int,
    default=None,
    help="Specific year to process (unused - API returns all)",
)
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Process EU-SILC interpersonal trust data from Eurostat."""
    processor = EUSILCProcessor()

    print("Fetching EU-SILC data from Eurostat API...")

    try:
        data = processor.download(year or 2024)
        observations = processor.process(data, year or 2024)

        # Count by country
        by_country: dict[str, list[int]] = {}
        for obs in observations:
            if obs.iso3 not in by_country:
                by_country[obs.iso3] = []
            by_country[obs.iso3].append(obs.year)

        print(f"Found {len(observations)} observations for {len(by_country)} countries")

        # Highlight Malta
        if "MLT" in by_country:
            print(f"Malta years: {sorted(by_country['MLT'])}")

        # Show year distribution
        years = set(obs.year for obs in observations)
        print(f"Years covered: {sorted(years)}")

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
