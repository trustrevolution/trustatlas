'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseFetchChartDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook for fetching chart data with loading and error states.
 * Eliminates repeated fetch/state boilerplate across chart components.
 *
 * @param fetcher - Async function that returns the data (should be stable or wrapped in useCallback)
 * @param errorMessage - Custom error message (default: 'Failed to load data')
 *
 * @example
 * const { data, loading, error } = useFetchChartData(
 *   () => api.getUSATrends(),
 *   'Failed to load USA trends'
 * )
 */
export function useFetchChartData<T>(
  fetcher: () => Promise<T>,
  errorMessage = 'Failed to load data'
): UseFetchChartDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Store fetcher in ref to avoid re-fetching when inline function changes
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

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

  // Only fetch on mount
  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetchData }
}

export default useFetchChartData
