'use client'

import { useState } from 'react'

interface TooltipProps {
  /** Tooltip text content */
  content: string
  /** Element that triggers the tooltip on hover */
  children: React.ReactNode
}

/**
 * Simple hover tooltip component
 *
 * Uses global CSS classes from globals.css:
 * - .chart-tooltip for positioning and styling
 * - .chart-tooltip-arrow for the pointer arrow
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="chart-tooltip">
          {content}
          <div className="chart-tooltip-arrow" />
        </div>
      )}
    </div>
  )
}

export default Tooltip
