#!/usr/bin/env python3
"""
ESS ETL Job - European Social Survey

Processes European Social Survey data into the trust index database.

ESS requires registration at https://ess.sikt.no/ to download data.
Set ESS_EMAIL environment variable after registration.

Variables used:
- ppltrst: "Most people can be trusted" (0-10 scale) -> interpersonal
- trstprl: Trust in parliament (0-10 scale) -> institutional
- trstplt: Trust in politicians (0-10 scale) -> institutional

Coverage: ~35 European countries per round (biennial since 2002)
"""

import os
import sys
from pathlib import Path
from typing import List, Optional

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation
from etl.common.scaling import scale_0_10_to_percent


class ESSProcessor(BaseProcessor):
    """Processor for European Social Survey data."""

    SOURCE_NAME = "ESS"

    # ESS round to approximate year mapping
    ROUND_YEARS = {
        11: 2023,
        10: 2021,
        9: 2018,
        8: 2016,
        7: 2014,
        6: 2012,
        5: 2010,
        4: 2008,
        3: 2006,
        2: 2004,
        1: 2002,
    }

    # Minimum sample size
    MIN_SAMPLE_SIZE = 300

    def download(self, year: int) -> Path:
        """
        Check for ESS data file (manual download required).

        ESS requires registration - provide instructions if not found.

        Args:
            year: Year (used to determine round)

        Returns:
            Path to ESS data file
        """
        # Determine which round to look for based on year
        round_num = self._year_to_round(year)
        round_dir = self.raw_data_dir / "ess" / f"round{round_num}"

        # Check for existing files
        if round_dir.exists():
            csvs = list(round_dir.glob("*.csv"))
            if csvs:
                print(f"Found ESS data at {csvs[0]}")
                return csvs[0]

            # Also check for SPSS/Stata files we could convert
            for ext in ["*.sav", "*.dta"]:
                files = list(round_dir.glob(ext))
                if files:
                    return self._convert_to_csv(files[0], round_dir)

        # Provide download instructions
        email = os.getenv("ESS_EMAIL")
        if not email:
            raise FileNotFoundError(
                f"\nESS data not found. Registration required:\n"
                f"1. Register at https://ess.sikt.no/\n"
                f"2. Set environment variable: ESS_EMAIL=your@email.com\n"
                f"3. Download Round {round_num} data and place in:\n"
                f"   {round_dir}/\n"
            )

        raise FileNotFoundError(
            f"\nESS data not found for Round {round_num}.\n"
            f"Download from https://ess.sikt.no/ and place in:\n"
            f"   {round_dir}/\n"
        )

    def _year_to_round(self, year: int) -> int:
        """Convert year to ESS round number."""
        for round_num, round_year in self.ROUND_YEARS.items():
            if abs(year - round_year) <= 1:
                return round_num
        # Default to latest round
        return 11

    def _convert_to_csv(self, input_file: Path, output_dir: Path) -> Path:
        """Convert SPSS/Stata file to CSV."""
        output_path = output_dir / f"{input_file.stem}.csv"

        if input_file.suffix == ".sav":
            import pyreadstat

            df, _ = pyreadstat.read_sav(str(input_file))
        elif input_file.suffix == ".dta":
            df = pd.read_stata(input_file)
        else:
            raise ValueError(f"Unknown file format: {input_file.suffix}")

        df.to_csv(output_path, index=False)
        print(f"Converted {input_file} to {output_path}")
        return output_path

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process ESS survey data into observations.

        Args:
            input_path: Path to ESS CSV file
            year: Year for observations

        Returns:
            List of Observation objects
        """
        print(f"Loading ESS data from {input_path}...")

        # Try to load with common column names
        try:
            df = pd.read_csv(input_path, low_memory=False)
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return []

        print(f"Loaded {len(df)} survey responses")

        observations = []

        # Find country column (ESS uses 'cntry' or 'cntry_num')
        country_col = None
        for col in ["cntry", "CNTRY", "country", "cntry_num"]:
            if col in df.columns:
                country_col = col
                break

        if not country_col:
            print(f"Could not find country column in: {df.columns.tolist()[:20]}")
            return []

        # Find year column if available
        year_col = None
        for col in ["inwyys", "inwyr", "essround"]:
            if col in df.columns:
                year_col = col
                break

        # Process each country
        for country_code, country_df in df.groupby(country_col):
            # ESS uses ISO2 codes
            iso3 = self.country_mapper.get_iso3_from_iso2(str(country_code))
            if not iso3:
                iso3 = self.country_mapper.get_or_map(str(country_code))
            if not iso3:
                self.stats["unmapped_countries"].append(str(country_code))
                continue

            # Get survey year
            if year_col and year_col in country_df.columns:
                try:
                    survey_year = int(country_df[year_col].mode().iloc[0])
                except (ValueError, IndexError):
                    survey_year = year
            else:
                survey_year = year

            # Calculate interpersonal trust (ppltrst)
            inter_obs = self._calculate_interpersonal_trust(
                country_df, iso3, survey_year
            )
            if inter_obs:
                observations.append(inter_obs)

            # Calculate institutional trust (trstprl, trstplt)
            inst_obs = self._calculate_institutional_trust(
                country_df, iso3, survey_year
            )
            if inst_obs:
                observations.append(inst_obs)

        print(f"Processed {len(observations)} ESS observations")
        return observations

    def _calculate_interpersonal_trust(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """
        Calculate interpersonal trust from ppltrst.

        ppltrst: "Most people can be trusted or you can't be too careful"
        Scale: 0 (can't be too careful) to 10 (most people can be trusted)

        Args:
            df: Country DataFrame
            iso3: ISO3 country code
            year: Survey year

        Returns:
            Observation or None if insufficient data
        """
        # Find the trust variable (case-insensitive)
        trust_col = None
        for col in df.columns:
            if col.lower() == "ppltrst":
                trust_col = col
                break

        if not trust_col:
            return None

        # Filter valid responses (0-10)
        valid = df[trust_col].between(0, 10)
        responses = df.loc[valid, trust_col]

        if len(responses) < self.MIN_SAMPLE_SIZE:
            return None

        # Calculate mean and convert to 0-100
        mean_score = responses.mean()
        score_0_100 = scale_0_10_to_percent(mean_score)

        return Observation(
            iso3=iso3,
            year=year,
            source="ESS",
            trust_type="interpersonal",
            raw_value=round(mean_score, 2),
            raw_unit="Mean (0-10 scale)",
            score_0_100=round(score_0_100, 1),
            sample_n=len(responses),
            method_notes=f"ESS ppltrst mean, n={len(responses)}",
            source_url="https://www.europeansocialsurvey.org",
            methodology="0-10scale",
        )

    def _calculate_institutional_trust(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """
        Calculate institutional trust from trstprl and trstplt.

        trstprl: Trust in country's parliament (0-10)
        trstplt: Trust in politicians (0-10)

        Args:
            df: Country DataFrame
            iso3: ISO3 country code
            year: Survey year

        Returns:
            Observation or None if insufficient data
        """
        trust_vars = []
        for col in df.columns:
            if col.lower() in ["trstprl", "trstplt", "trstgov"]:
                trust_vars.append(col)

        if not trust_vars:
            return None

        # Calculate mean for each available variable
        var_means = []
        total_n = 0

        for var in trust_vars:
            valid = df[var].between(0, 10)
            responses = df.loc[valid, var]

            if len(responses) < 100:
                continue

            var_means.append(responses.mean())
            total_n = max(total_n, len(responses))

        if not var_means or total_n < self.MIN_SAMPLE_SIZE:
            return None

        # Average across variables and convert to 0-100
        avg_mean = sum(var_means) / len(var_means)
        score_0_100 = scale_0_10_to_percent(avg_mean)

        return Observation(
            iso3=iso3,
            year=year,
            source="ESS",
            trust_type="institutional",
            raw_value=round(avg_mean, 2),
            raw_unit="Mean (0-10 scale)",
            score_0_100=round(score_0_100, 1),
            sample_n=total_n,
            method_notes=f"ESS trstprl/trstplt mean ({len(var_means)} vars), n~{total_n}",
            source_url="https://www.europeansocialsurvey.org",
        )


@click.command()
@click.option("--year", default=2023, help="Year to process (determines ESS round)")
@click.option(
    "--skip-download", is_flag=True, help="Ignored (ESS requires manual download)"
)
def main(year: int, skip_download: bool):
    """Run ESS ETL process."""
    processor = ESSProcessor()

    try:
        stats = processor.run(year, skip_download=True)

        if stats.get("unmapped_countries"):
            print(f"\nCould not map {len(stats['unmapped_countries'])} country codes")

        print(f"\nESS ETL completed successfully for {year}")
        print(f"  Countries: {stats['countries_processed']}")
        print(f"  Observations: {stats['observations_created']}")

    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    except Exception as e:
        print(f"ESS ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
