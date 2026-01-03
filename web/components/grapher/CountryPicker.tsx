'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Country {
  iso3: string
  name: string
  region?: string | null
}

interface CountryPickerProps {
  countries: Country[]
  selectedCountries: string[]
  onAdd: (iso3: string) => void
  onRemove: (iso3: string) => void
  maxCountries?: number
  className?: string
}

export function CountryPicker({
  countries,
  selectedCountries,
  onAdd,
  onRemove,
  maxCountries = 10,
  className,
}: CountryPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter countries based on search
  const filteredCountries = countries.filter((c) => {
    if (selectedCountries.includes(c.iso3)) return false
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.iso3.toLowerCase().includes(searchLower)
    )
  })

  // Get selected country objects
  const selectedCountryObjects = selectedCountries
    .map((iso3) => countries.find((c) => c.iso3 === iso3))
    .filter(Boolean) as Country[]

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, filteredCountries.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCountries[highlightedIndex]) {
          onAdd(filteredCountries[highlightedIndex].iso3)
          setSearch('')
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSelect = (iso3: string) => {
    onAdd(iso3)
    setSearch('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const canAddMore = selectedCountries.length < maxCountries

  return (
    <div className={cn('relative', className)}>
      {/* Selected countries as tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCountryObjects.map((country) => (
          <span
            key={country.iso3}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-sm"
          >
            <span className="font-medium">{country.iso3}</span>
            <span className="text-slate-500 hidden sm:inline">{country.name}</span>
            <button
              type="button"
              onClick={() => onRemove(country.iso3)}
              className="p-0.5 hover:bg-slate-200 rounded transition-colors"
              aria-label={`Remove ${country.name}`}
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>
          </span>
        ))}
      </div>

      {/* Search input */}
      {canAddMore && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add country..."
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm',
              'bg-white border border-slate-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500',
              'placeholder:text-slate-400'
            )}
            aria-label="Search for a country to add"
            aria-expanded={isOpen}
            aria-controls="country-dropdown"
          />

          {/* Dropdown */}
          {isOpen && filteredCountries.length > 0 && (
            <div
              ref={dropdownRef}
              id="country-dropdown"
              className={cn(
                'absolute z-50 w-full mt-1 py-1',
                'bg-white border border-slate-200 rounded-lg shadow-lg',
                'max-h-60 overflow-y-auto'
              )}
              role="listbox"
            >
              {filteredCountries.slice(0, 20).map((country, index) => (
                <button
                  key={country.iso3}
                  type="button"
                  onClick={() => handleSelect(country.iso3)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                    'hover:bg-slate-50 transition-colors',
                    index === highlightedIndex && 'bg-slate-50'
                  )}
                  role="option"
                  aria-selected={index === highlightedIndex}
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{country.iso3}</span>
                  <span className="text-slate-500">{country.name}</span>
                  {country.region && (
                    <span className="ml-auto text-xs text-slate-400">{country.region}</span>
                  )}
                </button>
              ))}
              {filteredCountries.length > 20 && (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  Type to narrow results...
                </div>
              )}
            </div>
          )}

          {isOpen && filteredCountries.length === 0 && search && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 py-3 px-3 bg-white border border-slate-200 rounded-lg shadow-lg text-sm text-slate-500 text-center"
            >
              No countries found
            </div>
          )}
        </div>
      )}

      {!canAddMore && (
        <p className="text-xs text-slate-400">Maximum {maxCountries} countries</p>
      )}
    </div>
  )
}

export default CountryPicker
