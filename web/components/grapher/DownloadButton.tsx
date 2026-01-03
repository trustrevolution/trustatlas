'use client'

import { Download } from 'lucide-react'
import { toCSV, downloadFile, generateExportFilename, type ExportDataPoint } from '@/lib/export'
import type { Pillar } from '@/lib/grapher-state'
import { cn } from '@/lib/utils'

interface DownloadButtonProps {
  data: ExportDataPoint[]
  countries: string[]
  pillar: Pillar
  sources: string[]
  className?: string
}

export function DownloadButton({
  data,
  countries,
  pillar,
  sources,
  className,
}: DownloadButtonProps) {
  const handleDownload = () => {
    if (data.length === 0) return

    const metadata = {
      pillar,
      sources,
      url: typeof window !== 'undefined' ? window.location.href : '',
      generatedAt: new Date().toISOString(),
    }

    const csv = toCSV(data, metadata)
    const filename = generateExportFilename(countries, pillar, 'csv')
    downloadFile(csv, filename, 'text/csv;charset=utf-8')
  }

  const isDisabled = data.length === 0

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        isDisabled
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
        className
      )}
      aria-label="Download data as CSV"
    >
      <Download className="w-4 h-4" />
      <span>Download</span>
    </button>
  )
}

export default DownloadButton
