import type { Pillar } from './grapher-state'

/**
 * Sanitize a CSV field to prevent formula injection in spreadsheet applications.
 * Fields starting with =, @, +, - could be interpreted as formulas in Excel/Google Sheets.
 */
function sanitizeCSVField(value: string): string {
  // First handle standard CSV escaping (quotes, commas, newlines)
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n')
  let escaped = needsQuotes ? `"${value.replace(/"/g, '""')}"` : value

  // Prevent formula injection by prefixing with single quote
  // This is the recommended approach per OWASP
  if (/^[=@+\-\t\r]/.test(escaped)) {
    escaped = `'${escaped}`
  }

  return escaped
}

export interface ExportDataPoint {
  country: string
  iso3: string
  year: number
  pillar: Pillar
  score: number
  source: string
}

/**
 * Generic table row for data story exports
 */
export interface TableExportRow {
  label: string
  year: number
  value: number
  source: string
  confidence?: string
}

export interface ExportMetadata {
  pillar: Pillar
  sources: string[]
  url: string
  generatedAt: string
}

/**
 * Generate CSV content with Trust Atlas attribution header
 */
export function toCSV(data: ExportDataPoint[], metadata: ExportMetadata): string {
  const lines: string[] = []

  // Header comments with attribution
  lines.push('# Trust Atlas Data Export')
  lines.push(`# Pillar: ${metadata.pillar}`)
  lines.push(`# Sources: ${metadata.sources.join(', ')}`)
  lines.push(`# Generated: ${metadata.generatedAt}`)
  lines.push('# License: CC BY-SA 4.0')
  lines.push(`# URL: ${metadata.url}`)
  lines.push('#')
  lines.push('# Please cite as:')
  lines.push('#   Trust Atlas. (2024). Trust data export. Retrieved from https://trustatlas.org')
  lines.push('')

  // CSV header
  lines.push('country,iso3,year,pillar,score,source')

  // Data rows
  data.forEach((row) => {
    const escapedCountry = sanitizeCSVField(row.country)
    const escapedSource = sanitizeCSVField(row.source)
    lines.push(
      `${escapedCountry},${row.iso3},${row.year},${row.pillar},${row.score.toFixed(1)},${escapedSource}`
    )
  })

  return lines.join('\n')
}

/**
 * Trigger browser download of a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a filename for export
 */
export function generateExportFilename(
  countries: string[],
  pillar: Pillar,
  format: 'csv' | 'json'
): string {
  const countryPart = countries.length <= 3 ? countries.join('-') : `${countries.length}-countries`
  const date = new Date().toISOString().split('T')[0]
  return `trust-atlas-${pillar}-${countryPart}-${date}.${format}`
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

/**
 * Convert table data to CSV with attribution header (for data story charts)
 */
export function tableToCSV(
  data: TableExportRow[],
  metadata: { title: string; sources: string[]; years: string }
): string {
  const lines: string[] = []

  // Header comments with attribution
  lines.push('# Trust Atlas Data Export')
  lines.push(`# Chart: ${metadata.title}`)
  lines.push(`# Sources: ${metadata.sources.join(', ')}`)
  lines.push(`# Years: ${metadata.years}`)
  lines.push(`# Generated: ${new Date().toISOString()}`)
  lines.push('# License: CC BY-SA 4.0')
  lines.push('#')
  lines.push('# Please cite as:')
  lines.push('#   Trust Atlas. (2024). Trust data export. Retrieved from https://trustatlas.org')
  lines.push('')

  // CSV header
  lines.push('label,year,value,source,confidence')

  // Data rows
  data.forEach((row) => {
    const escapedLabel = sanitizeCSVField(row.label)
    const escapedSource = sanitizeCSVField(row.source)
    const escapedConfidence = row.confidence ? sanitizeCSVField(row.confidence) : ''
    lines.push(
      `${escapedLabel},${row.year},${row.value.toFixed(1)},${escapedSource},${escapedConfidence}`
    )
  })

  return lines.join('\n')
}

/**
 * Download table data as CSV
 */
export function downloadTableCSV(
  data: TableExportRow[],
  metadata: { title: string; sources: string[]; years: string },
  filename?: string
): void {
  const csv = tableToCSV(data, metadata)
  const safeName = filename || metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const date = new Date().toISOString().split('T')[0]
  downloadFile(csv, `trust-atlas-${safeName}-${date}.csv`, 'text/csv;charset=utf-8')
}
