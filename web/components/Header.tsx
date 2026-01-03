'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Menu, X } from 'lucide-react'

interface HeaderProps {
  fixed?: boolean
  wide?: boolean
  activePage?: 'home' | 'explore' | 'methodology'
}

export default function Header({ fixed = false, wide = false, activePage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navClass = fixed
    ? 'fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800'
    : 'flex-shrink-0 bg-slate-950 border-b border-slate-800'

  const containerClass = wide
    ? 'px-4 sm:px-6 h-[var(--header-height)] flex items-center justify-between'
    : 'max-w-6xl mx-auto px-4 sm:px-6 h-[var(--header-height)] flex items-center justify-between'

  const linkClass = (page: string) =>
    activePage === page
      ? 'text-white text-sm sm:text-base font-medium'
      : 'text-slate-300 hover:text-white transition-colors text-sm sm:text-base font-medium'

  return (
    <nav className={navClass}>
      <div className={containerClass}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="font-display text-lg sm:text-2xl text-white tracking-tight">
            Trust Atlas
          </Link>
          <Link href="/methodology#beta" className="badge-beta">
            Beta
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/explore" className={linkClass('explore')}>
            Explore
          </Link>
          <Link href="/methodology" className={linkClass('methodology')}>
            Methodology
          </Link>
          <a
            href="https://trustrevolution.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition-colors text-sm sm:text-base font-medium flex items-center gap-1"
          >
            Podcast
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-3 -mr-3 text-slate-300 hover:text-white touch-target"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-950">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/explore"
              className={`block ${linkClass('explore')}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="/methodology"
              className={`block ${linkClass('methodology')}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Methodology
            </Link>
            <a
              href="https://trustrevolution.co"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Podcast
              <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
