'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeSliderProps {
  /** Available years in the dataset */
  years: number[]
  /** Currently selected year (null = show all years) */
  currentYear: number | null
  /** Callback when year changes */
  onYearChange: (year: number | null) => void
  /** Animation speed in ms per year */
  animationSpeed?: number
  /** Show "All" option at end */
  showAllOption?: boolean
  className?: string
}

export function TimeSlider({
  years,
  currentYear,
  onYearChange,
  animationSpeed = 500,
  showAllOption = true,
  className,
}: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const minYear = years[0]
  const maxYear = years[years.length - 1]

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    const timer = setInterval(() => {
      const currentIndex = currentYear ? years.indexOf(currentYear) : -1

      if (currentIndex >= years.length - 1) {
        // Reached end, stop
        setIsPlaying(false)
      } else {
        // Move to next year
        const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1
        onYearChange(years[nextIndex])
      }
    }, animationSpeed)

    return () => clearInterval(timer)
  }, [isPlaying, currentYear, years, animationSpeed, onYearChange])

  // Calculate thumb position as percentage
  const getThumbPosition = useCallback(() => {
    if (currentYear === null) return 100
    const index = years.indexOf(currentYear)
    if (index < 0) return 0
    return (index / (years.length - 1)) * 100
  }, [currentYear, years])

  // Handle track click
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      const index = Math.round(percent * (years.length - 1))
      const clampedIndex = Math.max(0, Math.min(years.length - 1, index))
      onYearChange(years[clampedIndex])
    },
    [years, onYearChange]
  )

  // Handle drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const index = Math.round(percent * (years.length - 1))
      onYearChange(years[index])
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, years, onYearChange])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = currentYear ? years.indexOf(currentYear) : -1

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          if (currentIndex > 0) {
            onYearChange(years[currentIndex - 1])
          }
          break
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          if (currentIndex < years.length - 1) {
            onYearChange(years[currentIndex + 1])
          } else if (showAllOption && currentIndex === years.length - 1) {
            onYearChange(null)
          }
          break
        case 'Home':
          e.preventDefault()
          onYearChange(years[0])
          break
        case 'End':
          e.preventDefault()
          onYearChange(showAllOption ? null : years[years.length - 1])
          break
      }
    },
    [currentYear, years, onYearChange, showAllOption]
  )

  const togglePlay = () => {
    if (!isPlaying && (currentYear === null || currentYear === maxYear)) {
      // Start from beginning if at end or showing all
      onYearChange(years[0])
    }
    setIsPlaying(!isPlaying)
  }

  const thumbPosition = getThumbPosition()

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 border-t border-slate-100', className)}>
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        className={cn(
          'flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full touch-target-sm',
          'bg-slate-100 hover:bg-slate-200 text-slate-600',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
        )}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Min year label */}
      <span className="text-xs font-medium text-slate-500 tabular-nums min-w-[3ch]">
        {minYear}
      </span>

      {/* Slider track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative flex-1 h-1 bg-slate-200 rounded-full cursor-pointer"
        role="slider"
        aria-valuemin={minYear}
        aria-valuemax={showAllOption ? maxYear + 1 : maxYear}
        aria-valuenow={currentYear ?? maxYear + 1}
        aria-valuetext={currentYear ? String(currentYear) : 'All years'}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full bg-slate-400 rounded-full pointer-events-none"
          style={{ width: `${thumbPosition}%` }}
        />

        {/* Thumb - visual 16px, touch target expanded */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
            'w-4 h-4 bg-slate-800 border-2 border-white rounded-full shadow-sm',
            'before:absolute before:inset-[-12px] before:content-[""]',
            isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab',
            'transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
          )}
          style={{ left: `${thumbPosition}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Max year / All label */}
      <span className="text-xs font-medium text-slate-500 tabular-nums min-w-[3ch]">
        {showAllOption && currentYear === null ? 'All' : maxYear}
      </span>
    </div>
  )
}

export default TimeSlider
