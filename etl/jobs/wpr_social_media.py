#!/usr/bin/env python3
"""
World Population Review Social Media ETL Job

Loads social media penetration data from World Population Review CSV export.
Data sourced from DataReportal (We Are Social + Meltwater partnership).

Usage:
    python -m etl.jobs.wpr_social_media --csv ~/Downloads/WorldPopulationReview.com/social-media-users-by-country-2026.csv
"""

import csv
import logging
import os
import sys
from pathlib import Path
from typing import List
from dataclasses import dataclass

import click
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.countries import CountryMapper

logger = logging.getLogger(__name__)

# Years available in the CSV
YEARS = [2021, 2022, 2023, 2024, 2025]

# Source metadata
SOURCE = "DataReportal"
SOURCE_URL = (
    "https://worldpopulationreview.com/country-rankings/social-media-users-by-country"
)


@dataclass
class DigitalIndicator:
    """A single digital indicator observation."""

    iso3: str
    year: int
    indicator: str
    value: float
    source: str
    source_url: str

    def to_tuple(self):
        return (
            self.iso3,
            self.year,
            self.indicator,
            self.value,
            self.source,
            self.source_url,
        )


def load_social_media_csv(
    csv_path: Path, mapper: CountryMapper
) -> List[DigitalIndicator]:
    """
    Load World Population Review social media data (2021-2025).

    Args:
        csv_path: Path to the CSV file
        mapper: CountryMapper for ISO2 to ISO3 conversion

    Returns:
        List of DigitalIndicator objects
    """
    rows = []
    unmapped = set()
    skipped_high = []

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            iso2 = row.get("flagCode", "").strip()
            country_name = row.get("country", "")

            if not iso2:
                continue

            # Map ISO2 to ISO3
            iso3 = mapper.get_iso3_from_iso2(iso2)
            if not iso3:
                unmapped.add(f"{iso2} ({country_name})")
                continue

            for year in YEARS:
                col = f"SocialMediaUsers_PctOfPop_{year}"
                raw_val = row.get(col, "")

                if not raw_val:
                    continue

                try:
                    pct = float(raw_val) * 100  # Convert decimal to percentage
                except (ValueError, TypeError):
                    logger.warning(f"Invalid value for {iso3}/{year}: {raw_val}")
                    continue

                # Skip impossible values (data quality issue in small territories)
                if pct > 100:
                    skipped_high.append(f"{iso3}/{year}: {pct:.1f}%")
                    continue

                rows.append(
                    DigitalIndicator(
                        iso3=iso3,
                        year=year,
                        indicator="social_media_penetration",
                        value=round(pct, 2),
                        source=SOURCE,
                        source_url=SOURCE_URL,
                    )
                )

    if unmapped:
        logger.warning(f"Unmapped countries: {sorted(unmapped)}")
    if skipped_high:
        logger.warning(
            f"Skipped {len(skipped_high)} values >100%: {skipped_high[:5]}..."
        )

    return rows


def insert_indicators(rows: List[DigitalIndicator], conn) -> int:
    """
    Insert digital indicators into database.

    Args:
        rows: List of DigitalIndicator objects
        conn: Database connection

    Returns:
        Number of rows affected
    """
    if not rows:
        logger.warning("No rows to insert")
        return 0

    cur = conn.cursor()

    execute_values(
        cur,
        """
        INSERT INTO digital_indicators (iso3, year, indicator, value, source, source_url)
        VALUES %s
        ON CONFLICT (iso3, year, indicator, source)
        DO UPDATE SET value = EXCLUDED.value, retrieved_at = CURRENT_DATE
        """,
        [r.to_tuple() for r in rows],
    )

    rows_affected = cur.rowcount
    conn.commit()

    return rows_affected


def ensure_countries_exist(rows: List[DigitalIndicator], conn) -> None:
    """Ensure all countries in the dataset exist in the countries table."""
    iso3_codes = {r.iso3 for r in rows}

    cur = conn.cursor()
    cur.execute("SELECT iso3 FROM countries")
    existing = {row[0] for row in cur.fetchall()}

    missing = iso3_codes - existing
    if missing:
        logger.info(f"Adding {len(missing)} missing countries: {sorted(missing)}")
        for iso3 in missing:
            cur.execute(
                "INSERT INTO countries (iso3, name) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (iso3, iso3),
            )
        conn.commit()


def get_db_connection():
    """Get database connection from environment variables."""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "trust"),
        user=os.getenv("POSTGRES_USER", "trust"),
        password=os.getenv("POSTGRES_PASSWORD", "trust"),
    )


@click.command()
@click.option(
    "--csv",
    "csv_path",
    type=click.Path(exists=True, path_type=Path),
    required=True,
    help="Path to World Population Review social media CSV",
)
@click.option(
    "--dry-run", is_flag=True, help="Parse and validate without database insert"
)
def main(csv_path: Path, dry_run: bool):
    """Load World Population Review social media penetration data."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # Load environment
    env_path = project_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    # Initialize country mapper
    mapper = CountryMapper()

    # Load and parse CSV
    logger.info(f"Loading data from {csv_path}")
    rows = load_social_media_csv(csv_path, mapper)
    logger.info(f"Parsed {len(rows)} valid observations")

    # Show summary by year
    by_year: dict[int, int] = {}
    for r in rows:
        by_year[r.year] = by_year.get(r.year, 0) + 1
    for year in sorted(by_year.keys()):
        logger.info(f"  {year}: {by_year[year]} countries")

    if dry_run:
        logger.info("Dry run - skipping database insert")
        # Show sample data
        logger.info("Sample observations:")
        for r in rows[:5]:
            logger.info(f"  {r.iso3}/{r.year}: {r.value}%")
        return

    # Insert into database
    conn = get_db_connection()
    try:
        ensure_countries_exist(rows, conn)
        affected = insert_indicators(rows, conn)
        logger.info(f"Inserted/updated {affected} rows in digital_indicators")

        # Verify
        cur = conn.cursor()
        cur.execute(
            "SELECT COUNT(*) FROM digital_indicators WHERE source = %s", (SOURCE,)
        )
        total = cur.fetchone()[0]
        logger.info(f"Total {SOURCE} records in database: {total}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
