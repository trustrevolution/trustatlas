'use client'

import { useState, useCallback, useEffect, type RefObject } from 'react'

interface UseFullscreenReturn {
  isFullscreen: boolean
  isSupported: boolean
  enterFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  toggleFullscreen: () => Promise<void>
}

export function useFullscreen(elementRef: RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isSupported = typeof document !== 'undefined' && 'fullscreenEnabled' in document

  const enterFullscreen = useCallback(async () => {
    if (!elementRef.current || !isSupported) return

    try {
      await elementRef.current.requestFullscreen()
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
    }
  }, [elementRef, isSupported])

  const exitFullscreen = useCallback(async () => {
    if (!isSupported) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
    }
  }, [isSupported])

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  // Listen for fullscreen changes
  useEffect(() => {
    if (!isSupported) return

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [isSupported])

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}

export default useFullscreen
