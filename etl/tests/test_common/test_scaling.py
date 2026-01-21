"""Tests for scaling functions."""

import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from common.scaling import (
    scale_0_10_to_percent,
    scale_wgi,
    scale_likert_4_to_percent,
    clamp_score,
    validate_score,
)


class TestScale010ToPercent:
    """Tests for 0-10 to percent conversion."""

    def test_zero(self):
        assert scale_0_10_to_percent(0) == 0

    def test_ten(self):
        assert scale_0_10_to_percent(10) == 100

    def test_five(self):
        assert scale_0_10_to_percent(5) == 50

    def test_decimal(self):
        assert scale_0_10_to_percent(7.5) == 75


class TestScaleWgi:
    """Tests for WGI -2.5 to +2.5 conversion."""

    def test_minimum(self):
        """WGI minimum (-2.5) should convert to 0."""
        assert scale_wgi(-2.5) == 0.0

    def test_maximum(self):
        """WGI maximum (+2.5) should convert to 100."""
        assert scale_wgi(2.5) == 100.0

    def test_zero(self):
        """WGI zero should convert to 50."""
        assert scale_wgi(0) == 50.0

    def test_positive(self):
        """Positive WGI values should be above 50."""
        assert scale_wgi(1.0) == 70.0

    def test_negative(self):
        """Negative WGI values should be below 50."""
        assert scale_wgi(-1.0) == 30.0


class TestScaleLikert4ToPercent:
    """Tests for 4-point Likert to percent conversion."""

    def test_all_trust(self):
        """100% trust responses should give 100%."""
        responses = {1: 100, 2: 0}
        assert scale_likert_4_to_percent(responses, trust_codes=(1,)) == 100.0

    def test_no_trust(self):
        """0% trust responses should give 0%."""
        responses = {1: 0, 2: 100}
        assert scale_likert_4_to_percent(responses, trust_codes=(1,)) == 0.0

    def test_half_trust(self):
        """50/50 split should give 50%."""
        responses = {1: 50, 2: 50}
        assert scale_likert_4_to_percent(responses, trust_codes=(1,)) == 50.0

    def test_institutional_trust(self):
        """Institutional trust uses codes 1 and 2."""
        responses = {1: 20, 2: 30, 3: 30, 4: 20}
        result = scale_likert_4_to_percent(responses, trust_codes=(1, 2))
        assert result == 50.0

    def test_empty_responses(self):
        """Empty responses should return None."""
        assert scale_likert_4_to_percent({}) is None


class TestClampScore:
    """Tests for score clamping."""

    def test_in_range(self):
        assert clamp_score(50) == 50

    def test_below_min(self):
        assert clamp_score(-10) == 0

    def test_above_max(self):
        assert clamp_score(110) == 100


class TestValidateScore:
    """Tests for score validation."""

    def test_valid_score(self):
        assert validate_score(50, "test") == 50

    def test_invalid_below(self):
        with pytest.raises(ValueError):
            validate_score(-1, "test")

    def test_invalid_above(self):
        with pytest.raises(ValueError):
            validate_score(101, "test")

    def test_boundary_zero(self):
        assert validate_score(0, "test") == 0

    def test_boundary_hundred(self):
        assert validate_score(100, "test") == 100
