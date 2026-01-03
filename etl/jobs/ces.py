#!/usr/bin/env python3
"""
CES ETL Job - Canadian Election Study

Processes CES data for Canada trust metrics across multiple election years.

Waves and variables:
- 2008: ces08_PES_TRUST_1 (1=trust, 5=careful)
- 2015: p_trust (1=trust, 5=careful), sat_govt (1-7 scale)
- 2019: pes19_trust, cps19_fed_gov_sat (requires encoding fix)
- 2021: pes21_trust (1=trust, 2=careful, 3=depends), cps21_fed_gov_sat (1-5)

Coverage: Canada only, 2008, 2015, 2019, 2021
Data sources:
- 2004-2011 cumulative: https://ces-eec.arts.ubc.ca/english-section/surveys/
- 2015: https://ces-eec.arts.ubc.ca/english-section/surveys/
- 2019: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/DUS88V
- 2021: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/XBZHKC
"""

import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from collections import defaultdict

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


class CESProcessor(BaseProcessor):
    """Processor for Canadian Election Study data."""

    SOURCE_NAME = "CES"
    MIN_SAMPLE_SIZE = 300

    # File patterns for each wave
    WAVE_FILES = {
        2008: "CES_04060811_final_without-geo-data.dta",
        2015: "CES2015_Combined_Stata14.dta",
        2019: "CES2019_trust_vars.csv",  # Converted from Stata via R haven
        2021: "cora-cdem-ces-E-2021_F1.dta",
    }

    # Variable mappings per CES wave
    # Each mapping includes: column name, trust_value (which value means "trust"),
    # careful_value (which value means "careful"), and scale_type
    WAVE_MAPPINGS: dict[int, dict[str, Any]] = {
        2008: {
            "interpersonal": {
                "column": "ces08_PES_TRUST_1",
                "trust_value": 1,
                "careful_value": 5,
                "scale_type": "binary",
            },
            # No institutional trust in 2008 cumulative file
        },
        2015: {
            "interpersonal": {
                "column": "p_trust",
                "trust_value": 1,
                "careful_value": 5,
                "scale_type": "binary",
            },
            "institutional": {
                "column": "sat_govt",
                "scale_type": "likert_7",  # 1=very dissatisfied, 7=very satisfied
                "valid_range": (1, 7),
            },
        },
        2019: {
            "interpersonal": {
                "column": "pes19_trust",
                "trust_value": 1,
                "careful_value": 2,
                "scale_type": "binary",
            },
            "institutional": {
                "column": "cps19_fed_gov_sat",
                "scale_type": "likert_5",
                "valid_range": (1, 5),
            },
        },
        2021: {
            "interpersonal": {
                "column": "pes21_trust",
                "trust_value": 1,
                "careful_value": 2,
                "scale_type": "binary",  # 3=depends is excluded
            },
            "institutional": {
                "column": "cps21_fed_gov_sat",
                "scale_type": "likert_5",
                "valid_range": (1, 5),
            },
        },
    }

    def download(self, year: int) -> Path:
        """Find CES data file for specified year."""
        ces_dir = self.raw_data_dir / "ces"

        if year not in self.WAVE_FILES:
            raise ValueError(
                f"No CES data mapping for year {year}. Available: {list(self.WAVE_FILES.keys())}"
            )

        target_file = self.WAVE_FILES[year]

        if ces_dir.exists():
            # Look for the specific file
            matches = list(ces_dir.rglob(f"*{target_file}"))
            if matches:
                return matches[0]

            # Also try exact match
            direct = ces_dir / target_file
            if direct.exists():
                return direct

        raise FileNotFoundError(
            f"\nCES {year} data not found.\n"
            f"Expected file: {target_file}\n"
            f"Download from: https://ces-eec.arts.ubc.ca/english-section/surveys/\n"
            f"Place in: {ces_dir}/\n"
        )

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """Process CES survey data into observations."""
        print(f"Loading CES {year} data from {input_path}...")

        # Handle different file formats
        if input_path.suffix == ".csv":
            df = pd.read_csv(input_path)
        else:
            try:
                df = pd.read_stata(
                    input_path, convert_categoricals=False, convert_dates=False
                )
            except UnicodeDecodeError:
                print(f"  Warning: Encoding issues with {input_path}")
                raise RuntimeError(
                    f"CES {year} file has encoding issues. "
                    "Convert with R: haven::read_dta() then write.csv()"
                )

        print(f"Loaded {len(df)} survey responses")

        observations = []

        # Get variable mapping for this wave
        if year not in self.WAVE_MAPPINGS:
            raise ValueError(f"No variable mapping for CES {year}")

        mapping: dict[str, Any] = self.WAVE_MAPPINGS[year]

        # Interpersonal trust
        if "interpersonal" in mapping:
            inter_obs = self._calculate_interpersonal_trust(
                df, year, mapping["interpersonal"]
            )
            if inter_obs:
                observations.append(inter_obs)

        # Institutional trust
        if "institutional" in mapping:
            inst_obs = self._calculate_institutional_trust(
                df, year, mapping["institutional"]
            )
            if inst_obs:
                observations.append(inst_obs)

        print(f"Processed {len(observations)} CES observations for {year}")
        return observations

    def _calculate_interpersonal_trust(
        self, df: pd.DataFrame, year: int, config: Dict[str, Any]
    ) -> Optional[Observation]:
        """
        Calculate interpersonal trust percentage.

        Config contains:
        - column: column name
        - trust_value: value indicating "can trust"
        - careful_value: value indicating "can't be too careful"
        - scale_type: "binary" for trust/careful questions
        """
        col = config["column"]
        if col not in df.columns:
            print(f"  Interpersonal trust column '{col}' not found")
            return None

        trust_val = config["trust_value"]
        careful_val = config["careful_value"]

        # Filter to valid responses (trust or careful only)
        valid = df[col].dropna()
        valid = valid[valid.isin([trust_val, careful_val])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            print(
                f"  Interpersonal: insufficient sample ({len(valid)} < {self.MIN_SAMPLE_SIZE})"
            )
            return None

        # % saying "can be trusted"
        pct_trust = float((valid == trust_val).mean() * 100)

        print(f"  Interpersonal trust: {pct_trust:.1f}% (n={len(valid)})")

        return Observation(
            iso3="CAN",
            year=year,
            source=self.SOURCE_NAME,
            trust_type="interpersonal",
            raw_value=round(pct_trust, 1),
            raw_unit="% can trust",
            score_0_100=round(pct_trust, 1),
            sample_n=int(len(valid)),
            method_notes=f"CES {col}, n={len(valid)}",
            source_url="https://ces-eec.arts.ubc.ca",
            methodology="binary",
        )

    def _calculate_institutional_trust(
        self, df: pd.DataFrame, year: int, config: Dict[str, Any]
    ) -> Optional[Observation]:
        """
        Calculate institutional trust from satisfaction scale.

        Config contains:
        - column: column name
        - scale_type: "likert_5" (1-5) or "likert_7" (1-7)
        - valid_range: tuple of (min, max) valid values
        """
        col = config["column"]
        if col not in df.columns:
            print(f"  Institutional trust column '{col}' not found")
            return None

        scale_type = config["scale_type"]
        min_val, max_val = config["valid_range"]

        # Filter valid responses
        valid = df[col].dropna()
        valid = valid[(valid >= min_val) & (valid <= max_val)]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            print(
                f"  Institutional: insufficient sample ({len(valid)} < {self.MIN_SAMPLE_SIZE})"
            )
            return None

        # Normalize to 0-100 scale
        # For any scale, map min->0, max->100
        normalized = ((valid - min_val) / (max_val - min_val)) * 100
        avg_score = float(normalized.mean())

        print(f"  Institutional trust: {avg_score:.1f} (n={len(valid)})")

        return Observation(
            iso3="CAN",
            year=year,
            source=self.SOURCE_NAME,
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit=f"Normalized from {scale_type}",
            score_0_100=round(avg_score, 1),
            sample_n=int(len(valid)),
            method_notes=f"CES {col} fed govt satisfaction ({scale_type}), n={len(valid)}",
            source_url="https://ces-eec.arts.ubc.ca",
        )


@click.command()
@click.option(
    "--year",
    default=None,
    type=int,
    help="Election year to process (default: all available)",
)
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: Optional[int], dry_run: bool):
    """Run CES ETL process."""
    processor = CESProcessor()

    # Determine which years to process
    if year:
        years = [year]
    else:
        years = list(CESProcessor.WAVE_FILES.keys())

    all_observations = []
    processed_years = []
    failed_years = []

    for y in years:
        print(f"\n{'='*50}")
        print(f"Processing CES {y}")
        print("=" * 50)

        try:
            data_path = processor.download(y)
            observations = processor.process(data_path, y)
            all_observations.extend(observations)
            processed_years.append(y)
        except FileNotFoundError as e:
            print(f"Skipping {y}: {e}")
            failed_years.append((y, "file not found"))
        except RuntimeError as e:
            print(f"Skipping {y}: {e}")
            failed_years.append((y, str(e)))
        except Exception as e:
            print(f"Error processing {y}: {e}")
            failed_years.append((y, str(e)))

    # Summary
    print(f"\n{'='*50}")
    print("CES ETL Summary")
    print("=" * 50)

    by_type: dict[str, int] = defaultdict(int)
    for obs in all_observations:
        by_type[obs.trust_type] += 1

    print(f"Years processed: {processed_years}")
    if failed_years:
        print(f"Years failed: {failed_years}")
    print(f"Total observations: {len(all_observations)}")
    for t, count in by_type.items():
        print(f"  {t}: {count}")

    if not dry_run and all_observations:
        processor.load_to_database(all_observations)
        print("\nSaved to database")
    elif dry_run:
        print("\nDry run - not saved")


if __name__ == "__main__":
    main()
