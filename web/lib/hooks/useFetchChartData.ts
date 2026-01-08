'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseFetchChartDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface UseFetchChartDataOptions<T> {
  /** Pre-fetched data from server - skips client fetch if provided */
  initialData?: T | null
  /** Custom error message (default: 'Failed to load data') */
  errorMessage?: string
}

/**
 * Generic hook for fetching chart data with loading and error states.
 * Eliminates repeated fetch/state boilerplate across chart components.
 *
 * @param fetcher - Async function that returns the data (should be stable or wrapped in useCallback)
 * @param options - Configuration options including initialData for SSR
 *
 * @example
 * // Client-side fetch (original behavior)
 * const { data, loading, error } = useFetchChartData(
 *   () => api.getUSATrends()
 * )
 *
 * @example
 * // With server-prefetched data (no loading state)
 * const { data, loading, error } = useFetchChartData(
 *   () => api.getUSATrends(),
 *   { initialData: prefetchedData }
 * )
 */
export function useFetchChartData<T>(
  fetcher: () => Promise<T>,
  options: UseFetchChartDataOptions<T> | string = {}
): UseFetchChartDataResult<T> {
  // Support legacy signature: useFetchChartData(fetcher, errorMessage)
  const opts = typeof options === 'string' ? { errorMessage: options } : options
  const { initialData, errorMessage = 'Failed to load data' } = opts

  // If initialData is provided and not null, start with it loaded
  const hasInitialData = initialData !== undefined && initialData !== null
  const [data, setData] = useState<T | null>(hasInitialData ? initialData : null)
  const [loading, setLoading] = useState(!hasInitialData)
  const [error, setError] = useState<string | null>(null)

  // Store fetcher in ref to avoid re-fetching when inline function changes
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Track if we've already initialized with data
  const initializedRef = useRef(hasInitialData)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
    } catch (err) {
      setError(errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [errorMessage])

  // Only fetch on mount if no initialData was provided
  useEffect(() => {
    if (!initializedRef.current) {
      fetchData()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetchData }
}

export default useFetchChartData
