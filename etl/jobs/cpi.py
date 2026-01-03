#!/usr/bin/env python3
"""
CPI ETL Job - Transparency International Corruption Perceptions Index

Downloads, processes, and loads CPI data into the trust index database.
Data source: DataHub.io (pre-processed TI data) or Transparency International directly.
"""

import sys
from pathlib import Path
from typing import List

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


class CPIProcessor(BaseProcessor):
    """Processor for Transparency International CPI data."""

    SOURCE_NAME = "CPI"
    TRUST_TYPE = "governance"

    # TI direct download URL patterns (they vary by year)
    TI_URLS = {
        2024: "https://images.transparencycdn.org/images/CPI2024-Results-and-trends.xlsx",
        2023: "https://images.transparencycdn.org/images/CPI2023_Global_Results_Trends.xlsx",
        2022: "https://images.transparencycdn.org/images/CPI2022_GlobalResultsTrends.xlsx",
    }

    # Fallback pattern for older years
    TI_MEDIA_KIT_URL = (
        "https://images.transparencycdn.org/images/CPI{year}_Global_Results_Trends.xlsx"
    )

    def download(self, year: int) -> Path:
        """
        Download CPI data for the specified year.

        Args:
            year: Year to download

        Returns:
            Path to downloaded CSV file
        """
        year_dir = self.raw_data_dir / "cpi" / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        output_path = year_dir / "cpi.csv"

        if output_path.exists():
            print(f"CPI data already exists at {output_path}")
            return output_path

        # Try direct TI download
        print(f"Downloading CPI {year} from Transparency International...")
        return self._download_from_ti(year, year_dir)

    def _download_from_ti(self, year: int, year_dir: Path) -> Path:
        """
        Download directly from Transparency International.

        TI provides Excel files with multiple sheets. We extract the main
        data sheet and convert to CSV.

        Args:
            year: Year to download
            year_dir: Directory to save file

        Returns:
            Path to CSV file
        """
        # Use known URL if available, otherwise try pattern
        url = self.TI_URLS.get(year, self.TI_MEDIA_KIT_URL.format(year=year))
        xlsx_path = year_dir / f"CPI{year}.xlsx"
        csv_path = year_dir / "cpi.csv"

        self.http_client.download_file(url, xlsx_path)

        # Read Excel - TI files have varying sheet structures
        xl = pd.ExcelFile(xlsx_path)
        df = None

        # Try common sheet names - look for the main CPI scores sheet
        for sheet_name in xl.sheet_names:
            sheet_lower = sheet_name.lower()
            # Skip timeseries, changes, regional averages sheets
            if any(
                x in sheet_lower
                for x in ["timeseries", "change", "regional", "historical"]
            ):
                continue
            if "cpi" in sheet_lower and str(year) in sheet_name:
                # TI files have multiple header rows (title, embargo notice, blank, then actual headers)
                # Read without header first to find the actual header row
                df_raw = pd.read_excel(
                    xlsx_path, sheet_name=sheet_name, header=None, nrows=10
                )
                header_row = None
                for i, row in df_raw.iterrows():
                    if any(
                        "country" in str(val).lower()
                        for val in row.values
                        if pd.notna(val)
                    ):
                        header_row = i
                        break
                if header_row is not None:
                    df = pd.read_excel(
                        xlsx_path, sheet_name=sheet_name, header=header_row
                    )
                    break

        if df is None:
            # Fall back to first sheet, auto-detect header row
            df_raw = pd.read_excel(xlsx_path, sheet_name=0, header=None, nrows=10)
            header_row = 0
            for i, row in df_raw.iterrows():
                if any(
                    "country" in str(val).lower() for val in row.values if pd.notna(val)
                ):
                    header_row = i
                    break
            df = pd.read_excel(xlsx_path, sheet_name=0, header=header_row)

        # Clean up - remove empty rows
        df = df.dropna(how="all")

        # Standardize column names
        df.columns = [str(c).strip() for c in df.columns]

        # Rename common column variations for consistency
        rename_map = {}
        for col in df.columns:
            col_lower = col.lower()
            if "country" in col_lower or "territory" in col_lower:
                rename_map[col] = "Country"
            elif "cpi score" in col_lower or (
                "cpi" in col_lower and str(year) in col_lower
            ):
                rename_map[col] = f"CPI Score {year}"
            elif col_lower == "iso3":
                rename_map[col] = "ISO3"

        if rename_map:
            df = df.rename(columns=rename_map)

        df.to_csv(csv_path, index=False)
        print(f"Downloaded and converted CPI {year} data to {csv_path}")

        return csv_path

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process CPI data into observations.

        DataHub format has columns: Jurisdiction, 2023, 2022, 2021, ... (years as columns)
        TI format has: Country, ISO3, CPI Score {year}, Rank
        Legacy format (pre-2012) has: country, iso, region, score (0-10 scale)

        Args:
            input_path: Path to CPI CSV file
            year: Year to extract

        Returns:
            List of Observation objects
        """
        df = pd.read_csv(input_path)
        observations = []

        # Detect format and process accordingly
        if "Jurisdiction" in df.columns:
            observations = self._process_datahub_format(df, year)
        elif "country" in df.columns and "iso" in df.columns and "score" in df.columns:
            # Legacy format (pre-2012): 0-10 scale
            observations = self._process_legacy_format(df, year)
        elif "Country" in df.columns:
            observations = self._process_ti_format(df, year)
        else:
            raise ValueError(f"Unknown CPI data format. Columns: {df.columns.tolist()}")

        print(f"Processed {len(observations)} CPI observations for {year}")
        return observations

    def _process_legacy_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process legacy TI format (pre-2012) with 0-10 scale.

        Columns: country, iso, region, score, rank, interval
        Score is 0-10, needs to be multiplied by 10 for 0-100 scale.

        Args:
            df: DataFrame with legacy format
            year: Year being processed

        Returns:
            List of observations
        """
        observations = []

        for _, row in df.iterrows():
            iso3 = row.get("iso")
            country_name = row.get("country")

            if not iso3 or pd.isna(iso3):
                iso3 = self.country_mapper.get_iso3_from_name(str(country_name))

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_name))
                continue

            cpi_score = row.get("score")
            if pd.isna(cpi_score):
                continue

            # Legacy CPI is 0-10, convert to 0-100
            score_0_100 = float(cpi_score) * 10

            observations.append(
                Observation(
                    iso3=iso3,
                    year=year,
                    source="CPI",
                    trust_type="governance",
                    raw_value=float(cpi_score),
                    raw_unit="CPI Score (0-10 legacy)",
                    score_0_100=score_0_100,
                    sample_n=None,
                    method_notes=f"Transparency International CPI {year} (0-10 scale, converted)",
                    source_url=f"https://www.transparency.org/en/cpi/{year}",
                )
            )

        return observations

    def _process_datahub_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process DataHub.io format (years as columns).

        Args:
            df: DataFrame with Jurisdiction and year columns
            year: Year to extract

        Returns:
            List of observations
        """
        observations = []
        year_col = str(year)

        if year_col not in df.columns:
            available_years = [c for c in df.columns if c.isdigit()]
            raise ValueError(
                f"Year {year} not found in data. Available years: {available_years}"
            )

        for _, row in df.iterrows():
            country_name = row["Jurisdiction"]
            iso3 = self.country_mapper.get_iso3_from_name(country_name)

            if not iso3:
                self.stats["unmapped_countries"].append(country_name)
                continue

            cpi_score = row[year_col]

            if pd.isna(cpi_score):
                continue

            # CPI scores are already 0-100, higher = less corrupt (better governance)
            observations.append(
                Observation(
                    iso3=iso3,
                    year=year,
                    source="CPI",
                    trust_type="governance",
                    raw_value=float(cpi_score),
                    raw_unit="CPI Score (0-100)",
                    score_0_100=float(cpi_score),
                    sample_n=None,
                    method_notes=f"Transparency International CPI {year}",
                    source_url=f"https://www.transparency.org/en/cpi/{year}",
                )
            )

        return observations

    def _process_ti_format(self, df: pd.DataFrame, year: int) -> List[Observation]:
        """
        Process direct TI format (CPI Score column).

        Args:
            df: DataFrame from TI Excel
            year: Year being processed

        Returns:
            List of observations
        """
        observations = []

        # Find the score column (various naming conventions)
        score_col = None
        for col in df.columns:
            if f"CPI {year}" in col or f"CPI Score {year}" in col or col == "CPI Score":
                score_col = col
                break

        if not score_col:
            # Try to find any numeric column that looks like scores
            for col in df.columns:
                if "score" in col.lower() or "cpi" in col.lower():
                    score_col = col
                    break

        if not score_col:
            raise ValueError(
                f"Could not find CPI score column in {df.columns.tolist()}"
            )

        for _, row in df.iterrows():
            # Try different column names for country
            country_name = (
                row.get("Country") or row.get("Jurisdiction") or row.get("country")
            )

            # Try to get ISO3 directly if available
            iso3 = row.get("ISO3") or row.get("iso3")
            if not iso3:
                iso3 = self.country_mapper.get_iso3_from_name(str(country_name))

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_name))
                continue

            cpi_score = row[score_col]

            if pd.isna(cpi_score):
                continue

            observations.append(
                Observation(
                    iso3=iso3,
                    year=year,
                    source="CPI",
                    trust_type="governance",
                    raw_value=float(cpi_score),
                    raw_unit="CPI Score (0-100)",
                    score_0_100=float(cpi_score),
                    sample_n=None,
                    method_notes=f"Transparency International CPI {year}",
                    source_url=f"https://www.transparency.org/en/cpi/{year}",
                )
            )

        return observations


@click.command()
@click.option("--year", default=2024, help="Year to process CPI data for")
@click.option(
    "--skip-download", is_flag=True, help="Skip download and use existing raw data"
)
def main(year: int, skip_download: bool):
    """Run CPI ETL process."""
    processor = CPIProcessor()

    try:
        stats = processor.run(year, skip_download)

        if stats.get("unmapped_countries"):
            print(
                f"\nWarning: Could not map {len(stats['unmapped_countries'])} countries:"
            )
            for country in stats["unmapped_countries"][:10]:
                print(f"  - {country}")
            if len(stats["unmapped_countries"]) > 10:
                print(f"  ... and {len(stats['unmapped_countries']) - 10} more")

        print(f"\nCPI ETL completed successfully for {year}")
        print(f"  Countries: {stats['countries_processed']}")
        print(f"  Observations: {stats['observations_created']}")

    except Exception as e:
        print(f"CPI ETL failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
