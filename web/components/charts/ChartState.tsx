'use client'

import { cn } from '@/lib/utils'

interface ChartStateProps {
  className?: string
  /** Height class or style (default: h-96) */
  height?: string
}

/**
 * Loading state for charts - consistent styling across all chart components.
 */
export function ChartLoading({ className, height = 'h-96' }: ChartStateProps) {
  return (
    <div className={cn(height, 'flex items-center justify-center bg-slate-50 rounded-xl', className)}>
      <div className="text-slate-400 text-sm">Loading data...</div>
    </div>
  )
}

/**
 * Error state for charts - consistent styling across all chart components.
 */
export function ChartError({
  error,
  className,
  height = 'h-96',
}: ChartStateProps & { error?: string | null }) {
  return (
    <div className={cn(height, 'flex items-center justify-center bg-slate-50 rounded-xl', className)}>
      <div className="text-red-700 text-sm">{error || 'No data available'}</div>
    </div>
  )
}
