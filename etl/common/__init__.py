"""
Trust Atlas ETL Common Utilities

Shared modules for all ETL jobs:
- base: Abstract base processor class
- countries: ISO country mapping and normalization
- scaling: Score normalization functions
- http: Resilient HTTP client for API calls
"""

from common.scaling import (
    scale_0_10_to_percent,
    scale_wgi,
    scale_likert_4_to_percent,
)
from common.countries import CountryMapper
from common.http import ResilientHTTPClient
from common.base import BaseProcessor

__all__ = [
    "scale_0_10_to_percent",
    "scale_wgi",
    "scale_likert_4_to_percent",
    "CountryMapper",
    "ResilientHTTPClient",
    "BaseProcessor",
]
