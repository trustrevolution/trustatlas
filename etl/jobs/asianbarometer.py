#!/usr/bin/env python3
"""
Asian Barometer ETL Job

Processes Asian Barometer Survey (ABS) data for trust measurements.

Data source: https://www.asianbarometer.org/
Requires manual download - registration is free.

Trust Variables by Wave:
- Wave 5 (2018-2021): q22 (interpersonal), q7/q11 (institutional)
- Wave 4 (2014-2016): Similar structure
- Wave 3 (2010-2012): Similar structure
- Wave 2 (2005-2008): Similar structure
- Wave 1 (2001-2003): Similar structure

Interpersonal scale: 1-2 (1=Most people can be trusted, 2=Must be very careful)
Institutional scale: 1-4 (1=A great deal of trust, 4=None at all)
"""

import sys
from pathlib import Path
from typing import List
from collections import defaultdict

import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from etl.common.base import BaseProcessor, Observation


# Asian Barometer country codes to ISO3 (verified from Wave 5 data)
ASIAN_COUNTRY_CODES = {
    # Numeric codes from Wave 5
    1: "JPN",  # Japan
    2: "HKG",  # Hong Kong
    3: "KOR",  # Korea
    4: "CHN",  # China
    5: "MNG",  # Mongolia
    6: "PHL",  # Philippines
    7: "TWN",  # Taiwan
    8: "THA",  # Thailand
    9: "IDN",  # Indonesia
    10: "SGP",  # Singapore
    11: "VNM",  # Vietnam
    12: "KHM",  # Cambodia
    13: "MYS",  # Malaysia
    14: "MMR",  # Myanmar
    15: "AUS",  # Australia
    18: "IND",  # India
    # Country names as fallback
    "Japan": "JPN",
    "Korea": "KOR",
    "South Korea": "KOR",
    "Mongolia": "MNG",
    "Philippines": "PHL",
    "Taiwan": "TWN",
    "Thailand": "THA",
    "Indonesia": "IDN",
    "Singapore": "SGP",
    "Vietnam": "VNM",
    "Viet Nam": "VNM",
    "Malaysia": "MYS",
    "Cambodia": "KHM",
    "Myanmar": "MMR",
    "China": "CHN",
    "Hong Kong": "HKG",
    "Australia": "AUS",
    "India": "IND",
    "Pakistan": "PAK",
    "Bangladesh": "BGD",
    "Sri Lanka": "LKA",
    "Nepal": "NPL",
    "Laos": "LAO",
    "Brunei": "BRN",
    "Timor-Leste": "TLS",
    "East Timor": "TLS",
}


class AsianBarometerProcessor(BaseProcessor):
    """Processor for Asian Barometer survey data."""

    SOURCE_NAME = "Asian Barometer"
    MIN_SAMPLE_SIZE = 300

    # Variable mappings by wave (verified from codebooks)
    # Interpersonal: "Most people can be trusted" vs "Must be very careful"
    # Institutional: Trust scales vary by wave!
    #   Wave 5: 1-6 scale (1=trust fully, 2=trust a lot, 3=trust somewhat, 4-6=distrust)
    #   Wave 6: 1-4 scale (1=great deal, 2=quite a lot, 3=not very much, 4=none)
    # NOTE: Trust coding changed between Wave 2 and Wave 3!
    #   Waves 1-2: code 2 = "Most people can be trusted"
    #   Waves 3-6: code 1 = "Most people can be trusted"
    WAVE_VARS = {
        6: {
            "interpersonal": "q22",  # "Most people can be trusted"
            "interpersonal_trust_code": 1,  # Code 1 = trust
            "institutional_exec": "q7",  # Trust in president/PM (1-4 scale)
            "institutional_natgov": "q9",  # Trust in national govt (1-4 scale)
            "institutional_scale": 4,  # 1-4 scale (1=great deal, 2=quite a lot, 3=not very much, 4=none)
            "institutional_trust_max": 2,  # 1-2 = trust
            "country": "COUNTRY",
        },
        5: {
            "interpersonal": "q22",  # "Most people can be trusted"
            "interpersonal_trust_code": 1,  # Code 1 = trust
            "institutional_exec": "q7",  # Trust in president/PM (1-6 scale)
            "institutional_natgov": "q9",  # Trust in national govt (1-6 scale)
            "institutional_scale": 6,  # 1-6 scale (trust fully to distrust fully)
            "institutional_trust_max": 3,  # 1-3 = trust (fully/a lot/somewhat)
            "country": "COUNTRY",
        },
        4: {
            "interpersonal": "q23",  # Different variable number in Wave 4
            "interpersonal_trust_code": 1,  # Code 1 = trust
            "institutional_exec": "q7",
            "institutional_natgov": "q9",
            "institutional_scale": 4,  # 1-4 scale
            "country": "COUNTRY",
        },
        3: {
            "interpersonal": "q23",  # Different variable number in Wave 3
            "interpersonal_trust_code": 1,  # Code 1 = trust
            "institutional_exec": "q7",
            "institutional_natgov": "q9",
            "institutional_scale": 4,  # 1-4 scale
            "country": "COUNTRY",
        },
        2: {
            "interpersonal": "q23",  # Different variable number in Wave 2
            "interpersonal_trust_code": 2,  # Code 2 = trust (reversed!)
            "institutional_exec": "q7",
            "institutional_natgov": "q9",
            "institutional_scale": 4,  # 1-4 scale
            "country": "COUNTRY",
        },
        1: {
            "interpersonal": "q024",  # Different variable number in Wave 1
            "interpersonal_trust_code": 2,  # Code 2 = trust (reversed!)
            "institutional_exec": "q007",  # Wave 1 uses 3-digit format
            "institutional_natgov": "q009",
            "institutional_scale": 4,  # 1-4 scale
            "country": "country",  # lowercase in Wave 1
        },
    }

    # Median years for each wave
    WAVE_YEARS = {
        6: 2023,  # 2020-2025 (ongoing)
        5: 2019,  # 2018-2021
        4: 2015,  # 2014-2016
        3: 2011,  # 2010-2012
        2: 2007,  # 2005-2008
        1: 2002,  # 2001-2003
    }

    def download(self, year: int) -> Path:
        """Check for Asian Barometer data files."""
        asian_dir = self.raw_data_dir / "asianbarometer"
        data_files = list(asian_dir.glob("**/*.sav")) + list(asian_dir.glob("**/*.dta"))
        if data_files:
            return data_files[0]
        raise FileNotFoundError(
            f"No Asian Barometer data found in {asian_dir}. "
            "Please download from https://www.asianbarometer.org/"
        )

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Asian Barometer data to observations."""
        import pyreadstat

        observations = []

        # Detect wave from filename/path
        path_str = str(data_path).upper()
        if "W6_" in path_str or "W6 " in path_str or "WAVE6" in path_str:
            wave_num = 6
        elif "W5" in path_str or "WAVE5" in path_str:
            wave_num = 5
        elif "W4" in path_str or "WAVE4" in path_str:
            wave_num = 4
        elif "ABS3" in path_str or "W3" in path_str or "WAVE3" in path_str:
            wave_num = 3
        elif "WAVE2" in path_str or "W2_" in path_str:
            wave_num = 2
        elif "WAVE1" in path_str or "W1" in path_str:
            wave_num = 1
        else:
            wave_num = 6  # Default to latest

        vars_config = self.WAVE_VARS.get(wave_num, self.WAVE_VARS[5])
        data_year = self.WAVE_YEARS.get(wave_num, year)

        # Read data file (.sav or .dta)
        try:
            if data_path.suffix.lower() == ".sav":
                df, meta = pyreadstat.read_sav(str(data_path))
            else:
                df, meta = pyreadstat.read_dta(str(data_path))
        except Exception as e:
            print(f"  Error reading {data_path}: {e}")
            return []

        # Find country column (case-insensitive)
        country_col = None
        for col in df.columns:
            if col.upper() == "COUNTRY":
                country_col = col
                break

        if not country_col:
            print(f"  Country column not found in {data_path.name}")
            return []

        # Find variable columns (case-insensitive)
        col_map = {}
        for key, var_name in vars_config.items():
            if var_name and isinstance(var_name, str):
                for col in df.columns:
                    if col.lower() == var_name.lower():
                        col_map[key] = col
                        break

        # Get unique countries
        countries = df[country_col].dropna().unique()

        for country_val in countries:
            # Get ISO3 code
            if isinstance(country_val, (int, float)):
                iso3 = ASIAN_COUNTRY_CODES.get(int(country_val))
            else:
                iso3 = ASIAN_COUNTRY_CODES.get(str(country_val))

            if not iso3:
                continue

            country_data = df[df[country_col] == country_val]
            n = len(country_data)

            if n < self.MIN_SAMPLE_SIZE:
                continue

            # Process interpersonal trust (1-2 scale, trust code varies by wave)
            interp_col = col_map.get("interpersonal")
            trust_code = vars_config.get("interpersonal_trust_code", 1)
            if interp_col and interp_col in df.columns:
                interp_data = country_data[interp_col].dropna()
                # Filter valid responses (1-2 only)
                interp_valid = interp_data[(interp_data >= 1) & (interp_data <= 2)]
                if len(interp_valid) >= self.MIN_SAMPLE_SIZE:
                    # Calculate % who trust (code varies by wave)
                    trust_pct = float((interp_valid == trust_code).mean() * 100)
                    var_name = vars_config.get("interpersonal", "q22")
                    observations.append(
                        Observation(
                            iso3=iso3,
                            year=int(data_year),
                            source=self.SOURCE_NAME,
                            trust_type="interpersonal",
                            raw_value=round(trust_pct, 1),
                            raw_unit="% most people can be trusted",
                            score_0_100=round(trust_pct, 1),
                            sample_n=int(len(interp_valid)),
                            method_notes=f"Asian Barometer Wave {wave_num} {var_name}, n={len(interp_valid)}",
                            source_url="https://www.asianbarometer.org",
                            methodology="4point",
                        )
                    )

            # Process institutional trust (average of exec + national govt)
            exec_col = col_map.get("institutional_exec")
            natgov_col = col_map.get("institutional_natgov")

            inst_scores = []
            inst_n = 0
            inst_scale = vars_config.get("institutional_scale", 4)
            trust_max = vars_config.get(
                "institutional_trust_max", 2
            )  # Max value considered "trust"
            for col in [exec_col, natgov_col]:
                if col and col in df.columns:
                    col_data = country_data[col].dropna()
                    valid = col_data[(col_data >= 1) & (col_data <= inst_scale)]
                    if len(valid) >= self.MIN_SAMPLE_SIZE:
                        # Count responses <= trust_max as "trust"
                        trust_pct = (valid <= trust_max).mean() * 100
                        inst_scores.append(trust_pct)
                        inst_n = max(inst_n, len(valid))

            if inst_scores:
                avg_inst = float(sum(inst_scores) / len(inst_scores))
                observations.append(
                    Observation(
                        iso3=iso3,
                        year=int(data_year),
                        source=self.SOURCE_NAME,
                        trust_type="institutional",
                        raw_value=round(avg_inst, 1),
                        raw_unit="% trust a great deal/quite a lot",
                        score_0_100=round(avg_inst, 1),
                        sample_n=int(inst_n),
                        method_notes=f"Asian Barometer Wave {wave_num} q7/q9 avg, n={inst_n}",
                        source_url="https://www.asianbarometer.org",
                    )
                )

        return observations


@click.command()
@click.option(
    "--wave",
    type=int,
    default=None,
    help="Asian Barometer wave (1-5), or all if not specified",
)
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(wave: int, dry_run: bool):
    """Process Asian Barometer data."""
    processor = AsianBarometerProcessor()
    asian_dir = processor.raw_data_dir / "asianbarometer"

    # Get all data files (.sav and .dta)
    data_files = list(asian_dir.glob("**/*.sav")) + list(asian_dir.glob("**/*.dta"))
    if not data_files:
        print(f"No Asian Barometer data found in {asian_dir}")
        sys.exit(1)

    all_observations = []

    for data_path in data_files:
        # Skip duplicate formats (prefer .sav)
        if data_path.suffix == ".dta":
            sav_equivalent = data_path.with_suffix(".sav")
            if sav_equivalent.exists():
                continue

        path_str = str(data_path).upper()

        # Detect wave
        if "W6_" in path_str or "W6 " in path_str or "WAVE6" in path_str:
            detected_wave = 6
        elif "W5" in path_str or "WAVE5" in path_str:
            detected_wave = 5
        elif "W4" in path_str or "WAVE4" in path_str:
            detected_wave = 4
        elif "ABS3" in path_str or "W3" in path_str:
            detected_wave = 3
        elif "WAVE2" in path_str or "W2_" in path_str:
            detected_wave = 2
        elif "W1" in path_str or "WAVE1" in path_str:
            detected_wave = 1
        else:
            continue

        if wave and detected_wave != wave:
            continue

        print(f"Processing Wave {detected_wave}: {data_path.name}")

        try:
            observations = processor.process(
                data_path, processor.WAVE_YEARS.get(detected_wave, 2019)
            )
            all_observations.extend(observations)

            # Count by type
            by_type: dict[str, int] = defaultdict(int)
            for obs in observations:
                by_type[obs.trust_type] += 1

            for t, count in by_type.items():
                print(f"  {t}: {count} countries")
        except Exception as e:
            print(f"  Error: {e}")
            import traceback

            traceback.print_exc()
            continue

    # Deduplicate by (iso3, year, source, trust_type) - keep last
    seen = {}
    for obs in all_observations:
        key = (obs.iso3, obs.year, obs.source, obs.trust_type)
        seen[key] = obs
    deduped = list(seen.values())

    print(
        f"\nTotal: {len(deduped)} observations (deduped from {len(all_observations)})"
    )

    if not dry_run and deduped:
        processor.load_to_database(deduped)
        print("Saved to database")
    elif dry_run:
        print("Dry run - not saved")


if __name__ == "__main__":
    main()
