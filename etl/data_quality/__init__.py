"""
Data Quality module for detecting outliers and anomalies in trust index data.

Usage:
    python -m etl.data_quality.sweep --help
"""

from .checks import (
    detect_statistical_outliers,
    detect_yoy_anomalies,
    detect_cross_source_inconsistencies,
    detect_methodology_mismatches,
    detect_sample_size_issues,
    detect_coverage_gaps,
)

__all__ = [
    "detect_statistical_outliers",
    "detect_yoy_anomalies",
    "detect_cross_source_inconsistencies",
    "detect_methodology_mismatches",
    "detect_sample_size_issues",
    "detect_coverage_gaps",
]
