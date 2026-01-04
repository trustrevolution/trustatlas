'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowRight, BarChart3, Github, Database, AlertCircle, BookOpen, Code } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api, Stats } from '@/lib/api'

// Dynamic imports - defers ECharts bundle until component renders
// ChartWithControls handles lazy loading skeleton internally
const USATrustTimeline = dynamic(
  () => import('@/components/charts/USATrustTimeline'),
  { ssr: false }
)
const RuleLawTrends = dynamic(
  () => import('@/components/charts/RuleLawTrends'),
  { ssr: false }
)
const CovidTrustImpact = dynamic(
  () => import('@/components/charts/CovidTrustImpact'),
  { ssr: false }
)
const TrustCollapse = dynamic(
  () => import('@/components/charts/TrustCollapse'),
  { ssr: false }
)
const TrustInversion = dynamic(
  () => import('@/components/charts/TrustInversion'),
  { ssr: false }
)

// Import provenance directly (dynamic imports strip static properties)
import { usaTrustTimelineProvenance } from '@/components/charts/USATrustTimeline'
import { ruleLawTrendsProvenance } from '@/components/charts/RuleLawTrends'
import { covidTrustImpactProvenance } from '@/components/charts/CovidTrustImpact'
import { trustCollapseProvenance } from '@/components/charts/TrustCollapse'
import { trustInversionProvenance } from '@/components/charts/TrustInversion'

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen">
      <Header fixed wide activePage="home" />

      <main>
      {/* Hero Section */}
      <section className="hero-section">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

        {/* Noise texture overlay */}
        <div className="noise-texture" />

        <div className="hero-content">
          {/* Main headline */}
          <h1 className="hero-title hero-headline">
            Trust is the <span className="italic text-amber-400">invisible</span> infrastructure of society.
          </h1>

          {/* Subhead */}
          <p className="hero-subtitle hero-subhead">
            We&apos;re mapping it.
          </p>

          {/* CTA */}
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

          {/* Stats */}
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

      {/* American Trust Crisis Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-header">
            <span className="story-label text-amber-700">Featured Analysis</span>
            <h2 id={usaTrustTimelineProvenance.id} className="story-title">{usaTrustTimelineProvenance.title}</h2>
            <p className="story-subtitle">{usaTrustTimelineProvenance.subtitle}</p>
          </div>

          <div className="story-chart">
            <USATrustTimeline />
          </div>

          <div className="story-insight insight-box">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Key Insight</h3>
            <p className="text-slate-700 text-sm sm:text-base">
              Partisan trust—how warmly Democrats and Republicans feel toward each other—collapsed
              from <strong>53% in 1978</strong> to just <strong>19% in 2024</strong>.
              This isn&apos;t a temporary dip. It&apos;s a structural transformation in
              American political culture.
            </p>
          </div>
        </div>
      </section>

      {/* Global Rule of Law Section */}
      <section className="story-section story-section-alt">
        <div className="story-container">
          <div className="story-header">
            <span className="story-label text-amber-700">Global Perspective</span>
            <h2 id={ruleLawTrendsProvenance.id} className="story-title">{ruleLawTrendsProvenance.title}</h2>
            <p className="story-subtitle">{ruleLawTrendsProvenance.subtitle}</p>
          </div>

          <div className="story-chart">
            <RuleLawTrends />
          </div>

          <div className="story-insight insight-box-emerald">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Key Insight</h3>
            <p className="text-slate-700 text-sm sm:text-base">
              While over 100 countries declined, <strong>Moldova led all improvers</strong> through
              anti-corruption reforms and EU integration efforts. Estonia continued its
              steady climb to become one of the world&apos;s strongest rule-of-law states.
            </p>
          </div>
        </div>
      </section>

      {/* COVID Trust Impact Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-header">
            <span className="story-label text-amber-700">Open Question</span>
            <h2 id={covidTrustImpactProvenance.id} className="story-title">{covidTrustImpactProvenance.title}</h2>
            <p className="story-subtitle">{covidTrustImpactProvenance.subtitle}</p>
          </div>

          <div className="story-chart">
            <CovidTrustImpact />
          </div>

          <div className="story-insight insight-box">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">What We See</h3>
            <p className="text-slate-700 text-sm sm:text-base">
              Trust fell sharply across much of Europe—the Netherlands, Austria, and Sweden
              all saw significant drops. But <strong>Switzerland, Ireland, and Finland held steady</strong> through
              the same period. Why did some governments maintain trust while others lost it?
            </p>
          </div>
        </div>
      </section>

      {/* Trust Collapse Section */}
      <section className="story-section story-section-alt">
        <div className="story-container">
          <div className="story-header">
            <span className="story-label text-red-700">Historical Pattern</span>
            <h2 id={trustCollapseProvenance.id} className="story-title">{trustCollapseProvenance.title}</h2>
            <p className="story-subtitle">{trustCollapseProvenance.subtitle}</p>
          </div>

          <div className="story-chart">
            <TrustCollapse />
          </div>

          <div className="story-insight border-l-4 border-red-500 bg-red-50 p-4 sm:p-6 rounded-r-lg">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">What Happened</h3>
            <p className="text-slate-700 text-sm sm:text-base">
              Iran dropped 55 points between 2000 and 2007, with a small recovery since.
              Indonesia fell steadily from 52% to 5%. Iraq and Egypt declined through
              years of conflict. The data ends at 2018 for most—we don&apos;t know the current state.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Inversion Section */}
      <section className="story-section">
        <div className="story-container">
          <div className="story-header">
            <span className="story-label text-amber-600">Anomaly</span>
            <h2 id={trustInversionProvenance.id} className="story-title">{trustInversionProvenance.title}</h2>
            <p className="story-subtitle">{trustInversionProvenance.subtitle}</p>
          </div>

          <div className="story-chart">
            <TrustInversion />
          </div>

          <div className="story-insight insight-box">
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">The Paradox</h3>
            <p className="text-slate-700 text-sm sm:text-base">
              In Brazil, only 4% say most people can be trusted—yet 28% trust government.
              Greece, Turkey, and Cyprus show similar patterns. What creates societies where
              strangers distrust each other but still trust institutions?
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="pt-10 pb-12 sm:pt-20 sm:pb-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-12">
            <span className="text-amber-700 font-semibold text-xs sm:text-sm uppercase tracking-wider">
              Our Approach
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-slate-900 mt-2 sm:mt-3 mb-3 sm:mb-6">
              Three Pillars of Trust
            </h2>
            <p className="text-sm sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Open data only—no paywalls, no black boxes.
            </p>
          </div>

          {/* Three primary pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Social Trust */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl sm:text-3xl">🤝</span>
              </div>
              <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">
                Social Trust
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                Do people trust each other? The foundation of social cohesion.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                WVS, EVS, GSS + regional barometers
              </p>
            </div>

            {/* Institutional Trust */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent opacity-50" />
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl sm:text-3xl">🏛️</span>
              </div>
              <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">
                Institutional Trust
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                Do people trust government? And does that trust match reality?
              </p>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Trust-Quality Gap</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The divergence between what citizens believe and how institutions perform is where the story lives.
                </p>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-3">
                WVS + CPI, WGI, WJP, V-Dem
              </p>
            </div>

            {/* Media Trust */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl sm:text-3xl">📰</span>
              </div>
              <h3 className="font-display text-lg sm:text-2xl text-slate-900 mb-2">
                Media Trust
              </h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-3">
                Do people trust the news? Critical for informed democracy.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Reuters DNR, Eurobarometer, WVS
              </p>
            </div>
          </div>

          {/* Supplementary indicators */}
          <div className="bg-slate-100 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6">
            <h3 className="font-display text-base sm:text-lg text-slate-700 mb-4 text-center">
              Supplementary Indicators
            </h3>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200">
                <span className="text-sm">🔬</span>
                <span className="text-xs sm:text-sm text-slate-600">Science Trust</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200">
                <span className="text-sm">🏦</span>
                <span className="text-xs sm:text-sm text-slate-600">Financial Trust</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-slate-200">
                <span className="text-sm">🤖</span>
                <span className="text-xs sm:text-sm text-slate-600">AI/Tech Trust</span>
              </div>
            </div>
            <p className="text-center text-slate-500 text-xs mt-4">
              Additional indicators tracked separately from core pillars
            </p>
          </div>

          <p className="text-center text-slate-500 text-xs sm:text-sm">
            All source data is freely available. See our{' '}
            <Link href="/methodology" className="text-amber-700 hover:underline">
              full methodology
            </Link>{' '}
            for details.
          </p>
        </div>
      </section>

      {/* CTA Footer */}
      <section id="join" className="pt-10 pb-12 sm:pt-20 sm:pb-28 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Headline */}
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
              This project is incomplete.
              <br />
              <span className="text-amber-400">That&apos;s the point.</span>
            </h2>
            <p className="text-base text-slate-400">
              Trust Atlas is open source and open data. Here&apos;s how you can help.
            </p>
          </div>

          {/* Contribution paths */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-10">
            {/* Data sources */}
            <a
              href="https://github.com/trustrevolution/trustatlas/issues/new?template=data-source.md&title=[Data]+New+source+suggestion"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors"
            >
              <Database className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">
                Suggest a data source
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Know a public trust survey we&apos;re missing?
              </p>
            </a>

            {/* Report issues */}
            <a
              href="https://github.com/trustrevolution/trustatlas/issues/new?template=bug-report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors"
            >
              <AlertCircle className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">
                Report an issue
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                See incorrect data or a bug? Let us know.
              </p>
            </a>

            {/* Share expertise */}
            <a
              href="mailto:hello@trustrevolution.co?subject=Trust%20Atlas%20Collaboration"
              className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors"
            >
              <BookOpen className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">
                Share expertise
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Researcher or journalist? We&apos;d love to talk.
              </p>
            </a>

            {/* Contribute code */}
            <a
              href="https://github.com/trustrevolution/trustatlas"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-colors"
            >
              <Code className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base group-hover:text-amber-400 transition-colors">
                Contribute code
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                The entire codebase is open on GitHub.
              </p>
            </a>
          </div>

          {/* Primary CTA */}
          <div className="text-center">
            <a
              href="https://github.com/trustrevolution/trustatlas"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-lg"
            >
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
