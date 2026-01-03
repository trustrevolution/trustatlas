#!/usr/bin/env python3
"""
Reuters DNR ETL Job - Reuters Institute Digital News Report

Processes manually exported Reuters DNR media trust data into the trust index database.

IMPORTANT: Reuters DNR data requires manual export due to interactive tool.
1. Visit: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2024
2. Use interactive charts to export "Trust in news" by country
3. Save as CSV to: data/raw/reuters_dnr/reuters_dnr_trust.csv

Expected CSV format (from interactive tool export or manual compilation):
  Country,Year,Trust_Percent
  Finland,2024,69
  Portugal,2024,62
  ...

Alternative format (multi-year compiled):
  Country,2024,2023,2022,2021,...
  Finland,69,65,65,65,...

Data source: https://reutersinstitute.politics.ox.ac.uk/digital-news-report
License: CC BY - "We encourage free, attributed reuse"
"""

import sys
from pathlib import Path
from typing import List, Optional

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


# Reuters DNR country names to ISO3 mapping
# Based on 2024 report coverage (47 countries)
REUTERS_COUNTRY_CODES = {
    # Europe (24)
    "United Kingdom": "GBR",
    "UK": "GBR",
    "Austria": "AUT",
    "Belgium": "BEL",
    "Bulgaria": "BGR",
    "Croatia": "HRV",
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    "Denmark": "DNK",
    "Finland": "FIN",
    "France": "FRA",
    "Germany": "DEU",
    "Greece": "GRC",
    "Hungary": "HUN",
    "Ireland": "IRL",
    "Italy": "ITA",
    "Netherlands": "NLD",
    "Norway": "NOR",
    "Poland": "POL",
    "Portugal": "PRT",
    "Romania": "ROU",
    "Slovakia": "SVK",
    "Spain": "ESP",
    "Sweden": "SWE",
    "Switzerland": "CHE",
    "Turkey": "TUR",
    # North America (2)
    "United States": "USA",
    "US": "USA",
    "USA": "USA",
    "Canada": "CAN",
    # Latin America (6)
    "Argentina": "ARG",
    "Brazil": "BRA",
    "Chile": "CHL",
    "Colombia": "COL",
    "Mexico": "MEX",
    "Peru": "PER",
    # Asia Pacific (11)
    "Australia": "AUS",
    "Hong Kong": "HKG",
    "India": "IND",
    "Indonesia": "IDN",
    "Japan": "JPN",
    "Malaysia": "MYS",
    "Philippines": "PHL",
    "Singapore": "SGP",
    "South Korea": "KOR",
    "Korea": "KOR",
    "Taiwan": "TWN",
    "Thailand": "THA",
    # Africa (4)
    "Kenya": "KEN",
    "Nigeria": "NGA",
    "South Africa": "ZAF",
    "Morocco": "MAR",
}


class ReutersDNRProcessor(BaseProcessor):
    """Processor for Reuters Digital News Report media trust data."""

    SOURCE_NAME = "Reuters_DNR"
    TRUST_TYPE = "media"

    # Reuters DNR has been running since 2012
    AVAILABLE_YEARS = list(range(2012, 2026))

    def download(self, year: int) -> Path:
        """
        Reuters DNR requires manual download.

        This method checks for existing data and provides instructions if missing.

        Args:
            year: Year to process

        Returns:
            Path to data file
        """
        # Check for multi-year compiled file first
        compiled_path = self.raw_data_dir / "reuters_dnr" / "reuters_dnr_trust.csv"
        if compiled_path.exists():
            print(f"Using compiled Reuters DNR data at {compiled_path}")
            return compiled_path

        # Check for year-specific file
        year_path = self.raw_data_dir / "reuters_dnr" / str(year) / "reuters_dnr.csv"
        if year_path.exists():
            print(f"Using Reuters DNR {year} data at {year_path}")
            return year_path

        # Data not found - provide instructions
        raise FileNotFoundError(
            f"\n{'='*60}\n"
            f"Reuters DNR data not found.\n\n"
            f"To download the data:\n"
            f"1. Visit: https://reutersinstitute.politics.ox.ac.uk/digital-news-report/{year}\n"
            f"2. Navigate to the 'Country and market data' or interactive charts\n"
            f"3. Export 'Trust in news' percentages by country\n"
            f"4. Save as CSV to one of:\n"
            f"   - {compiled_path} (for multi-year data)\n"
            f"   - {year_path} (for single year)\n\n"
            f"Expected CSV format:\n"
            f"  Country,Year,Trust_Percent\n"
            f"  Finland,2024,69\n"
            f"  ...\n"
            f"{'='*60}"
        )

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process Reuters DNR data into observations.

        Supports multiple input formats:
        1. Long format: Country,Year,Trust_Percent
        2. Wide format: Country,2024,2023,2022,...
        3. Simple format: Country,Trust (for single year)

        Args:
            input_path: Path to CSV file
            year: Year to extract (if multi-year file)

        Returns:
            List of Observation objects
        """
        df = pd.read_csv(input_path)

        # Normalize column names
        df.columns = [str(c).strip() for c in df.columns]

        # Detect format and process
        if "Year" in df.columns or "year" in df.columns:
            observations = self._process_long_format(df, year)
        elif str(year) in df.columns:
            observations = self._process_wide_format(df, year)
        elif "Trust" in df.columns or "Trust_Percent" in df.columns:
            observations = self._process_simple_format(df, year)
        else:
            # Try to find any year column
            year_cols = [c for c in df.columns if c.isdigit()]
            if year_cols:
                observations = self._process_wide_format(df, year)
            else:
                raise ValueError(
                    f"Unknown Reuters DNR format. Columns: {df.columns.tolist()}\n"
                    f"Expected: Country,Year,Trust_Percent OR Country,2024,2023,..."
                )

        print(f"Processed {len(observations)} Reuters DNR observations for {year}")
        return observations

    def _get_iso3(self, country_name: str) -> Optional[str]:
        """Get ISO3 code from country name, using local mapping first."""
        # Try local mapping first (handles Reuters-specific names)
        iso3 = REUTERS_COUNTRY_CODES.get(country_name)
        if iso3:
            return iso3

        # Fall back to country mapper
        return self.country_mapper.get_iso3_from_name(country_name)

    def _process_long_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process long format: Country,Year,Trust_Percent

        Args:
            df: DataFrame
            year: Year to filter

        Returns:
            List of observations
        """
        observations = []

        # Normalize column names
        col_map = {}
        for col in df.columns:
            col_lower = col.lower()
            if "country" in col_lower:
                col_map[col] = "Country"
            elif col_lower == "iso3":
                col_map[col] = "ISO3"
            elif "year" in col_lower:
                col_map[col] = "Year"
            elif "trust" in col_lower or "percent" in col_lower:
                col_map[col] = "Trust"

        df = df.rename(columns=col_map)

        # Filter to requested year
        df_year = df[df["Year"] == year]

        for _, row in df_year.iterrows():
            # Use ISO3 directly if available, otherwise look up by country name
            if "ISO3" in df_year.columns:
                iso3 = str(row["ISO3"])
            else:
                country_name = row["Country"]
                iso3 = self._get_iso3(str(country_name))

            if not iso3:
                self.stats["unmapped_countries"].append(
                    str(row.get("Country", "Unknown"))
                )
                continue

            trust_pct = row["Trust"]
            if pd.isna(trust_pct):
                continue

            # Convert to native Python int to avoid numpy type issues
            observations.append(
                self._create_observation(iso3, int(year), float(trust_pct))
            )

        return observations

    def _process_wide_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process wide format: Country,2024,2023,2022,...

        Args:
            df: DataFrame
            year: Year column to extract

        Returns:
            List of observations
        """
        observations = []
        year_col = str(year)

        if year_col not in df.columns:
            available_years = [c for c in df.columns if c.isdigit()]
            raise ValueError(
                f"Year {year} not found. Available years: {available_years}"
            )

        # Find country column
        country_col = None
        for col in df.columns:
            if "country" in col.lower():
                country_col = col
                break

        if not country_col:
            country_col = df.columns[0]  # Assume first column

        for _, row in df.iterrows():
            country_name = row[country_col]
            iso3 = self._get_iso3(str(country_name))

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_name))
                continue

            trust_pct = row[year_col]
            if pd.isna(trust_pct):
                continue

            observations.append(self._create_observation(iso3, year, float(trust_pct)))

        return observations

    def _process_simple_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process simple format: Country,Trust (single year implied)

        Args:
            df: DataFrame
            year: Year to assign

        Returns:
            List of observations
        """
        observations = []

        # Find columns
        country_col = None
        trust_col = None

        for col in df.columns:
            col_lower = col.lower()
            if "country" in col_lower:
                country_col = col
            elif "trust" in col_lower or "percent" in col_lower:
                trust_col = col

        if not country_col:
            country_col = df.columns[0]
        if not trust_col:
            trust_col = df.columns[1]

        for _, row in df.iterrows():
            country_name = row[country_col]
            iso3 = self._get_iso3(str(country_name))

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_name))
                continue

            trust_pct = row[trust_col]
            if pd.isna(trust_pct):
                continue

            observations.append(self._create_observation(iso3, year, float(trust_pct)))

        return observations

    def _create_observation(
        self, iso3: str, year: int, trust_pct: float
    ) -> Observation:
        """
        Create a media trust observation.

        Args:
            iso3: Country ISO3 code
            year: Survey year
            trust_pct: Trust percentage (0-100)

        Returns:
            Observation object
        """
        return Observation(
            iso3=iso3,
            year=year,
            source="Reuters_DNR",
            trust_type="media",
            raw_value=trust_pct,
            raw_unit="Percent trusting news",
            score_0_100=trust_pct,  # Already 0-100
            sample_n=2000,  # Reuters uses ~2000 per country
            method_notes=(
                f"Reuters Digital News Report {year}. "
                "Question: 'I think you can trust most news most of the time'. "
                "Online survey, nationally representative."
            ),
            source_url=f"https://reutersinstitute.politics.ox.ac.uk/digital-news-report/{year}",
            methodology="binary",  # Agree/disagree question
        )

    def run_all_years(self, skip_download: bool = False) -> dict:
        """
        Process all available years from a multi-year file.

        Args:
            skip_download: If True, use existing data

        Returns:
            Combined statistics
        """
        compiled_path = self.raw_data_dir / "reuters_dnr" / "reuters_dnr_trust.csv"

        if not compiled_path.exists():
            raise FileNotFoundError(f"Multi-year file not found: {compiled_path}")

        df = pd.read_csv(compiled_path)

        # Detect available years
        if "Year" in df.columns or "year" in df.columns:
            year_col = "Year" if "Year" in df.columns else "year"
            years = sorted(df[year_col].unique())
        else:
            years = [int(c) for c in df.columns if c.isdigit()]

        all_observations = []
        total_stats = {
            "years_processed": [],
            "total_observations": 0,
            "countries": set(),
        }

        for year in years:
            print(f"\nProcessing Reuters DNR {year}...")
            observations = self.process(compiled_path, year)
            all_observations.extend(observations)

            total_stats["years_processed"].append(year)
            total_stats["total_observations"] += len(observations)
            total_stats["countries"].update(obs.iso3 for obs in observations)

        # Ensure countries exist and load to database
        if all_observations:
            iso3_codes = {obs.iso3 for obs in all_observations}
            self.ensure_countries_exist(iso3_codes)
            self.load_to_database(all_observations)

        total_stats["countries"] = len(total_stats["countries"])
        print(
            f"\nTotal: {total_stats['total_observations']} observations across {len(total_stats['years_processed'])} years"
        )

        return total_stats


@click.command()
@click.option("--year", default=2024, help="Year to process (default: 2024)")
@click.option("--all-years", is_flag=True, help="Process all years from compiled file")
@click.option(
    "--skip-download", is_flag=True, help="Skip download check (use existing data)"
)
def main(year: int, all_years: bool, skip_download: bool):
    """
    Run Reuters DNR ETL process.

    Before running, manually download data from:
    https://reutersinstitute.politics.ox.ac.uk/digital-news-report/

    Save to: data/raw/reuters_dnr/reuters_dnr_trust.csv
    """
    processor = ReutersDNRProcessor()

    try:
        if all_years:
            stats = processor.run_all_years(skip_download)
            print(
                f"\nReuters DNR ETL completed for {len(stats['years_processed'])} years"
            )
            print(f"  Years: {stats['years_processed']}")
            print(f"  Countries: {stats['countries']}")
            print(f"  Observations: {stats['total_observations']}")
        else:
            stats = processor.run(year, skip_download)

            if stats.get("unmapped_countries"):
                print(
                    f"\nWarning: Could not map {len(stats['unmapped_countries'])} countries:"
                )
                for country in stats["unmapped_countries"][:10]:
                    print(f"  - {country}")

            print(f"\nReuters DNR ETL completed for {year}")
            print(f"  Countries: {stats['countries_processed']}")
            print(f"  Observations: {stats['observations_created']}")

    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    except Exception as e:
        print(f"Reuters DNR ETL failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
