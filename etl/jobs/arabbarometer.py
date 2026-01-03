#!/usr/bin/env python3
"""
Arab Barometer ETL Job

Processes Arab Barometer survey data for trust measurements.

Data source: https://www.arabbarometer.org/
Requires manual download - registration is free.

Trust Variables by Wave:
- Wave V (2018-2019): Q103 (interpersonal), Q201A_1/Q201A_3 (institutional)
- Wave VI (2020-2021): Similar structure
- Wave VII (2021-2022): Similar structure
- Wave VIII (2022-2023): Q103 (interpersonal)

Scale: 1-4 (1=Trust a great deal, 4=Cannot be trusted at all) - REVERSED
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


# Arab Barometer country codes to ISO3
# Note: Different waves use different numeric coding schemes
ARAB_COUNTRY_CODES: dict[int | str, str] = {
    # Numeric codes from waves V-VIII (verified from actual files)
    1: "DZA",  # Algeria
    5: "EGY",  # Egypt
    7: "IRQ",  # Iraq
    8: "JOR",  # Jordan
    9: "KWT",  # Kuwait
    10: "LBN",  # Lebanon
    11: "LBY",  # Libya
    12: "MRT",  # Mauritania
    13: "MAR",  # Morocco
    15: "PSE",  # Palestine
    19: "SDN",  # Sudan
    21: "TUN",  # Tunisia
    22: "YEM",  # Yemen
    # Country names as fallback
    "Algeria": "DZA",
    "Egypt": "EGY",
    "Iraq": "IRQ",
    "Jordan": "JOR",
    "Kuwait": "KWT",
    "Lebanon": "LBN",
    "Libya": "LBY",
    "Morocco": "MAR",
    "Palestine": "PSE",
    "Sudan": "SDN",
    "Tunisia": "TUN",
    "Yemen": "YEM",
    "Saudi Arabia": "SAU",
    "Bahrain": "BHR",
    "Qatar": "QAT",
    "Oman": "OMN",
    "United Arab Emirates": "ARE",
    "Mauritania": "MRT",
}

# Wave-specific country code mappings (each wave uses different numbering)
WAVE_COUNTRY_CODES: dict[int, dict[int | str, str]] = {
    1: {  # Wave I (2006-2007)
        1: "JOR",
        2: "PSE",
        3: "DZA",
        4: "MAR",
        6: "LBN",
        7: "YEM",
        8: "BHR",
    },
    2: {  # Wave II (2010-2011)
        1: "DZA",
        5: "EGY",
        7: "IRQ",
        8: "JOR",
        10: "LBN",
        15: "PSE",
        17: "SAU",
        19: "SDN",
        21: "TUN",
        22: "YEM",
    },
    3: {  # Wave III (2012-2014)
        1: "DZA",
        5: "EGY",
        7: "IRQ",
        8: "JOR",
        9: "KWT",
        10: "LBN",
        11: "LBY",
        13: "MAR",
        15: "PSE",
        19: "SDN",
        21: "TUN",
        22: "YEM",
    },
    4: {  # Wave IV (2016-2017)
        1: "DZA",
        5: "EGY",
        8: "JOR",
        10: "LBN",
        13: "MAR",
        15: "PSE",
        16: "QAT",
        21: "TUN",
    },
}
# Backward compatibility alias
WAVE2_COUNTRY_CODES = WAVE_COUNTRY_CODES[2]


class ArabBarometerProcessor(BaseProcessor):
    """Processor for Arab Barometer survey data."""

    SOURCE_NAME = "Arab Barometer"
    MIN_SAMPLE_SIZE = 300

    # Variable mappings by wave (verified from actual data files)
    WAVE_VARS: dict[int, dict[str, str | None]] = {
        8: {
            "interpersonal": "Q103",
            "institutional_govt": "Q201A_1",
            "institutional_parliament": "Q201A_3",
            "country": "COUNTRY",
        },
        7: {
            "interpersonal": "Q103",
            "institutional_govt": "Q201A_1",
            "institutional_parliament": "Q201A_3",
            "country": "COUNTRY",
        },
        6: {
            "interpersonal": None,  # Not asked in Wave VI
            "institutional_govt": "Q201A_1",
            "institutional_parliament": "Q201A_3",
            "country": "COUNTRY",
        },
        5: {
            "interpersonal": "Q103",
            "institutional_govt": "Q201A_1",
            "institutional_parliament": "Q201A_3",
            "country": "COUNTRY",
        },
        # Waves I-IV use lowercase variable names and q201X format
        4: {
            "interpersonal": "q103",
            "institutional_govt": "q2011",
            "institutional_parliament": "q2013",
            "country": "country",
        },
        3: {
            "interpersonal": "q103",
            "institutional_govt": "q2011",
            "institutional_parliament": "q2013",
            "country": "country",
        },
        2: {
            "interpersonal": "q103",
            "institutional_govt": "q2011",
            "institutional_parliament": "q2013",
            "country": "country",
        },
        1: {
            "interpersonal": "q103",
            "institutional_govt": "q2011",
            "institutional_parliament": "q2013",
            "country": "country",
        },
    }

    # Median years for each wave
    WAVE_YEARS = {
        8: 2023,
        7: 2022,
        6: 2021,
        5: 2019,
        4: 2017,
        3: 2014,
        2: 2011,
        1: 2007,
    }

    def download(self, year: int) -> Path:
        """Check for Arab Barometer data files."""
        arab_dir = self.raw_data_dir / "arabbarometer"
        data_files = list(arab_dir.glob("**/*.sav")) + list(arab_dir.glob("**/*.dta"))
        if data_files:
            return data_files[0]
        raise FileNotFoundError(
            f"No Arab Barometer data found in {arab_dir}. "
            "Please download from https://www.arabbarometer.org/"
        )

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Arab Barometer data to observations."""
        import pyreadstat

        observations = []

        # Detect wave from filename
        # Note: Check specific patterns before generic ones (ABIV before V, etc.)
        filename = data_path.name.upper()
        if "VIII" in filename or "WAVE8" in filename or "WAVEVIII" in filename:
            wave_num = 8
        elif "AB7" in filename or "VII" in filename or "WAVE7" in filename:
            wave_num = 7
        elif (
            "WAVE VI" in data_path.parent.name.upper()
            or "WAVE6" in filename
            or "_6_" in filename
        ):
            wave_num = 6
        elif "ABIV" in filename or "WAVE4" in filename:
            wave_num = 4
        elif "ABIII" in filename or "WAVE3" in filename:
            wave_num = 3
        elif "ABII" in filename or "WAVE2" in filename:
            wave_num = 2
        elif (
            "WAVEV" in filename
            or "WAVE5" in filename
            or ("_V_" in filename and "I" not in filename.split("_V_")[0][-1:])
        ):
            wave_num = 5
        elif "ABI" in filename and "ABII" not in filename:
            wave_num = 1
        else:
            wave_num = 8  # Default to latest

        vars_config: dict[str, str | None] = self.WAVE_VARS.get(
            wave_num, self.WAVE_VARS[8]
        )
        data_year = self.WAVE_YEARS.get(wave_num, year)

        # Read data file (.sav or .dta)
        try:
            if data_path.suffix.lower() == ".sav":
                df, meta = pyreadstat.read_sav(str(data_path))
            else:
                try:
                    df, meta = pyreadstat.read_dta(str(data_path))
                except Exception:
                    # Fallback to latin1 encoding for older files
                    df, meta = pyreadstat.read_dta(str(data_path), encoding="latin1")
        except Exception as e:
            print(f"  Error reading {data_path}: {e}")
            return []

        # Normalize column names to lowercase for matching
        df.columns = df.columns.str.lower()
        vars_lower = {k: v.lower() if v else None for k, v in vars_config.items()}

        country_col = vars_lower["country"]
        if country_col not in df.columns:
            print(f"  Country column {country_col} not found in {data_path.name}")
            return []

        # Get unique countries
        countries = df[country_col].dropna().unique()

        # Use wave-specific country code mapping for early waves
        if wave_num in WAVE_COUNTRY_CODES:
            country_codes = WAVE_COUNTRY_CODES[wave_num]
        else:
            country_codes = ARAB_COUNTRY_CODES

        for country_val in countries:
            # Get ISO3 code (handle numpy types)
            try:
                iso3 = country_codes.get(int(country_val))
            except (ValueError, TypeError):
                iso3 = country_codes.get(str(country_val))  # type: ignore[arg-type]

            if not iso3:
                continue

            country_data = df[df[country_col] == country_val]
            n = len(country_data)

            if n < self.MIN_SAMPLE_SIZE:
                continue

            # Process interpersonal trust (Q103)
            # Wave I uses 1-4 scale (1-2=trust, 3-4=don't trust)
            # Waves II-VIII use 1-2 scale (1=trust, 2=don't trust)
            interp_col = vars_lower.get("interpersonal")
            if interp_col and interp_col in df.columns:
                interp_data = country_data[interp_col].dropna()

                # Detect scale based on max valid value
                max_val = interp_data[(interp_data >= 1) & (interp_data <= 4)].max()

                if max_val > 2:
                    # 1-4 scale (Wave I): filter 1-4, trust = 1 or 2
                    interp_valid = interp_data[(interp_data >= 1) & (interp_data <= 4)]
                    if len(interp_valid) >= self.MIN_SAMPLE_SIZE:
                        trust_pct = float((interp_valid <= 2).mean() * 100)
                else:
                    # 1-2 scale (Waves II+): filter 1-2, trust = 1
                    interp_valid = interp_data[(interp_data >= 1) & (interp_data <= 2)]
                    if len(interp_valid) >= self.MIN_SAMPLE_SIZE:
                        trust_pct = float((interp_valid == 1).mean() * 100)
                    else:
                        trust_pct = None

                if len(interp_valid) >= self.MIN_SAMPLE_SIZE and trust_pct is not None:
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
                            method_notes=f"Arab Barometer Wave {wave_num} Q103, n={len(interp_valid)}",
                            source_url="https://www.arabbarometer.org",
                            methodology="4point",
                        )
                    )

            # Process institutional trust (average of govt + parliament, 1-4 scale reversed)
            govt_col = vars_lower.get("institutional_govt")
            parl_col = vars_lower.get("institutional_parliament")

            inst_scores = []
            inst_n = 0
            for col in [govt_col, parl_col]:
                if col and col in df.columns:
                    col_data = country_data[col].dropna()
                    valid = col_data[(col_data >= 1) & (col_data <= 4)]
                    if len(valid) >= self.MIN_SAMPLE_SIZE:
                        # Trust = 1 or 2 (great deal or quite a lot)
                        trust_pct = (valid <= 2).mean() * 100
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
                        method_notes=f"Arab Barometer Wave {wave_num} Q201 avg, n={inst_n}",
                        source_url="https://www.arabbarometer.org",
                    )
                )

        return observations


@click.command()
@click.option(
    "--wave",
    type=int,
    default=None,
    help="Arab Barometer wave (1-8), or all if not specified",
)
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(wave: int, dry_run: bool):
    """Process Arab Barometer data."""
    processor = ArabBarometerProcessor()
    arab_dir = processor.raw_data_dir / "arabbarometer"

    # Get all data files (.sav and .dta)
    data_files = list(arab_dir.glob("**/*.sav")) + list(arab_dir.glob("**/*.dta"))
    if not data_files:
        print(f"No Arab Barometer data found in {arab_dir}")
        sys.exit(1)

    all_observations = []

    for data_path in data_files:
        # Skip duplicate formats (prefer .sav)
        if data_path.suffix == ".dta":
            sav_equivalent = data_path.with_suffix(".sav")
            if sav_equivalent.exists():
                continue

        filename = data_path.name.upper()

        # Detect wave
        if "VIII" in filename or "WAVEVIII" in filename:
            detected_wave = 8
        elif "VII" in filename or "AB7" in filename:
            detected_wave = 7
        elif (
            "_6_" in filename
            or "WAVE6" in filename
            or "WAVE VI" in data_path.parent.name.upper()
        ):
            detected_wave = 6
        elif (
            "WAVEV" in filename
            and "VIII" not in filename
            and "VII" not in filename
            and "VI" not in filename
        ):
            detected_wave = 5
        elif "ABIV" in filename:
            detected_wave = 4
        elif "ABIII" in filename:
            detected_wave = 3
        elif "ABII" in filename:
            detected_wave = 2
        elif "ABI" in filename and "ABII" not in filename:
            detected_wave = 1
        else:
            continue

        if wave and detected_wave != wave:
            continue

        print(f"Processing Wave {detected_wave}: {data_path.name}")

        try:
            observations = processor.process(
                data_path, processor.WAVE_YEARS.get(detected_wave, 2023)
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
