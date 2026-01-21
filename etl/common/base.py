"""
Base processor class for Trust Atlas ETL jobs.

Provides common functionality for downloading, processing, validating,
and loading trust data from external sources.
"""

import os
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

from common.countries import CountryMapper
from common.http import ResilientHTTPClient

logger = logging.getLogger(__name__)


@dataclass
class Observation:
    """A single trust observation to be inserted into the database."""

    iso3: str
    year: int
    source: str
    trust_type: str
    raw_value: float
    raw_unit: str
    score_0_100: float
    sample_n: Optional[int]
    method_notes: str
    source_url: str
    methodology: Optional[str] = None  # 'binary' or '4point' for interpersonal trust

    def to_tuple(self) -> Tuple:
        """Convert to tuple for database insertion."""
        return (
            self.iso3,
            self.year,
            self.source,
            self.trust_type,
            self.raw_value,
            self.raw_unit,
            self.score_0_100,
            self.sample_n,
            self.method_notes,
            self.source_url,
            self.methodology,
        )


class BaseProcessor(ABC):
    """Abstract base class for ETL processors."""

    # Subclasses should override these
    SOURCE_NAME: str = "unknown"
    TRUST_TYPE: str = "unknown"

    def __init__(self):
        """Initialize the processor with common paths and utilities."""
        self.project_root = Path(__file__).parent.parent.parent
        self.raw_data_dir = self.project_root / "data" / "raw"
        self.staging_dir = self.project_root / "data" / "staging"
        self.reference_dir = self.project_root / "data" / "reference"

        # Ensure directories exist
        self.raw_data_dir.mkdir(parents=True, exist_ok=True)
        self.staging_dir.mkdir(parents=True, exist_ok=True)

        # Load environment variables
        env_path = self.project_root / ".env"
        if env_path.exists():
            load_dotenv(env_path)

        # Initialize utilities
        self.country_mapper: CountryMapper = CountryMapper()
        self.http_client: ResilientHTTPClient = ResilientHTTPClient()

        # Statistics
        self.stats: Dict[str, Any] = {
            "countries_processed": 0,
            "observations_created": 0,
            "unmapped_countries": [],
            "warnings": [],
        }

    def get_db_connection(self):
        """
        Get database connection from environment variables.

        Returns:
            psycopg2 connection object
        """
        return psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=os.getenv("POSTGRES_PORT", "5432"),
            database=os.getenv("POSTGRES_DB", "trust"),
            user=os.getenv("POSTGRES_USER", "trust"),
            password=os.getenv("POSTGRES_PASSWORD", "trust"),
        )

    @abstractmethod
    def download(self, year: int) -> Path:
        """
        Download raw data for the specified year.

        Args:
            year: Year to download data for

        Returns:
            Path to downloaded file
        """
        pass

    @abstractmethod
    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process raw data into observations.

        Args:
            input_path: Path to raw data file
            year: Year being processed

        Returns:
            List of Observation objects
        """
        pass

    def validate_observation(self, obs: Observation) -> List[str]:
        """
        Validate an observation before insertion.

        Args:
            obs: Observation to validate

        Returns:
            List of warning messages (empty if valid)
        """
        warnings = []

        # Check score bounds
        if obs.score_0_100 < 0 or obs.score_0_100 > 100:
            raise ValueError(
                f"Score {obs.score_0_100} for {obs.iso3} is outside [0, 100] range"
            )

        # Check ISO3 validity
        if not self.country_mapper.validate_iso3(obs.iso3):
            warnings.append(f"ISO3 code '{obs.iso3}' not in reference data")

        # Check trust_type validity
        valid_trust_types = {
            "interpersonal",
            "institutional",
            "governance",
            "partisan",
            "cpi",
            "wgi",
            "oecd",
            "derived",
            "freedom",
            "media",  # Reuters Digital News Report
        }
        if obs.trust_type not in valid_trust_types:
            raise ValueError(f"Invalid trust_type: {obs.trust_type}")

        # Check sample size (if provided)
        if obs.sample_n is not None and obs.sample_n < 300:
            warnings.append(
                f"Low sample size for {obs.iso3}: n={obs.sample_n} (min recommended: 300)"
            )

        return warnings

    def save_staging_data(self, observations: List[Observation], year: int) -> Path:
        """
        Save processed data to staging CSV.

        Args:
            observations: List of observations
            year: Year being processed

        Returns:
            Path to staging CSV file
        """
        staging_path: Path = self.staging_dir / f"{self.SOURCE_NAME.lower()}_{year}.csv"

        df = pd.DataFrame(
            [obs.to_tuple() for obs in observations],
            columns=[
                "iso3",
                "year",
                "source",
                "trust_type",
                "raw_value",
                "raw_unit",
                "score_0_100",
                "sample_n",
                "method_notes",
                "source_url",
                "methodology",
            ],
        )

        df.to_csv(staging_path, index=False)
        logger.info(f"Saved {len(observations)} observations to {staging_path}")

        return staging_path

    def load_to_database(self, observations: List[Observation]) -> int:
        """
        Load observations into database with upsert.

        Args:
            observations: List of observations to load

        Returns:
            Number of rows affected
        """
        if not observations:
            logger.warning("No observations to load")
            return 0

        # Deduplicate: keep last observation for each unique key
        seen = {}
        for obs in observations:
            key = (obs.iso3, obs.year, obs.source, obs.trust_type)
            seen[key] = obs  # Later observations overwrite earlier ones
        observations = list(seen.values())
        logger.info(f"Deduplicated to {len(observations)} unique observations")

        conn = self.get_db_connection()
        rows_affected: int = 0

        try:
            with conn.cursor() as cur:
                execute_values(
                    cur,
                    """INSERT INTO observations
                       (iso3, year, source, trust_type, raw_value, raw_unit,
                        score_0_100, sample_n, method_notes, source_url, methodology)
                       VALUES %s
                       ON CONFLICT (iso3, year, source, trust_type)
                       DO UPDATE SET
                         raw_value = EXCLUDED.raw_value,
                         score_0_100 = EXCLUDED.score_0_100,
                         sample_n = EXCLUDED.sample_n,
                         method_notes = EXCLUDED.method_notes,
                         source_url = EXCLUDED.source_url,
                         methodology = EXCLUDED.methodology,
                         ingested_at = NOW()""",
                    [obs.to_tuple() for obs in observations],
                )

                rows_affected = cur.rowcount
                conn.commit()
                logger.info(f"Loaded {rows_affected} observations to database")

        except Exception as e:
            conn.rollback()
            logger.error(f"Database load failed: {e}")
            raise
        finally:
            conn.close()

        return rows_affected

    def ensure_countries_exist(self, iso3_codes: set) -> None:
        """
        Ensure all countries exist in the countries table.

        Args:
            iso3_codes: Set of ISO3 codes to check/insert
        """
        conn = self.get_db_connection()

        try:
            with conn.cursor() as cur:
                # Get existing countries
                cur.execute("SELECT iso3 FROM countries")
                existing = {row[0] for row in cur.fetchall()}

                # Find missing
                missing = iso3_codes - existing

                if missing:
                    logger.info(f"Adding {len(missing)} missing countries: {missing}")

                    # Insert with minimal data (can be enriched later)
                    for iso3 in missing:
                        cur.execute(
                            """INSERT INTO countries (iso3, name)
                               VALUES (%s, %s)
                               ON CONFLICT (iso3) DO NOTHING""",
                            (iso3, iso3),  # Use ISO3 as placeholder name
                        )

                    conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to ensure countries exist: {e}")
            raise
        finally:
            conn.close()

    def run(self, year: int, skip_download: bool = False) -> Dict[str, Any]:
        """
        Run the complete ETL pipeline.

        Args:
            year: Year to process
            skip_download: If True, use existing raw data

        Returns:
            Dictionary with run statistics
        """
        logger.info(f"Starting {self.SOURCE_NAME} ETL for year {year}")
        self.stats = {
            "year": year,
            "source": self.SOURCE_NAME,
            "countries_processed": 0,
            "observations_created": 0,
            "unmapped_countries": [],
            "warnings": [],
        }

        try:
            # Download data
            if skip_download:
                raw_path = self._get_expected_raw_path(year)
                if not raw_path.exists():
                    raise FileNotFoundError(f"Raw data not found at {raw_path}")
            else:
                raw_path = self.download(year)

            # Process data
            observations = self.process(raw_path, year)

            # Validate all observations
            for obs in observations:
                warnings = self.validate_observation(obs)
                self.stats["warnings"].extend(warnings)

            # Ensure countries exist in database
            iso3_codes = {obs.iso3 for obs in observations}
            self.ensure_countries_exist(iso3_codes)

            # Save staging data
            self.save_staging_data(observations, year)

            # Load to database
            self.load_to_database(observations)

            # Update stats
            self.stats["countries_processed"] = len(iso3_codes)
            self.stats["observations_created"] = len(observations)
            self.stats["success"] = True

            logger.info(
                f"{self.SOURCE_NAME} ETL completed: "
                f"{self.stats['observations_created']} observations for "
                f"{self.stats['countries_processed']} countries"
            )

        except Exception as e:
            self.stats["success"] = False
            self.stats["error"] = str(e)
            logger.error(f"{self.SOURCE_NAME} ETL failed: {e}")
            raise

        return self.stats

    def _get_expected_raw_path(self, year: int) -> Path:
        """
        Get the expected path for raw data.

        Override in subclasses if needed.

        Args:
            year: Year being processed

        Returns:
            Expected path to raw data file
        """
        result: Path = (
            self.raw_data_dir
            / self.SOURCE_NAME.lower()
            / str(year)
            / f"{self.SOURCE_NAME.lower()}.csv"
        )
        return result
