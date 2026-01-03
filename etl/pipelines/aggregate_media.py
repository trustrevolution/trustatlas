#!/usr/bin/env python3
"""
Media Pillar Aggregation Pipeline

Computes weighted country_year.media from observations using methodology.yaml weights:
- Reuters_DNR: 40% (primary global)
- Eurobarometer: 40% (primary EU)
- WVS: 20% (supplementary/historical)

Weight redistribution: Missing sources have their weight redistributed proportionally.

Confidence tier logic (distinct from survey pillars):
- Tier A: Reuters or Eurobarometer data ≤1 year old
- Tier B: Reuters/Eurobarometer 1-2 years old OR WVS ≤3 years old
- Tier C: No media data within 3 years

Usage:
    python -m etl.pipelines.aggregate_media
    python -m etl.pipelines.aggregate_media --dry-run
"""

import os
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import click
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Media pillar source weights from methodology.yaml
MEDIA_WEIGHTS = {
    "Reuters_DNR": 0.4,
    "Eurobarometer": 0.4,
    "WVS": 0.2,
}

# Annual sources (for confidence tier calculation)
ANNUAL_SOURCES = {"Reuters_DNR", "Eurobarometer"}

# Current year for confidence calculations
CURRENT_YEAR = datetime.now().year


def get_db_connection():
    """Create database connection from environment."""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "trust"),
        user=os.getenv("POSTGRES_USER", "trust"),
        password=os.getenv("POSTGRES_PASSWORD", "trust"),
    )


def compute_media_confidence_tier(
    sources: List[str], latest_year: int, current_year: int = CURRENT_YEAR
) -> str:
    """
    Compute media-specific confidence tier.

    Media tier logic differs from survey pillars (interpersonal/institutional)
    because Reuters DNR and Eurobarometer are annual, not 5-year cycles.

    Args:
        sources: List of source names that contributed to the score
        latest_year: Most recent year of data available
        current_year: Reference year for recency calculation

    Returns:
        'A', 'B', or 'C' tier
    """
    age = current_year - latest_year
    has_annual = any(s in ANNUAL_SOURCES for s in sources)

    # Tier A: Annual source data within 1 year
    if has_annual and age <= 1:
        return "A"

    # Tier B: Annual source 1-2 years old, OR WVS within 3 years
    if (has_annual and age <= 2) or ("WVS" in sources and age <= 3):
        return "B"

    # Tier C: Older data
    return "C"


def compute_confidence_interval(
    score: float, tier: str
) -> Tuple[Optional[float], Optional[float]]:
    """
    Compute confidence interval based on tier.

    Args:
        score: Media trust score (0-100)
        tier: Confidence tier ('A', 'B', 'C')

    Returns:
        Tuple of (ci_lower, ci_upper)
    """
    if score is None:
        return None, None

    margin = {"A": 5, "B": 10, "C": 15}.get(tier, 15)
    return (max(0, score - margin), min(100, score + margin))


def aggregate_media_observations(conn, dry_run: bool = False) -> Dict:
    """
    Aggregate media observations into country_year table.

    Args:
        conn: Database connection
        dry_run: If True, don't write to database

    Returns:
        Statistics dict
    """
    stats = {
        "countries_processed": 0,
        "country_years_updated": 0,
        "tier_distribution": {"A": 0, "B": 0, "C": 0},
        "source_coverage": defaultdict(int),
    }

    with conn.cursor() as cur:
        # Get all media observations grouped by country-year
        cur.execute("""
            SELECT iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'media'
              AND score_0_100 IS NOT NULL
            ORDER BY iso3, year, source
        """)

        # Group by (iso3, year)
        country_years: Dict[Tuple[str, int], Dict[str, List[float]]] = defaultdict(
            lambda: defaultdict(list)
        )

        for row in cur.fetchall():
            iso3, year, source, score = row
            country_years[(iso3, year)][source].append(float(score))

        # Track unique countries
        countries = set()

        # Compute weighted averages
        results = []
        for (iso3, year), sources_data in country_years.items():
            countries.add(iso3)

            # Calculate source averages (in case multiple obs per source)
            source_scores = {
                src: sum(scores) / len(scores) for src, scores in sources_data.items()
            }

            # Calculate weighted average with redistribution
            available_weight = sum(
                MEDIA_WEIGHTS.get(src, 0) for src in source_scores
            )

            if available_weight == 0:
                continue

            weighted_sum = sum(
                score * (MEDIA_WEIGHTS.get(src, 0) / available_weight)
                for src, score in source_scores.items()
            )

            # Compute confidence tier
            source_list = list(source_scores.keys())
            tier = compute_media_confidence_tier(source_list, year)
            ci_lower, ci_upper = compute_confidence_interval(weighted_sum, tier)

            results.append(
                {
                    "iso3": iso3,
                    "year": year,
                    "media": round(weighted_sum, 1),
                    "sources": source_list,
                    "confidence_tier": tier,
                    "ci_lower": ci_lower,
                    "ci_upper": ci_upper,
                }
            )

            # Update stats
            stats["tier_distribution"][tier] += 1
            for src in source_list:
                stats["source_coverage"][src] += 1

        stats["countries_processed"] = len(countries)
        stats["country_years_updated"] = len(results)

        if dry_run:
            print(f"\nDRY RUN - Would update {len(results)} country-year records")
            return stats

        # Update country_year table
        for r in results:
            cur.execute(
                """
                INSERT INTO country_year (iso3, year, media, media_confidence_tier, media_ci_lower, media_ci_upper, sources_used, computed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (iso3, year) DO UPDATE SET
                    media = EXCLUDED.media,
                    media_confidence_tier = EXCLUDED.media_confidence_tier,
                    media_ci_lower = EXCLUDED.media_ci_lower,
                    media_ci_upper = EXCLUDED.media_ci_upper,
                    sources_used = COALESCE(country_year.sources_used, '{}'::jsonb) ||
                        jsonb_build_object('media', %s::jsonb),
                    computed_at = NOW()
            """,
                (
                    r["iso3"],
                    r["year"],
                    r["media"],
                    r["confidence_tier"],
                    r["ci_lower"],
                    r["ci_upper"],
                    Json({"media": r["sources"]}),
                    Json(r["sources"]),
                ),
            )

        conn.commit()

    return stats


def print_report(stats: Dict) -> None:
    """Print aggregation report."""
    print("\n" + "=" * 60)
    print("MEDIA PILLAR AGGREGATION REPORT")
    print("=" * 60)
    print(f"Countries processed: {stats['countries_processed']}")
    print(f"Country-year records updated: {stats['country_years_updated']}")
    print("\nConfidence tier distribution:")
    for tier, count in sorted(stats["tier_distribution"].items()):
        print(f"  Tier {tier}: {count}")
    print("\nSource coverage:")
    for source, count in sorted(stats["source_coverage"].items()):
        weight = MEDIA_WEIGHTS.get(source, 0) * 100
        print(f"  {source} ({weight:.0f}% weight): {count} observations")
    print("=" * 60)


@click.command()
@click.option("--dry-run", is_flag=True, help="Report only, no database writes")
def main(dry_run: bool):
    """
    Aggregate media observations into country_year.media.

    Computes weighted averages from Reuters DNR, Eurobarometer, and WVS media data,
    with pillar-specific confidence tiers.
    """
    # Load environment
    project_root = Path(__file__).parent.parent.parent
    env_path = project_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"Error: Could not connect to database: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        print("Aggregating media pillar scores...")
        stats = aggregate_media_observations(conn, dry_run)
        print_report(stats)

    except Exception as e:
        print(f"Error during aggregation: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
