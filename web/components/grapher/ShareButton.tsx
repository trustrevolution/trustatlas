'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { copyToClipboard } from '@/lib/export'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  url?: string
  className?: string
}

export function ShareButton({ url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    // Try native share API on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trust Atlas',
          text: 'Explore trust data across countries',
          url: shareUrl,
        })
        return
      } catch {
        // Fall through to clipboard copy
      }
    }

    // Copy to clipboard
    const success = await copyToClipboard(shareUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium',
        'bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors',
        className
      )}
      aria-label={copied ? 'Link copied' : 'Share this chart'}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </>
      )}
    </button>
  )
}

export default ShareButton
