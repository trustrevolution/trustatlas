'use client'

import { useState, useEffect, useMemo, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, BarChart3, Github, Database, AlertCircle, BookOpen, Code } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ExpandableStoryCard from '@/components/ExpandableStoryCard'
import { api, Stats } from '@/lib/api'
import type { ChartProvenance } from '@/components/data-provenance'

// Provenance imports (also trigger prefetch when imported)
import { usaTrustTimelineProvenance } from '@/components/charts/USATrustTimeline'
import { ruleLawTrendsProvenance } from '@/components/charts/RuleLawTrends'
import { covidTrustImpactProvenance } from '@/components/charts/CovidTrustImpact'
import { trustCollapseProvenance } from '@/components/charts/TrustCollapse'
import { trustInversionProvenance } from '@/components/charts/TrustInversion'
import { financialTrustParadoxProvenance } from '@/components/charts/FinancialTrustParadox'

// Story configuration type
interface StoryConfig {
  id: string
  provenance: ChartProvenance
  label: string
  labelColor: string
  insightTitle: string
  insight: ReactNode
  insightBoxClass?: string
  Chart: React.ComponentType
}

// All stories configuration with lazy-loaded charts
const STORIES: StoryConfig[] = [
  {
    id: 'usa-timeline',
    provenance: usaTrustTimelineProvenance,
    label: 'Trend Analysis',
    labelColor: 'text-amber-700',
    insightTitle: 'Key Insight',
    insight: (
      <p>
        Partisan trust—how warmly Democrats and Republicans feel toward each other—collapsed
        from <strong>53% in 1978</strong> to just <strong>19% in 2024</strong>.
        This isn&apos;t a temporary dip. It&apos;s a structural transformation in American political culture.
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/USATrustTimeline'), { ssr: false }),
  },
  {
    id: 'rule-of-law',
    provenance: ruleLawTrendsProvenance,
    label: 'Global Perspective',
    labelColor: 'text-amber-700',
    insightTitle: 'Key Insight',
    insight: (
      <p>
        While over 100 countries declined, <strong>Moldova led all improvers</strong> through
        anti-corruption reforms and EU integration efforts. Estonia continued its
        steady climb to become one of the world&apos;s strongest rule-of-law states.
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/RuleLawTrends'), { ssr: false }),
  },
  {
    id: 'covid-impact',
    provenance: covidTrustImpactProvenance,
    label: 'Open Question',
    labelColor: 'text-amber-700',
    insightTitle: 'What We See',
    insight: (
      <p>
        Trust fell sharply across much of Europe—the Netherlands, Austria, and Sweden
        all saw significant drops. But <strong>Switzerland, Ireland, and Finland held steady</strong> through
        the same period. Why did some governments maintain trust while others lost it?
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/CovidTrustImpact'), { ssr: false }),
  },
  {
    id: 'trust-collapse',
    provenance: trustCollapseProvenance,
    label: 'Historical Pattern',
    labelColor: 'text-red-700',
    insightTitle: 'What Happened',
    insightBoxClass: 'border-l-4 border-red-500 bg-red-50 p-4 sm:p-6 rounded-r-lg',
    insight: (
      <p>
        Iran dropped 55 points between 2000 and 2007, with a small recovery since.
        Indonesia fell steadily from 52% to 5%. Iraq and Egypt declined through
        years of conflict. The data ends at 2018 for most—we don&apos;t know the current state.
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/TrustCollapse'), { ssr: false }),
  },
  {
    id: 'trust-inversion',
    provenance: trustInversionProvenance,
    label: 'Anomaly',
    labelColor: 'text-amber-600',
    insightTitle: 'The Paradox',
    insight: (
      <p>
        In Brazil, only 4% say most people can be trusted—yet 28% trust government.
        Greece, Turkey, and Cyprus show similar patterns. What creates societies where
        strangers distrust each other but still trust institutions?
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/TrustInversion'), { ssr: false }),
  },
  {
    id: 'financial-paradox',
    provenance: financialTrustParadoxProvenance,
    label: 'Paradox',
    labelColor: 'text-emerald-600',
    insightTitle: 'The 2008 Hangover',
    insight: (
      <p>
        Australia (12%), USA (10%), UK (14%)—the countries with the best-regulated
        banking systems have the least trust in banks. China (91%) and Vietnam (94%)
        lead the world. State-controlled systems with implicit guarantees vs.
        post-crisis skepticism in democracies.
      </p>
    ),
    Chart: dynamic(() => import('@/components/charts/FinancialTrustParadox'), { ssr: false }),
  },
]

// Week-based deterministic rotation (same heroes all week, rotates automatically)
function getWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

function selectHeroStories(stories: StoryConfig[]): { heroes: StoryConfig[]; cards: StoryConfig[] } {
  const week = getWeekNumber()
  const offset = week % stories.length
  const heroIndices = new Set([offset, (offset + 1) % stories.length])

  const heroes = stories.filter((_, i) => heroIndices.has(i))
  const cards = stories.filter((_, i) => !heroIndices.has(i))

  return { heroes, cards }
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null)

  // Week-based hero selection (deterministic, rotates weekly)
  const { heroes: heroStories, cards: cardStories } = useMemo(() => selectHeroStories(STORIES), [])

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error)
    // Check URL hash to auto-expand matching story
    const hash = window.location.hash.slice(1)
    if (hash) {
      setExpandedStoryId(hash)
    }
  }, [])

  return (
    <div className="min-h-screen">
      <Header fixed wide activePage="home" />

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
          <div className="noise-texture" />
          <div className="hero-content">
            <h1 className="hero-title hero-headline">
              Trust is the <span className="italic text-amber-400">invisible</span> infrastructure of society.
            </h1>
            <p className="hero-subtitle hero-subhead">We&apos;re mapping it.</p>
            <div className="hero-actions hero-cta">
              <Link href="/explore" className="btn-primary-lg">
                <BarChart3 className="w-5 h-5" />
                Explore the atlas
              </Link>
              <Link href="#join" className="btn-link">
                Join the project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hero-stats-bar hero-stats">
              <div className="hero-stats-grid">
                <div className="text-center">
                  <span className="hero-stat-value">{stats?.countries.toLocaleString() ?? '—'}</span>
                  <span className="hero-stat-label">countries</span>
                </div>
                <div className="text-center">
                  <span className="hero-stat-value">{stats?.observations.toLocaleString() ?? '—'}</span>
                  <span className="hero-stat-label">observations</span>
                </div>
                <div className="text-center">
                  <span className="hero-stat-value">{stats?.sources ?? '—'}</span>
                  <span className="hero-stat-label">sources</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Stories (2 randomly selected) */}
        {heroStories.map((story, index) => (
          <section key={story.id} id={story.provenance.id} className={`story-section scroll-mt-16 ${index % 2 === 1 ? 'story-section-alt' : ''}`}>
            <div className="story-container">
              <div className="story-header">
                <span className={`story-label ${story.labelColor}`}>{story.label}</span>
                <h2 className="story-title">{story.provenance.title}</h2>
                <p className="story-subtitle">{story.provenance.subtitle}</p>
              </div>
              <div className="story-chart">
                <story.Chart />
              </div>
              <div className={`story-insight ${story.insightBoxClass || (index % 2 === 0 ? 'insight-box' : 'insight-box-emerald')}`}>
                <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">{story.insightTitle}</h3>
                <div className="text-slate-700 text-sm sm:text-base">{story.insight}</div>
              </div>
            </div>
          </section>
        ))}

        {/* Expandable Stories Section (remaining 4) */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl text-slate-900">More Data Stories</h2>
              <p className="text-slate-600 mt-2">Click to expand</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {cardStories.map((story) => (
                <ExpandableStoryCard
                  key={story.id}
                  provenance={story.provenance}
                  label={story.label}
                  labelColor={story.labelColor}
                  insightTitle={story.insightTitle}
                  insightBoxClass={story.insightBoxClass}
                  insight={story.insight}
                  defaultExpanded={expandedStoryId === story.provenance.id}
                >
                  <story.Chart />
                </ExpandableStoryCard>
              ))}
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section className="pt-10 pb-12 sm:pt-20 sm:pb-28 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-12">
              <span className="text-amber-700 font-semibold text-xs sm:text-sm uppercase tracking-wider">Our Approach</span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-slate-900 mt-2 sm:mt-3 mb-3 sm:mb-6">
                Three Pillars of Trust
              </h2>
              <p className="text-sm sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Open data only—no paywalls, no black boxes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm text-center sm:text-left">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <span className="text-2xl sm:text-3xl">🤝</span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">Social</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                  Do people trust each other? The foundation of social cohesion.
                </p>
                <p className="text-slate-400 text-xs sm:text-sm">WVS, EVS, GSS + regional barometers</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden text-center sm:text-left">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent opacity-50" />
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <span className="text-2xl sm:text-3xl">🏛️</span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">Institutional</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                  Do people trust government? And does that trust match reality?
                </p>
                <p className="text-slate-400 text-xs sm:text-sm">WVS + CPI, WGI, WJP, V-Dem</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm text-center sm:text-left">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <span className="text-2xl sm:text-3xl">📰</span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">Media</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                  Do people trust the news? Critical for informed democracy.
                </p>
                <p className="text-slate-400 text-xs sm:text-sm">Reuters DNR, Eurobarometer, WVS</p>
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6">
              <h3 className="font-display text-base sm:text-lg text-slate-700 mb-4 text-center">Supplementary Indicators</h3>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200 opacity-60">
                  <span className="text-sm">🔬</span>
                  <span className="text-xs sm:text-sm text-slate-600">Science</span>
                  <span className="text-[10px] text-slate-400 font-medium">Soon</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200">
                  <span className="text-sm">🏦</span>
                  <span className="text-xs sm:text-sm text-slate-600">Financial</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200 opacity-60">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs sm:text-sm text-slate-600">Tech</span>
                  <span className="text-[10px] text-slate-400 font-medium">Soon</span>
                </div>
              </div>
              <p className="text-center text-slate-500 text-xs mt-4">Additional indicators tracked separately from core pillars</p>
            </div>

            <p className="text-center text-slate-500 text-xs sm:text-sm">
              All source data is freely available. See our{' '}
              <Link href="/methodology" className="text-amber-700 hover:underline">full methodology</Link> for details.
            </p>
          </div>
        </section>

        {/* CTA Footer */}
        <section id="join" className="pt-10 pb-12 sm:pt-20 sm:pb-28 bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
                This project is incomplete.<br />
                <span className="text-amber-400">That&apos;s the point.</span>
              </h2>
              <p className="text-base text-slate-400">Trust Atlas is open source and open data. Here&apos;s how you can help.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-10">
              <a href="https://github.com/trustrevolution/trustatlas/issues/new?template=data-source.md&title=[Data]+New+source+suggestion" target="_blank" rel="noopener noreferrer" className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors">
                <Database className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">Suggest a data source</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Know a public trust survey we&apos;re missing?</p>
              </a>
              <a href="https://github.com/trustrevolution/trustatlas/issues/new?template=bug-report.md" target="_blank" rel="noopener noreferrer" className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors">
                <AlertCircle className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">Report an issue</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">See incorrect data or a bug? Let us know.</p>
              </a>
              <a href="mailto:hello@trustrevolution.co?subject=Trust%20Atlas%20Collaboration" className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors">
                <BookOpen className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">Share expertise</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">Researcher or journalist? We&apos;d love to talk.</p>
              </a>
              <a href="https://github.com/trustrevolution/trustatlas" target="_blank" rel="noopener noreferrer" className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors">
                <Code className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">Contribute code</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">The entire codebase is open on GitHub.</p>
              </a>
            </div>

            <div className="text-center">
              <a href="https://github.com/trustrevolution/trustatlas" target="_blank" rel="noopener noreferrer" className="btn-primary-lg">
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
