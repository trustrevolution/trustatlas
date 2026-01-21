#!/usr/bin/env python3
"""
WGI ETL Job - World Bank Worldwide Governance Indicators

Downloads, processes, and loads WGI data into the trust index database.
Data source: World Bank API (api.worldbank.org)

WGI provides six governance indicators. For the governance pillar,
we use the average of:
- CC.EST: Control of Corruption
- GE.EST: Government Effectiveness
- RL.EST: Rule of Law
"""

import sys
from pathlib import Path
from typing import List, Dict
import json

import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation
from common.scaling import scale_wgi


class WGIProcessor(BaseProcessor):
    """Processor for World Bank Worldwide Governance Indicators data."""

    SOURCE_NAME = "WGI"
    TRUST_TYPE = "governance"

    # World Bank API endpoint
    API_BASE = "https://api.worldbank.org/v2"

    # WGI indicators we use for the governance pillar
    # Full list at: https://api.worldbank.org/v2/source/3/indicators
    INDICATORS = {
        "CC.EST": "Control of Corruption: Estimate",
        "GE.EST": "Government Effectiveness: Estimate",
        "RL.EST": "Rule of Law: Estimate",
    }

    def download(self, year: int) -> Path:
        """
        Download WGI data from World Bank API.

        Args:
            year: Year to download

        Returns:
            Path to downloaded JSON file
        """
        year_dir: Path = self.raw_data_dir / "wgi" / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)

        # Download each indicator
        for indicator_code, indicator_name in self.INDICATORS.items():
            output_path = year_dir / f"{indicator_code.replace('.', '_')}.json"

            if output_path.exists():
                print(f"WGI {indicator_code} data already exists at {output_path}")
                continue

            print(f"Downloading WGI {indicator_code} ({indicator_name})...")
            data = self._fetch_indicator(indicator_code, year)

            with open(output_path, "w") as f:
                json.dump(data, f, indent=2)

            print(f"Saved {indicator_code} to {output_path}")

        # Return path to directory (we have multiple files)
        return year_dir

    def _fetch_indicator(self, indicator: str, year: int) -> List[Dict]:
        """
        Fetch indicator data from World Bank API.

        Args:
            indicator: Indicator code (e.g., CC.EST)
            year: Year to fetch

        Returns:
            List of country data dictionaries
        """
        url = f"{self.API_BASE}/country/all/indicator/{indicator}"
        params = {
            "format": "json",
            "date": str(year),
            "per_page": 300,  # Get all countries in one request
            "source": 3,  # WGI source
        }

        response = self.http_client.get_json(url, params)

        # World Bank API returns [metadata, data] array
        if isinstance(response, list) and len(response) >= 2:
            return response[1] or []

        return []

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process WGI data into observations.

        Loads all three indicator files, averages them per country,
        and converts from WGI scale (-2.5 to +2.5) to 0-100.

        Args:
            input_path: Path to directory containing indicator JSON files
            year: Year being processed

        Returns:
            List of Observation objects
        """
        # Load all indicator data
        indicator_data: Dict[str, Dict[str, float]] = {}

        for indicator_code in self.INDICATORS.keys():
            file_path = input_path / f"{indicator_code.replace('.', '_')}.json"

            if not file_path.exists():
                print(f"Warning: Missing indicator file {file_path}")
                continue

            with open(file_path) as f:
                data = json.load(f)

            for entry in data:
                if entry is None:
                    continue

                iso3 = entry.get("countryiso3code")
                value = entry.get("value")

                if not iso3 or value is None:
                    continue

                # Skip aggregates (regions, world, etc.)
                if len(iso3) != 3:
                    continue

                if iso3 not in indicator_data:
                    indicator_data[iso3] = {}

                indicator_data[iso3][indicator_code] = float(value)

        # Create observations by averaging indicators
        observations = []

        for iso3, indicators in indicator_data.items():
            # Need at least 2 of 3 indicators for a valid score
            if len(indicators) < 2:
                continue

            # Calculate average of available indicators
            raw_avg = sum(indicators.values()) / len(indicators)

            # Scale from WGI (-2.5 to +2.5) to 0-100
            score_0_100 = scale_wgi(raw_avg)

            # Validate ISO3
            if not self.country_mapper.validate_iso3(iso3):
                self.stats["unmapped_countries"].append(iso3)
                # Still include it - might be a valid country not in our reference
                self.stats["warnings"].append(f"ISO3 '{iso3}' not in reference data")

            indicators_used = ", ".join(sorted(indicators.keys()))
            observations.append(
                Observation(
                    iso3=iso3,
                    year=year,
                    source="WGI",
                    trust_type="governance",
                    raw_value=round(raw_avg, 3),
                    raw_unit="WGI Estimate (-2.5 to +2.5)",
                    score_0_100=round(score_0_100, 1),
                    sample_n=None,
                    method_notes=f"World Bank WGI {year}, avg of {indicators_used}",
                    source_url="https://info.worldbank.org/governance/wgi/",
                )
            )

        print(f"Processed {len(observations)} WGI observations for {year}")
        return observations

    def _get_expected_raw_path(self, year: int) -> Path:
        """Get expected path for raw WGI data directory."""
        result: Path = self.raw_data_dir / "wgi" / str(year)
        return result


@click.command()
@click.option(
    "--year", default=2023, help="Year to process WGI data for (latest usually 2023)"
)
@click.option(
    "--skip-download", is_flag=True, help="Skip download and use existing raw data"
)
def main(year: int, skip_download: bool):
    """Run WGI ETL process."""
    processor = WGIProcessor()

    try:
        stats = processor.run(year, skip_download)

        if stats.get("warnings"):
            print(f"\nWarnings ({len(stats['warnings'])}):")
            for warning in stats["warnings"][:5]:
                print(f"  - {warning}")

        print(f"\nWGI ETL completed successfully for {year}")
        print(f"  Countries: {stats['countries_processed']}")
        print(f"  Observations: {stats['observations_created']}")

    except Exception as e:
        print(f"WGI ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
