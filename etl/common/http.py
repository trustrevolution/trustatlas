"""
Resilient HTTP client for Trust Atlas ETL API calls.

Provides retry logic, rate limiting, and error handling for
external data source APIs (World Bank, OECD, etc.).
"""

import time
import logging
from typing import Optional, Dict, Any, Union
from pathlib import Path

import requests
import pandas as pd

logger = logging.getLogger(__name__)


class ResilientHTTPClient:
    """HTTP client with retry logic and rate limiting."""

    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
        timeout: int = 30,
        rate_limit_delay: float = 0.5,
    ):
        """
        Initialize the HTTP client.

        Args:
            max_retries: Maximum number of retry attempts
            backoff_factor: Multiplier for exponential backoff
            timeout: Request timeout in seconds
            rate_limit_delay: Delay between requests in seconds
        """
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        self.rate_limit_delay = rate_limit_delay
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "TrustAtlas-ETL/0.1.0 (trustatlas.org)"}
        )
        self._last_request_time = 0.0

    def _wait_for_rate_limit(self) -> None:
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    def _make_request(
        self, method: str, url: str, params: Optional[Dict[str, Any]] = None, **kwargs
    ) -> requests.Response:
        """
        Make an HTTP request with retries.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            params: Query parameters
            **kwargs: Additional arguments for requests

        Returns:
            Response object

        Raises:
            requests.RequestException: If all retries fail
        """
        self._wait_for_rate_limit()

        last_exception: requests.RequestException | None = None

        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.request(
                    method, url, params=params, timeout=self.timeout, **kwargs
                )
                response.raise_for_status()
                return response

            except requests.RequestException as e:
                last_exception = e

                if attempt < self.max_retries:
                    wait_time = self.backoff_factor * (2**attempt)
                    logger.warning(
                        f"Request failed (attempt {attempt + 1}/{self.max_retries + 1}): {e}. "
                        f"Retrying in {wait_time:.1f}s..."
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(
                        f"Request failed after {self.max_retries + 1} attempts: {e}"
                    )

        if last_exception is not None:
            raise last_exception
        raise requests.RequestException("All retries exhausted")

    def get_json(
        self, url: str, params: Optional[Dict[str, Any]] = None
    ) -> Union[Dict, list]:
        """
        Fetch JSON from URL.

        Args:
            url: Request URL
            params: Query parameters

        Returns:
            Parsed JSON response
        """
        response = self._make_request("GET", url, params=params)
        result: dict[Any, Any] | list[Any] = response.json()
        return result

    def get_csv(
        self, url: str, params: Optional[Dict[str, Any]] = None, **read_csv_kwargs
    ) -> pd.DataFrame:
        """
        Fetch CSV from URL and return as DataFrame.

        Args:
            url: Request URL
            params: Query parameters
            **read_csv_kwargs: Additional arguments for pd.read_csv

        Returns:
            DataFrame with CSV contents
        """
        response = self._make_request("GET", url, params=params)

        from io import StringIO

        return pd.read_csv(StringIO(response.text), **read_csv_kwargs)

    def download_file(
        self, url: str, output_path: Path, params: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Download file to disk.

        Args:
            url: Request URL
            output_path: Path to save file
            params: Query parameters

        Returns:
            Path to downloaded file
        """
        output_path.parent.mkdir(parents=True, exist_ok=True)

        response = self._make_request("GET", url, params=params, stream=True)

        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        logger.info(f"Downloaded {url} to {output_path}")
        return output_path

    def get_with_pagination(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        page_param: str = "page",
        per_page_param: str = "per_page",
        per_page: int = 100,
        max_pages: int = 50,
        data_key: Optional[str] = None,
    ) -> list:
        """
        Fetch paginated API results.

        Args:
            url: Base URL
            params: Base query parameters
            page_param: Name of page parameter
            per_page_param: Name of per_page parameter
            per_page: Results per page
            max_pages: Maximum pages to fetch
            data_key: Key in response containing data (None for root)

        Returns:
            List of all results across pages
        """
        params = params or {}
        params[per_page_param] = per_page

        all_results = []

        for page in range(1, max_pages + 1):
            params[page_param] = page
            response = self.get_json(url, params)

            if data_key and isinstance(response, dict):
                page_data = response.get(data_key, [])
            else:
                page_data = response if isinstance(response, list) else []

            if not page_data:
                break

            all_results.extend(page_data)
            logger.debug(f"Fetched page {page}, got {len(page_data)} items")

            if len(page_data) < per_page:
                break

        return all_results
