#!/usr/bin/env python3
"""
OECD ETL Job - OECD Trust in Government Indicators

Downloads, processes, and loads OECD trust data into the trust index database.
Data source: OECD Data Explorer (SDMX API)

Covers ~38 OECD member countries with trust in government survey data.
"""

import sys
from pathlib import Path
from typing import List
from io import StringIO

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


class OECDProcessor(BaseProcessor):
    """Processor for OECD Trust in Government data."""

    SOURCE_NAME = "OECD"
    TRUST_TYPE = "institutional"

    # OECD SDMX API base URL (new Data Explorer API as of 2024)
    SDMX_BASE = "https://sdmx.oecd.org/public/rest/data"

    # Trust in Government dataset - Government at a Glance 2025 edition
    # Contains "Trust, security and dignity" indicators
    DATASET_ID = "OECD.GOV.GIP,DSD_GOV_INT@DF_GOV_TDG_2025,1.0"

    # Measure code for trust in national government
    TRUST_MEASURE = "TRUST_NG"
    # Scale code for "High and moderately high" trust (the positive response %)
    TRUST_SCALE = "HMH"

    def download(self, year: int) -> Path:
        """
        Download OECD trust data from SDMX API.

        Args:
            year: Year to download

        Returns:
            Path to downloaded CSV file
        """
        year_dir = self.raw_data_dir / "oecd" / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        output_path = year_dir / "trust_gov.csv"

        if output_path.exists():
            print(f"OECD data already exists at {output_path}")
            return output_path

        print(f"Downloading OECD Trust in Government data for {year}...")

        # Try multiple API approaches
        try:
            df = self._fetch_from_sdmx(year)
        except Exception as e:
            print(f"SDMX API failed: {e}")
            print("Trying alternative OECD.Stat approach...")
            df = self._fetch_from_oecd_stat(year)

        df.to_csv(output_path, index=False)
        print(f"Downloaded OECD data to {output_path}")

        return output_path

    def _fetch_from_sdmx(self, year: int) -> pd.DataFrame:
        """
        Fetch from OECD SDMX API (Data Explorer).

        Args:
            year: Year to fetch

        Returns:
            DataFrame with trust data
        """
        # SDMX query - fetch all data, filter locally
        url = f"{self.SDMX_BASE}/{self.DATASET_ID}/all"
        params = {
            "format": "csvfilewithlabels",
        }

        response = self.http_client._make_request("GET", url, params=params)
        df = pd.read_csv(StringIO(response.text))

        # Filter for trust in national government with "high/moderately high" responses
        if "MEASURE" in df.columns and "SCALE" in df.columns:
            df = df[
                (df["MEASURE"] == self.TRUST_MEASURE)
                & (df["SCALE"] == self.TRUST_SCALE)
            ]

        return df

    def _fetch_from_oecd_stat(self, year: int) -> pd.DataFrame:
        """
        Alternative: Fetch from OECD.Stat JSON API.

        Args:
            year: Year to fetch

        Returns:
            DataFrame with trust data
        """
        # OECD.Stat provides a simpler JSON API
        # GOV_TRUST dataset
        url = "https://stats.oecd.org/SDMX-JSON/data/GOV_TRUST"
        params = {
            "contentType": "csv",
        }

        try:
            df = self.http_client.get_csv(url, params)
            # Filter for the year we want
            if "TIME_PERIOD" in df.columns:
                df = df[df["TIME_PERIOD"] == year]
            elif "Year" in df.columns:
                df = df[df["Year"] == year]
            return df
        except Exception:
            # Return empty DataFrame if API unavailable
            print("Warning: Could not fetch OECD data. Creating placeholder.")
            return pd.DataFrame()

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process OECD trust data into observations.

        Args:
            input_path: Path to OECD CSV file
            year: Year being processed

        Returns:
            List of Observation objects
        """
        df = pd.read_csv(input_path)

        if df.empty:
            print("Warning: Empty OECD dataset")
            return []

        observations = []

        # OECD Data Explorer format columns
        country_col = self._find_column(df, ["REF_AREA", "LOCATION", "Country", "COU"])
        value_col = self._find_column(df, ["OBS_VALUE", "Value", "value"])
        year_col = self._find_column(df, ["TIME_PERIOD", "Year", "TIME"])

        if not country_col or not value_col:
            print(f"Could not identify OECD data columns: {df.columns.tolist()}")
            return []

        # Filter for requested year if year column exists
        if year_col:
            df = df[df[year_col] == year]
            if df.empty:
                # Try closest available year
                available_years = pd.read_csv(input_path)[year_col].unique()
                print(f"No data for {year}. Available years: {sorted(available_years)}")
                # Use most recent year if requested year not available
                closest_year = (
                    max(y for y in available_years if y <= year)
                    if any(y <= year for y in available_years)
                    else min(available_years)
                )
                df = pd.read_csv(input_path)
                df = df[df[year_col] == closest_year]
                print(f"Using closest year: {closest_year}")

        for _, row in df.iterrows():
            country_code = row[country_col]

            # OECD uses ISO3 codes (AUS, AUT, etc.)
            iso3 = self.country_mapper.get_or_map(str(country_code))

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_code))
                continue

            value = row[value_col]
            if pd.isna(value):
                continue

            # OECD trust data is percentage (0-100)
            score = float(value)

            # Validate range
            if score < 0 or score > 100:
                self.stats["warnings"].append(
                    f"OECD score {score} for {iso3} outside expected range"
                )
                continue

            # Get actual year from data if available
            data_year = int(row[year_col]) if year_col else year

            observations.append(
                Observation(
                    iso3=iso3,
                    year=data_year,
                    source="OECD",
                    trust_type="institutional",
                    raw_value=score,
                    raw_unit="Percent high/moderately high trust",
                    score_0_100=score,
                    sample_n=None,
                    method_notes=f"OECD Trust in Government Survey {data_year}",
                    source_url="https://data-explorer.oecd.org/",
                )
            )

        print(f"Processed {len(observations)} OECD observations for {year}")
        return observations

    def _find_column(self, df: pd.DataFrame, candidates: List[str]) -> str | None:
        """Find first matching column name from candidates."""
        for col in candidates:
            if col in df.columns:
                return col
        return None


@click.command()
@click.option("--year", default=2023, help="Year to process OECD data for")
@click.option(
    "--skip-download", is_flag=True, help="Skip download and use existing raw data"
)
def main(year: int, skip_download: bool):
    """Run OECD ETL process."""
    processor = OECDProcessor()

    try:
        stats = processor.run(year, skip_download)

        if stats.get("unmapped_countries"):
            print(f"\nCould not map {len(stats['unmapped_countries'])} country codes")

        print(f"\nOECD ETL completed successfully for {year}")
        print(f"  Countries: {stats['countries_processed']}")
        print(f"  Observations: {stats['observations_created']}")

    except Exception as e:
        print(f"OECD ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
