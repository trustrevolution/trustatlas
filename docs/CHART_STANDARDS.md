# Chart Standards

Standards and patterns for Trust Atlas data story charts.

## Quick Start

```tsx
import { ChartWithControls } from '@/components/charts/ChartWithControls'
import { createChartOption, line, timeAxis, percentAxis, TOOLTIP_STYLES } from '@/lib/charts'
import type { ChartProvenance, DataTableRow } from '@/components/data-provenance'
```

Copy `web/components/charts/_ChartTemplate.tsx` as a starting point.

---

## Builder Functions

### `line(opts)`

Creates a line series with sensible defaults.

```tsx
line({
  name: 'Institutional',           // Series name (legend/tooltip)
  data: [[2016, 45], [2018, 48]],  // [year, value] tuples
  color: '#3b82f6',                // Line color
  // Optional:
  endLabel: 'NLD',                 // Label at line end (string or true for name)
  smooth: true,                    // Smooth interpolation (default: true)
  lineWidth: 3,                    // Line width (default: 3)
  symbols: 'all',                  // 'all' | 'endpoints' | 'end' | 'none'
})
```

### `timeAxis(opts)`

X-axis for year-based data.

```tsx
timeAxis({
  range: [2016, 2023],  // [start, end] years
  interval: 2,          // Label interval (optional)
})
```

### `percentAxis(opts)`

Y-axis for 0-100 trust scores.

```tsx
percentAxis({
  label: 'Trust %',        // Axis label (optional)
  range: [0, 100],         // [min, max] (default: [0, 100])
  interval: 20,            // Tick interval (optional)
  formatPercent: true,     // Add % suffix (default: false)
  nameGap: 35,             // Label-to-axis gap (default: 35)
})
```

### `eventMarker(opts)`

Vertical dashed line marking an event.

```tsx
eventMarker({
  year: 1974,
  label: 'Watergate',
  color: '#ef4444',  // Default: red
})
```

### `periodBand(opts)`

Shaded background region.

```tsx
periodBand({
  start: 2020,
  end: 2022,
  label: 'COVID-19',
  color: 'rgba(100, 116, 139, 0.1)',  // Default: light slate
})
```

### `gridRight(endLabels)`

Calculate right margin for end labels.

```tsx
const endLabels = countries.map(c => c.iso3)
const grid = { left: 48, right: gridRight(endLabels), top: 40, bottom: 40 }
```

---

## Grid Presets

```tsx
import { CHART_GRID } from '@/lib/charts'

CHART_GRID.compact     // { left: 48, right: 24, top: 24, bottom: 40 }  - embedded
CHART_GRID.standard    // { left: 48, right: 48, top: 24, bottom: 48 }  - default
CHART_GRID.wide        // { left: 48, right: 100, top: 24, bottom: 48 } - end labels
CHART_GRID.withLegend  // { left: 48, right: 48, top: 24, bottom: 64 }  - bottom legend
```

**When to use:**
- `compact` - Small embedded charts without controls
- `standard` - Default, most charts
- `wide` - Charts with end labels (use `gridRight()` instead for dynamic sizing)
- `withLegend` - Multiple series with bottom legend

---

## Provenance Structure

Every chart needs provenance metadata:

```tsx
const PROVENANCE: ChartProvenance = {
  id: 'my-chart-id',                    // For deep linking (#my-chart-id)
  title: 'Chart Title',
  subtitle: 'Optional subtitle',
  sources: [
    {
      source: 'ESS',                    // Source ID
      seriesNames: ['Netherlands'],     // Which series use this source
      confidence: 'A',                  // 'A' | 'B' | 'C'
    },
  ],
  years: '2016-2023',
  confidence: 'A',                      // Overall confidence
  methodologyAnchor: '#institutional',  // Link to methodology section
  narrative: 'Brief context about what this chart shows.',
}
```

**Confidence Tiers:**
- **A**: Current survey data (≤3 years) + governance
- **B**: Survey >3 years old OR single pillar
- **C**: Governance proxy only

---

## Table Data for Accessibility

Generate `DataTableRow[]` for the Chart/Table toggle:

```tsx
const tableData: DataTableRow[] = useMemo(() => {
  return countries.flatMap(c =>
    c.data.map(d => ({
      label: c.name,           // Row label (country/series name)
      year: d.year,
      value: d.score,
      source: 'ESS',
      confidence: 'A' as const,
    }))
  )
}, [countries])
```

---

## Composing a Chart

```tsx
const option = createChartOption({
  grid: CHART_GRID.standard,
  xAxis: timeAxis({ range: [2016, 2023] }),
  yAxis: percentAxis({ label: 'Trust %', range: [0, 100] }),
  tooltip: {
    ...TOOLTIP_STYLES,
    trigger: 'axis',
  },
  legend: 'none',  // 'none' | 'bottom' | ['Series1', 'Series2']
  series: [
    line({ name: 'Netherlands', data, color: '#3b82f6' }),
  ],
})

return (
  <ChartWithControls
    option={option}
    provenance={PROVENANCE}
    tableData={tableData}
    height={{ mobile: '320px', desktop: '400px' }}
  />
)
```

---

## Color Palette

**Pillar Colors:**
```tsx
interpersonal: '#38bdf8'  // cyan/sky
institutional: '#f59e0b'  // amber
governance:    '#10b981'  // emerald
```

**Country Gradients (for multi-country charts):**
- Decliners: Red → Orange → Yellow (`#ef4444` → `#f97316` → `#eab308`)
- Stable: Green → Cyan (`#10b981` → `#06b6d4`)

**Events:**
- Crisis/negative: `#ef4444` (red)
- Neutral/context: `#f59e0b` (amber)

---

## Checklist for New Charts

1. [ ] Define `PROVENANCE` with id, title, sources, confidence
2. [ ] Fetch data with loading/error states
3. [ ] Generate `tableData` for accessibility
4. [ ] Use `createChartOption()` with builders
5. [ ] Wrap with `ChartWithControls`
6. [ ] Set responsive height `{ mobile, desktop }`
7. [ ] Use design token colors (not hardcoded hex)
8. [ ] Filter data to x-axis range (avoid clipped dots)
9. [ ] Use `gridRight()` if chart has end labels

---

## Country Labels

Use human-readable country labels, never cryptic ISO3 codes.

```tsx
import { shortName } from '@/lib/countries'
```

### Standard: Use Readable Names

| Context | Use | Example |
|---------|-----|---------|
| End labels | `shortName(iso3, name)` | "UK", "Iran", "Netherlands" |
| Axis labels | Full name | "United Kingdom" |
| Tooltips | Full name | "United Kingdom" |
| Table data | Full name | "United Kingdom" |

### Common Abbreviations

Only these countries use abbreviations (handled by `shortName()`):

| ISO3 | Display Label |
|------|---------------|
| GBR | UK |
| USA | US |
| ARE | UAE |
| KOR | S. Korea |
| PRK | N. Korea |

All other countries use their full name (e.g., "Iran" not "IRN").

### Example Usage

```tsx
const COUNTRIES = [
  { iso3: 'GBR', name: 'United Kingdom', color: '#ef4444' },
  { iso3: 'IRN', name: 'Iran', color: '#f97316' },
]

// Calculate grid margin using readable names
const endLabels = countries.map(c => shortName(c.iso3, c.name))
const grid = { ...CHART_GRID.withEndLabels, right: gridRight(endLabels) }

// Use readable name for end label, full name for series
series: countries.map(c =>
  line({
    name: c.name,                           // Full name for tooltip
    data: c.data,
    color: c.color,
    endLabel: shortName(c.iso3, c.name),    // "UK", "Iran"
  })
)
```

---

## Advanced Features

### Event Markers
```tsx
series: [
  line({ ... }),
  eventMarker({ year: 1974, label: 'Watergate' }),
  eventMarker({ year: 2008, label: 'Financial Crisis', color: '#f59e0b' }),
]
```

### Period Bands
```tsx
series: [
  periodBand({ start: 2020, end: 2022, label: 'COVID-19' }),
  line({ ... }),
]
```

### End Labels (Multi-Country)
```tsx
import { shortName } from '@/lib/countries'

const endLabels = countries.map(c => shortName(c.iso3, c.name))
const grid = { ...CHART_GRID.withEndLabels, right: gridRight(endLabels) }

series: countries.map(c =>
  line({
    name: c.name,
    data: c.data,
    color: c.color,
    endLabel: shortName(c.iso3, c.name),  // Readable name at line end
  })
)
// Use legend: 'none' to avoid duplicating end labels
```

### Custom Tooltip
```tsx
const tooltipFormatter = (params: unknown) => {
  const p = params as Array<{ seriesName: string; value: [number, number]; color: string }>
  const year = p[0]?.value[0]
  const rows = p.map(s => `
    <div style="display:flex;justify-content:space-between;gap:16px">
      <span style="color:${s.color}">${s.seriesName}</span>
      <strong>${s.value[1].toFixed(1)}%</strong>
    </div>
  `).join('')
  return `<div style="font-size:12px"><strong>${year}</strong>${rows}</div>`
}

tooltip: {
  ...TOOLTIP_STYLES,
  trigger: 'axis',
  formatter: tooltipFormatter,
}
```

---

## File Locations

- **Builders**: `web/lib/charts/` (index.ts, series.ts, axis.ts, types.ts, constants.ts)
- **Wrapper**: `web/components/charts/ChartWithControls.tsx`
- **Examples**: `USATrustTimeline.tsx`, `CovidTrustImpact.tsx`, `TrustTrajectories.tsx`
- **Global CSS**: `web/app/globals.css` (chart-* classes)
