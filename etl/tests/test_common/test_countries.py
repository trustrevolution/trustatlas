"""Tests for country mapping utilities."""

import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from common.countries import CountryMapper, COUNTRY_ALIASES


class TestCountryAliases:
    """Tests for built-in country aliases."""

    def test_usa_variations(self):
        """Test USA name variations."""
        assert COUNTRY_ALIASES["United States"] == "USA"
        assert COUNTRY_ALIASES["United States of America"] == "USA"
        assert COUNTRY_ALIASES["US"] == "USA"

    def test_uk_variations(self):
        """Test UK name variations."""
        assert COUNTRY_ALIASES["United Kingdom"] == "GBR"
        assert COUNTRY_ALIASES["UK"] == "GBR"

    def test_russia_variations(self):
        """Test Russia name variations."""
        assert COUNTRY_ALIASES["Russian Federation"] == "RUS"
        assert COUNTRY_ALIASES["Russia"] == "RUS"


class TestCountryMapper:
    """Tests for CountryMapper class."""

    @pytest.fixture
    def mapper(self):
        """Create CountryMapper instance."""
        return CountryMapper()

    def test_get_iso3_from_name_exact(self, mapper):
        """Test exact name matching."""
        # Uses aliases
        assert mapper.get_iso3_from_name("United States") == "USA"
        assert mapper.get_iso3_from_name("Russia") == "RUS"

    def test_get_iso3_from_name_case_insensitive(self, mapper):
        """Test case-insensitive name matching."""
        assert mapper.get_iso3_from_name("UNITED STATES") == "USA"
        assert mapper.get_iso3_from_name("united kingdom") == "GBR"

    def test_get_iso3_from_iso2(self, mapper):
        """Test ISO2 to ISO3 conversion."""
        assert mapper.get_iso3_from_iso2("SE") == "SWE"
        assert mapper.get_iso3_from_iso2("US") == "USA"
        assert mapper.get_iso3_from_iso2("GB") == "GBR"

    def test_get_iso3_from_iso2_lowercase(self, mapper):
        """Test lowercase ISO2 codes."""
        assert mapper.get_iso3_from_iso2("se") == "SWE"
        assert mapper.get_iso3_from_iso2("us") == "USA"

    def test_validate_iso3_valid(self, mapper):
        """Test valid ISO3 codes."""
        assert mapper.validate_iso3("SWE") is True
        assert mapper.validate_iso3("USA") is True
        assert mapper.validate_iso3("GBR") is True

    def test_validate_iso3_invalid(self, mapper):
        """Test invalid ISO3 codes."""
        assert mapper.validate_iso3("XXX") is False
        assert mapper.validate_iso3("ZZZ") is False

    def test_get_or_map_iso3(self, mapper):
        """Test get_or_map with ISO3 code."""
        assert mapper.get_or_map("SWE") == "SWE"
        assert mapper.get_or_map("USA") == "USA"

    def test_get_or_map_iso2(self, mapper):
        """Test get_or_map with ISO2 code."""
        assert mapper.get_or_map("SE") == "SWE"
        assert mapper.get_or_map("US") == "USA"

    def test_get_or_map_name(self, mapper):
        """Test get_or_map with country name."""
        assert mapper.get_or_map("Sweden") == "SWE"
        assert mapper.get_or_map("United States") == "USA"

    def test_unknown_country_returns_none(self, mapper):
        """Test that unknown countries return None."""
        assert mapper.get_iso3_from_name("Narnia") is None
        assert mapper.get_iso3_from_iso2("XX") is None

    def test_normalize_name(self, mapper):
        """Test name normalization."""
        assert mapper.normalize_name("  Sweden  ") == "Sweden"
        assert mapper.normalize_name("USA") == "USA"
