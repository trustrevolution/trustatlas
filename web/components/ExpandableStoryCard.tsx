'use client'

import { useState, useEffect, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ChartProvenance } from '@/components/data-provenance'

interface ExpandableStoryCardProps {
  provenance: ChartProvenance
  label: string
  labelColor?: string
  insight: ReactNode
  insightTitle: string
  insightBoxClass?: string
  children: ReactNode // The chart component
  defaultExpanded?: boolean
}

export default function ExpandableStoryCard({
  provenance,
  label,
  labelColor = 'text-amber-700',
  insight,
  insightTitle,
  insightBoxClass = 'insight-box',
  children,
  defaultExpanded = false,
}: ExpandableStoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Sync with defaultExpanded prop (for URL hash navigation)
  useEffect(() => {
    if (defaultExpanded) {
      setIsExpanded(true)
      // Scroll to put chart in view after expansion animation
      setTimeout(() => {
        document.getElementById(provenance.id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 350) // After 300ms expand animation
    }
  }, [defaultExpanded, provenance.id])

  return (
    <div id={provenance.id} className="border-b border-slate-200 last:border-b-0 scroll-mt-20">
      {/* Collapsed header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-6 px-4 sm:px-6 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
            {label}
          </span>
          <h3 className="font-display text-xl sm:text-2xl text-slate-900 mt-1">
            {provenance.title}
          </h3>
          <p className="text-slate-600 text-sm sm:text-base mt-1 line-clamp-2">
            {provenance.subtitle}
          </p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 sm:px-6 pb-8">
          <div className="story-chart">
            {children}
          </div>
          <div className={`${insightBoxClass} mt-6`}>
            <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">{insightTitle}</h4>
            <div className="text-slate-700 text-sm sm:text-base">
              {insight}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
