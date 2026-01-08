export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trustatlas-api.vercel.app'

export interface Country {
  iso3: string
  name: string
  region: string | null
}

export interface Score {
  iso3: string
  year: number
  score: number | null
  confidence_tier: 'A' | 'B' | 'C' | null
}

export interface CountryDetail {
  iso3: string
  name: string
  region: string | null
  series: Array<{
    year: number
    interpersonal: number | null
    institutional: number | null
    governance: number | null
    media: number | null
    confidence_tier: 'A' | 'B' | 'C' | null
  }>
  sources_used?: Record<string, string[]>
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`)
  
  if (!response.ok) {
    throw new ApiError(response.status, `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

// Trend types
export interface TrendPoint {
  year: number
  score: number
  source: string
}

export interface USATrends {
  series: {
    interpersonal: TrendPoint[]
    institutional: TrendPoint[]
    partisan: TrendPoint[]
  }
}

export interface GlobalTrustCountry {
  iso3: string
  name: string
  region: string
  year: number
  score: number
  source: string
}

export interface RegionStats {
  region: string
  countryCount: number
  avgScore: number
  minScore: number
  maxScore: number
}

export interface CountryTrends {
  iso3: string
  name: string
  region: string
  series: Record<string, TrendPoint[]>
}

// Stats response type
export interface Stats {
  countries: number
  observations: number
  sources: number
}

export const api = {
  // Homepage stats
  async getStats(): Promise<Stats> {
    return fetchApi<Stats>('/stats')
  },

  async getCountries(): Promise<Country[]> {
    return fetchApi<Country[]>('/countries')
  },
  
  async getScores(year?: number, trustType: string = 'governance'): Promise<Score[]> {
    const params = new URLSearchParams()
    if (year) params.set('year', year.toString())
    params.set('trust_type', trustType)
    
    return fetchApi<Score[]>(`/score?${params}`)
  },
  
  async getCountryDetail(iso3: string, from?: number, to?: number): Promise<CountryDetail> {
    const params = new URLSearchParams()
    if (from) params.set('from', from.toString())
    if (to) params.set('to', to.toString())
    
    const query = params.toString() ? `?${params}` : ''
    return fetchApi<CountryDetail>(`/country/${iso3}${query}`)
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMethodology(): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fetchApi<any>('/methodology')
  },

  // Trend endpoints
  async getUSATrends(): Promise<USATrends> {
    return fetchApi<USATrends>('/trends/usa')
  },

  async getGlobalTrust(): Promise<{ countries: GlobalTrustCountry[] }> {
    return fetchApi<{ countries: GlobalTrustCountry[] }>('/trends/global')
  },

  async getRegionStats(pillar?: 'social' | 'institutions' | 'media'): Promise<{ regions: RegionStats[] }> {
    const params = pillar ? `?pillar=${pillar}` : ''
    return fetchApi<{ regions: RegionStats[] }>(`/trends/regions${params}`)
  },

  async getCountryTrends(iso3: string): Promise<CountryTrends> {
    return fetchApi<CountryTrends>(`/trends/country/${iso3}`)
  },

  // Generic multi-country trends - works for any data story
  // pillar: core pillars (social, institutions, media) or supplementary indicators (financial)
  async getMultiCountryTrends(
    iso3Codes: string[],
    options?: { pillar?: 'social' | 'institutions' | 'media' | 'financial'; source?: string }
  ): Promise<MultiCountryData> {
    const params = new URLSearchParams()
    params.set('iso3', iso3Codes.join(','))
    if (options?.pillar) params.set('pillar', options.pillar)
    if (options?.source) params.set('source', options.source)
    return fetchApi<MultiCountryData>(`/trends/countries?${params}`)
  }
}

// Generic multi-country response type
// Matches 3-pillar structure from API + supplementary indicators
export interface MultiCountryData {
  countries: Record<string, {
    name: string
    region: string
    social?: TrendPoint[]
    institutions?: {
      institutional?: TrendPoint[]
      governance?: TrendPoint[]
    }
    media?: TrendPoint[]
    // Supplementary indicators
    financial?: TrendPoint[]
  }>
}

export { ApiError }