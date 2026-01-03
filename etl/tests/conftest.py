"""Shared pytest fixtures for ETL tests."""

import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture
def sample_wgi_data():
    """Sample WGI API response data."""
    return [
        {"countryiso3code": "SWE", "value": 1.95},
        {"countryiso3code": "USA", "value": 1.15},
        {"countryiso3code": "BRA", "value": -0.35},
        {"countryiso3code": "NGA", "value": -1.05},
    ]


@pytest.fixture
def sample_cpi_data():
    """Sample CPI DataFrame data."""
    return {
        "Jurisdiction": ["Sweden", "United States", "Brazil", "Nigeria"],
        "2023": [83, 69, 36, 25],
        "2022": [83, 69, 38, 24],
    }
