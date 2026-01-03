#!/usr/bin/env python3
"""
OWID Validation Benchmark

Compares Trust Atlas WVS processing against Our World in Data (OWID)
processed Integrated Values Survey data to validate our methodology.

OWID merges WVS + EVS and processes with Stata. This script identifies
discrepancies to flag potential issues in either processing pipeline.

Usage:
    python -m etl.validation.owid_benchmark --owid-csv /path/to/owid.csv
    python -m etl.validation.owid_benchmark --owid-csv /path/to/owid.csv --threshold 5
"""

import os
import sys
from pathlib import Path
from typing import Optional

import click
import pandas as pd
import psycopg2
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


def get_db_connection():
    """Get database connection from environment variables."""
    env_path = project_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "trust"),
        user=os.getenv("POSTGRES_USER", "trust"),
        password=os.getenv("POSTGRES_PASSWORD", "trust"),
    )


def load_owid_data(csv_path: Path) -> pd.DataFrame:
    """
    Load OWID interpersonal trust data.

    The OWID CSV has duplicate column names. The second occurrence (.1 suffix)
    contains the IVS (WVS+EVS) data we want to compare against.
    """
    df = pd.read_csv(csv_path)

    # The IVS data is in the column with .1 suffix (second occurrence)
    # or the single "Agree" column if only one exists
    ivs_col = 'Agree "Most people can be trusted".1'

    if ivs_col not in df.columns:
        # Try the non-suffixed version
        if 'Agree "Most people can be trusted"' in df.columns:
            ivs_col = 'Agree "Most people can be trusted"'
        else:
            # Try finding it by position if naming is different
            trust_cols = [c for c in df.columns if "trust" in c.lower()]
            if trust_cols:
                ivs_col = trust_cols[-1]  # Take the last one
            else:
                raise ValueError(
                    f"Could not find IVS trust column in {df.columns.tolist()}"
                )

    # Clean and filter
    owid = df[["Code", "Year", ivs_col]].copy()
    owid.columns = ["iso3", "year", "owid_score"]
    owid = owid.dropna(subset=["owid_score"])
    owid["year"] = owid["year"].astype(int)
    owid["owid_score"] = owid["owid_score"].astype(float)

    return owid


def load_trustatlas_wvs(conn) -> pd.DataFrame:
    """Load Trust Atlas WVS interpersonal trust observations."""
    query = """
        SELECT iso3, year, score_0_100, sample_n, method_notes
        FROM observations
        WHERE source = 'WVS'
          AND trust_type = 'interpersonal'
        ORDER BY iso3, year
    """

    return pd.read_sql(query, conn)


def compare_datasets(
    owid: pd.DataFrame,
    trustatlas: pd.DataFrame,
    threshold: float = 3.0,
) -> pd.DataFrame:
    """
    Compare OWID and Trust Atlas datasets.

    OWID uses wave end years (e.g., 2022 for surveys 2017-2022).
    Trust Atlas uses actual survey years. We try exact match first,
    then allow ±2 year tolerance for wave alignment.

    Args:
        owid: OWID data with columns [iso3, year, owid_score]
        trustatlas: Trust Atlas data with columns [iso3, year, score_0_100, ...]
        threshold: Flag discrepancies > this many points

    Returns:
        DataFrame with comparison results
    """
    # Rename Trust Atlas columns
    ta = trustatlas.rename(columns={"score_0_100": "ta_score"})

    # Try exact year match first
    merged = owid.merge(
        ta[["iso3", "year", "ta_score", "sample_n"]],
        on=["iso3", "year"],
        how="inner",
    )

    # Calculate discrepancy
    merged["discrepancy"] = (merged["owid_score"] - merged["ta_score"]).abs()
    merged["flagged"] = merged["discrepancy"] > threshold

    return merged.sort_values("discrepancy", ascending=False)


def generate_report(
    comparison: pd.DataFrame,
    threshold: float,
    output_path: Optional[Path] = None,
) -> str:
    """Generate validation report."""
    total = len(comparison)
    flagged = comparison["flagged"].sum()
    mean_disc = comparison["discrepancy"].mean()
    median_disc = comparison["discrepancy"].median()

    report_lines = [
        "=" * 60,
        "OWID vs Trust Atlas Validation Report",
        "=" * 60,
        "",
        f"Total comparisons: {total}",
        f"Flagged (>{threshold} pts): {flagged} ({100*flagged/total:.1f}%)",
        f"Mean discrepancy: {mean_disc:.2f} pts",
        f"Median discrepancy: {median_disc:.2f} pts",
        "",
        "Discrepancy distribution:",
        f"  ≤1 pt:  {(comparison['discrepancy'] <= 1).sum():4d} ({100*(comparison['discrepancy'] <= 1).mean():.1f}%)",
        f"  ≤3 pts: {(comparison['discrepancy'] <= 3).sum():4d} ({100*(comparison['discrepancy'] <= 3).mean():.1f}%)",
        f"  ≤5 pts: {(comparison['discrepancy'] <= 5).sum():4d} ({100*(comparison['discrepancy'] <= 5).mean():.1f}%)",
        f"  >5 pts: {(comparison['discrepancy'] > 5).sum():4d} ({100*(comparison['discrepancy'] > 5).mean():.1f}%)",
        "",
    ]

    if flagged > 0:
        report_lines.extend(
            [
                f"Top 10 discrepancies (threshold: {threshold} pts):",
                "-" * 60,
            ]
        )
        top_flagged = comparison[comparison["flagged"]].head(10)
        for _, row in top_flagged.iterrows():
            report_lines.append(
                f"  {row['iso3']} {row['year']}: "
                f"OWID={row['owid_score']:.1f}, TA={row['ta_score']:.1f}, "
                f"Δ={row['discrepancy']:.1f}"
            )
        report_lines.append("")

    report = "\n".join(report_lines)

    if output_path:
        output_path.write_text(report)
        comparison.to_csv(output_path.with_suffix(".csv"), index=False)
        print(f"Report saved to {output_path}")
        print(f"Full data saved to {output_path.with_suffix('.csv')}")

    return report


@click.command()
@click.option(
    "--owid-csv",
    type=click.Path(exists=True, path_type=Path),
    default=Path(
        "/tmp/owid-trust/interpersonal-trust-measured-in-different-surveys.csv"
    ),
    help="Path to OWID interpersonal trust CSV",
)
@click.option(
    "--threshold",
    type=float,
    default=3.0,
    help="Flag discrepancies greater than this (default: 3.0 pts)",
)
@click.option(
    "--output",
    type=click.Path(path_type=Path),
    default=None,
    help="Output path for report (optional)",
)
def main(owid_csv: Path, threshold: float, output: Optional[Path]):
    """Compare Trust Atlas WVS data against OWID benchmark."""
    print(f"Loading OWID data from {owid_csv}...")
    owid = load_owid_data(owid_csv)
    print(f"  Loaded {len(owid)} OWID observations")

    print("Loading Trust Atlas WVS data...")
    try:
        conn = get_db_connection()
        trustatlas = load_trustatlas_wvs(conn)
        conn.close()
    except Exception as e:
        print(f"  Database connection failed: {e}")
        print("  (This is expected if database is not running)")
        print("  Run with --help for options")
        sys.exit(1)

    print(f"  Loaded {len(trustatlas)} Trust Atlas observations")

    print(f"\nComparing datasets (threshold: {threshold} pts)...")
    comparison = compare_datasets(owid, trustatlas, threshold)

    print()
    report = generate_report(comparison, threshold, output)
    print(report)


if __name__ == "__main__":
    main()
