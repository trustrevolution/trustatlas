#!/usr/bin/env python3
"""
Survey Pillar Aggregation Pipeline

Aggregates interpersonal and institutional trust observations into country_year.

Source hierarchy (first available takes precedence):
1. WVS (gold standard, identical methodology globally)
2. Regional barometers (Afro/Arab/Asian/Latino) - supplement gaps
3. EVS (interpersonal only, same A165 question as WVS)

For each country-year, we take the most authoritative source available.
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import click
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Source priority (lower = higher priority)
SOURCE_PRIORITY = {
    "WVS": 1,
    "EVS": 2,  # Same methodology as WVS
    "GSS": 3,  # USA gold standard
    "ANES": 3,  # USA gold standard
    "CES": 3,  # Canada gold standard
    "Afrobarometer": 4,
    "Arab Barometer": 4,
    "Asian Barometer": 4,
    "Latinobarometro": 4,
    "CaucasusBarometer": 5,
    "LAPOP": 5,
    "LiTS": 5,
    "ESS": 6,  # Different scale, reference only
    "OECD": 6,  # Different scale, reference only
    "EU-SILC": 6,  # Different scale, reference only
}


def get_confidence_tier(source: str, data_age: int) -> str:
    """
    Determine confidence tier based on source and data age.

    Tier A: WVS/EVS/GSS/ANES ≤3 years old
    Tier B: WVS/EVS 3-5 years old OR barometers ≤3 years old
    Tier C: All sources >5 years old
    """
    priority = SOURCE_PRIORITY.get(source, 10)

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


def get_ci_bounds(tier: str, score: float) -> Tuple[float, float]:
    """Get confidence interval bounds based on tier."""
    if tier == "A":
        margin = 5
    elif tier == "B":
        margin = 10
    else:
        margin = 15

    return (max(0, score - margin), min(100, score + margin))


def aggregate_survey_observations(
    conn,
    pillar: str,  # 'interpersonal' or 'institutional'
    dry_run: bool = False,
    current_year: int = None
) -> Dict:
    """
    Aggregate survey observations into country_year table.

    For each country-year, selects the highest-priority source available.
    """
    if current_year is None:
        current_year = datetime.now().year

    trust_type = pillar  # interpersonal or institutional
    pillar_col = pillar  # column name in country_year

    countries_processed = 0
    country_years_updated = 0
    source_counts: Dict[str, int] = {}
    tier_counts = {"A": 0, "B": 0, "C": 0}

    with conn.cursor() as cur:
        # Get all survey observations for this pillar
        cur.execute("""
            SELECT iso3, year, source, score_0_100, sample_n
            FROM observations
            WHERE trust_type = %s
              AND score_0_100 IS NOT NULL
              AND source NOT IN ('ESS', 'OECD', 'EU-SILC')  -- Exclude different-scale sources
            ORDER BY iso3, year DESC, source
        """, (trust_type,))

        rows = cur.fetchall()

        if not rows:
            print(f"No observations found for {pillar}")
            return {"countries_processed": 0, "country_years_updated": 0}

        # Group by country-year and select best source
        country_years: Dict[Tuple[str, int], Tuple[str, float, int]] = {}

        for iso3, year, source, score, sample_n in rows:
            key = (iso3, year)
            priority = SOURCE_PRIORITY.get(source, 10)

            if key not in country_years:
                country_years[key] = (source, float(score), sample_n or 0)
            else:
                existing_source, _, _ = country_years[key]
                existing_priority = SOURCE_PRIORITY.get(existing_source, 10)
                if priority < existing_priority:
                    country_years[key] = (source, float(score), sample_n or 0)

        countries = set(k[0] for k in country_years.keys())
        countries_processed = len(countries)

        results = []
        for (iso3, year), (source, score, sample_n) in country_years.items():
            data_age = current_year - year
            tier = get_confidence_tier(source, data_age)
            ci_lower, ci_upper = get_ci_bounds(tier, score)

            results.append({
                "iso3": iso3,
                "year": year,
                "score": round(score, 1),
                "source": source,
                "tier": tier,
                "ci_lower": ci_lower,
                "ci_upper": ci_upper,
            })

            source_counts[source] = source_counts.get(source, 0) + 1
            tier_counts[tier] += 1

        country_years_updated = len(results)

        if dry_run:
            print(f"\nDRY RUN - Would update {country_years_updated} {pillar} records")
            return {
                "countries_processed": countries_processed,
                "country_years_updated": country_years_updated,
                "source_counts": source_counts,
                "tier_counts": tier_counts,
            }

        # Update country_year table
        for r in results:
            # Dynamic column names for pillar-specific fields
            tier_col = f"{pillar_col}_confidence_tier"
            ci_lower_col = f"{pillar_col}_ci_lower"
            ci_upper_col = f"{pillar_col}_ci_upper"

            cur.execute(f"""
                INSERT INTO country_year (iso3, year, {pillar_col}, {tier_col}, {ci_lower_col}, {ci_upper_col}, sources_used, computed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (iso3, year) DO UPDATE SET
                    {pillar_col} = EXCLUDED.{pillar_col},
                    {tier_col} = EXCLUDED.{tier_col},
                    {ci_lower_col} = EXCLUDED.{ci_lower_col},
                    {ci_upper_col} = EXCLUDED.{ci_upper_col},
                    sources_used = COALESCE(country_year.sources_used, '{{}}'::jsonb) ||
                                   EXCLUDED.sources_used,
                    computed_at = NOW()
            """, (
                r["iso3"],
                r["year"],
                r["score"],
                r["tier"],
                r["ci_lower"],
                r["ci_upper"],
                Json({pillar: [r["source"]]}),
            ))

        conn.commit()

    return {
        "countries_processed": countries_processed,
        "country_years_updated": country_years_updated,
        "source_counts": source_counts,
        "tier_counts": tier_counts,
    }


@click.command()
@click.option("--pillar", type=click.Choice(["interpersonal", "institutional", "both"]), default="both")
@click.option("--dry-run", is_flag=True, help="Don't write to database")
def main(pillar: str, dry_run: bool):
    """Aggregate survey observations into country_year."""
    load_dotenv()

    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "trustatlas"),
        user=os.getenv("POSTGRES_USER", "trust"),
        password=os.getenv("POSTGRES_PASSWORD", "trust"),
    )

    pillars = ["interpersonal", "institutional"] if pillar == "both" else [pillar]

    for p in pillars:
        print(f"\n{'='*60}")
        print(f"Aggregating {p} pillar...")
        print('='*60)

        stats = aggregate_survey_observations(conn, p, dry_run)

        print(f"\nCountries processed: {stats['countries_processed']}")
        print(f"Country-years updated: {stats['country_years_updated']}")

        if stats.get('source_counts'):
            print("\nSource distribution:")
            for src, count in sorted(stats['source_counts'].items(), key=lambda x: -x[1]):
                print(f"  {src}: {count}")

        if stats.get('tier_counts'):
            print("\nConfidence tiers:")
            for tier, count in sorted(stats['tier_counts'].items()):
                print(f"  Tier {tier}: {count}")

    conn.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
