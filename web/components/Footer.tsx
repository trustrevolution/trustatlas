'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export default function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="py-3 bg-slate-950 border-t border-slate-800 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            Trust Atlas — An open-source project from{' '}
            <a
              href="https://trustrevolution.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition-colors hover:text-trust-revolution"
            >
              Trust Revolution
            </a>
          </p>
        </div>
      </footer>
    )
  }

  return (
    <footer className="py-10 bg-slate-950 border-t border-slate-800 flex-shrink-0">
      <div className="max-w-6xl mx-auto px-6">
        {/* Secondary navigation */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
          <Link
            href="/attribution"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Data Attribution
          </Link>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <Link
            href="/api"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            API
          </Link>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <a
            href="https://github.com/trustrevolution/trustatlas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
          >
            GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-medium text-slate-400">
              CC BY-SA 4.0
            </span>
          </a>
        </div>

        {/* Main credit */}
        <p className="text-slate-500 text-sm text-center">
          Trust Atlas — An open-source project from{' '}
          <a
            href="https://trustrevolution.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 transition-colors hover:text-trust-revolution"
          >
            Trust Revolution
          </a>
        </p>
      </div>
    </footer>
  )
}
