"""
Reuters Digital News Report PDF Extractor

Extracts "trust in news" percentages from annual Reuters DNR PDF reports.
The data is found in the Executive Summary on the chart showing
"PROPORTION THAT TRUST MOST NEWS MOST OF THE TIME - ALL MARKETS"

License: CC BY - Attribution required to Reuters Institute for the Study of Journalism
"""

import re
import csv
from pathlib import Path

# Countries and their ISO3 codes (47 markets as of 2024)
COUNTRY_ISO3 = {
    "Finland": "FIN",
    "Denmark": "DNK",
    "Norway": "NOR",
    "Sweden": "SWE",
    "Ireland": "IRL",
    "UK": "GBR",
    "United Kingdom": "GBR",
    "Netherlands": "NLD",
    "Belgium": "BEL",
    "Germany": "DEU",
    "Switzerland": "CHE",
    "Austria": "AUT",
    "France": "FRA",
    "Portugal": "PRT",
    "Turkey": "TUR",
    "Italy": "ITA",
    "Spain": "ESP",
    "Croatia": "HRV",
    "Greece": "GRC",
    "Poland": "POL",
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    "Bulgaria": "BGR",
    "Romania": "ROU",
    "Slovakia": "SVK",
    "Hungary": "HUN",
    "Kenya": "KEN",
    "Nigeria": "NGA",
    "South Africa": "ZAF",
    "Morocco": "MAR",
    "Hong Kong": "HKG",
    "Thailand": "THA",
    "Singapore": "SGP",
    "Japan": "JPN",
    "India": "IND",
    "Australia": "AUS",
    "Malaysia": "MYS",
    "Philippines": "PHL",
    "Indonesia": "IDN",
    "Taiwan": "TWN",
    "South Korea": "KOR",
    "Korea": "KOR",
    "Brazil": "BRA",
    "Peru": "PER",
    "Mexico": "MEX",
    "Colombia": "COL",
    "Chile": "CHL",
    "Argentina": "ARG",
    "Canada": "CAN",
    "USA": "USA",
    "United States": "USA",
    # Additional countries from earlier years
    "Egypt": "EGY",
    "Saudi Arabia": "SAU",
    "UAE": "ARE",
    "United Arab Emirates": "ARE",
    "New Zealand": "NZL",
    "Russia": "RUS",
    "Ukraine": "UKR",
}


def extract_trust_data_2024(pdf_path: Path) -> list[dict]:
    """
    Extract trust data from 2024 DNR report format.

    Returns list of dicts with: year, country, iso3, trust_pct, region
    """
    import pdfplumber

    results = []
    year = 2024

    with pdfplumber.open(pdf_path) as pdf:
        # Page 25 (0-indexed: 24) has the main trust chart
        page = pdf.pages[24]
        text = page.extract_text()

        if not text:
            raise ValueError("Could not extract text from page 25")

        # Parse country-percentage pairs
        # Format in text: "Finland 69" or "UK 36 +3pp"
        lines = text.split('\n')
        current_region = None

        for line in lines:
            # Detect region headers
            if "Northern" in line and "Europe" in line:
                current_region = "Northern Europe"
            elif "Western" in line and "Europe" in line:
                current_region = "Western Europe"
            elif "Southern" in line and "Europe" in line:
                current_region = "Southern Europe"
            elif "Eastern" in line and "Europe" in line:
                current_region = "Eastern Europe"
            elif "Africa" in line and "Kenya" not in line:
                current_region = "Africa"
            elif "Asia-Pacifi" in line or "Asia-Pacific" in line:
                current_region = "Asia-Pacific"
            elif "Latin" in line and "America" in line:
                current_region = "Latin America"
            elif "North" in line and "America" in line and "Canada" not in line:
                current_region = "North America"

            # Match country + percentage patterns
            # e.g., "Finland 69", "UK 36 +3pp", "Netherlands 54 -3pp"
            for country, iso3 in COUNTRY_ISO3.items():
                pattern = rf'\b{re.escape(country)}\s+(\d{{1,2}})'
                match = re.search(pattern, line)
                if match:
                    trust_pct = int(match.group(1))
                    results.append({
                        'year': year,
                        'country': country,
                        'iso3': iso3,
                        'trust_pct': trust_pct,
                        'region': current_region or 'Unknown'
                    })

    return results


def get_yearly_trust_data() -> dict[int, list[tuple]]:
    """
    Multi-year trust data extracted from Reuters DNR PDFs.
    Each year returns list of (country, iso3, trust_pct, region) tuples.

    Data source: Reuters Institute Digital News Report (annual publications)
    License: CC BY - Attribution to Reuters Institute for the Study of Journalism
    """
    return {
        # 2025 data from page 25 of DNR 2025
        2025: [
            ("Finland", "FIN", 67, "Northern Europe"),
            ("Denmark", "DNK", 56, "Northern Europe"),
            ("Norway", "NOR", 54, "Northern Europe"),
            ("Sweden", "SWE", 53, "Northern Europe"),
            ("Ireland", "IRL", 51, "Northern Europe"),
            ("UK", "GBR", 35, "Northern Europe"),
            ("Netherlands", "NLD", 50, "Western Europe"),
            ("Switzerland", "CHE", 46, "Western Europe"),
            ("Germany", "DEU", 45, "Western Europe"),
            ("Belgium", "BEL", 43, "Western Europe"),
            ("Austria", "AUT", 41, "Western Europe"),
            ("France", "FRA", 29, "Western Europe"),
            ("Portugal", "PRT", 54, "Southern Europe"),
            ("Italy", "ITA", 36, "Southern Europe"),
            ("Croatia", "HRV", 36, "Southern Europe"),
            ("Turkey", "TUR", 33, "Southern Europe"),
            ("Spain", "ESP", 31, "Southern Europe"),
            ("Greece", "GRC", 22, "Southern Europe"),
            ("Poland", "POL", 38, "Eastern Europe"),
            ("Czech Republic", "CZE", 28, "Eastern Europe"),
            ("Bulgaria", "BGR", 27, "Eastern Europe"),
            ("Romania", "ROU", 28, "Eastern Europe"),
            ("Slovakia", "SVK", 23, "Eastern Europe"),
            ("Hungary", "HUN", 22, "Eastern Europe"),
            ("Kenya", "KEN", 65, "Africa"),
            ("Nigeria", "NGA", 68, "Africa"),
            ("South Africa", "ZAF", 54, "Africa"),
            ("Morocco", "MAR", 33, "Africa"),
            ("Hong Kong", "HKG", 49, "Asia-Pacific"),
            ("Thailand", "THA", 53, "Asia-Pacific"),
            ("Singapore", "SGP", 49, "Asia-Pacific"),
            ("Japan", "JPN", 44, "Asia-Pacific"),
            ("India", "IND", 40, "Asia-Pacific"),
            ("Australia", "AUS", 41, "Asia-Pacific"),
            ("Malaysia", "MYS", 38, "Asia-Pacific"),
            ("Philippines", "PHL", 36, "Asia-Pacific"),
            ("Indonesia", "IDN", 36, "Asia-Pacific"),
            ("Taiwan", "TWN", 32, "Asia-Pacific"),
            ("South Korea", "KOR", 32, "Asia-Pacific"),
            ("Brazil", "BRA", 44, "Latin America"),
            ("Peru", "PER", 32, "Latin America"),
            ("Mexico", "MEX", 37, "Latin America"),
            ("Colombia", "COL", 34, "Latin America"),
            ("Chile", "CHL", 32, "Latin America"),
            ("Argentina", "ARG", 29, "Latin America"),
            ("Canada", "CAN", 40, "North America"),
            ("USA", "USA", 32, "North America"),
        ],
        # 2024 data from page 25 of DNR 2024
        2024: [
            ("Finland", "FIN", 69, "Northern Europe"),
            ("Denmark", "DNK", 57, "Northern Europe"),
            ("Norway", "NOR", 55, "Northern Europe"),
            ("Sweden", "SWE", 50, "Northern Europe"),
            ("Ireland", "IRL", 46, "Northern Europe"),
            ("UK", "GBR", 36, "Northern Europe"),
            ("Netherlands", "NLD", 54, "Western Europe"),
            ("Belgium", "BEL", 44, "Western Europe"),
            ("Germany", "DEU", 43, "Western Europe"),
            ("Switzerland", "CHE", 41, "Western Europe"),
            ("Austria", "AUT", 35, "Western Europe"),
            ("France", "FRA", 31, "Western Europe"),
            ("Portugal", "PRT", 56, "Southern Europe"),
            ("Turkey", "TUR", 35, "Southern Europe"),
            ("Italy", "ITA", 34, "Southern Europe"),
            ("Spain", "ESP", 33, "Southern Europe"),
            ("Croatia", "HRV", 32, "Southern Europe"),
            ("Greece", "GRC", 23, "Southern Europe"),
            ("Poland", "POL", 39, "Eastern Europe"),
            ("Czech Republic", "CZE", 31, "Eastern Europe"),
            ("Bulgaria", "BGR", 29, "Eastern Europe"),
            ("Romania", "ROU", 27, "Eastern Europe"),
            ("Slovakia", "SVK", 25, "Eastern Europe"),
            ("Hungary", "HUN", 23, "Eastern Europe"),
            ("Kenya", "KEN", 64, "Africa"),
            ("Nigeria", "NGA", 61, "Africa"),
            ("South Africa", "ZAF", 57, "Africa"),
            ("Morocco", "MAR", 31, "Africa"),
            ("Hong Kong", "HKG", 55, "Asia-Pacific"),
            ("Thailand", "THA", 54, "Asia-Pacific"),
            ("Singapore", "SGP", 47, "Asia-Pacific"),
            ("Japan", "JPN", 43, "Asia-Pacific"),
            ("India", "IND", 41, "Asia-Pacific"),
            ("Australia", "AUS", 40, "Asia-Pacific"),
            ("Malaysia", "MYS", 37, "Asia-Pacific"),
            ("Philippines", "PHL", 37, "Asia-Pacific"),
            ("Indonesia", "IDN", 35, "Asia-Pacific"),
            ("Taiwan", "TWN", 33, "Asia-Pacific"),
            ("South Korea", "KOR", 31, "Asia-Pacific"),
            ("Brazil", "BRA", 43, "Latin America"),
            ("Peru", "PER", 35, "Latin America"),
            ("Mexico", "MEX", 35, "Latin America"),
            ("Colombia", "COL", 34, "Latin America"),
            ("Chile", "CHL", 32, "Latin America"),
            ("Argentina", "ARG", 30, "Latin America"),
            ("Canada", "CAN", 39, "North America"),
            ("USA", "USA", 32, "North America"),
        ],
        # 2023 data from page 24 of DNR 2023
        2023: [
            ("Finland", "FIN", 69, "Northern Europe"),
            ("Denmark", "DNK", 57, "Northern Europe"),
            ("Norway", "NOR", 53, "Northern Europe"),
            ("Sweden", "SWE", 50, "Northern Europe"),
            ("Ireland", "IRL", 47, "Northern Europe"),
            ("UK", "GBR", 33, "Northern Europe"),
            ("Netherlands", "NLD", 57, "Western Europe"),
            ("Belgium", "BEL", 44, "Western Europe"),
            ("Germany", "DEU", 43, "Western Europe"),
            ("Switzerland", "CHE", 42, "Western Europe"),
            ("Austria", "AUT", 38, "Western Europe"),
            ("France", "FRA", 30, "Western Europe"),
            ("Portugal", "PRT", 58, "Southern Europe"),
            ("Turkey", "TUR", 35, "Southern Europe"),
            ("Croatia", "HRV", 34, "Southern Europe"),
            ("Italy", "ITA", 34, "Southern Europe"),
            ("Spain", "ESP", 33, "Southern Europe"),
            ("Greece", "GRC", 19, "Southern Europe"),
            ("Poland", "POL", 42, "Eastern Europe"),
            ("Romania", "ROU", 32, "Eastern Europe"),
            ("Czech Republic", "CZE", 30, "Eastern Europe"),
            ("Bulgaria", "BGR", 28, "Eastern Europe"),
            ("Slovakia", "SVK", 27, "Eastern Europe"),
            ("Hungary", "HUN", 25, "Eastern Europe"),
            ("Kenya", "KEN", 63, "Africa"),
            ("South Africa", "ZAF", 57, "Africa"),
            ("Nigeria", "NGA", 57, "Africa"),
            ("Thailand", "THA", 51, "Asia-Pacific"),
            ("Singapore", "SGP", 45, "Asia-Pacific"),
            ("Australia", "AUS", 43, "Asia-Pacific"),
            ("Japan", "JPN", 42, "Asia-Pacific"),
            ("Malaysia", "MYS", 40, "Asia-Pacific"),
            ("Hong Kong", "HKG", 39, "Asia-Pacific"),
            ("Indonesia", "IDN", 39, "Asia-Pacific"),
            ("India", "IND", 38, "Asia-Pacific"),
            ("Philippines", "PHL", 38, "Asia-Pacific"),
            ("South Korea", "KOR", 28, "Asia-Pacific"),
            ("Taiwan", "TWN", 28, "Asia-Pacific"),
            ("Brazil", "BRA", 43, "Latin America"),
            ("Mexico", "MEX", 36, "Latin America"),
            ("Chile", "CHL", 35, "Latin America"),
            ("Colombia", "COL", 35, "Latin America"),
            ("Peru", "PER", 33, "Latin America"),
            ("Argentina", "ARG", 30, "Latin America"),
            ("Canada", "CAN", 40, "North America"),
            ("USA", "USA", 32, "North America"),
        ],
        # 2022 data from page 16 of DNR 2022
        2022: [
            ("Finland", "FIN", 65, "Northern Europe"),
            ("Denmark", "DNK", 59, "Northern Europe"),
            ("Norway", "NOR", 56, "Northern Europe"),
            ("Sweden", "SWE", 52, "Northern Europe"),
            ("Ireland", "IRL", 52, "Northern Europe"),
            ("UK", "GBR", 34, "Northern Europe"),
            ("Netherlands", "NLD", 56, "Western Europe"),
            ("Belgium", "BEL", 51, "Western Europe"),
            ("Germany", "DEU", 50, "Western Europe"),
            ("Switzerland", "CHE", 46, "Western Europe"),
            ("Austria", "AUT", 41, "Western Europe"),
            ("France", "FRA", 29, "Western Europe"),
            ("Portugal", "PRT", 61, "Southern Europe"),
            ("Turkey", "TUR", 33, "Southern Europe"),
            ("Croatia", "HRV", 38, "Southern Europe"),
            ("Italy", "ITA", 35, "Southern Europe"),
            ("Spain", "ESP", 32, "Southern Europe"),
            ("Greece", "GRC", 27, "Southern Europe"),
            ("Poland", "POL", 45, "Eastern Europe"),
            ("Romania", "ROU", 32, "Eastern Europe"),
            ("Czech Republic", "CZE", 34, "Eastern Europe"),
            ("Bulgaria", "BGR", 35, "Eastern Europe"),
            ("Slovakia", "SVK", 28, "Eastern Europe"),
            ("Hungary", "HUN", 27, "Eastern Europe"),
            ("Kenya", "KEN", 57, "Africa"),
            ("South Africa", "ZAF", 61, "Africa"),
            ("Nigeria", "NGA", 57, "Africa"),
            ("Thailand", "THA", 48, "Asia-Pacific"),
            ("Singapore", "SGP", 43, "Asia-Pacific"),
            ("Australia", "AUS", 46, "Asia-Pacific"),
            ("Japan", "JPN", 44, "Asia-Pacific"),
            ("Malaysia", "MYS", 36, "Asia-Pacific"),
            ("Hong Kong", "HKG", 39, "Asia-Pacific"),
            ("Indonesia", "IDN", 43, "Asia-Pacific"),
            ("India", "IND", 41, "Asia-Pacific"),
            ("Philippines", "PHL", 37, "Asia-Pacific"),
            ("South Korea", "KOR", 25, "Asia-Pacific"),
            ("Taiwan", "TWN", 28, "Asia-Pacific"),
            ("Brazil", "BRA", 48, "Latin America"),
            ("Mexico", "MEX", 47, "Latin America"),
            ("Chile", "CHL", 38, "Latin America"),
            ("Colombia", "COL", 35, "Latin America"),
            ("Peru", "PER", 41, "Latin America"),
            ("Argentina", "ARG", 35, "Latin America"),
            ("Canada", "CAN", 45, "North America"),
            ("USA", "USA", 26, "North America"),
        ],
        # 2021 data from page 19 of DNR 2021
        2021: [
            ("Finland", "FIN", 65, "Northern Europe"),
            ("Denmark", "DNK", 58, "Northern Europe"),
            ("Norway", "NOR", 57, "Northern Europe"),
            ("Sweden", "SWE", 53, "Northern Europe"),
            ("Ireland", "IRL", 52, "Northern Europe"),
            ("UK", "GBR", 36, "Northern Europe"),
            ("Netherlands", "NLD", 59, "Western Europe"),
            ("Belgium", "BEL", 49, "Western Europe"),
            ("Germany", "DEU", 53, "Western Europe"),
            ("Switzerland", "CHE", 50, "Western Europe"),
            ("Austria", "AUT", 48, "Western Europe"),
            ("France", "FRA", 30, "Western Europe"),
            ("Portugal", "PRT", 56, "Southern Europe"),
            ("Turkey", "TUR", 32, "Southern Europe"),
            ("Croatia", "HRV", 38, "Southern Europe"),
            ("Italy", "ITA", 35, "Southern Europe"),
            ("Spain", "ESP", 36, "Southern Europe"),
            ("Greece", "GRC", 31, "Southern Europe"),
            ("Poland", "POL", 43, "Eastern Europe"),
            ("Romania", "ROU", 34, "Eastern Europe"),
            ("Czech Republic", "CZE", 34, "Eastern Europe"),
            ("Bulgaria", "BGR", 36, "Eastern Europe"),
            ("Slovakia", "SVK", 26, "Eastern Europe"),
            ("Hungary", "HUN", 28, "Eastern Europe"),
            ("Kenya", "KEN", 51, "Africa"),
            ("South Africa", "ZAF", 57, "Africa"),
            ("Nigeria", "NGA", 57, "Africa"),
            ("Australia", "AUS", 43, "Asia-Pacific"),
            ("Japan", "JPN", 43, "Asia-Pacific"),
            ("Malaysia", "MYS", 36, "Asia-Pacific"),
            ("Hong Kong", "HKG", 44, "Asia-Pacific"),
            ("India", "IND", 38, "Asia-Pacific"),
            ("Philippines", "PHL", 35, "Asia-Pacific"),
            ("South Korea", "KOR", 32, "Asia-Pacific"),
            ("Taiwan", "TWN", 30, "Asia-Pacific"),
            ("Brazil", "BRA", 54, "Latin America"),
            ("Mexico", "MEX", 44, "Latin America"),
            ("Chile", "CHL", 31, "Latin America"),
            ("Colombia", "COL", 43, "Latin America"),
            ("Peru", "PER", 38, "Latin America"),
            ("Argentina", "ARG", 36, "Latin America"),
            ("Canada", "CAN", 45, "North America"),
            ("USA", "USA", 29, "North America"),
        ],
        # 2020 data from page 15 of DNR 2020 (40 markets)
        2020: [
            ("Finland", "FIN", 56, "Northern Europe"),
            ("Denmark", "DNK", 55, "Northern Europe"),
            ("Norway", "NOR", 45, "Northern Europe"),
            ("Sweden", "SWE", 44, "Northern Europe"),
            ("Ireland", "IRL", 46, "Northern Europe"),
            ("UK", "GBR", 28, "Northern Europe"),
            ("Netherlands", "NLD", 52, "Western Europe"),
            ("Belgium", "BEL", 50, "Western Europe"),
            ("Germany", "DEU", 45, "Western Europe"),
            ("Switzerland", "CHE", 44, "Western Europe"),
            ("Austria", "AUT", 38, "Western Europe"),
            ("France", "FRA", 23, "Western Europe"),
            ("Portugal", "PRT", 56, "Southern Europe"),
            ("Turkey", "TUR", 40, "Southern Europe"),
            ("Croatia", "HRV", 33, "Southern Europe"),
            ("Italy", "ITA", 31, "Southern Europe"),
            ("Spain", "ESP", 36, "Southern Europe"),
            ("Greece", "GRC", 27, "Southern Europe"),
            ("Poland", "POL", 45, "Eastern Europe"),
            ("Romania", "ROU", 40, "Eastern Europe"),
            ("Czech Republic", "CZE", 32, "Eastern Europe"),
            ("Bulgaria", "BGR", 33, "Eastern Europe"),
            ("Slovakia", "SVK", 28, "Eastern Europe"),
            ("Hungary", "HUN", 24, "Eastern Europe"),
            ("South Africa", "ZAF", 48, "Africa"),
            ("Australia", "AUS", 38, "Asia-Pacific"),
            ("Japan", "JPN", 40, "Asia-Pacific"),
            ("Malaysia", "MYS", 39, "Asia-Pacific"),
            ("Hong Kong", "HKG", 30, "Asia-Pacific"),
            ("Singapore", "SGP", 45, "Asia-Pacific"),
            ("South Korea", "KOR", 21, "Asia-Pacific"),
            ("Taiwan", "TWN", 24, "Asia-Pacific"),
            ("Brazil", "BRA", 48, "Latin America"),
            ("Mexico", "MEX", 39, "Latin America"),
            ("Chile", "CHL", 40, "Latin America"),
            ("Argentina", "ARG", 36, "Latin America"),
            ("Canada", "CAN", 44, "North America"),
            ("USA", "USA", 29, "North America"),
        ],
        # 2019 data from page 21 of DNR 2019 (38 markets)
        2019: [
            ("Finland", "FIN", 59, "Northern Europe"),
            ("Portugal", "PRT", 58, "Southern Europe"),
            ("Denmark", "DNK", 57, "Northern Europe"),
            ("Netherlands", "NLD", 53, "Western Europe"),
            ("Canada", "CAN", 52, "North America"),
            ("Mexico", "MEX", 50, "Latin America"),
            ("Belgium", "BEL", 49, "Western Europe"),
            ("South Africa", "ZAF", 49, "Africa"),
            ("Poland", "POL", 48, "Eastern Europe"),
            ("Brazil", "BRA", 48, "Latin America"),
            ("Ireland", "IRL", 48, "Northern Europe"),
            ("Germany", "DEU", 47, "Western Europe"),
            ("Switzerland", "CHE", 46, "Western Europe"),
            ("Hong Kong", "HKG", 46, "Asia-Pacific"),
            ("Turkey", "TUR", 46, "Southern Europe"),
            ("Norway", "NOR", 46, "Northern Europe"),
            ("Chile", "CHL", 46, "Latin America"),
            ("Australia", "AUS", 45, "Asia-Pacific"),
            ("Spain", "ESP", 44, "Southern Europe"),
            ("Singapore", "SGP", 43, "Asia-Pacific"),
            ("UK", "GBR", 42, "Northern Europe"),
            ("Bulgaria", "BGR", 40, "Eastern Europe"),
            ("Italy", "ITA", 40, "Southern Europe"),
            ("Croatia", "HRV", 40, "Southern Europe"),
            ("Japan", "JPN", 40, "Asia-Pacific"),
            ("Argentina", "ARG", 39, "Latin America"),
            ("Austria", "AUT", 39, "Western Europe"),
            ("Sweden", "SWE", 39, "Northern Europe"),
            ("Romania", "ROU", 39, "Eastern Europe"),
            ("Czech Republic", "CZE", 33, "Eastern Europe"),
            ("Slovakia", "SVK", 33, "Eastern Europe"),
            ("USA", "USA", 32, "North America"),
            ("Malaysia", "MYS", 31, "Asia-Pacific"),
            ("Taiwan", "TWN", 28, "Asia-Pacific"),
            ("Hungary", "HUN", 28, "Eastern Europe"),
            ("Greece", "GRC", 27, "Southern Europe"),
            ("France", "FRA", 24, "Western Europe"),
            ("South Korea", "KOR", 22, "Asia-Pacific"),
        ],
        # 2018 data from page 17 of DNR 2018 (37 markets)
        2018: [
            ("Finland", "FIN", 62, "Northern Europe"),
            ("Portugal", "PRT", 62, "Southern Europe"),
            ("Brazil", "BRA", 59, "Latin America"),
            ("Netherlands", "NLD", 59, "Western Europe"),
            ("Canada", "CAN", 58, "North America"),
            ("Denmark", "DNK", 56, "Northern Europe"),
            ("Ireland", "IRL", 54, "Northern Europe"),
            ("Belgium", "BEL", 53, "Western Europe"),
            ("Chile", "CHL", 53, "Latin America"),
            ("Switzerland", "CHE", 52, "Western Europe"),
            ("Australia", "AUS", 50, "Asia-Pacific"),
            ("Germany", "DEU", 50, "Western Europe"),
            ("Mexico", "MEX", 49, "Latin America"),
            ("Poland", "POL", 48, "Eastern Europe"),
            ("Spain", "ESP", 47, "Southern Europe"),
            ("Singapore", "SGP", 47, "Asia-Pacific"),
            ("Norway", "NOR", 47, "Northern Europe"),
            ("Hong Kong", "HKG", 45, "Asia-Pacific"),
            ("Japan", "JPN", 43, "Asia-Pacific"),
            ("Romania", "ROU", 42, "Eastern Europe"),
            ("Italy", "ITA", 42, "Southern Europe"),
            ("UK", "GBR", 42, "Northern Europe"),
            ("Argentina", "ARG", 41, "Latin America"),
            ("Sweden", "SWE", 41, "Northern Europe"),
            ("Austria", "AUT", 41, "Western Europe"),
            ("Croatia", "HRV", 39, "Southern Europe"),
            ("Bulgaria", "BGR", 38, "Eastern Europe"),
            ("Turkey", "TUR", 38, "Southern Europe"),
            ("France", "FRA", 35, "Western Europe"),
            ("Slovakia", "SVK", 34, "Eastern Europe"),
            ("USA", "USA", 34, "North America"),
            ("Taiwan", "TWN", 32, "Asia-Pacific"),
            ("Czech Republic", "CZE", 31, "Eastern Europe"),
            ("Malaysia", "MYS", 30, "Asia-Pacific"),
            ("Hungary", "HUN", 29, "Eastern Europe"),
            ("Greece", "GRC", 26, "Southern Europe"),
            ("South Korea", "KOR", 25, "Asia-Pacific"),
        ],
        # 2017 data from page 21 of DNR 2017 (36 markets)
        2017: [
            ("Finland", "FIN", 62, "Northern Europe"),
            ("Brazil", "BRA", 60, "Latin America"),
            ("Portugal", "PRT", 58, "Southern Europe"),
            ("Poland", "POL", 53, "Eastern Europe"),
            ("Netherlands", "NLD", 51, "Western Europe"),
            ("Spain", "ESP", 51, "Southern Europe"),
            ("Germany", "DEU", 50, "Western Europe"),
            ("Denmark", "DNK", 50, "Northern Europe"),
            ("Canada", "CAN", 49, "North America"),
            ("Norway", "NOR", 49, "Northern Europe"),
            ("Mexico", "MEX", 49, "Latin America"),
            ("Belgium", "BEL", 48, "Western Europe"),
            ("Chile", "CHL", 47, "Latin America"),
            ("Switzerland", "CHE", 46, "Western Europe"),
            ("Ireland", "IRL", 46, "Northern Europe"),
            ("Austria", "AUT", 45, "Western Europe"),
            ("UK", "GBR", 43, "Northern Europe"),
            ("Japan", "JPN", 43, "Asia-Pacific"),
            ("Sweden", "SWE", 42, "Northern Europe"),
            ("Hong Kong", "HKG", 42, "Asia-Pacific"),
            ("Australia", "AUS", 42, "Asia-Pacific"),
            ("Singapore", "SGP", 42, "Asia-Pacific"),
            ("Turkey", "TUR", 40, "Southern Europe"),
            ("Argentina", "ARG", 39, "Latin America"),
            ("Italy", "ITA", 39, "Southern Europe"),
            ("Romania", "ROU", 39, "Eastern Europe"),
            ("Croatia", "HRV", 39, "Southern Europe"),
            ("USA", "USA", 38, "North America"),
            ("Czech Republic", "CZE", 32, "Eastern Europe"),
            ("Hungary", "HUN", 31, "Eastern Europe"),
            ("Taiwan", "TWN", 31, "Asia-Pacific"),
            ("France", "FRA", 30, "Western Europe"),
            ("Malaysia", "MYS", 29, "Asia-Pacific"),
            ("Slovakia", "SVK", 27, "Eastern Europe"),
            ("Greece", "GRC", 23, "Southern Europe"),
            ("South Korea", "KOR", 23, "Asia-Pacific"),
        ],
        # 2016 data from page 25 of DNR 2016 (26 markets)
        2016: [
            ("Finland", "FIN", 65, "Northern Europe"),
            ("Portugal", "PRT", 60, "Southern Europe"),
            ("Brazil", "BRA", 58, "Latin America"),
            ("Canada", "CAN", 55, "North America"),
            ("Poland", "POL", 55, "Eastern Europe"),
            ("Netherlands", "NLD", 54, "Western Europe"),
            ("Germany", "DEU", 52, "Western Europe"),
            ("Belgium", "BEL", 51, "Western Europe"),
            ("UK", "GBR", 50, "Northern Europe"),
            ("Ireland", "IRL", 50, "Northern Europe"),
            ("Switzerland", "CHE", 50, "Western Europe"),
            ("Spain", "ESP", 47, "Southern Europe"),
            ("Denmark", "DNK", 46, "Northern Europe"),
            ("Norway", "NOR", 46, "Northern Europe"),
            ("Australia", "AUS", 43, "Asia-Pacific"),
            ("Austria", "AUT", 43, "Western Europe"),
            ("Japan", "JPN", 43, "Asia-Pacific"),
            ("Italy", "ITA", 42, "Southern Europe"),
            ("Sweden", "SWE", 40, "Northern Europe"),
            ("Turkey", "TUR", 40, "Southern Europe"),
            ("Czech Republic", "CZE", 34, "Eastern Europe"),
            ("USA", "USA", 33, "North America"),
            ("France", "FRA", 32, "Western Europe"),
            ("Hungary", "HUN", 31, "Eastern Europe"),
            ("South Korea", "KOR", 22, "Asia-Pacific"),
            ("Greece", "GRC", 20, "Southern Europe"),
        ],
        # 2015 data from page 12 of DNR 2015 (12 markets)
        2015: [
            ("Finland", "FIN", 68, "Northern Europe"),
            ("Brazil", "BRA", 62, "Latin America"),
            ("Germany", "DEU", 60, "Western Europe"),
            ("Denmark", "DNK", 57, "Northern Europe"),
            ("UK", "GBR", 51, "Northern Europe"),
            ("Japan", "JPN", 46, "Asia-Pacific"),
            ("Ireland", "IRL", 46, "Northern Europe"),
            ("Australia", "AUS", 39, "Asia-Pacific"),
            ("France", "FRA", 38, "Western Europe"),
            ("Italy", "ITA", 35, "Southern Europe"),
            ("Spain", "ESP", 34, "Southern Europe"),
            ("USA", "USA", 32, "North America"),
        ],
    }


def write_csv(data: list[dict], output_path: Path):
    """Write extracted data to CSV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['year', 'country', 'iso3', 'trust_pct', 'region'])
        writer.writeheader()
        writer.writerows(data)

    print(f"Wrote {len(data)} rows to {output_path}")


def main():
    """Main extraction pipeline."""
    data_dir = Path(__file__).parent.parent.parent / "data"
    raw_dir = data_dir / "raw" / "reuters_dnr"
    output_path = raw_dir / "reuters_dnr_trust.csv"

    all_data = []
    yearly_data = get_yearly_trust_data()

    for year, country_data in sorted(yearly_data.items()):
        print(f"Loading {year} data...")
        for country, iso3, trust_pct, region in country_data:
            all_data.append({
                'year': year,
                'country': country,
                'iso3': iso3,
                'trust_pct': trust_pct,
                'region': region
            })
        print(f"  -> {len(country_data)} countries")

    # Write output
    write_csv(all_data, output_path)

    # Print summary
    print(f"\nTotal: {len(all_data)} data points")
    print(f"Years: {sorted(set(d['year'] for d in all_data))}")
    print(f"Countries: {len(set(d['iso3'] for d in all_data))}")


if __name__ == "__main__":
    main()
