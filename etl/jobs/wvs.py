#!/usr/bin/env python3
"""
WVS ETL Job - World Values Survey

Processes manually downloaded WVS data into the trust index database.

Supports two data formats:
1. Time Series file (preferred): WVS_Time_Series_1981-2022_csv_v5_0.csv
   - Contains all waves (1-7), 1981-2022
   - Variables: A165 (interpersonal), E069_11/12/13 (institutional)

2. Wave 7 file (fallback): WVS_Cross-National_Wave_7.csv
   - Single wave, ~2017-2022
   - Variables: Q57 (interpersonal), Q71-Q73 (institutional)

IMPORTANT: WVS data requires manual download due to terms acceptance.
Download from: https://www.worldvaluessurvey.org
"""

import sys
from pathlib import Path
from typing import List, Optional
from collections import defaultdict

import pandas as pd
import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation
from common.scaling import scale_likert_4_to_percent


# WVS country codes to ISO3 mapping
# From WVS documentation
WVS_COUNTRY_CODES = {
    4: "AFG",
    8: "ALB",
    12: "DZA",
    20: "AND",
    31: "AZE",
    32: "ARG",
    36: "AUS",
    40: "AUT",
    48: "BHR",
    50: "BGD",
    51: "ARM",
    56: "BEL",
    68: "BOL",
    70: "BIH",
    76: "BRA",
    100: "BGR",
    104: "MMR",
    112: "BLR",
    124: "CAN",
    152: "CHL",
    156: "CHN",
    158: "TWN",
    170: "COL",
    191: "HRV",
    196: "CYP",
    203: "CZE",
    208: "DNK",
    214: "DOM",
    218: "ECU",
    818: "EGY",
    222: "SLV",
    231: "ETH",
    233: "EST",
    246: "FIN",
    250: "FRA",
    268: "GEO",
    276: "DEU",
    288: "GHA",
    300: "GRC",
    320: "GTM",
    344: "HKG",
    348: "HUN",
    356: "IND",
    360: "IDN",
    364: "IRN",
    368: "IRQ",
    372: "IRL",
    376: "ISR",
    380: "ITA",
    392: "JPN",
    398: "KAZ",
    400: "JOR",
    404: "KEN",
    410: "KOR",
    414: "KWT",
    417: "KGZ",
    422: "LBN",
    428: "LVA",
    430: "LBR",
    434: "LBY",
    440: "LTU",
    458: "MYS",
    466: "MLI",
    484: "MEX",
    496: "MNG",
    499: "MNE",
    504: "MAR",
    528: "NLD",
    554: "NZL",
    558: "NIC",
    566: "NGA",
    578: "NOR",
    586: "PAK",
    600: "PRY",
    604: "PER",
    608: "PHL",
    616: "POL",
    620: "PRT",
    630: "PRI",
    634: "QAT",
    642: "ROU",
    643: "RUS",
    646: "RWA",
    682: "SAU",
    688: "SRB",
    702: "SGP",
    703: "SVK",
    704: "VNM",
    705: "SVN",
    710: "ZAF",
    716: "ZWE",
    724: "ESP",
    752: "SWE",
    756: "CHE",
    764: "THA",
    788: "TUN",
    792: "TUR",
    804: "UKR",
    807: "MKD",
    826: "GBR",
    840: "USA",
    854: "BFA",
    858: "URY",
    860: "UZB",
    862: "VEN",
    887: "YEM",
}


class WVSProcessor(BaseProcessor):
    """Processor for World Values Survey data."""

    SOURCE_NAME = "WVS"

    # Minimum sample size from methodology.yaml
    MIN_SAMPLE_SIZE = 300

    def download(self, year: int) -> Path:
        """
        WVS requires manual download - this method checks for available files.

        Priority:
        1. Time series file (contains all waves 1981-2022)
        2. Wave 7 file (fallback)

        Args:
            year: Not used for WVS (wave-based)

        Returns:
            Path to WVS data file

        Raises:
            FileNotFoundError: If WVS data not found
        """
        wvs_dir = self.raw_data_dir / "wvs"

        # Priority 1: Time series file (preferred - contains all waves)
        time_series_patterns = [
            "WVS_Time_Series*.csv",
            "*Time_Series*.csv",
        ]
        for pattern in time_series_patterns:
            files = list(wvs_dir.glob(pattern))
            if files:
                print(f"Found WVS time series data at {files[0]}")
                self._is_time_series = True
                return Path(files[0])

        # Priority 2: Wave 7 file
        wave7_dir = wvs_dir / "wave7"
        if wave7_dir.exists():
            csvs = list(wave7_dir.glob("*.csv"))
            if csvs:
                print(f"Found WVS Wave 7 data at {csvs[0]}")
                self._is_time_series = False
                return Path(csvs[0])

        raise FileNotFoundError(
            f"\nWVS data not found. Manual download required:\n"
            f"1. Register at https://www.worldvaluessurvey.org\n"
            f"2. Download Time Series CSV (recommended) or Wave 7 CSV\n"
            f"3. Place in: {wvs_dir}/\n"
        )

    def process(self, input_path: Path, year: int) -> List[Observation]:
        """
        Process WVS survey data into observations.

        Handles both time series and Wave 7 formats.

        Args:
            input_path: Path to WVS CSV file
            year: Used for output year (WVS uses actual survey year)

        Returns:
            List of Observation objects
        """
        print(f"Loading WVS data from {input_path}...")
        print("(This may take a moment for large files)")

        # Detect format and load appropriate columns
        is_time_series = getattr(
            self, "_is_time_series", "Time_Series" in str(input_path)
        )

        if is_time_series:
            return self._process_time_series(input_path)
        else:
            return self._process_wave7(input_path, year)

    def _process_time_series(self, input_path: Path) -> List[Observation]:
        """Process WVS Time Series file (all waves 1981-2022)."""
        # Time series columns:
        # A165 (interpersonal), E069_11/12/13 (institutional), E069_07/08 (media)
        usecols = [
            "S003",
            "COUNTRY_ALPHA",
            "S020",
            "A165",
            "E069_07",  # Confidence in the Press
            "E069_08",  # Confidence in Television
            "E069_11",
            "E069_12",
            "E069_13",
        ]
        try:
            df = pd.read_csv(input_path, usecols=usecols, low_memory=False)
        except ValueError:
            df = pd.read_csv(input_path, low_memory=False)

        print(f"Loaded {len(df)} survey responses from time series")

        observations = []

        # Use COUNTRY_ALPHA if available, else S003
        if "COUNTRY_ALPHA" in df.columns:
            country_col = "COUNTRY_ALPHA"
        else:
            country_col = "S003"

        # Group by country AND year for time series
        for (country_code, survey_year), group_df in df.groupby([country_col, "S020"]):
            survey_year = int(survey_year)

            # Get ISO3 code
            if country_col == "COUNTRY_ALPHA":
                iso3 = str(country_code) if len(str(country_code)) == 3 else None
            else:
                iso3 = self._get_iso3(country_code)

            if not iso3:
                self.stats["unmapped_countries"].append(str(country_code))
                continue

            # Interpersonal trust (A165): 1=trust, 2=careful, negative=missing
            inter_obs = self._calc_interpersonal_ts(group_df, iso3, survey_year)
            if inter_obs:
                observations.append(inter_obs)

            # Institutional trust (E069_11/12/13): 1-4 scale, negative=missing
            inst_obs = self._calc_institutional_ts(group_df, iso3, survey_year)
            if inst_obs:
                observations.append(inst_obs)

            # Media trust (E069_07/08): 1-4 scale, negative=missing
            media_obs = self._calc_media_ts(group_df, iso3, survey_year)
            if media_obs:
                observations.append(media_obs)

            # Financial trust (E069_12): 1-4 scale, negative=missing
            financial_obs = self._calc_financial_ts(group_df, iso3, survey_year)
            if financial_obs:
                observations.append(financial_obs)

        print(f"Processed {len(observations)} WVS observations from time series")
        return observations

    def _calc_interpersonal_ts(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate interpersonal trust from A165 (time series format)."""
        if "A165" not in df.columns:
            return None

        # Filter valid responses (1=trust, 2=careful)
        valid = df["A165"].dropna()
        valid = valid[valid.isin([1, 2])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # % saying "can trust" (code 1)
        trust_pct = float((valid == 1).mean() * 100)

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="interpersonal",
            raw_value=round(trust_pct, 1),
            raw_unit="Percent trusting",
            score_0_100=round(trust_pct, 1),
            sample_n=len(valid),
            method_notes=f"WVS Time Series A165, n={len(valid)}",
            source_url="https://www.worldvaluessurvey.org",
            methodology="binary",
        )

    def _calc_institutional_ts(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate institutional trust from E069_11/12/13 (time series format)."""
        # E069_11: Parliament, E069_12: Government, E069_13: Political parties
        trust_vars = ["E069_11", "E069_12", "E069_13"]
        available_vars = [v for v in trust_vars if v in df.columns]

        if not available_vars:
            return None

        var_scores = []
        total_n = 0

        for var in available_vars:
            # Filter valid responses (1-4), negative values are missing
            valid = df[var].dropna()
            valid = valid[valid.isin([1, 2, 3, 4])]

            if len(valid) < 100:
                continue

            # Calculate % confident (codes 1 or 2 = "great deal" or "quite a lot")
            confident_pct = float(((valid == 1) | (valid == 2)).mean() * 100)
            var_scores.append(confident_pct)
            total_n = max(total_n, len(valid))

        if not var_scores or total_n < self.MIN_SAMPLE_SIZE:
            return None

        avg_score = sum(var_scores) / len(var_scores)

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit="Percent confident",
            score_0_100=round(avg_score, 1),
            sample_n=total_n,
            method_notes=f"WVS Time Series E069 avg ({len(var_scores)} vars), n~{total_n}",
            source_url="https://www.worldvaluessurvey.org",
        )

    def _calc_media_ts(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate media trust from E069_07/08 (time series format).

        E069_07: Confidence in the Press
        E069_08: Confidence in Television

        Scale: 1=A great deal, 2=Quite a lot, 3=Not very much, 4=None at all
        We calculate % with "a great deal" or "quite a lot" of confidence.
        """
        # E069_07: Press, E069_08: Television
        trust_vars = ["E069_07", "E069_08"]
        available_vars = [v for v in trust_vars if v in df.columns]

        if not available_vars:
            return None

        var_scores = []
        total_n = 0

        for var in available_vars:
            # Filter valid responses (1-4), negative values are missing
            valid = df[var].dropna()
            valid = valid[valid.isin([1, 2, 3, 4])]

            if len(valid) < 100:
                continue

            # Calculate % confident (codes 1 or 2 = "great deal" or "quite a lot")
            confident_pct = float(((valid == 1) | (valid == 2)).mean() * 100)
            var_scores.append(confident_pct)
            total_n = max(total_n, len(valid))

        if not var_scores or total_n < self.MIN_SAMPLE_SIZE:
            return None

        avg_score = sum(var_scores) / len(var_scores)

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="media",
            raw_value=round(avg_score, 1),
            raw_unit="Percent confident",
            score_0_100=round(avg_score, 1),
            sample_n=total_n,
            method_notes=f"WVS Time Series E069_07/08 avg ({len(var_scores)} vars), n~{total_n}",
            source_url="https://www.worldvaluessurvey.org",
        )

    def _calc_financial_ts(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """Calculate financial trust from E069_12 (time series format).

        E069_12: Confidence in Banks

        Scale: 1=A great deal, 2=Quite a lot, 3=Not very much, 4=None at all
        We calculate % with "a great deal" or "quite a lot" of confidence.
        """
        if "E069_12" not in df.columns:
            return None

        # Filter valid responses (1-4), negative values are missing
        valid = df["E069_12"].dropna()
        valid = valid[valid.isin([1, 2, 3, 4])]

        if len(valid) < self.MIN_SAMPLE_SIZE:
            return None

        # Calculate % confident (codes 1 or 2 = "great deal" or "quite a lot")
        confident_pct = float(((valid == 1) | (valid == 2)).mean() * 100)

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="financial",
            raw_value=round(confident_pct, 1),
            raw_unit="Percent confident",
            score_0_100=round(confident_pct, 1),
            sample_n=len(valid),
            method_notes=f"WVS Time Series E069_12 (banks), n={len(valid)}",
            source_url="https://www.worldvaluessurvey.org",
        )

    def _process_wave7(self, input_path: Path, year: int) -> List[Observation]:
        """Process WVS Wave 7 file (legacy format)."""
        usecols = ["B_COUNTRY", "S020", "Q57", "Q71", "Q72", "Q73"]
        try:
            df = pd.read_csv(input_path, usecols=usecols, low_memory=False)
        except ValueError:
            df = pd.read_csv(input_path, low_memory=False)

        print(f"Loaded {len(df)} survey responses from Wave 7")

        observations = []

        if "B_COUNTRY" in df.columns:
            country_col = "B_COUNTRY"
        elif "C_COW_NUM" in df.columns:
            country_col = "C_COW_NUM"
        else:
            raise ValueError(f"Could not find country column in {df.columns.tolist()}")

        year_col = "S020" if "S020" in df.columns else None

        for country_code, country_df in df.groupby(country_col):
            iso3 = self._get_iso3(country_code)
            if not iso3:
                self.stats["unmapped_countries"].append(str(country_code))
                continue

            if year_col:
                survey_year = int(country_df[year_col].mode().iloc[0])
            else:
                survey_year = year

            inter_obs = self._calculate_interpersonal_trust(
                country_df, iso3, survey_year
            )
            if inter_obs:
                observations.append(inter_obs)

            inst_obs = self._calculate_institutional_trust(
                country_df, iso3, survey_year
            )
            if inst_obs:
                observations.append(inst_obs)

        print(f"Processed {len(observations)} WVS observations from Wave 7")
        return observations

    def _get_iso3(self, country_code) -> Optional[str]:
        """Convert WVS country code to ISO3."""
        # Try numeric lookup
        if isinstance(country_code, (int, float)):
            result: str | None = WVS_COUNTRY_CODES.get(int(country_code))
            return result

        # Try string lookup
        return self.country_mapper.get_or_map(str(country_code))

    def _calculate_interpersonal_trust(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """
        Calculate interpersonal trust from Q57.

        Q57: "Generally speaking, would you say that most people can be trusted
              or that you need to be very careful in dealing with people?"
        1 = Most people can be trusted
        2 = Need to be very careful

        Args:
            df: Country DataFrame
            iso3: ISO3 country code
            year: Survey year

        Returns:
            Observation or None if insufficient data
        """
        if "Q57" not in df.columns:
            return None

        # Filter valid responses (1 or 2)
        valid = df["Q57"].isin([1, 2])
        responses = df.loc[valid, "Q57"]

        if len(responses) < self.MIN_SAMPLE_SIZE:
            self.stats["warnings"].append(
                f"WVS Q57 sample too small for {iso3}: n={len(responses)}"
            )
            return None

        # Calculate percent who trust
        value_counts = responses.value_counts().to_dict()
        trust_pct = scale_likert_4_to_percent(value_counts, trust_codes=(1,))

        if trust_pct is None:
            return None

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="interpersonal",
            raw_value=round(trust_pct, 1),
            raw_unit="Percent trusting",
            score_0_100=round(trust_pct, 1),
            sample_n=len(responses),
            method_notes=f"WVS Wave 7 Q57, n={len(responses)}",
            source_url="https://www.worldvaluessurvey.org",
            methodology="binary",
        )

    def _calculate_institutional_trust(
        self, df: pd.DataFrame, iso3: str, year: int
    ) -> Optional[Observation]:
        """
        Calculate institutional trust from Q71-Q73.

        Q71: Trust in the government (in your nation's capital)
        Q72: Trust in parliament
        Q73: Trust in political parties

        Scale: 1=A great deal, 2=Quite a lot, 3=Not very much, 4=None at all

        We calculate % with "a great deal" or "quite a lot" of confidence.

        Args:
            df: Country DataFrame
            iso3: ISO3 country code
            year: Survey year

        Returns:
            Observation or None if insufficient data
        """
        trust_vars = ["Q71", "Q72", "Q73"]
        available_vars = [v for v in trust_vars if v in df.columns]

        if not available_vars:
            return None

        # Calculate trust for each available variable
        var_scores = []
        total_n = 0

        for var in available_vars:
            # Filter valid responses (1-4)
            valid = df[var].isin([1, 2, 3, 4])
            responses = df.loc[valid, var]

            if len(responses) < 100:  # Per-variable minimum
                continue

            # Calculate percent confident (codes 1 or 2)
            value_counts = responses.value_counts().to_dict()
            confident_pct = scale_likert_4_to_percent(value_counts, trust_codes=(1, 2))

            if confident_pct is not None:
                var_scores.append(confident_pct)
                total_n = max(total_n, len(responses))

        if not var_scores or total_n < self.MIN_SAMPLE_SIZE:
            return None

        # Average across available variables
        avg_score = sum(var_scores) / len(var_scores)

        return Observation(
            iso3=iso3,
            year=year,
            source="WVS",
            trust_type="institutional",
            raw_value=round(avg_score, 1),
            raw_unit="Percent confident",
            score_0_100=round(avg_score, 1),
            sample_n=total_n,
            method_notes=f"WVS Wave 7 Q71-Q73 avg ({len(var_scores)} vars), n~{total_n}",
            source_url="https://www.worldvaluessurvey.org",
        )


@click.command()
@click.option("--year", default=2022, help="Output year (ignored for time series)")
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(year: int, dry_run: bool):
    """Run WVS ETL process."""

    processor = WVSProcessor()

    try:
        data_path = processor.download(year)
        observations = processor.process(data_path, year)

        # Count by type and year range
        by_type: dict[str, int] = defaultdict(int)
        years_by_type: dict[str, list[int]] = defaultdict(list)
        for obs in observations:
            by_type[obs.trust_type] += 1
            years_by_type[obs.trust_type].append(obs.year)

        print("\nWVS ETL summary:")
        for t, count in by_type.items():
            yrs = sorted(set(years_by_type[t]))
            print(f"  {t}: {count} observations ({min(yrs)}-{max(yrs)})")

        if processor.stats.get("unmapped_countries"):
            print(f"\nUnmapped countries: {len(processor.stats['unmapped_countries'])}")

        if not dry_run and observations:
            # Ensure countries exist before loading
            iso3_codes = {obs.iso3 for obs in observations}
            processor.ensure_countries_exist(iso3_codes)
            processor.load_to_database(observations)
            print("Saved to database")
        elif dry_run:
            print("Dry run - not saved")

    except FileNotFoundError as e:
        print(str(e))
        sys.exit(1)
    except Exception as e:
        print(f"WVS ETL failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
