'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export type Pillar = 'social' | 'institutions' | 'media'

export interface GrapherState {
  countries: string[]
  pillar: Pillar
  from?: number
  to?: number
  title?: string
  subtitle?: string
}

export interface UseGrapherStateReturn {
  state: GrapherState
  setCountries: (countries: string[]) => void
  addCountry: (iso3: string) => void
  removeCountry: (iso3: string) => void
  setPillar: (pillar: Pillar) => void
  setTimeRange: (from?: number, to?: number) => void
  getShareUrl: () => string
}

/**
 * Hook for managing grapher URL state.
 * All state is stored in URL params for shareability.
 */
export function useGrapherState(): UseGrapherStateReturn {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse current state from URL
  const state = useMemo((): GrapherState => {
    const countriesParam = searchParams.get('countries')
    const pillarParam = searchParams.get('pillar')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const titleParam = searchParams.get('title')
    const subtitleParam = searchParams.get('subtitle')

    return {
      countries: countriesParam ? countriesParam.split(',').filter(Boolean) : [],
      pillar: (['social', 'institutions', 'media'].includes(pillarParam || '')
        ? pillarParam
        : 'social') as Pillar,
      from: fromParam ? Number(fromParam) : undefined,
      to: toParam ? Number(toParam) : undefined,
      title: titleParam || undefined,
      subtitle: subtitleParam || undefined,
    }
  }, [searchParams])

  // Helper to update URL with new params
  const updateUrl = useCallback(
    (updates: Partial<Record<string, string | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newUrl = `${pathname}?${params.toString()}`
      router.push(newUrl, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  const setCountries = useCallback(
    (countries: string[]) => {
      updateUrl({ countries: countries.length > 0 ? countries.join(',') : undefined })
    },
    [updateUrl]
  )

  const addCountry = useCallback(
    (iso3: string) => {
      if (!state.countries.includes(iso3)) {
        setCountries([...state.countries, iso3])
      }
    },
    [state.countries, setCountries]
  )

  const removeCountry = useCallback(
    (iso3: string) => {
      setCountries(state.countries.filter((c) => c !== iso3))
    },
    [state.countries, setCountries]
  )

  const setPillar = useCallback(
    (pillar: Pillar) => {
      updateUrl({ pillar })
    },
    [updateUrl]
  )

  const setTimeRange = useCallback(
    (from?: number, to?: number) => {
      updateUrl({
        from: from?.toString(),
        to: to?.toString(),
      })
    },
    [updateUrl]
  )

  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  return {
    state,
    setCountries,
    addCountry,
    removeCountry,
    setPillar,
    setTimeRange,
    getShareUrl,
  }
}

/**
 * Build a grapher URL with given params
 */
export function buildGrapherUrl(params: Partial<GrapherState>): string {
  const searchParams = new URLSearchParams()

  if (params.countries && params.countries.length > 0) {
    searchParams.set('countries', params.countries.join(','))
  }
  if (params.pillar) {
    searchParams.set('pillar', params.pillar)
  }
  if (params.from) {
    searchParams.set('from', params.from.toString())
  }
  if (params.to) {
    searchParams.set('to', params.to.toString())
  }
  if (params.title) {
    searchParams.set('title', params.title)
  }
  if (params.subtitle) {
    searchParams.set('subtitle', params.subtitle)
  }

  return `/grapher?${searchParams.toString()}`
}
