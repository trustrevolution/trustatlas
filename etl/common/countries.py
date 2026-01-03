"""
Country mapping and normalization for Trust Atlas ETL.

Handles ISO code lookups, name normalization, and fuzzy matching
for country names across different data sources.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

import pandas as pd

logger = logging.getLogger(__name__)


# Common country name variations mapped to ISO3 codes
COUNTRY_ALIASES = {
    # United States variations
    "United States of America": "USA",
    "United States": "USA",
    "US": "USA",
    "U.S.": "USA",
    "U.S.A.": "USA",
    "America": "USA",
    # United Kingdom variations
    "United Kingdom of Great Britain and Northern Ireland": "GBR",
    "United Kingdom": "GBR",
    "UK": "GBR",
    "U.K.": "GBR",
    "Great Britain": "GBR",
    "Britain": "GBR",
    # Russia variations
    "Russian Federation": "RUS",
    "Russia": "RUS",
    # Korea variations
    "Korea, Republic of": "KOR",
    "Republic of Korea": "KOR",
    "South Korea": "KOR",
    "Korea (South)": "KOR",
    "Korea, Dem. People's Rep.": "PRK",
    "North Korea": "PRK",
    # China variations
    "China, People's Republic of": "CHN",
    "People's Republic of China": "CHN",
    "China": "CHN",
    "Taiwan, China": "TWN",
    "Taiwan": "TWN",
    "Taiwan, Province of China": "TWN",
    "Chinese Taipei": "TWN",
    "Hong Kong SAR, China": "HKG",
    "Hong Kong": "HKG",
    # Vietnam variations
    "Viet Nam": "VNM",
    "Vietnam": "VNM",
    # Iran variations
    "Iran, Islamic Republic of": "IRN",
    "Iran": "IRN",
    # Venezuela variations
    "Venezuela, RB": "VEN",
    "Venezuela": "VEN",
    "Venezuela, Bolivarian Republic of": "VEN",
    # Egypt variations
    "Egypt, Arab Rep.": "EGY",
    "Egypt": "EGY",
    # Czech Republic variations
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    # Other common variations
    "Slovak Republic": "SVK",
    "Slovakia": "SVK",
    "Congo, Dem. Rep.": "COD",
    "Democratic Republic of the Congo": "COD",
    "Congo, Rep.": "COG",
    "Republic of the Congo": "COG",
    "Cote d'Ivoire": "CIV",
    "Ivory Coast": "CIV",
    "Lao PDR": "LAO",
    "Laos": "LAO",
    "Kyrgyz Republic": "KGZ",
    "Kyrgyzstan": "KGZ",
    "North Macedonia": "MKD",
    "Macedonia": "MKD",
    "Turkiye": "TUR",
    "Turkey": "TUR",
    "Brunei Darussalam": "BRN",
    "Brunei": "BRN",
    "Syrian Arab Republic": "SYR",
    "Syria": "SYR",
    "Timor-Leste": "TLS",
    "East Timor": "TLS",
    "Eswatini": "SWZ",
    "Swaziland": "SWZ",
    "Cabo Verde": "CPV",
    "Cape Verde": "CPV",
    "Bolivia, Plurinational State of": "BOL",
    "Bolivia": "BOL",
    "Tanzania, United Republic of": "TZA",
    "Tanzania": "TZA",
    "Moldova, Republic of": "MDA",
    "Moldova": "MDA",
    "Micronesia, Federated States of": "FSM",
    "Micronesia": "FSM",
    "Gambia, The": "GMB",
    "Gambia": "GMB",
    "Bahamas, The": "BHS",
    "Bahamas": "BHS",
    "West Bank and Gaza": "PSE",
    "Palestine": "PSE",
    "Palestinian Territories": "PSE",
}


class CountryMapper:
    """Map country names and codes to standardized ISO3 format."""

    def __init__(
        self, iso_map_path: Optional[Path] = None, aliases_path: Optional[Path] = None
    ):
        """
        Initialize the country mapper.

        Args:
            iso_map_path: Path to iso_map.csv reference file
            aliases_path: Path to country_aliases.json (optional)
        """
        self.project_root = Path(__file__).parent.parent.parent
        self.reference_dir = self.project_root / "data" / "reference"

        # Load ISO mappings from CSV
        self.iso_map_path = iso_map_path or self.reference_dir / "iso_map.csv"
        self._name_to_iso3: Dict[str, str] = {}
        self._iso2_to_iso3: Dict[str, str] = {}
        self._iso3_set: set = set()
        self._load_iso_map()

        # Load additional aliases
        self.aliases = dict(COUNTRY_ALIASES)
        aliases_path = aliases_path or self.reference_dir / "country_aliases.json"
        if aliases_path.exists():
            self._load_aliases(aliases_path)

    def _load_iso_map(self) -> None:
        """Load ISO mappings from CSV file."""
        if not self.iso_map_path.exists():
            logger.warning(f"ISO map not found at {self.iso_map_path}")
            return

        df = pd.read_csv(self.iso_map_path)

        for _, row in df.iterrows():
            iso3 = str(row["iso3"]).strip()
            if not iso3 or iso3 == "nan":
                continue
            self._iso3_set.add(iso3)

            # Map name to ISO3
            name = row.get("name", "")
            if pd.notna(name) and name:
                name = str(name).strip()
                self._name_to_iso3[name] = iso3
                self._name_to_iso3[name.lower()] = iso3

            # Map ISO2 to ISO3
            iso2 = row.get("iso2", "")
            if pd.notna(iso2) and iso2:
                iso2 = str(iso2).strip()
                self._iso2_to_iso3[iso2] = iso3
                self._iso2_to_iso3[iso2.lower()] = iso3

        logger.debug(f"Loaded {len(self._iso3_set)} countries from ISO map")

    def _load_aliases(self, path: Path) -> None:
        """Load additional aliases from JSON file."""
        with open(path) as f:
            data = json.load(f)
            if "aliases" in data:
                self.aliases.update(data["aliases"])
            else:
                self.aliases.update(data)

        logger.debug(f"Loaded {len(self.aliases)} country aliases")

    def normalize_name(self, name: str) -> str:
        """
        Normalize country name for matching.

        Args:
            name: Raw country name

        Returns:
            Normalized name (stripped, title case)
        """
        return name.strip()

    def get_iso3_from_name(self, name: str) -> Optional[str]:
        """
        Get ISO3 code from country name.

        Args:
            name: Country name (any variation)

        Returns:
            ISO3 code or None if not found
        """
        name = self.normalize_name(name)

        # Check aliases first (exact match)
        if name in self.aliases:
            return self.aliases[name]

        # Check direct name mapping
        if name in self._name_to_iso3:
            return self._name_to_iso3[name]

        # Case-insensitive lookup
        name_lower = name.lower()
        if name_lower in self._name_to_iso3:
            return self._name_to_iso3[name_lower]

        # Check aliases case-insensitive
        for alias, iso3 in self.aliases.items():
            if alias.lower() == name_lower:
                return iso3

        logger.warning(f"Could not map country name: '{name}'")
        return None

    def get_iso3_from_iso2(self, iso2: str) -> Optional[str]:
        """
        Get ISO3 code from ISO2 code.

        Args:
            iso2: Two-letter country code

        Returns:
            ISO3 code or None if not found
        """
        iso2 = iso2.strip().upper()

        if iso2 in self._iso2_to_iso3:
            return self._iso2_to_iso3[iso2]

        # Try lowercase lookup
        if iso2.lower() in self._iso2_to_iso3:
            return self._iso2_to_iso3[iso2.lower()]

        logger.warning(f"Could not map ISO2 code: '{iso2}'")
        return None

    def validate_iso3(self, iso3: str) -> bool:
        """
        Check if ISO3 code is valid.

        Args:
            iso3: Three-letter country code

        Returns:
            True if valid, False otherwise
        """
        return iso3.upper() in self._iso3_set

    def get_or_map(self, identifier: str) -> Optional[str]:
        """
        Get ISO3 from any identifier (name, ISO2, or ISO3).

        Args:
            identifier: Country name, ISO2, or ISO3 code

        Returns:
            ISO3 code or None if not found
        """
        identifier = identifier.strip()

        # Check if it's already a valid ISO3
        if len(identifier) == 3 and identifier.upper() in self._iso3_set:
            return identifier.upper()

        # Check if it's an ISO2
        if len(identifier) == 2:
            result = self.get_iso3_from_iso2(identifier)
            if result:
                return result

        # Try name lookup
        return self.get_iso3_from_name(identifier)

    def get_all_iso3_codes(self) -> set:
        """
        Get all known ISO3 codes.

        Returns:
            Set of all ISO3 codes
        """
        return self._iso3_set.copy()
