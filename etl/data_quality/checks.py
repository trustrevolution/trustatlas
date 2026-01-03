"""
Data quality check functions for detecting outliers and anomalies.

Each function returns a list of Flag dictionaries with:
- observation_id: ID of the flagged observation
- flag_type: Type of issue detected
- severity: 'warning' or 'error'
- details: Dict with context about the issue
"""

from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class Flag:
    """Represents a data quality flag."""

    observation_id: int
    flag_type: str
    severity: str  # 'warning' or 'error'
    details: Dict[str, Any]


def detect_statistical_outliers(conn) -> List[Flag]:
    """
    Detect scores that are statistically extreme for their trust type.

    Thresholds:
    - Interpersonal (binary): Flag if >60% or <10% (expected 15-55%)
    - Institutional: Flag if >95% or <5%
    - Governance: Flag if >95% or <10%
    """
    flags = []

    with conn.cursor() as cur:
        # Binary interpersonal outliers
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100, methodology
            FROM observations
            WHERE trust_type = 'interpersonal'
              AND methodology = 'binary'
              AND (score_0_100 > 60 OR score_0_100 < 10)
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score, methodology = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="statistical_outlier",
                    severity="error" if score > 70 or score < 5 else "warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "trust_type": "interpersonal",
                        "methodology": methodology,
                        "expected_range": [10, 60],
                        "reason": "Binary interpersonal trust outside expected range",
                    },
                )
            )

        # 4-point scale interpersonal outliers
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100, methodology
            FROM observations
            WHERE trust_type = 'interpersonal'
              AND methodology = '4point'
              AND score_0_100 > 80
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score, methodology = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="statistical_outlier",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "trust_type": "interpersonal",
                        "methodology": methodology,
                        "expected_range": [10, 80],
                        "reason": "4-point scale interpersonal unusually high",
                    },
                )
            )

        # Institutional outliers
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'institutional'
              AND (score_0_100 > 95 OR score_0_100 < 5)
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="statistical_outlier",
                    severity="error" if score > 98 or score < 3 else "warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "trust_type": "institutional",
                        "expected_range": [5, 95],
                        "reason": "Institutional trust outside expected range",
                    },
                )
            )

        # Governance outliers (very high is suspicious)
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'governance'
              AND score_0_100 > 95
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="statistical_outlier",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "trust_type": "governance",
                        "expected_range": [0, 95],
                        "reason": "Governance score suspiciously high",
                    },
                )
            )

        # Media trust outliers
        # Typical range: 15-75% based on Reuters DNR distribution (global average ~40%)
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'media'
              AND (score_0_100 > 75 OR score_0_100 < 15)
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="statistical_outlier",
                    severity="error" if score > 85 or score < 10 else "warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "trust_type": "media",
                        "expected_range": [15, 75],
                        "reason": f"Media trust {score:.1f}% outside typical range (15-75%)",
                    },
                )
            )

    return flags


def detect_yoy_anomalies(conn) -> List[Flag]:
    """
    Detect year-over-year changes greater than 25 points.

    Only flags changes between years that are close together (<=5 years apart).
    """
    flags = []

    with conn.cursor() as cur:
        cur.execute(
            """
            WITH changes AS (
                SELECT
                    id,
                    iso3,
                    source,
                    trust_type,
                    year,
                    score_0_100,
                    LAG(score_0_100) OVER (
                        PARTITION BY iso3, source, trust_type
                        ORDER BY year
                    ) as prev_score,
                    LAG(year) OVER (
                        PARTITION BY iso3, source, trust_type
                        ORDER BY year
                    ) as prev_year,
                    LAG(id) OVER (
                        PARTITION BY iso3, source, trust_type
                        ORDER BY year
                    ) as prev_id
                FROM observations
            )
            SELECT
                id, iso3, source, trust_type, year, score_0_100,
                prev_score, prev_year, prev_id,
                score_0_100 - prev_score as change
            FROM changes
            WHERE prev_score IS NOT NULL
              AND ABS(score_0_100 - prev_score) > 25
              AND year - prev_year <= 5
            ORDER BY ABS(score_0_100 - prev_score) DESC
        """
        )

        for row in cur.fetchall():
            (
                obs_id,
                iso3,
                source,
                trust_type,
                year,
                score,
                prev_score,
                prev_year,
                prev_id,
                change,
            ) = row

            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="yoy_anomaly",
                    severity="error" if abs(change) > 40 else "warning",
                    details={
                        "iso3": iso3,
                        "source": source,
                        "trust_type": trust_type,
                        "year": year,
                        "score": float(score),
                        "prev_year": prev_year,
                        "prev_score": float(prev_score),
                        "change": float(change),
                        "prev_observation_id": prev_id,
                        "reason": f"Score changed {change:+.1f} points from {prev_year} to {year}",
                    },
                )
            )

    return flags


def detect_cross_source_inconsistencies(conn) -> List[Flag]:
    """
    Detect cases where different sources report very different scores
    for the same country/year/trust_type combination.

    Flags differences >30 points (>35 for media sources).

    Note: Excludes governance trust_type because governance indices (CPI, WGI,
    FreedomHouse, V-Dem) measure fundamentally different concepts and are
    expected to diverge by 30-40+ points. Survey sources measuring the same
    trust question are the actionable conflicts.

    Media sources use a wider threshold (35 points) because Reuters DNR and
    WVS use different question wording ("trust news" vs "confidence in press").
    """
    flags = []
    seen_pairs = set()  # Track which pairs we've flagged

    with conn.cursor() as cur:
        cur.execute(
            """
            WITH pairs AS (
                SELECT
                    a.id as id_a,
                    b.id as id_b,
                    a.iso3,
                    a.year,
                    a.trust_type,
                    a.source as source_a,
                    a.score_0_100 as score_a,
                    a.methodology as methodology_a,
                    b.source as source_b,
                    b.score_0_100 as score_b,
                    b.methodology as methodology_b,
                    ABS(a.score_0_100 - b.score_0_100) as diff
                FROM observations a
                JOIN observations b ON a.iso3 = b.iso3
                    AND a.year = b.year
                    AND a.trust_type = b.trust_type
                    AND a.source < b.source
                WHERE a.trust_type != 'governance'
            )
            SELECT * FROM pairs
            WHERE (trust_type != 'media' AND diff > 30)
               OR (trust_type = 'media' AND diff > 35)
            ORDER BY diff DESC
        """
        )

        for row in cur.fetchall():
            (
                id_a,
                id_b,
                iso3,
                year,
                trust_type,
                source_a,
                score_a,
                methodology_a,
                source_b,
                score_b,
                methodology_b,
                diff,
            ) = row

            # Flag the higher score observation (more likely to be wrong)
            flagged_id = id_a if score_a > score_b else id_b

            # Skip if we've already flagged this observation for cross-source
            if flagged_id in seen_pairs:
                continue
            seen_pairs.add(flagged_id)

            flags.append(
                Flag(
                    observation_id=flagged_id,
                    flag_type="cross_source",
                    severity="error" if diff > 40 else "warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "trust_type": trust_type,
                        "source_a": source_a,
                        "score_a": float(score_a),
                        "methodology_a": methodology_a,
                        "source_b": source_b,
                        "score_b": float(score_b),
                        "methodology_b": methodology_b,
                        "difference": float(diff),
                        "reason": f"{source_a} ({score_a:.1f}) vs {source_b} ({score_b:.1f}) differ by {diff:.1f} points",
                    },
                )
            )

    return flags


def detect_methodology_mismatches(conn) -> List[Flag]:
    """
    Detect scores that are outside the expected range for their methodology.

    Different methodologies produce systematically different score ranges:
    - Binary: typically 15-50%
    - 4-point: typically 20-65%
    - 0-10scale: typically 45-65%
    """
    flags = []

    with conn.cursor() as cur:
        # Binary scores that are too high (should be 15-55%)
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'interpersonal'
              AND methodology = 'binary'
              AND score_0_100 > 55
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="methodology_mismatch",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "methodology": "binary",
                        "expected_max": 55,
                        "reason": f"Binary interpersonal trust of {score:.1f}% exceeds typical max of 55%",
                    },
                )
            )

        # 0-10 scale scores that might indicate wrong methodology tag
        cur.execute(
            """
            SELECT id, iso3, year, source, score_0_100
            FROM observations
            WHERE trust_type = 'interpersonal'
              AND methodology = '0-10scale'
              AND score_0_100 > 70
            ORDER BY score_0_100 DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="methodology_mismatch",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "score": float(score),
                        "methodology": "0-10scale",
                        "expected_max": 70,
                        "reason": f"0-10 scale interpersonal trust of {score:.1f}% exceeds typical max of 70%",
                    },
                )
            )

    return flags


def detect_sample_size_issues(conn) -> List[Flag]:
    """
    Detect observations with suspicious sample sizes.

    Flags:
    - Sample size < 100 (unreliable)
    - Sample size NULL for survey data
    - Sample size > 100,000 (may be aggregation error)
    """
    flags = []

    with conn.cursor() as cur:
        # Low sample size
        cur.execute(
            """
            SELECT id, iso3, year, source, trust_type, sample_n, score_0_100
            FROM observations
            WHERE sample_n IS NOT NULL
              AND sample_n < 100
              AND trust_type IN ('interpersonal', 'institutional', 'media')
            ORDER BY sample_n
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, trust_type, sample_n, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="sample_size",
                    severity="error" if sample_n < 50 else "warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "trust_type": trust_type,
                        "sample_n": sample_n,
                        "score": float(score),
                        "reason": f"Sample size of {sample_n} is below minimum threshold of 100",
                    },
                )
            )

        # Suspiciously large sample size
        cur.execute(
            """
            SELECT id, iso3, year, source, trust_type, sample_n, score_0_100
            FROM observations
            WHERE sample_n > 100000
            ORDER BY sample_n DESC
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, trust_type, sample_n, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="sample_size",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "trust_type": trust_type,
                        "sample_n": sample_n,
                        "score": float(score) if score else None,
                        "reason": f"Sample size of {sample_n:,} is unusually large - possible aggregation error",
                    },
                )
            )

        # Missing sample size for survey data (excluding governance)
        cur.execute(
            """
            SELECT id, iso3, year, source, trust_type, score_0_100
            FROM observations
            WHERE sample_n IS NULL
              AND trust_type IN ('interpersonal', 'institutional', 'media')
              AND source NOT IN ('OECD', 'Eurobarometer')
            ORDER BY source, year
            LIMIT 100
        """
        )
        for row in cur.fetchall():
            obs_id, iso3, year, source, trust_type, score = row
            flags.append(
                Flag(
                    observation_id=obs_id,
                    flag_type="sample_size",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "year": year,
                        "source": source,
                        "trust_type": trust_type,
                        "sample_n": None,
                        "score": float(score) if score else None,
                        "reason": "Survey data missing sample size",
                    },
                )
            )

    return flags


def detect_coverage_gaps(conn) -> List[Flag]:
    """
    Detect data coverage issues (not tied to specific observations).

    Returns flags with observation_id=None for coverage-level issues:
    - Sources with very few countries
    - Countries with only governance data
    - Years with coverage drops
    """
    flags = []

    with conn.cursor() as cur:
        # Sources with suspiciously few countries (may indicate ETL bug)
        cur.execute(
            """
            SELECT source, COUNT(DISTINCT iso3) as country_count,
                   MIN(year) as min_year, MAX(year) as max_year
            FROM observations
            WHERE trust_type IN ('interpersonal', 'institutional')
            GROUP BY source
            HAVING COUNT(DISTINCT iso3) < 5
            ORDER BY country_count
        """
        )
        for row in cur.fetchall():
            source, country_count, min_year, max_year = row
            # Create a pseudo-flag without observation_id
            flags.append(
                Flag(
                    observation_id=0,  # Placeholder for coverage issues
                    flag_type="coverage_gap",
                    severity="warning",
                    details={
                        "source": source,
                        "country_count": country_count,
                        "year_range": f"{min_year}-{max_year}",
                        "reason": f"Source {source} has only {country_count} countries - possible ETL issue",
                    },
                )
            )

        # Countries with only 1 observation ever (excluding small territories)
        cur.execute(
            """
            SELECT o.iso3, c.name, COUNT(*) as obs_count,
                   STRING_AGG(DISTINCT o.source, ', ') as sources
            FROM observations o
            JOIN countries c ON o.iso3 = c.iso3
            GROUP BY o.iso3, c.name
            HAVING COUNT(*) = 1
            ORDER BY c.name
            LIMIT 50
        """
        )
        for row in cur.fetchall():
            iso3, name, obs_count, sources = row
            flags.append(
                Flag(
                    observation_id=0,
                    flag_type="coverage_gap",
                    severity="warning",
                    details={
                        "iso3": iso3,
                        "country_name": name,
                        "observation_count": obs_count,
                        "sources": sources,
                        "reason": f"{name} ({iso3}) has only 1 observation",
                    },
                )
            )

    return flags
