'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ChartProvenance } from '@/components/data-provenance'

interface StoryCardProps {
  provenance: ChartProvenance
  label: string
  labelColor?: string
  href: string
}

export default function StoryCard({ provenance, label, labelColor = 'text-amber-700', href }: StoryCardProps) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all"
    >
      <span className={`text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
        {label}
      </span>
      <h3 className="font-display text-lg text-slate-900 mt-2 mb-2 group-hover:text-amber-700 transition-colors">
        {provenance.title}
      </h3>
      <p className="text-slate-600 text-sm line-clamp-2 mb-3">
        {provenance.subtitle}
      </p>
      <span className="inline-flex items-center gap-1 text-sm text-amber-700 font-medium group-hover:gap-2 transition-all">
        View story
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  )
}
