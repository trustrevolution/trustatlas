/**
 * Tree-shaken ECharts configuration
 *
 * Only imports chart types and components we actually use.
 * This reduces the bundle from ~1.2MB to ~400KB.
 */

// Core library
import * as echarts from 'echarts/core'

// Chart types we use
import { MapChart, LineChart, ScatterChart, BarChart, CustomChart } from 'echarts/charts'

// Components we use
import {
  GeoComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  TitleComponent,
  DatasetComponent,
  ToolboxComponent,
  GraphicComponent,
  AxisPointerComponent,
  AriaComponent,
} from 'echarts/components'

// Features (for containLabel and transitions in tree-shaken builds)
import { LabelLayout, UniversalTransition, LegacyGridContainLabel } from 'echarts/features'

// Renderer
import { CanvasRenderer } from 'echarts/renderers'

// Register only what we need
echarts.use([
  // Charts
  MapChart,
  LineChart,
  ScatterChart,
  BarChart,
  CustomChart,
  // Components
  GeoComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  TitleComponent,
  DatasetComponent,
  ToolboxComponent,
  GraphicComponent,
  AxisPointerComponent,
  AriaComponent,
  // Features (for containLabel and transitions)
  LabelLayout,
  UniversalTransition,
  LegacyGridContainLabel,
  // Renderer
  CanvasRenderer,
])

export { echarts }
export type { EChartsCoreOption as EChartsOption } from 'echarts/core'
