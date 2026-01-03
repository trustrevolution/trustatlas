'use client'

import { cn } from '@/lib/utils'
import { PILLARS } from '@/lib/design-tokens'
import type { Pillar } from '@/lib/grapher-state'

interface PillarToggleProps {
  value: Pillar
  onChange: (pillar: Pillar) => void
  className?: string
}

const PILLAR_OPTIONS: { id: Pillar; label: string }[] = [
  { id: 'interpersonal', label: 'Interpersonal' },
  { id: 'institutional', label: 'Institutional' },
  { id: 'governance', label: 'Governance' },
]

export function PillarToggle({ value, onChange, className }: PillarToggleProps) {
  return (
    <div
      className={cn('inline-flex rounded-lg bg-slate-100 p-1', className)}
      role="radiogroup"
      aria-label="Select trust pillar"
    >
      {PILLAR_OPTIONS.map((option) => {
        const isSelected = value === option.id
        const pillarConfig = PILLARS[option.id]

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              isSelected
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
            style={
              isSelected
                ? { borderBottom: `2px solid ${pillarConfig.colorHex}` }
                : undefined
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default PillarToggle
