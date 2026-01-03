'use client'

import { useCallback, type RefObject } from 'react'
import type { EChartsWrapperRef } from '@/components/charts/EChartsWrapper'
import { CHART_EXPORT } from '@/lib/charts/constants'
import { LOGO_SVG } from '@/lib/brand'

interface UsePNGExportOptions {
  chartRef: RefObject<EChartsWrapperRef | null>
  title: string
  subtitle?: string
  sourceNames: string
  years?: string
}

// Scale a font string by a factor
function scaleFont(font: string, scale: number): string {
  return font.replace(/(\d+)px/, (_, size) => `${parseInt(size) * scale}px`)
}

// Wrap text to fit within maxWidth
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export function usePNGExport({
  chartRef,
  title,
  subtitle,
  sourceNames,
  years,
}: UsePNGExportOptions) {
  const handleSavePNG = useCallback(async () => {
    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) {
      console.warn('usePNGExport: No chart instance')
      return
    }

    const { PADDING, TITLE_HEIGHT, LINE_HEIGHT, TITLE_GAP, SUBTITLE_GAP, FOOTER_GAP, FOOTER_HEIGHT, LOGO_SIZE, LOGO_GAP, LOGO_OFFSET_Y, PIXEL_RATIO, FONTS, COLORS } = CHART_EXPORT
    const scale = PIXEL_RATIO

    // Get chart image from ECharts
    const chartDataURL = chart.getDataURL({
      type: 'png',
      pixelRatio: scale,
      backgroundColor: COLORS.background,
    })

    // Load chart image
    const chartImg = new Image()
    chartImg.src = chartDataURL
    await new Promise<void>((resolve, reject) => {
      chartImg.onload = () => resolve()
      chartImg.onerror = reject
    })

    // Load logo
    const logoBlob = new Blob([LOGO_SVG], { type: 'image/svg+xml' })
    const logoUrl = URL.createObjectURL(logoBlob)
    const logoImg = new Image()
    logoImg.src = logoUrl
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve()
      logoImg.onerror = reject
    })

    // Scaled dimensions
    const padding = PADDING * scale
    const titleHeight = TITLE_HEIGHT * scale
    const lineHeight = LINE_HEIGHT * scale
    const footerHeight = FOOTER_HEIGHT * scale
    const logoSize = LOGO_SIZE * scale

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Measure subtitle wrapping
    ctx.font = scaleFont(FONTS.subtitle, scale)
    const maxTextWidth = chartImg.width - padding * 2
    const subtitleLines = subtitle ? wrapText(ctx, subtitle, maxTextWidth) : []

    // Calculate header height
    const subtitleHeight = subtitleLines.length * lineHeight
    const headerHeight = padding + titleHeight + (subtitleLines.length > 0 ? subtitleHeight + SUBTITLE_GAP * scale : 0)

    // Set canvas dimensions
    canvas.width = chartImg.width
    canvas.height = headerHeight + chartImg.height + footerHeight

    // White background
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw title
    ctx.textBaseline = 'top'
    ctx.font = scaleFont(FONTS.title, scale)
    ctx.fillStyle = COLORS.title
    ctx.fillText(title, padding, padding)

    // Draw subtitle lines
    if (subtitleLines.length > 0) {
      ctx.font = scaleFont(FONTS.subtitle, scale)
      ctx.fillStyle = COLORS.subtitle
      let y = padding + titleHeight + TITLE_GAP * scale
      for (const line of subtitleLines) {
        ctx.fillText(line, padding, y)
        y += lineHeight
      }
    }

    // Draw chart (full width, directly after header)
    const chartY = headerHeight
    ctx.drawImage(chartImg, 0, chartY)

    // Draw footer: source (left) + branding (right)
    const footerY = chartY + chartImg.height + FOOTER_GAP * scale

    // Source attribution (left)
    ctx.font = scaleFont(FONTS.source, scale)
    ctx.fillStyle = COLORS.source
    const sourceText = years
      ? `Source: ${sourceNames} (${years}) | CC BY-SA 4.0`
      : `Source: ${sourceNames} | CC BY-SA 4.0`
    ctx.fillText(sourceText, padding, footerY)

    // Branding: trustatlas.org + logo (right, logo on outside)
    // Matches ChartTopRow: text-xs (12px), font-medium, text-slate-400, gap-1.5 (6px), logo w-4 h-4 (16px)
    const brandText = 'trustatlas.org'
    ctx.font = scaleFont(FONTS.brand, scale)
    ctx.fillStyle = COLORS.brand
    const brandWidth = ctx.measureText(brandText).width
    const logoGap = LOGO_GAP * scale
    const logoX = canvas.width - padding - logoSize
    const brandX = logoX - logoGap - brandWidth

    ctx.fillText(brandText, brandX, footerY)
    ctx.drawImage(logoImg, logoX, footerY - LOGO_OFFSET_Y * scale, logoSize, logoSize)

    // Cleanup
    URL.revokeObjectURL(logoUrl)

    // Download
    const link = document.createElement('a')
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [chartRef, title, subtitle, sourceNames, years])

  return handleSavePNG
}

export default usePNGExport
