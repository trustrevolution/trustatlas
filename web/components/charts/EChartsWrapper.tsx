'use client'

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { ECharts, EChartsOption } from 'echarts'
import type { EChartsReactProps } from 'echarts-for-react'

export type EChartsWrapperProps = EChartsReactProps

export interface EChartsWrapperRef {
  getEchartsInstance: () => ECharts | undefined
}

/**
 * Minimal ECharts wrapper that handles React StrictMode properly.
 *
 * echarts-for-react has a bug where componentWillUnmount calls
 * resizeObserver.disconnect() without optional chaining, causing errors
 * during StrictMode's double-mount cycle.
 *
 * This wrapper uses ECharts directly with proper cleanup guards.
 */
export const EChartsWrapper = forwardRef<EChartsWrapperRef, EChartsWrapperProps>(
  function EChartsWrapper({ echarts: echartsLib, option, style, opts, notMerge, onEvents }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<ECharts | null>(null)

    // Expose getEchartsInstance for PNG export
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => chartRef.current ?? undefined,
    }))

    // Initialize chart
    useEffect(() => {
      if (!containerRef.current || !echartsLib) return

      // Create chart instance
      const chart = echartsLib.init(containerRef.current, undefined, opts)
      chartRef.current = chart

      // Set option
      chart.setOption(option as EChartsOption, notMerge)

      // Bind events
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, handler]) => {
          if (handler) {
            chart.on(eventName, handler)
          }
        })
      }

      // Resize handler
      const handleResize = () => chart.resize()
      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize)
        // Guard against StrictMode double-unmount
        if (chartRef.current) {
          chartRef.current.dispose()
          chartRef.current = null
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- option/notMerge/onEvents handled in separate effect
    }, [echartsLib, opts])

    // Update option when it changes
    useEffect(() => {
      if (chartRef.current && option) {
        chartRef.current.setOption(option as EChartsOption, notMerge)
      }
    }, [option, notMerge])

    return <div ref={containerRef} style={style} />
  }
)

export default EChartsWrapper
