#!/usr/bin/env python3
"""
Afrobarometer ETL Job

Processes Afrobarometer survey data for trust measurements.

Data source: https://www.afrobarometer.org/data/
Requires manual download - registration is free.

Trust Variables by Round:
- Round 9 (2022-2023): Q86A (interpersonal), Q37A-B (institutional)
- Round 8 (2019-2021): Q84A (interpersonal), Q52A-B (institutional)
- Round 7 (2016-2018): Q84A (interpersonal), Q52A-B (institutional)
- Round 6 (2014-2015): Q84A (interpersonal), Q49A-B (institutional)

Variable meanings:
- Interpersonal: "How much do you trust other [nationality] citizens?"
- Institutional: Trust in president, parliament/national assembly

Scale: 0=Not at all, 1=Just a little, 2=Somewhat, 3=A lot
"""

import sys
from pathlib import Path
from typing import List
from collections import defaultdict

import click

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from common.base import BaseProcessor, Observation


# Afrobarometer country codes to ISO3
AFRO_COUNTRY_CODES = {
    1: "BEN",
    2: "BWA",
    3: "GHA",
    4: "LSO",
    5: "MWI",
    6: "MLI",
    7: "NAM",
    8: "NGA",
    9: "ZAF",
    10: "TZA",
    11: "UGA",
    12: "ZMB",
    13: "ZWE",
    14: "CPV",
    15: "KEN",
    16: "MOZ",
    17: "SEN",
    18: "BFA",
    19: "LBR",
    20: "MDG",
    21: "NER",
    22: "CMR",
    23: "CIV",
    24: "MUS",
    25: "SWZ",
    26: "TGO",
    27: "EGY",
    28: "MAR",
    29: "DZA",
    30: "TUN",
    31: "SLE",
    32: "BDI",
    33: "GAB",
    34: "STP",
    35: "SDN",
    36: "GIN",
    37: "ETH",
    38: "COD",
    39: "GMB",
    40: "AGO",
    41: "SSD",
    # Country names as they appear in data
    "Benin": "BEN",
    "Botswana": "BWA",
    "Ghana": "GHA",
    "Lesotho": "LSO",
    "Malawi": "MWI",
    "Mali": "MLI",
    "Namibia": "NAM",
    "Nigeria": "NGA",
    "South Africa": "ZAF",
    "Tanzania": "TZA",
    "Uganda": "UGA",
    "Zambia": "ZMB",
    "Zimbabwe": "ZWE",
    "Cape Verde": "CPV",
    "Cabo Verde": "CPV",
    "Kenya": "KEN",
    "Mozambique": "MOZ",
    "Senegal": "SEN",
    "Burkina Faso": "BFA",
    "Liberia": "LBR",
    "Madagascar": "MDG",
    "Niger": "NER",
    "Cameroon": "CMR",
    "Côte d'Ivoire": "CIV",
    "Cote d'Ivoire": "CIV",
    "Mauritius": "MUS",
    "Eswatini": "SWZ",
    "Swaziland": "SWZ",
    "Togo": "TGO",
    "Egypt": "EGY",
    "Morocco": "MAR",
    "Algeria": "DZA",
    "Tunisia": "TUN",
    "Sierra Leone": "SLE",
    "Burundi": "BDI",
    "Gabon": "GAB",
    "São Tomé and Príncipe": "STP",
    "Sao Tome and Principe": "STP",
    "Sudan": "SDN",
    "Guinea": "GIN",
    "Ethiopia": "ETH",
    "Democratic Republic of Congo": "COD",
    "Congo (DRC)": "COD",
    "Gambia": "GMB",
    "The Gambia": "GMB",
    "Angola": "AGO",
    "South Sudan": "SSD",
    # R9 new countries
    "Congo-Brazzaville": "COG",
    "Mauritania": "MRT",
    "Seychelles": "SYC",
}


class AfrobarometerProcessor(BaseProcessor):
    """Processor for Afrobarometer survey data."""

    SOURCE_NAME = "Afrobarometer"
    MIN_SAMPLE_SIZE = 300

    # Variable mappings by round (verified from actual data files)
    ROUND_VARS = {
        9: {
            "interpersonal": "Q86A",
            "interpersonal_type": "likert",  # 0-3 scale
            "institutional_president": "Q37A",
            "institutional_parliament": "Q37B",
            "country": "COUNTRY",
            "year": None,  # Use round year
        },
        8: {
            "interpersonal": "Q83",  # "Most people can be trusted"
            "interpersonal_type": "binary",  # 0=careful, 1=trust
            "institutional_president": "Q41A",
            "institutional_parliament": "Q41B",
            "country": "COUNTRY",
            "year": None,
        },
        7: {
            "interpersonal": None,  # Not asked in R7
            "interpersonal_type": None,
            "institutional_president": "Q43A",
            "institutional_parliament": "Q43B",
            "country": "COUNTRY",
            "year": None,
        },
        6: {
            "interpersonal": None,  # Not asked in R6
            "interpersonal_type": None,
            "institutional_president": "Q52A",
            "institutional_parliament": "Q52B",
            "country": "COUNTRY",
            "year": None,
        },
    }

    # Median years for each round
    ROUND_YEARS = {
        9: 2023,
        8: 2020,
        7: 2017,
        6: 2015,
        5: 2012,
    }

    def download(self, year: int) -> Path:
        """Check for Afrobarometer data files."""
        afro_dir = self.raw_data_dir / "afrobarometer"

        # Look for any .sav files
        sav_files = list(afro_dir.glob("*.sav"))
        if sav_files:
            return Path(sav_files[0])

        raise FileNotFoundError(
            f"No Afrobarometer data found in {afro_dir}. "
            "Please download from https://www.afrobarometer.org/data/"
        )

    def process(self, data_path: Path, year: int) -> List[Observation]:
        """Process Afrobarometer data to observations."""
        import pyreadstat

        observations = []

        # Detect round from filename
        filename = data_path.name.upper()
        if "R9" in filename or "ROUND9" in filename:
            round_num = 9
        elif "R8" in filename or "ROUND8" in filename:
            round_num = 8
        elif "R7" in filename or "ROUND7" in filename:
            round_num = 7
        elif "R6" in filename or "ROUND6" in filename:
            round_num = 6
        else:
            round_num = 9  # Default to latest

        vars_config = self.ROUND_VARS.get(round_num, self.ROUND_VARS[9])
        data_year = self.ROUND_YEARS.get(round_num, year)

        # Read relevant columns (filter None values)
        cols_to_read = [
            vars_config["country"],
            vars_config["interpersonal"],
            vars_config["institutional_president"],
            vars_config["institutional_parliament"],
        ]
        cols_to_read = [c for c in cols_to_read if c]

        try:
            df, meta = pyreadstat.read_sav(
                str(data_path),
                usecols=cols_to_read,
            )
        except Exception as e:
            print(f"Error reading {data_path}: {e}")
            return []

        country_col = vars_config["country"]

        # Get country value labels from metadata (maps numeric codes to names)
        country_labels = meta.variable_value_labels.get(country_col, {})

        # Get unique countries
        countries = df[country_col].dropna().unique()

        for country_val in countries:
            # Get country name from metadata labels, then map to ISO3
            # This handles changing numeric codes across rounds
            country_name = country_labels.get(float(country_val), str(country_val))
            iso3 = AFRO_COUNTRY_CODES.get(country_name)

            # Fallback: try numeric code (for older data without labels)
            if not iso3 and isinstance(country_val, (int, float)):
                iso3 = AFRO_COUNTRY_CODES.get(int(country_val))

            if not iso3:
                continue

            country_data = df[df[country_col] == country_val]
            n = len(country_data)

            if n < self.MIN_SAMPLE_SIZE:
                continue

            # Process interpersonal trust
            interp_col = vars_config["interpersonal"]
            interp_type = vars_config.get("interpersonal_type")
            if interp_col and interp_col in df.columns:
                interp_data = country_data[interp_col].dropna()

                if interp_type == "binary":
                    # R8: Q83 is binary (0=careful, 1=trust)
                    interp_valid = interp_data[interp_data.isin([0, 1])]
                    if len(interp_valid) >= self.MIN_SAMPLE_SIZE:
                        trust_pct = float((interp_valid == 1).mean() * 100)
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
                                method_notes=f"Afrobarometer R{round_num} {interp_col}, n={len(interp_valid)}",
                                source_url="https://www.afrobarometer.org",
                                methodology="binary",
                            )
                        )
                else:
                    # R9+: 0-3 scale, calculate % who trust "somewhat" or "a lot"
                    interp_valid = interp_data[(interp_data >= 0) & (interp_data <= 3)]
                    if len(interp_valid) >= self.MIN_SAMPLE_SIZE:
                        trust_pct = float((interp_valid >= 2).mean() * 100)
                        observations.append(
                            Observation(
                                iso3=iso3,
                                year=int(data_year),
                                source=self.SOURCE_NAME,
                                trust_type="interpersonal",
                                raw_value=round(trust_pct, 1),
                                raw_unit="% trust somewhat/a lot",
                                score_0_100=round(trust_pct, 1),
                                sample_n=int(len(interp_valid)),
                                method_notes=f"Afrobarometer R{round_num} {interp_col}, n={len(interp_valid)}",
                                source_url="https://www.afrobarometer.org",
                                methodology="4point",
                            )
                        )

            # Process institutional trust (average of president + parliament)
            pres_col = vars_config["institutional_president"]
            parl_col = vars_config["institutional_parliament"]

            inst_scores = []
            inst_n = 0
            for col in [pres_col, parl_col]:
                if col in df.columns:
                    col_data = country_data[col].dropna()
                    valid = col_data[(col_data >= 0) & (col_data <= 3)]
                    if len(valid) >= self.MIN_SAMPLE_SIZE:
                        trust_pct = (valid >= 2).mean() * 100
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
                        raw_unit="% trust somewhat/a lot",
                        score_0_100=round(avg_inst, 1),
                        sample_n=int(inst_n),
                        method_notes=f"Afrobarometer R{round_num} Q37A/B avg, n={inst_n}",
                        source_url="https://www.afrobarometer.org",
                    )
                )

        return observations


@click.command()
@click.option(
    "--round",
    "round_num",
    type=int,
    default=None,
    help="Afrobarometer round (6-9), or all if not specified",
)
@click.option("--dry-run", is_flag=True, help="Don't save to database")
def main(round_num: int, dry_run: bool):
    """Process Afrobarometer data."""
    processor = AfrobarometerProcessor()
    afro_dir = processor.raw_data_dir / "afrobarometer"

    # Get all .sav files
    sav_files = list(afro_dir.glob("*.sav"))
    if not sav_files:
        print(f"No Afrobarometer data found in {afro_dir}")
        sys.exit(1)

    all_observations = []

    for data_path in sav_files:
        # Detect round from filename
        filename = data_path.name.upper()
        if "R9" in filename or "ROUND9" in filename or "39CTRY" in filename:
            detected_round = 9
        elif "R8" in filename or "ROUND8" in filename or "34CTRY_R8" in filename:
            detected_round = 8
        elif "R7" in filename or "ROUND7" in filename:
            detected_round = 7
        elif "R6" in filename or "ROUND6" in filename:
            detected_round = 6
        else:
            print(f"Skipping {data_path.name} - couldn't detect round")
            continue

        # Skip if specific round requested and this isn't it
        if round_num and detected_round != round_num:
            continue

        print(f"Processing Round {detected_round}: {data_path.name}")

        try:
            observations = processor.process(
                data_path, processor.ROUND_YEARS.get(detected_round, 2023)
            )
            all_observations.extend(observations)

            # Count by type for this file
            by_type: dict[str, int] = defaultdict(int)
            for obs in observations:
                by_type[obs.trust_type] += 1

            for t, count in by_type.items():
                print(f"  {t}: {count} countries")
        except Exception as e:
            print(f"  Error: {e}")
            continue

    print(f"\nTotal: {len(all_observations)} observations")

    if not dry_run and all_observations:
        processor.load_to_database(all_observations)
        print("Saved to database")
    elif dry_run:
        print("Dry run - not saved")


if __name__ == "__main__":
    main()
