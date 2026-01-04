#!/usr/bin/env python3
"""
Pillar Aggregation Pipeline

Aggregates observations into country_year table for all pillars:
- interpersonal: Survey-based, source priority (WVS > barometers)
- institutional: Survey-based, source priority (WVS > barometers)
- media: Weighted average (Reuters 40%, Eurobarometer 40%, WVS 20%)
- governance: Handled separately by ETL jobs (CPI, WGI, etc.)

Usage:
    python -m etl.pipelines.aggregate_pillars                    # All pillars
    python -m etl.pipelines.aggregate_pillars --pillar media     # Single pillar
    python -m etl.pipelines.aggregate_pillars --dry-run          # Preview only
"""

import os
import sys
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

import click
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# =============================================================================
# Configuration
# =============================================================================

CURRENT_YEAR = datetime.now().year

# Media pillar weights (weighted average)
MEDIA_WEIGHTS = {
    "Reuters_DNR": 0.4,
    "Eurobarometer": 0.4,
    "WVS": 0.2,
}

# Survey pillar source priority (lower = higher priority)
SURVEY_SOURCE_PRIORITY = {
    "WVS": 1,
    "EVS": 2,
    "GSS": 3,
    "ANES": 3,
    "CES": 3,
    "Afrobarometer": 4,
    "Arab Barometer": 4,
    "Asian Barometer": 4,
    "Latinobarometro": 4,
    "CaucasusBarometer": 5,
    "LAPOP": 5,
    "LiTS": 5,
}

# Sources to exclude from survey pillars (different scales)
EXCLUDED_SURVEY_SOURCES = {"ESS", "OECD", "EU-SILC"}


# =============================================================================
# Database
# =============================================================================


def get_db_connection():
    """Create database connection from environment."""
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        database=os.getenv("POSTGRES_DB", "trust"),
        user=os.getenv("POSTGRES_USER", "trust"),
        password=os.getenv("POSTGRES_PASSWORD", "trust"),
    )


# =============================================================================
# Confidence Tiers
# =============================================================================


def get_survey_confidence_tier(source: str, data_age: int) -> str:
    """
    Determine confidence tier for survey pillars.

    Tier A: WVS/EVS/GSS/ANES ≤3 years old
    Tier B: WVS/EVS 3-5 years old OR barometers ≤3 years old
    Tier C: All sources >5 years old
    """
    priority = SURVEY_SOURCE_PRIORITY.get(source, 10)

    if priority <= 3:  # WVS, EVS, GSS, ANES, CES
        if data_age <= 3:
            return "A"
        elif data_age <= 5:
            return "B"
        else:
            return "C"
    elif priority <= 5:  # Barometers
        if data_age <= 3:
            return "B"
        else:
            return "C"
    else:
        return "C"


def get_media_confidence_tier(sources: List[str], latest_year: int) -> str:
    """
    Determine confidence tier for media pillar.

    Tier A: Reuters/Eurobarometer ≤1 year old
    Tier B: Reuters/Eurobarometer 1-2 years old OR WVS ≤3 years
    Tier C: Older data
    """
    age = CURRENT_YEAR - latest_year
    annual_sources = {"Reuters_DNR", "Eurobarometer"}
    has_annual = any(s in annual_sources for s in sources)

    if has_annual and age <= 1:
        return "A"
    if (has_annual and age <= 2) or ("WVS" in sources and age <= 3):
        return "B"
    return "C"


def get_ci_bounds(tier: str, score: float) -> Tuple[float, float]:
    """Get confidence interval bounds based on tier."""
    margin = {"A": 5, "B": 10, "C": 15}.get(tier, 15)
    return (max(0, score - margin), min(100, score + margin))


# =============================================================================
# Survey Pillar Aggregation (interpersonal, institutional)
# =============================================================================


def aggregate_survey_pillar(conn, pillar: str, dry_run: bool = False) -> Dict:
    """
    Aggregate survey observations for interpersonal or institutional pillar.

    Uses source priority - highest priority source wins for each country-year.
    """
    tier_counts = {"A": 0, "B": 0, "C": 0}
    source_counts: Dict[str, int] = defaultdict(int)

    with conn.cursor() as cur:
        # Get all observations for this pillar
        cur.execute(
            """
            SELECT iso3, year, source, score_0_100, sample_n
            FROM observations
            WHERE trust_type = %s
              AND score_0_100 IS NOT NULL
              AND source NOT IN %s
            ORDER BY iso3, year DESC, source
        """,
            (pillar, tuple(EXCLUDED_SURVEY_SOURCES)),
        )

        rows = cur.fetchall()
        if not rows:
            return {"countries_processed": 0, "country_years_updated": 0}

        # Select best source for each country-year
        country_years: Dict[Tuple[str, int], Tuple[str, float, int]] = {}

        for iso3, year, source, score, sample_n in rows:
            key = (iso3, year)
            priority = SURVEY_SOURCE_PRIORITY.get(source, 10)

            if key not in country_years:
                country_years[key] = (source, float(score), sample_n or 0)
            else:
                existing_priority = SURVEY_SOURCE_PRIORITY.get(
                    country_years[key][0], 10
                )
                if priority < existing_priority:
                    country_years[key] = (source, float(score), sample_n or 0)

        countries = set(k[0] for k in country_years.keys())
        results = []

        for (iso3, year), (source, score, _) in country_years.items():
            data_age = CURRENT_YEAR - year
            tier = get_survey_confidence_tier(source, data_age)
            ci_lower, ci_upper = get_ci_bounds(tier, score)

            results.append(
                {
                    "iso3": iso3,
                    "year": year,
                    "score": round(score, 1),
                    "source": source,
                    "tier": tier,
                    "ci_lower": ci_lower,
                    "ci_upper": ci_upper,
                }
            )

            source_counts[source] += 1
            tier_counts[tier] += 1

        stats = {
            "countries_processed": len(countries),
            "country_years_updated": len(results),
            "source_counts": dict(source_counts),
            "tier_counts": tier_counts,
        }

        if dry_run:
            return stats

        # Update country_year table
        tier_col = f"{pillar}_confidence_tier"
        ci_lower_col = f"{pillar}_ci_lower"
        ci_upper_col = f"{pillar}_ci_upper"

        for r in results:
            cur.execute(
                f"""
                INSERT INTO country_year (iso3, year, {pillar}, {tier_col}, {ci_lower_col}, {ci_upper_col}, sources_used, computed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (iso3, year) DO UPDATE SET
                    {pillar} = EXCLUDED.{pillar},
                    {tier_col} = EXCLUDED.{tier_col},
                    {ci_lower_col} = EXCLUDED.{ci_lower_col},
                    {ci_upper_col} = EXCLUDED.{ci_upper_col},
                    sources_used = COALESCE(country_year.sources_used, '{{}}'::jsonb) || EXCLUDED.sources_used,
                    computed_at = NOW()
            """,
                (
                    r["iso3"],
                    r["year"],
                    r["score"],
                    r["tier"],
                    r["ci_lower"],
                    r["ci_upper"],
                    Json({pillar: [r["source"]]}),
                ),
            )

        conn.commit()

    return stats


# =============================================================================
# Media Pillar Aggregation
# =============================================================================


def aggregate_media_pillar(conn, dry_run: bool = False) -> Dict:
    """
    Aggregate media observations using weighted average.

    Weights: Reuters 40%, Eurobarometer 40%, WVS 20%
    Missing sources have weight redistributed proportionally.
    """
    tier_counts = {"A": 0, "B": 0, "C": 0}
    source_counts: Dict[str, int] = defaultdict(int)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'media'
              AND score_0_100 IS NOT NULL
            ORDER BY iso3, year, source
        """
        )

        # Group by country-year
        country_years: Dict[Tuple[str, int], Dict[str, List[float]]] = defaultdict(
            lambda: defaultdict(list)
        )

        for iso3, year, source, score in cur.fetchall():
            country_years[(iso3, year)][source].append(float(score))

        countries = set()
        results = []

        for (iso3, year), sources_data in country_years.items():
            countries.add(iso3)

            # Average each source's observations
            source_scores = {
                src: sum(scores) / len(scores) for src, scores in sources_data.items()
            }

            # Weighted average with redistribution
            available_weight = sum(MEDIA_WEIGHTS.get(src, 0) for src in source_scores)
            if available_weight == 0:
                continue

            weighted_sum = sum(
                score * (MEDIA_WEIGHTS.get(src, 0) / available_weight)
                for src, score in source_scores.items()
            )

            source_list = list(source_scores.keys())
            tier = get_media_confidence_tier(source_list, year)
            ci_lower, ci_upper = get_ci_bounds(tier, weighted_sum)

            results.append(
                {
                    "iso3": iso3,
                    "year": year,
                    "score": round(weighted_sum, 1),
                    "sources": source_list,
                    "tier": tier,
                    "ci_lower": ci_lower,
                    "ci_upper": ci_upper,
                }
            )

            tier_counts[tier] += 1
            for src in source_list:
                source_counts[src] += 1

        stats = {
            "countries_processed": len(countries),
            "country_years_updated": len(results),
            "source_counts": dict(source_counts),
            "tier_counts": tier_counts,
        }

        if dry_run:
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
                    sources_used = COALESCE(country_year.sources_used, '{}'::jsonb) || EXCLUDED.sources_used,
                    computed_at = NOW()
            """,
                (
                    r["iso3"],
                    r["year"],
                    r["score"],
                    r["tier"],
                    r["ci_lower"],
                    r["ci_upper"],
                    Json({"media": r["sources"]}),
                ),
            )

        conn.commit()

    return stats


# =============================================================================
# Main CLI
# =============================================================================


def print_pillar_stats(pillar: str, stats: Dict):
    """Print stats for a pillar aggregation."""
    print(f"\n{'='*60}")
    print(f"{pillar.upper()} PILLAR")
    print("=" * 60)
    print(f"Countries: {stats['countries_processed']}")
    print(f"Country-years: {stats['country_years_updated']}")

    if stats.get("source_counts"):
        print("\nSources:")
        for src, count in sorted(stats["source_counts"].items(), key=lambda x: -x[1]):
            print(f"  {src}: {count}")

    if stats.get("tier_counts"):
        print("\nTiers:")
        for tier in ["A", "B", "C"]:
            print(f"  {tier}: {stats['tier_counts'].get(tier, 0)}")


@click.command()
@click.option(
    "--pillar",
    type=click.Choice(["interpersonal", "institutional", "media", "all"]),
    default="all",
)
@click.option("--dry-run", is_flag=True, help="Preview only, no database writes")
def main(pillar: str, dry_run: bool):
    """Aggregate observations into country_year for all pillars."""
    load_dotenv()

    try:
        conn = get_db_connection()
    except Exception as e:
        print(f"Error: Could not connect to database: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        pillars = (
            ["interpersonal", "institutional", "media"] if pillar == "all" else [pillar]
        )

        for p in pillars:
            print(f"\nAggregating {p}...")

            if p == "media":
                stats = aggregate_media_pillar(conn, dry_run)
            else:
                stats = aggregate_survey_pillar(conn, p, dry_run)

            print_pillar_stats(p, stats)

        if dry_run:
            print("\n[DRY RUN - no changes made]")
        else:
            print("\nDone!")

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
