#!/usr/bin/env python3
"""
ANES ETL Job - American National Election Studies

Processes ANES cumulative data file for USA trust metrics.

Variables used:
- VCF0601: Interpersonal trust (1968-1974 only)
  "Generally speaking, would you say that most people can be trusted..."
  1 = Most people can be trusted
  2 = Can't be too careful
  3 = Depends
  0 = DK/NA

- VCF0604: Trust in government (1958-2012)
  "How much of the time do you think you can trust the government..."
  1 = None of the time
  2 = Some of the time
  3 = Most of the time
  4 = Just about always
  0 = DK; 9 = NA

Coverage: USA only, 1958-2012 (biennial, election years)
Data source: https://electionstudies.org/data-center/anes-time-series-cumulative-data-file/
"""

import sys
from pathlib import Path
from typing import List, Optional
from collections import defaultdict

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


class ANESProcessor(BaseProcessor):
    """Processor for American National Election Studies data."""

    SOURCE_NAME = "ANES"
    MIN_SAMPLE_SIZE = 300

    def download(self, year: int) -> Path:
        """Check for ANES cumulative data file."""
        anes_dir = self.raw_data_dir / "anes"

        if anes_dir.exists():
            for ext in ["*.dta", "*.csv"]:
                files = list(anes_dir.glob(ext))
                if files:
                    return files[0]

        raise FileNotFoundError(
            f"\nANES data not found.\n"
            f"Download cumulative data file from:\n"
            f"   https://electionstudies.org/data-center/anes-time-series-cumulative-data-file/\n"
            f"Place in: {anes_dir}/\n"
        )

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """Process ANES cumulative data into observations."""
        print(f"Loading ANES data from {input_path}...")
        print("(This may take a moment for large files)")

        # Load only needed columns
        columns = ["VCF0004", "VCF0601", "VCF0604", "VCF0301", "VCF0218", "VCF0224"]
        df = pd.read_stata(input_path, columns=columns, convert_categoricals=False)
        print(f"Loaded {len(df)} survey responses")

        observations = []

        # Process each election year
        for survey_year in sorted(df["VCF0004"].dropna().unique()):
            survey_year = int(survey_year)
            subset = df[df["VCF0004"] == survey_year]

            # Interpersonal trust (VCF0601) - only available 1968-1974
            inter_obs = self._calculate_interpersonal_trust(subset, survey_year)
            if inter_obs:
                observations.append(inter_obs)

            # Institutional trust (VCF0604) - available 1958-2012
            inst_obs = self._calculate_institutional_trust(subset, survey_year)
            if inst_obs:
                observations.append(inst_obs)

            # Partisan trust (out-party feeling thermometer) - available 1978+
            partisan_obs = self._calculate_partisan_trust(subset, survey_year)
            if partisan_obs:
                observations.append(partisan_obs)

        print(f"Processed {len(observations)} ANES observations")
        return observations

    def _calculate_interpersonal_trust(
        self, df: pd.DataFrame, year: int
    ) -> Optional[Observation]:
        """
        Calculate interpersonal trust from VCF0601.

        VCF0601: "Generally speaking, would you say that most people
                  can be trusted or that you can't be too careful?"
        1 = Most people can be trusted
        2 = Can't be too careful
        3 = Depends
        0 = DK/NA
        """
        if "VCF0601" not in df.columns:
            return None

        # Filter valid responses (1, 2, or 3 - exclude 0 which is DK/NA)
        valid = df["VCF0601"].dropna()
        valid = valid[valid.isin([1, 2, 3])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # Exclude "depends" for binary comparison (matching GSS methodology)
        binary = valid[valid.isin([1, 2])]
        if len(binary) < self.MIN_SAMPLE_SIZE:
            return None

        # % saying "can be trusted"
        pct_trust = float((binary == 1).mean() * 100)

        return Observation(
            iso3="USA",
            year=year,
            source=self.SOURCE_NAME,
            trust_type="interpersonal",
            raw_value=round(pct_trust, 1),
            raw_unit="% can trust",
            score_0_100=round(pct_trust, 1),
            sample_n=int(len(binary)),
            method_notes=f"ANES VCF0601, n={len(binary)}",
            source_url="https://electionstudies.org",
            methodology="binary",
        )

    def _calculate_institutional_trust(
        self, df: pd.DataFrame, year: int
    ) -> Optional[Observation]:
        """
        Calculate institutional trust from VCF0604.

        VCF0604: "How much of the time do you think you can trust
                  the government in Washington to do what is right?"
        1 = None of the time
        2 = Some of the time
        3 = Most of the time
        4 = Just about always
        0 = DK; 9 = NA
        """
        if "VCF0604" not in df.columns:
            return None

        # Filter valid responses (1-4)
        valid = df["VCF0604"].dropna()
        valid = valid[valid.isin([1, 2, 3, 4])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # Map to 0-100 scale: 1->0, 2->33, 3->67, 4->100
        score_map = {1: 0, 2: 33.3, 3: 66.7, 4: 100}
        mapped = valid.map(score_map)
        avg_score = float(mapped.mean())

        return Observation(
            iso3="USA",
            year=year,
            source=self.SOURCE_NAME,
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit="Mean trust score",
            score_0_100=round(avg_score, 1),
            sample_n=int(len(valid)),
            method_notes=f"ANES VCF0604 trust in govt, n={len(valid)}",
            source_url="https://electionstudies.org",
        )

    def _calculate_partisan_trust(
        self, df: pd.DataFrame, year: int
    ) -> Optional[Observation]:
        """
        Calculate partisan trust from out-party feeling thermometer.

        Uses party ID (VCF0301) to determine each respondent's party,
        then takes their rating of the opposing party.

        VCF0301 Party ID: 1-3=Democrat, 4=Independent, 5-7=Republican
        VCF0218: Feeling thermometer - Democratic Party (0-100)
        VCF0224: Feeling thermometer - Republican Party (0-100)

        Out-party trust = Democrats' rating of Republicans + Republicans' rating of Democrats
        """
        required_cols = ["VCF0301", "VCF0218", "VCF0224"]
        if not all(col in df.columns for col in required_cols):
            return None

        # Get valid rows with party ID and thermometer ratings
        valid = df[required_cols].dropna()

        # Democrats (1-3): their rating of Republicans
        dems = valid[valid["VCF0301"].isin([1, 2, 3])]
        dem_ratings = dems["VCF0224"]  # Dems rating Reps
        dem_ratings = dem_ratings[(dem_ratings >= 0) & (dem_ratings <= 100)]

        # Republicans (5-7): their rating of Democrats
        reps = valid[valid["VCF0301"].isin([5, 6, 7])]
        rep_ratings = reps["VCF0218"]  # Reps rating Dems
        rep_ratings = rep_ratings[(rep_ratings >= 0) & (rep_ratings <= 100)]

        total_n = len(dem_ratings) + len(rep_ratings)
        if total_n < self.MIN_SAMPLE_SIZE:
            return None

        # Average out-party feeling (already 0-100 scale)
        all_ratings = pd.concat([dem_ratings, rep_ratings])
        avg_feeling = float(all_ratings.mean())

        return Observation(
            iso3="USA",
            year=year,
            source=self.SOURCE_NAME,
            trust_type="partisan",
            raw_value=round(avg_feeling, 1),
            raw_unit="Out-party feeling thermometer (0-100)",
            score_0_100=round(avg_feeling, 1),
            sample_n=int(total_n),
            method_notes=f"ANES out-party feeling thermometer, n={total_n}",
            source_url="https://electionstudies.org",
        )


@click.command()
@click.option("--year", default=2024, help="Year to process (uses cumulative file)")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Run ANES ETL process."""
    processor = ANESProcessor()

    try:
        data_path = processor.download(year)
        observations = processor.process(data_path, year)

        # Count by type
        by_type: dict[str, int] = defaultdict(int)
        for obs in observations:
            by_type[obs.trust_type] += 1

        print("\nANES ETL summary:")
        for t, count in by_type.items():
            print(f"  {t}: {count} years")

        if not dry_run and observations:
            processor.load_to_database(observations)
            print("Saved to database")
        elif dry_run:
            print("Dry run - not saved")

    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    except Exception as e:
        print(f"ANES ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
