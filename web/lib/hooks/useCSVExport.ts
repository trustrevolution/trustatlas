'use client'

import { useCallback } from 'react'
import { downloadTableCSV, type TableExportRow } from '@/lib/export'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance/types'

interface UseCSVExportOptions {
  /** Table data to export */
  tableData?: DataTableRow[]
  /** Chart provenance for metadata */
  provenance: ChartProvenance
}

/**
 * Hook for exporting chart data as CSV
 *
 * Creates a CSV file with:
 * - Metadata header (title, sources, years)
 * - Data rows (label, year, value, source, confidence)
 */
export function useCSVExport({ tableData, provenance }: UseCSVExportOptions) {
  const handleDownloadCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return

    const exportData: TableExportRow[] = tableData.map((row) => ({
      label: row.label,
      year: row.year,
      value: row.value,
      source: row.source,
      confidence: row.confidence,
    }))

    const sourceIds = provenance.sources.map((s) => s.source)
    downloadTableCSV(
      exportData,
      {
        title: provenance.title,
        sources: sourceIds,
        years: provenance.years,
      },
      provenance.id
    )
  }, [tableData, provenance])

  return tableData && tableData.length > 0 ? handleDownloadCSV : undefined
}

export default useCSVExport
