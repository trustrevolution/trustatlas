'use client'

import { cn } from '@/lib/utils'
import { ViewTabs, type ViewType } from './ViewTabs'
import { LOGO_DATA_URI } from '@/lib/brand'

interface ChartTopRowProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  /** Show branding (logo + trustatlas.org + CC license) */
  showBrand?: boolean
  /** Show view tabs (Chart/Table toggle) */
  showViewTabs?: boolean
  /** Optional custom actions on the right */
  actions?: React.ReactNode
  className?: string
}

export function ChartTopRow({
  activeView,
  onViewChange,
  showBrand = false,
  showViewTabs = true,
  actions,
  className,
}: ChartTopRowProps) {
  return (
    <div
      data-chart-top-row
      className={cn(
        'flex items-center justify-between px-4 py-2 border-b border-slate-100',
        className
      )}
    >
      {/* Left: View tabs (only if table data available) */}
      {showViewTabs ? (
        <div data-view-tabs>
          <ViewTabs activeView={activeView} onViewChange={onViewChange} />
        </div>
      ) : (
        <div />
      )}

      {/* Right: Branding and/or actions */}
      <div className="flex items-center gap-3">
        {showBrand && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium">trustatlas.org</span>
            <img src={LOGO_DATA_URI} alt="" className="w-4 h-4" />
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}

export default ChartTopRow
