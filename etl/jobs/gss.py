#!/usr/bin/env python3
"""
GSS ETL Job - General Social Survey

Processes GSS data for USA trust metrics.

Variables used:
- trust: "Most people can be trusted" (1=yes, 2=no) -> interpersonal
- confed: Confidence in executive branch (1-3 scale) -> institutional
- conlegis: Confidence in Congress (1-3 scale) -> institutional

Coverage: USA only, 1972-2024 (biennial/irregular)
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


class GSSProcessor(BaseProcessor):
    """Processor for General Social Survey data."""

    SOURCE_NAME = "GSS"
    MIN_SAMPLE_SIZE = 300

    def download(self, year: int) -> Path:
        """Check for GSS data file (manual download required)."""
        gss_dir = self.raw_data_dir / "gss"

        if gss_dir.exists():
            for ext in ["*.dta", "*.csv"]:
                files = list(gss_dir.glob(ext))
                if files:
                    return files[0]

        raise FileNotFoundError(
            f"\nGSS data not found.\n"
            f"Download from https://gss.norc.org/get-the-data/stata and place in:\n"
            f"   {gss_dir}/\n"
        )

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """Process GSS survey data into observations."""
        print(f"Loading GSS data from {input_path}...")

        df = pd.read_stata(input_path, convert_categoricals=False)
        print(f"Loaded {len(df)} survey responses")

        observations = []

        # Process each year
        for survey_year in sorted(df["year"].dropna().unique()):
            survey_year = int(survey_year)
            subset = df[df["year"] == survey_year]

            # Interpersonal trust
            inter_obs = self._calculate_interpersonal_trust(subset, survey_year)
            if inter_obs:
                observations.append(inter_obs)

            # Institutional trust (confed/conlegis available since 1973)
            inst_obs = self._calculate_institutional_trust(subset, survey_year)
            if inst_obs:
                observations.append(inst_obs)

        print(f"Processed {len(observations)} GSS observations")
        return observations

    def _calculate_interpersonal_trust(
        self, df: pd.DataFrame, year: int
    ) -> Optional[Observation]:
        """
        Calculate interpersonal trust from 'trust' variable.

        trust: "Generally speaking, would you say that most people can be trusted
               or that you can't be too careful in dealing with people?"
        1 = Can trust, 2 = Cannot trust, 3 = Depends
        """
        if "trust" not in df.columns:
            return None

        valid = df["trust"].dropna()
        valid = valid[valid.isin([1, 2])]  # Exclude "depends"

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # % saying "can trust"
        pct_trust = float((valid == 1).mean() * 100)

        return Observation(
            iso3="USA",
            year=year,
            source="GSS",
            trust_type="interpersonal",
            raw_value=round(pct_trust, 1),
            raw_unit="% can trust",
            score_0_100=round(pct_trust, 1),
            sample_n=int(len(valid)),
            method_notes=f"GSS trust variable, n={len(valid)}",
            source_url="https://gss.norc.org",
            methodology="binary",
        )

    def _calculate_institutional_trust(
        self, df: pd.DataFrame, year: int
    ) -> Optional[Observation]:
        """
        Calculate institutional trust from confed + conlegis.

        confed: Confidence in executive branch of federal government
        conlegis: Confidence in Congress
        Scale: 1=A great deal, 2=Only some, 3=Hardly any
        """
        # Map to 0-100: 1->100, 2->50, 3->0
        score_map = {1: 100, 2: 50, 3: 0}

        scores = []
        total_n = 0

        for var in ["confed", "conlegis"]:
            if var not in df.columns:
                continue
            valid = df[var].dropna()
            valid = valid[valid.isin([1, 2, 3])]
            if len(valid) >= self.MIN_SAMPLE_SIZE:
                mapped = valid.map(score_map)
                scores.extend(mapped.tolist())
                total_n = max(total_n, len(valid))

        if len(scores) < self.MIN_SAMPLE_SIZE:
            return None

        avg_score = float(sum(scores) / len(scores))

        return Observation(
            iso3="USA",
            year=year,
            source="GSS",
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit="Mean confidence score",
            score_0_100=round(avg_score, 1),
            sample_n=int(total_n),
            method_notes=f"GSS confed+conlegis mean, n~{total_n}",
            source_url="https://gss.norc.org",
        )


@click.command()
@click.option("--year", default=2024, help="Year to process (uses cumulative file)")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Run GSS ETL process."""
    from collections import defaultdict

    processor = GSSProcessor()

    try:
        data_path = processor.download(year)
        observations = processor.process(data_path, year)

        # Count by type
        by_type: dict[str, int] = defaultdict(int)
        for obs in observations:
            by_type[obs.trust_type] += 1

        print("\nGSS ETL summary:")
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
        print(f"GSS ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
