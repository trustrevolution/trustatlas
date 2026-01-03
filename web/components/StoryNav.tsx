'use client'

import { useEffect, useState } from 'react'
import { usaTrustTimelineProvenance } from './charts/USATrustTimeline'
import { ruleLawTrendsProvenance } from './charts/RuleLawTrends'
import { covidTrustImpactProvenance } from './charts/CovidTrustImpact'
import { trustCollapseProvenance } from './charts/TrustCollapse'
import { trustInversionProvenance } from './charts/TrustInversion'

const STORIES = [
  { id: usaTrustTimelineProvenance.id, label: usaTrustTimelineProvenance.title },
  { id: ruleLawTrendsProvenance.id, label: ruleLawTrendsProvenance.title },
  { id: covidTrustImpactProvenance.id, label: covidTrustImpactProvenance.title },
  { id: trustCollapseProvenance.id, label: trustCollapseProvenance.title },
  { id: trustInversionProvenance.id, label: trustInversionProvenance.title },
]

export default function StoryNav() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const firstSection = document.getElementById(STORIES[0].id)
      const lastSection = document.getElementById(STORIES[STORIES.length - 1].id)

      if (!firstSection || !lastSection) {
        setVisible(false)
        return
      }

      const firstTop = firstSection.getBoundingClientRect().top
      const lastBottom = lastSection.getBoundingClientRect().bottom

      // Only visible when:
      // - First section top is at or above viewport top (we've scrolled to stories)
      // - Last section bottom is below viewport top (we haven't scrolled past all stories)
      const inStoryZone = firstTop <= 0 && lastBottom > window.innerHeight * 0.3
      setVisible(inStoryZone)

      if (!inStoryZone) return

      // Find active: last section whose top is at or above viewport top
      let found = 0
      STORIES.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 50) {
          found = i
        }
      })
      setActive(found)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:block">
      <ul className="flex flex-col gap-3">
        {STORIES.map((s, i) => (
          <li key={s.id}>
            <button
              onClick={() => go(s.id)}
              className="flex items-center gap-2 group"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === active ? 'bg-slate-900' : 'bg-slate-300 group-hover:bg-slate-500'
                }`}
              />
              <span
                className={`text-xs transition-opacity ${
                  i === active
                    ? 'text-slate-900'
                    : 'text-slate-400 opacity-0 group-hover:opacity-100'
                }`}
              >
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
