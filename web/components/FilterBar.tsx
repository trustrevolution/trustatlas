'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, Building2, Newspaper } from 'lucide-react'
import type { Pillar } from '@/app/explore/page'
import { api, type Country } from '@/lib/api'
import { PILLARS } from '@/lib/design-tokens'

interface FilterBarProps {
  onCountrySelect: (iso3: string) => void
  selectedPillar: Pillar
  onPillarChange: (pillar: Pillar) => void
}

// Icon mapping for pillars
const PILLAR_ICONS = {
  social: Users,
  institutions: Building2,
  media: Newspaper,
} as const

const PILLAR_ORDER: Pillar[] = ['social', 'institutions', 'media']

export default function FilterBar({ onCountrySelect, selectedPillar, onPillarChange }: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [countries, setCountries] = useState<Country[]>([])
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch countries for search
  useEffect(() => {
    api.getCountries()
      .then(data => setCountries(data))
      .catch(err => console.error('Failed to fetch countries:', err))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.iso3.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8)

  const handleSelect = (iso3: string) => {
    onCountrySelect(iso3)
    setSearchQuery('')
    setShowResults(false)
  }

  return (
    <div className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        {/* Search */}
        <div ref={containerRef} className="relative flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-slate-500 hover:text-white" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchQuery && filteredCountries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
              {filteredCountries.map(country => (
                <button
                  key={country.iso3}
                  onClick={() => handleSelect(country.iso3)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
                >
                  <div>
                    <div className="text-white font-medium">{country.name}</div>
                    <div className="text-slate-500 text-sm">{country.region}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && searchQuery && filteredCountries.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-xl z-50 p-4 text-slate-400 text-center">
              No countries found
            </div>
          )}
        </div>

        {/* Pillar Selector - icons with responsive labels */}
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1.5" role="radiogroup" aria-label="Select trust pillar">
          {PILLAR_ORDER.map(pillarId => {
            const pillar = PILLARS[pillarId]
            const Icon = PILLAR_ICONS[pillarId]
            const isActive = selectedPillar === pillarId
            return (
              <button
                key={pillarId}
                onClick={() => onPillarChange(pillarId)}
                className={`pillar-icon-btn ${isActive ? 'pillar-icon-btn-active' : ''}`}
                data-pillar={pillarId}
                role="radio"
                aria-checked={isActive}
                aria-label={pillar.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="pillar-label">{pillar.shortLabel}</span>
                <span className="pillar-tooltip">
                  <span className="pillar-tooltip-title">{pillar.shortLabel}</span>
                  <span className="pillar-tooltip-desc">{pillar.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
