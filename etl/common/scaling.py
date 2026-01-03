"""
Score normalization functions for Trust Atlas ETL.

All functions convert source-specific scales to the standard 0-100 range.
Formulas are derived from data/reference/methodology.yaml.
"""

from typing import Dict, Optional


def scale_0_10_to_percent(value: float) -> float:
    """
    Convert 0-10 scale to 0-100 percent.

    Used for: ESS trust variables (ppltrst, trstprl, etc.)

    Args:
        value: Score on 0-10 scale

    Returns:
        Score on 0-100 scale
    """
    return value * 10


def scale_wgi(value: float) -> float:
    """
    Convert World Bank WGI scale (-2.5 to +2.5) to 0-100.

    Formula from methodology.yaml: ((x + 2.5) / 5) * 100

    Args:
        value: WGI estimate value (-2.5 to +2.5)

    Returns:
        Score on 0-100 scale

    Examples:
        >>> scale_wgi(-2.5)
        0.0
        >>> scale_wgi(0)
        50.0
        >>> scale_wgi(2.5)
        100.0
    """
    return ((value + 2.5) / 5) * 100


def scale_likert_4_to_percent(
    responses: Dict[int, int], trust_codes: tuple = (1,)
) -> Optional[float]:
    """
    Convert 4-point Likert responses to percent who trust.

    Used for: WVS Q57 (interpersonal trust)
    - 1 = "Most people can be trusted"
    - 2 = "Need to be very careful"

    And WVS Q71-76 (institutional trust)
    - 1 = "A great deal"
    - 2 = "Quite a lot"
    - 3 = "Not very much"
    - 4 = "None at all"

    Args:
        responses: Dict mapping response code to count
        trust_codes: Which codes indicate trust (default: just 1)

    Returns:
        Percent who selected trust codes, or None if no valid responses

    Examples:
        >>> scale_likert_4_to_percent({1: 400, 2: 600})  # Q57
        40.0
        >>> scale_likert_4_to_percent({1: 200, 2: 300, 3: 300, 4: 200}, trust_codes=(1, 2))
        50.0
    """
    trust_count = sum(responses.get(code, 0) for code in trust_codes)
    total = sum(responses.values())

    if total == 0:
        return None

    return (trust_count / total) * 100


def clamp_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """
    Clamp score to valid 0-100 range.

    Args:
        value: Score to clamp
        min_val: Minimum allowed value (default 0)
        max_val: Maximum allowed value (default 100)

    Returns:
        Clamped score
    """
    return max(min_val, min(max_val, value))


def validate_score(value: float, source: str = "unknown") -> float:
    """
    Validate that a score is within 0-100 range.

    Args:
        value: Score to validate
        source: Source name for error messages

    Returns:
        The validated score

    Raises:
        ValueError: If score is outside 0-100 range
    """
    if value < 0 or value > 100:
        raise ValueError(f"Score {value} from {source} is outside valid range [0, 100]")
    return value
