'use client'

import { useCallback } from 'react'
import { LineChart, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHART_UI } from '@/lib/charts/constants'

export type ViewType = 'chart' | 'table'

interface ViewTabsProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  className?: string
}

export function ViewTabs({ activeView, onViewChange, className }: ViewTabsProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, view: ViewType) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const newView = view === 'chart' ? 'table' : 'chart'
        onViewChange(newView)
      }
    },
    [onViewChange]
  )

  return (
    <div
      role="tablist"
      aria-label="View options"
      className={cn('view-tablist', className)}
    >
      <button
        role="tab"
        aria-selected={activeView === 'chart'}
        aria-controls="chart-panel"
        tabIndex={activeView === 'chart' ? 0 : -1}
        onClick={() => onViewChange('chart')}
        onKeyDown={(e) => handleKeyDown(e, 'chart')}
        className={cn('view-tab', activeView === 'chart' && 'view-tab-active')}
      >
        <LineChart className={CHART_UI.ICON_SIZE} />
        Chart
      </button>

      <button
        role="tab"
        aria-selected={activeView === 'table'}
        aria-controls="table-panel"
        tabIndex={activeView === 'table' ? 0 : -1}
        onClick={() => onViewChange('table')}
        onKeyDown={(e) => handleKeyDown(e, 'table')}
        className={cn('view-tab', activeView === 'table' && 'view-tab-active')}
      >
        <Table2 className={CHART_UI.ICON_SIZE} />
        Table
      </button>
    </div>
  )
}

export default ViewTabs
