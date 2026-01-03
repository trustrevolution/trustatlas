#!/usr/bin/env python3
"""
Data Quality Sweep - Detect and flag outliers in the trust index database.

Usage:
    python -m etl.data_quality.sweep --help
    python -m etl.data_quality.sweep --output-csv reports/quality_sweep.csv
    python -m etl.data_quality.sweep --check yoy_anomalies --dry-run
"""

import argparse
import csv
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

import psycopg2
from psycopg2.extras import Json

from .checks import (
    Flag,
    detect_statistical_outliers,
    detect_yoy_anomalies,
    detect_cross_source_inconsistencies,
    detect_methodology_mismatches,
    detect_sample_size_issues,
    detect_coverage_gaps,
)


# Available checks
CHECKS = {
    "statistical_outliers": detect_statistical_outliers,
    "yoy_anomalies": detect_yoy_anomalies,
    "cross_source": detect_cross_source_inconsistencies,
    "methodology_mismatch": detect_methodology_mismatches,
    "sample_size": detect_sample_size_issues,
    "coverage_gaps": detect_coverage_gaps,
}


@dataclass
class SweepReport:
    """Summary of sweep results."""

    total_flags: int
    errors: int
    warnings: int
    by_type: dict
    timestamp: datetime


def get_db_connection():
    """Create database connection from environment."""
    return psycopg2.connect(
        os.environ.get("POSTGRES_URL", "postgresql://trust:trust@localhost:5432/trust")
    )


def save_flags_to_db(conn, flags: List[Flag]) -> int:
    """
    Persist flags to data_quality_flags table.

    Uses UPSERT to update existing flags rather than creating duplicates.
    Returns count of new/updated flags.
    """
    if not flags:
        return 0

    saved = 0
    with conn.cursor() as cur:
        for flag in flags:
            # Skip coverage flags with observation_id=0
            if flag.observation_id == 0:
                continue

            cur.execute(
                """
                INSERT INTO data_quality_flags
                    (observation_id, flag_type, severity, details, detected_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (observation_id, flag_type)
                DO UPDATE SET
                    severity = EXCLUDED.severity,
                    details = EXCLUDED.details,
                    detected_at = NOW(),
                    resolved_at = NULL
                RETURNING id
            """,
                (
                    flag.observation_id,
                    flag.flag_type,
                    flag.severity,
                    Json(flag.details),
                ),
            )
            if cur.fetchone():
                saved += 1

        conn.commit()

    return saved


def write_csv_report(flags: List[Flag], output_path: str, conn) -> None:
    """Write flags to CSV file with country names."""
    # Build lookup for country names
    country_names = {}
    with conn.cursor() as cur:
        cur.execute("SELECT iso3, name FROM countries")
        for row in cur.fetchall():
            country_names[row[0]] = row[1]

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "observation_id",
                "iso3",
                "country_name",
                "year",
                "source",
                "trust_type",
                "score",
                "flag_type",
                "severity",
                "reason",
                "details",
            ]
        )

        for flag in flags:
            details = flag.details
            iso3 = details.get("iso3", "")
            writer.writerow(
                [
                    flag.observation_id if flag.observation_id != 0 else "",
                    iso3,
                    country_names.get(iso3, details.get("country_name", "")),
                    details.get("year", ""),
                    details.get("source", ""),
                    details.get("trust_type", ""),
                    details.get("score", ""),
                    flag.flag_type,
                    flag.severity,
                    details.get("reason", ""),
                    str(details),
                ]
            )


def run_sweep(
    conn,
    checks: Optional[List[str]] = None,
    save_to_db: bool = True,
    output_csv: Optional[str] = None,
    verbose: bool = False,
) -> SweepReport:
    """
    Run data quality sweep.

    Args:
        conn: Database connection
        checks: List of check names to run (None = all)
        save_to_db: Whether to persist flags to database
        output_csv: Path to write CSV report (None = skip)
        verbose: Print detailed output

    Returns:
        SweepReport with summary statistics
    """
    checks_to_run = checks or list(CHECKS.keys())
    all_flags: List[Flag] = []
    by_type = {}

    for check_name in checks_to_run:
        if check_name not in CHECKS:
            print(f"Warning: Unknown check '{check_name}', skipping")
            continue

        if verbose:
            print(f"Running {check_name}...", end=" ", flush=True)

        check_fn = CHECKS[check_name]
        flags = check_fn(conn)
        all_flags.extend(flags)
        by_type[check_name] = len(flags)

        if verbose:
            print(f"found {len(flags)} issues")

    # Count severities
    errors = sum(1 for f in all_flags if f.severity == "error")
    warnings = sum(1 for f in all_flags if f.severity == "warning")

    # Save to database
    if save_to_db:
        saved = save_flags_to_db(conn, all_flags)
        if verbose:
            print(f"\nSaved {saved} flags to database")

    # Write CSV
    if output_csv:
        write_csv_report(all_flags, output_csv, conn)
        if verbose:
            print(f"Wrote report to {output_csv}")

    return SweepReport(
        total_flags=len(all_flags),
        errors=errors,
        warnings=warnings,
        by_type=by_type,
        timestamp=datetime.now(),
    )


def print_report(report: SweepReport) -> None:
    """Print human-readable sweep report."""
    print("\n" + "=" * 60)
    print("DATA QUALITY SWEEP REPORT")
    print("=" * 60)
    print(f"Timestamp: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal issues found: {report.total_flags}")
    print(f"  Errors:   {report.errors}")
    print(f"  Warnings: {report.warnings}")
    print("\nBy check type:")
    for check_name, count in sorted(report.by_type.items()):
        print(f"  {check_name}: {count}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Sweep database for data quality issues",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run all checks, save to DB and generate CSV
    python -m etl.data_quality.sweep --output-csv reports/quality_sweep.csv

    # Run specific check only
    python -m etl.data_quality.sweep --check yoy_anomalies

    # Dry run (report only, no DB writes)
    python -m etl.data_quality.sweep --dry-run

    # Multiple specific checks
    python -m etl.data_quality.sweep --check statistical_outliers --check yoy_anomalies

Available checks:
    statistical_outliers  - Scores outside expected ranges
    yoy_anomalies         - Year-over-year changes >25 points
    cross_source          - Sources differing >30 points
    methodology_mismatch  - Scores unexpected for methodology type
    sample_size           - Sample size issues (too small/large/missing)
    coverage_gaps         - Sources with few countries, sparse data
        """,
    )

    parser.add_argument(
        "--check",
        "-c",
        action="append",
        dest="checks",
        choices=list(CHECKS.keys()),
        help="Specific check(s) to run (can be repeated)",
    )

    parser.add_argument(
        "--output-csv", "-o", metavar="PATH", help="Path for CSV output report"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report only, do not save flags to database",
    )

    parser.add_argument(
        "--quiet", "-q", action="store_true", help="Suppress progress output"
    )

    parser.add_argument(
        "--list-checks", action="store_true", help="List available checks and exit"
    )

    args = parser.parse_args()

    if args.list_checks:
        print("Available checks:")
        for name in CHECKS:
            print(f"  {name}")
        return 0

    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"Error: Could not connect to database: {e}", file=sys.stderr)
        return 1

    try:
        report = run_sweep(
            conn,
            checks=args.checks,
            save_to_db=not args.dry_run,
            output_csv=args.output_csv,
            verbose=not args.quiet,
        )

        print_report(report)

        # Exit with error code if any errors found
        return 1 if report.errors > 0 else 0

    except Exception as e:
        print(f"Error during sweep: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
