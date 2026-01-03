"""
Trust Atlas ETL Common Utilities

Shared modules for all ETL jobs:
- base: Abstract base processor class
- countries: ISO country mapping and normalization
- scaling: Score normalization functions
- http: Resilient HTTP client for API calls
"""

from etl.common.scaling import (
    scale_0_10_to_percent,
    scale_wgi,
    scale_likert_4_to_percent,
)
from etl.common.countries import CountryMapper
from etl.common.http import ResilientHTTPClient
from etl.common.base import BaseProcessor

__all__ = [
    "scale_0_10_to_percent",
    "scale_wgi",
    "scale_likert_4_to_percent",
    "CountryMapper",
    "ResilientHTTPClient",
    "BaseProcessor",
]
