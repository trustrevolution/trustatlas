'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Download, Share2, Maximize2, Minimize2, Image, FileSpreadsheet, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DATA_SOURCES } from '@/components/data-provenance/tokens'
import { CHART_UI } from '@/lib/charts/constants'
import { Tooltip } from '@/components/ui/Tooltip'
import type { ChartProvenance } from '@/components/data-provenance/types'

interface ChartFooterProps {
  provenance: ChartProvenance
  onDownloadPNG: () => void
  onDownloadCSV?: () => void
  onFullscreen?: () => void
  isFullscreen?: boolean
  showFullscreen?: boolean
  className?: string
}

// =============================================================================
// Download Dropdown
// =============================================================================

function DownloadDropdown({
  onDownloadPNG,
  onDownloadCSV,
}: {
  onDownloadPNG: () => void
  onDownloadCSV?: () => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handlePNG = () => {
    onDownloadPNG()
    setOpen(false)
  }

  const handleCSV = () => {
    onDownloadCSV?.()
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn('chart-action-btn', open && 'chart-action-btn-active')}
      >
        <Download className={CHART_UI.ICON_SIZE} />
        <span className="hidden sm:inline">Download</span>
      </button>

      {open && (
        <div className="chart-dropdown">
          <button type="button" onClick={handlePNG} className="chart-dropdown-item">
            <Image className="w-4 h-4 text-slate-400" />
            <span>Save as PNG</span>
          </button>

          {onDownloadCSV && (
            <button type="button" onClick={handleCSV} className="chart-dropdown-item">
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              <span>Download CSV</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Footer Button
// =============================================================================

function FooterButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('chart-action-btn', active && 'chart-action-btn-active')}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ChartFooter({
  provenance,
  onDownloadPNG,
  onDownloadCSV,
  onFullscreen,
  isFullscreen = false,
  showFullscreen = true,
  className,
}: ChartFooterProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')

  // Build source text
  const sourceIds = provenance.sources.map((s) => s.source)
  const sourceNames = sourceIds.map((id) => DATA_SOURCES[id]?.name || id).join(', ')
  const years = provenance.years ? ` (${provenance.years})` : ''

  // Methodology URL
  const methodologyUrl = provenance.methodologyAnchor
    ? `/methodology${provenance.methodologyAnchor}`
    : '/methodology'

  // Share: native share sheet or copy link
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#${provenance.id}`

    // Try native share sheet first
    if (navigator.share) {
      try {
        await navigator.share({
          title: provenance.title,
          text: `${provenance.title} - Trust Atlas`,
          url,
        })
        return
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 2000)
    } catch {
      // Clipboard failed
    }
  }, [provenance])

  return (
    <footer className={cn('chart-footer', className)}>
      {/* Mobile: stacked, Desktop: single row */}
      <div className="chart-footer-row">
        {/* Source + info + license */}
        <div className="chart-footer-source">
          <span className="font-medium shrink-0">Source:</span>
          <span className="truncate">{sourceNames}{years}</span>
          <Tooltip content="Learn how this data is collected and processed">
            <a
              href={methodologyUrl}
              className="chart-footer-info-link"
              aria-label="View methodology"
            >
              <Info className="w-3 h-3" />
            </a>
          </Tooltip>
          <span className="text-slate-400 shrink-0 whitespace-nowrap">CC BY-SA 4.0</span>
        </div>

        {/* Action buttons */}
        <nav data-footer-actions className="chart-footer-actions" aria-label="Chart actions">
          <DownloadDropdown
            onDownloadPNG={onDownloadPNG}
            onDownloadCSV={onDownloadCSV}
          />

          <FooterButton
            icon={
              shareState === 'copied' ? (
                <Check className={cn(CHART_UI.ICON_SIZE, 'text-green-600')} />
              ) : (
                <Share2 className={CHART_UI.ICON_SIZE} />
              )
            }
            label={shareState === 'copied' ? 'Copied!' : 'Share'}
            onClick={handleShare}
            active={shareState === 'copied'}
          />

          {showFullscreen && onFullscreen && (
            <FooterButton
              icon={
                isFullscreen ? (
                  <Minimize2 className={CHART_UI.ICON_SIZE} />
                ) : (
                  <Maximize2 className={CHART_UI.ICON_SIZE} />
                )
              }
              label={isFullscreen ? 'Exit' : 'Full-screen'}
              onClick={onFullscreen}
              active={isFullscreen}
            />
          )}
        </nav>
      </div>
    </footer>
  )
}

export default ChartFooter
