# API Reference

This document describes the Trust Atlas REST API, including all endpoints, request/response formats, caching behavior, and error handling.

## Base URL

```
Development: http://localhost:3001
Production:  https://api.trustatlas.org
```

## Common Headers

All successful responses include:

| Header | Value | Description |
|--------|-------|-------------|
| `X-Methodology-Version` | `0.5.0` | Data methodology version |
| `Cache-Control` | `s-maxage=86400, stale-while-revalidate=604800` | CDN caching directives |
| `Content-Type` | `application/json` | Response format |

## Authentication

The API is publicly accessible and requires no authentication. All data is open access.

## Error Handling

### Error Response Format

```json
{
  "error": "Error description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad request (validation error) |
| `404` | Resource not found |
| `500` | Internal server error |

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "year",
      "message": "Must be a valid year"
    }
  ]
}
```

---

## Endpoints

### Health Check

Check API availability.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.5.0"
}
```

---

### List Countries

Get all countries with their latest pillar scores.

```
GET /countries
```

**Response:**
```json
[
  {
    "iso3": "DNK",
    "name": "Denmark",
    "region": "Europe",
    "latest_year": 2024,
    "interpersonal": 74.2,
    "institutional": 62.5,
    "governance": 90.0,
    "confidence_tier": "A"
  },
  {
    "iso3": "USA",
    "name": "United States",
    "region": "North America",
    "latest_year": 2024,
    "interpersonal": 38.0,
    "institutional": 20.5,
    "governance": 69.0,
    "confidence_tier": "A"
  }
]
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `iso3` | string | ISO 3166-1 alpha-3 country code |
| `name` | string | Country name |
| `region` | string | Geographic region |
| `latest_year` | number\|null | Most recent year with data |
| `interpersonal` | number\|null | Interpersonal trust pillar (0-100) |
| `institutional` | number\|null | Institutional trust pillar (0-100) |
| `governance` | number\|null | Governance quality pillar (0-100) |
| `confidence_tier` | string | Data confidence: "A", "B", or "C" |

**Notes:**
- Results are sorted alphabetically by name
- Countries without data have pillar scores as null
- Each pillar is independent; no composite score is computed

---

### Get Scores by Year

Get pillar scores for all countries in a specific year.

```
GET /score
GET /score?year=2024
GET /score?year=2024&pillar=interpersonal
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | integer | No | Latest available | Target year |
| `pillar` | string | No | All pillars | Which pillar to return |

**Pillar Values:**

| Value | Returns |
|-------|---------|
| `interpersonal` | Interpersonal trust pillar |
| `institutional` | Institutional trust pillar |
| `governance` | Governance quality pillar |

**Response:**
```json
[
  {
    "iso3": "DNK",
    "year": 2024,
    "interpersonal": 74.2,
    "institutional": 62.5,
    "governance": 90.0,
    "confidence_tier": "A"
  },
  {
    "iso3": "USA",
    "year": 2024,
    "interpersonal": 38.0,
    "institutional": 20.5,
    "governance": 69.0,
    "confidence_tier": "A"
  }
]
```

**Notes:**
- Only countries with data for the specified year are returned
- When `pillar` is specified, only that pillar's score is included
- Each pillar is independent; no composite score is computed

---

### Get Country Details

Get detailed time series and pillar breakdown for a specific country.

```
GET /country/{iso3}
GET /country/{iso3}?from=2015&to=2024
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `iso3` | string | ISO 3166-1 alpha-3 country code |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | integer | No | Start year (inclusive) |
| `to` | integer | No | End year (inclusive) |

**Response:**
```json
{
  "iso3": "USA",
  "name": "United States",
  "region": "North America",
  "series": [
    {
      "year": 2024,
      "interpersonal": 38.0,
      "institutional": 20.5,
      "governance": 69.0,
      "confidence_tier": "A",
      "confidence_score": 1.0
    },
    {
      "year": 2023,
      "interpersonal": 36.5,
      "institutional": 19.8,
      "governance": 69.0,
      "confidence_tier": "A",
      "confidence_score": 1.0
    }
  ],
  "sources_used": {
    "interpersonal": ["WVS", "GSS", "ANES"],
    "institutional": ["WVS", "ANES"],
    "governance": ["CPI", "WGI", "WJP", "FH", "V-Dem"]
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `iso3` | string | Country code |
| `name` | string | Country name |
| `region` | string | Geographic region |
| `series` | array | Time series data points |
| `sources_used` | object | Data sources by pillar (aggregated across all years) |

**Series Object Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Data year |
| `interpersonal` | number\|null | Interpersonal trust pillar (0-100) |
| `institutional` | number\|null | Institutional trust pillar (0-100) |
| `governance` | number\|null | Governance quality pillar (0-100) |
| `confidence_tier` | string | "A", "B", or "C" |
| `confidence_score` | number | Numeric confidence (0-1) |

**Notes:**
- Each pillar is independent; no composite score is computed
- Pillars may be null if no data available for that year

**Error Response (404):**
```json
{
  "error": "Country not found"
}
```

---

### Get Methodology

Get the current methodology specification.

```
GET /methodology
```

**Response:**
```json
{
  "version": "0.5.0",
  "pillars": {
    "interpersonal": {
      "description": "Trust in other people",
      "sources": ["WVS", "EVS", "GSS", "ANES", "CES"],
      "notes": "WVS takes precedence; EVS supplements gaps"
    },
    "institutional": {
      "description": "Trust in national government/institutions",
      "sources": ["WVS", "ANES", "CES"],
      "notes": "EVS excluded due to inconsistent variable coverage"
    },
    "governance": {
      "description": "Institutional quality proxy",
      "sources": ["CPI", "WGI", "WJP", "WJP-Corruption", "FH", "V-Dem"],
      "weights": {
        "CPI": 0.20,
        "WGI": 0.20,
        "WJP": 0.20,
        "WJP-Corruption": 0.20,
        "FH": 0.10,
        "V-Dem": 0.10
      }
    }
  },
  "scaling": {
    "WGI": "((x + 2.5) / 5) * 100"
  },
  "confidence": {
    "survey_grace_period_years": 3,
    "decay_rate_per_year": 0.03,
    "max_survey_age_years": 7
  },
  "notes": "Each pillar is independent. No composite score is computed."
}
```

**Notes:**
- Loaded from `data/reference/methodology.yaml`
- Changes to methodology are versioned
- Pillars are displayed independently; no composite index

---

### USA Trust Timeline

Get historical trust data for the United States across multiple dimensions.

```
GET /trends/usa
```

**Response:**
```json
{
  "series": {
    "interpersonal": [
      {"year": 1960, "score": 55.0, "source": "ANES"},
      {"year": 1964, "score": 54.0, "source": "ANES"},
      {"year": 2022, "score": 38.0, "source": "WVS"}
    ],
    "institutional": [
      {"year": 1958, "score": 73.0, "source": "ANES"},
      {"year": 2024, "score": 20.5, "source": "ANES"}
    ],
    "partisan": [
      {"year": 1978, "score": 53.0, "source": "ANES"},
      {"year": 2024, "score": 19.0, "source": "ANES"}
    ]
  }
}
```

**Notes:**
- Used for USA-specific visualizations on the homepage
- Includes `partisan` trust dimension (unique to USA data)
- Sources: WVS, GSS, ANES (WVS-family only)

---

### Global Trust Map

Get latest pillar scores for all countries (optimized for world map visualization).

```
GET /trends/global
GET /trends/global?pillar=interpersonal
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pillar` | string | No | Filter to specific pillar |

**Response:**
```json
{
  "countries": [
    {
      "iso3": "DNK",
      "name": "Denmark",
      "region": "Europe",
      "year": 2024,
      "interpersonal": 74.2,
      "institutional": 62.5,
      "governance": 90.0,
      "confidence_tier": "A"
    },
    {
      "iso3": "USA",
      "name": "United States",
      "region": "North America",
      "year": 2024,
      "interpersonal": 38.0,
      "institutional": 20.5,
      "governance": 69.0,
      "confidence_tier": "A"
    }
  ]
}
```

**Notes:**
- Returns only countries with pillar data
- When `pillar` specified, returns only that score
- Each pillar is independent; no composite score

---

### Regional Statistics

Get aggregate trust statistics by geographic region.

```
GET /trends/regions
GET /trends/regions?pillar=interpersonal
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pillar` | string | Yes | Which pillar to aggregate |

**Response:**
```json
{
  "regions": [
    {
      "region": "Europe",
      "countryCount": 42,
      "avgScore": 42.5,
      "minScore": 18.3,
      "maxScore": 74.2
    },
    {
      "region": "North America",
      "countryCount": 3,
      "avgScore": 35.8,
      "minScore": 32.1,
      "maxScore": 42.0
    }
  ]
}
```

**Notes:**
- Sorted by average score descending
- Uses latest available data for each country
- Each pillar aggregated separately

---

### Country Trust Timeline

Get all trust observations for a specific country.

```
GET /trends/country/{iso3}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `iso3` | string | ISO 3166-1 alpha-3 country code |

**Response:**
```json
{
  "iso3": "DEU",
  "name": "Germany",
  "region": "Europe",
  "series": {
    "interpersonal": [
      {"year": 2018, "score": 45.0, "source": "WVS"},
      {"year": 2022, "score": 47.0, "source": "EVS"}
    ],
    "institutional": [
      {"year": 2018, "score": 52.0, "source": "WVS"},
      {"year": 2022, "score": 55.0, "source": "WVS"}
    ]
  }
}
```

**Notes:**
- Groups observations by pillar
- Includes source attribution for each data point
- Returns `interpersonal`, `institutional`, and for USA, `partisan`
- Only WVS-family sources included (WVS, EVS, GSS, ANES, CES)

**Error Response (404):**
```json
{
  "error": "Country not found"
}
```

---

### Multi-Country Trends

Batch fetch trend data for multiple countries. Used for data story charts.

```
GET /trends/countries?iso3=MDA,EST,UZB
GET /trends/countries?iso3=VNM,CHN,USA&pillar=social
GET /trends/countries?iso3=MDA,EST&pillar=institutions&source=WJP
GET /trends/countries?iso3=VNM,CHN,USA&pillar=financial
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `iso3` | string | Yes | Comma-separated ISO3 country codes (max 20) |
| `pillar` | string | No | Filter to specific pillar or supplementary indicator |
| `source` | string | No | Filter to specific source (e.g., WJP, WVS) |

**Pillar Values:**

| Value | Returns |
|-------|---------|
| `social` | Interpersonal trust (WVS-family binary methodology) |
| `institutions` | Institutional trust + governance quality |
| `media` | Media trust (Reuters DNR) |

**Supplementary Indicators:**

| Value | Returns |
|-------|---------|
| `financial` | Financial (bank) trust from WVS |

**Legacy Pillar Mappings:**
- `interpersonal` → `social`
- `institutional` → `institutions`
- `governance` → `institutions`

**Response:**
```json
{
  "countries": {
    "VNM": {
      "name": "Vietnam",
      "region": "Asia",
      "financial": [
        {"year": 2020, "score": 94.2, "source": "WVS"}
      ]
    },
    "CHN": {
      "name": "China",
      "region": "Asia",
      "financial": [
        {"year": 2018, "score": 91.0, "source": "WVS"}
      ]
    },
    "USA": {
      "name": "United States",
      "region": "North America",
      "financial": [
        {"year": 2017, "score": 10.3, "source": "WVS"}
      ]
    }
  }
}
```

**Response Structure by Pillar:**

When `pillar=social`:
```json
{
  "countries": {
    "DEU": {
      "name": "Germany",
      "region": "Europe",
      "social": [{"year": 2022, "score": 47.0, "source": "WVS"}]
    }
  }
}
```

When `pillar=institutions`:
```json
{
  "countries": {
    "DEU": {
      "name": "Germany",
      "region": "Europe",
      "institutions": {
        "institutional": [{"year": 2022, "score": 55.0, "source": "WVS"}],
        "governance": [{"year": 2023, "score": 80.6, "source": "WJP"}]
      }
    }
  }
}
```

**Notes:**
- Maximum 20 countries per request
- Returns empty object for countries with no matching data
- Supplementary indicators (e.g., `financial`) are tracked separately from pillars
- Each pillar is independent; no composite score is computed

---

### GET /indicators/digital

Retrieve digital penetration indicators (contextual data, not trust measures).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `iso3` | string | Yes | Comma-separated ISO3 codes (max 20) |
| `year` | number | No | Filter to specific year |
| `indicator` | string | No | Indicator name (default: `social_media_penetration`) |

**Example Requests:**

```
GET /indicators/digital?iso3=FIN,USA,KOR&year=2024
GET /indicators/digital?iso3=FIN,NOR,SWE,DNK
```

**Response:**

```json
{
  "indicator": "social_media_penetration",
  "source": "DataReportal",
  "countries": {
    "FIN": {
      "name": "Finland",
      "data": [{"year": 2024, "value": 79.33}]
    },
    "USA": {
      "name": "United States",
      "data": [{"year": 2024, "value": 68.47}]
    },
    "KOR": {
      "name": "South Korea",
      "data": [{"year": 2024, "value": 94.12}]
    }
  }
}
```

**Notes:**
- This is **contextual data** for correlation analysis, not a trust measure
- Values are percentages (0-100) of population with social media accounts
- Data based on platform-reported advertising reach, not surveys
- See [DATA_SOURCES.md](./DATA_SOURCES.md#datareportal-digital-penetration) for limitations

---

## Caching

The API uses HTTP caching headers for CDN and browser caching:

```
Cache-Control: s-maxage=86400, stale-while-revalidate=604800
```

| Directive | Value | Meaning |
|-----------|-------|---------|
| `s-maxage` | 86400 | CDN cache for 24 hours |
| `stale-while-revalidate` | 604800 | Serve stale for up to 7 days while revalidating |

**Cache Invalidation:**
- Data updates are typically monthly or quarterly
- Cache naturally expires after 24 hours
- Force refresh by clearing CDN cache

---

## Rate Limiting

Currently no rate limiting is enforced. This may change in production.

---

## CORS

The API allows cross-origin requests from all origins in development:

```
Access-Control-Allow-Origin: *
```

Production may restrict to specific domains.

---

## Code Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3001';

// Get all countries
const countries = await fetch(`${API_BASE}/countries`).then(r => r.json());

// Get USA details
const usa = await fetch(`${API_BASE}/country/USA?from=2015&to=2024`).then(r => r.json());

// Get 2024 institutional trust scores
const scores = await fetch(`${API_BASE}/score?year=2024&trust_type=institutional`).then(r => r.json());

// Get global map data
const global = await fetch(`${API_BASE}/trends/global`).then(r => r.json());
```

### Python

```python
import requests

API_BASE = 'http://localhost:3001'

# Get all countries
countries = requests.get(f'{API_BASE}/countries').json()

# Get country details with time range
usa = requests.get(f'{API_BASE}/country/USA', params={
    'from': 2015,
    'to': 2024
}).json()

# Get regional statistics
regions = requests.get(f'{API_BASE}/trends/regions').json()
```

### cURL

```bash
# Health check
curl http://localhost:3001/health

# Get countries
curl http://localhost:3001/countries

# Get country details
curl "http://localhost:3001/country/USA?from=2015&to=2024"

# Get scores for specific year and type
curl "http://localhost:3001/score?year=2024&trust_type=governance"
```

---

## Web Client

The Next.js frontend uses a typed API client in `web/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Available methods
const countries = await api.getCountries();
const scores = await api.getScores(2024, 'interpersonal');
const country = await api.getCountryDetail('USA', 2015, 2024);
const methodology = await api.getMethodology();
const usaTrends = await api.getUSATrends();
const globalData = await api.getGlobalTrust();
const regions = await api.getRegionStats();
const countryTrends = await api.getCountryTrends('DEU');

// Multi-country trends (for data story charts)
const socialTrends = await api.getMultiCountryTrends(
  ['MDA', 'EST', 'UZB'],
  { pillar: 'social' }
);

// With source filter
const wjpTrends = await api.getMultiCountryTrends(
  ['MDA', 'EST'],
  { pillar: 'institutions', source: 'WJP' }
);

// Supplementary indicators (financial trust)
const financialTrends = await api.getMultiCountryTrends(
  ['VNM', 'CHN', 'USA'],
  { pillar: 'financial' }
);
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview
- [DATA_MODEL.md](./DATA_MODEL.md) - Database schema
- [METHODOLOGY.md](./METHODOLOGY.md) - Trust pillar methodology
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Running the API locally
