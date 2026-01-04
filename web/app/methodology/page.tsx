'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Scale } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header fixed wide activePage="methodology" />

      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <Link href="/" className="page-back-link">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="page-title">Methodology</h1>
          <p className="page-subtitle">
            How we measure trust—transparently, with open data only.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="page-content">
        {/* Beta Notice */}
        <section id="beta" className="mb-16 scroll-mt-32">
          <div className="info-box info-box-amber">
            <div className="flex items-start gap-4">
              <span className="text-2xl">🚧</span>
              <div>
                <h2 className="font-display text-responsive-lg text-slate-900 mb-2">This is a Beta Release</h2>
                <p className="text-slate-700 mb-4">
                  Trust Atlas is under active development. Data coverage is incomplete,
                  methodologies may change, and you&apos;ll likely find rough edges. We&apos;re building
                  in the open because we believe transparency matters—even when things aren&apos;t perfect.
                </p>
                <p className="text-slate-700 mb-4">
                  Found an error? Have a suggestion? Want to contribute data or code?
                </p>
                <a
                  href="https://github.com/trustrevolution/trustatlas/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Open an issue on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Trust Atlas measures trust across four independent dimensions. Each pillar is displayed
            separately—we do <strong>not</strong> combine them into a single composite score.
            All data sources are freely accessible—no paywalls, no proprietary datasets.
          </p>
          <div className="info-box info-box-slate text-sm text-slate-600">
            <strong>Why no composite index?</strong> Survey data is sparse (WVS every ~5 years) while
            governance data is annual. Combining them creates artificial volatility. Individual pillars
            tell clearer stories.
          </div>
        </section>

        {/* Four Pillars */}
        <section className="mb-16">
          <h2 className="section-title mb-8">The Four Pillars</h2>

          {/* Interpersonal */}
          <div className="insight-box mb-10" style={{ borderColor: 'var(--color-pillar-interpersonal)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤝</span>
              <h3 className="font-display text-xl text-slate-900">Interpersonal Trust</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Do people trust each other? Based on the classic survey question:
              &ldquo;Generally speaking, would you say that most people can be trusted, or that you need to be very careful in dealing with people?&rdquo;
            </p>
            <div className="text-sm text-slate-500 mb-3">
              <strong>Sources:</strong> WVS, EVS, GSS, ANES, CES + regional barometers
            </div>
            <div className="info-box info-box-blue text-sm">
              <strong className="text-blue-800">Source hierarchy:</strong>
              <span className="text-blue-700"> WVS-family sources (WVS, EVS, GSS, ANES, CES) take precedence using the same binary
              &ldquo;trust/careful&rdquo; question established by{' '}
              <a href="https://doi.org/10.2307/2095329" className="underline" target="_blank" rel="noopener noreferrer">
                Rosenberg (1956)
              </a>.
              Regional barometers (Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer) fill coverage gaps
              in Africa, Latin America, Asia, and MENA where WVS data is sparse. ETL normalizes variable names and scales.
              ESS is excluded (0-10 scale incompatible with binary).</span>
            </div>
          </div>

          {/* Institutional */}
          <div className="insight-box mb-10" style={{ borderColor: 'var(--color-pillar-institutional)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-display text-xl text-slate-900">Institutional Trust</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Do people trust their government and institutions? Measures confidence in
              national government, parliament, courts, and other public institutions.
            </p>
            <div className="text-sm text-slate-500 mb-3">
              <strong>Sources:</strong> WVS, ANES, CES + regional barometers
            </div>
            <div className="info-box info-box-amber text-sm">
              <strong className="text-amber-800">Source hierarchy:</strong>
              <span className="text-amber-700"> WVS takes precedence globally; ANES and CES provide deep USA/Canada coverage.
              Regional barometers fill gaps where WVS hasn&apos;t surveyed. EVS is excluded for institutional trust
              due to inconsistent variable coverage across waves. ESS and OECD use different scales.</span>
            </div>
          </div>

          {/* Media */}
          <div className="insight-box mb-10" style={{ borderColor: 'var(--color-pillar-media)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📰</span>
              <h3 className="font-display text-xl text-slate-900">Media Trust</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Do people trust the news media? Based on survey questions about trust in news
              and confidence in the press.
            </p>
            <div className="text-sm text-slate-500 mb-3">
              <strong>Sources:</strong> Reuters Digital News Report, Eurobarometer, WVS
            </div>
            <div className="info-box text-sm" style={{ backgroundColor: 'rgb(238 242 255)', borderColor: 'rgb(199 210 254)' }}>
              <strong className="text-indigo-800">Weighted average:</strong>
              <span className="text-indigo-700"> Reuters DNR (40%) + Eurobarometer (40%) + WVS (20%).
              Reuters DNR is the primary global source with standardized methodology since 2015.
              Eurobarometer provides annual EU coverage. WVS supplements with historical depth
              back to 1981. Missing sources have weights redistributed proportionally.</span>
            </div>
          </div>

          {/* Governance */}
          <div className="insight-box-emerald mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚖️</span>
              <h3 className="font-display text-xl text-slate-900">Governance Quality</h3>
            </div>
            <p className="text-slate-600 mb-4">
              How trustworthy are institutions objectively? Expert assessments of corruption,
              rule of law, and government effectiveness serve as a proxy for institutional integrity.
            </p>
            <div className="text-sm text-slate-500">
              <strong>Sources:</strong> Transparency International CPI, World Bank WGI, WJP Rule of Law Index, Freedom House, V-Dem
            </div>
            <div className="info-box info-box-slate mt-4 text-sm">
              <strong>Weighted average:</strong> CPI (20%) + WGI (20%) + WJP (20%) + WJP-Corruption (20%) + Freedom House (10%) + V-Dem (10%)
              <div className="text-xs text-slate-500 mt-1">Missing sources have weights redistributed proportionally</div>
            </div>
          </div>
        </section>

        {/* Why Independent Pillars */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Why Independent Pillars?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Many trust indices combine multiple measures into a single composite score. We deliberately
            chose not to. Here&apos;s why:
          </p>
          <div className="space-y-4 mb-6">
            <div className="info-box info-box-blue">
              <div className="font-semibold text-slate-900 mb-2">
                Different Data Rhythms
              </div>
              <p className="text-sm text-slate-600">
                Survey data (WVS, GSS) is collected every 5-7 years. Governance data (CPI, WGI) is annual.
                Combining them creates artificial volatility—a country&apos;s &ldquo;trust score&rdquo; would
                swing wildly based on which data source updated most recently.
              </p>
            </div>
            <div className="info-box info-box-emerald">
              <div className="font-semibold text-slate-900 mb-2">
                Different Constructs
              </div>
              <p className="text-sm text-slate-600">
                &ldquo;Do you trust your neighbor?&rdquo; and &ldquo;Is the government corrupt?&rdquo;
                measure fundamentally different things. Research shows a{' '}
                <a
                  href="https://link.springer.com/chapter/10.1007/978-3-030-66018-5_2"
                  className="text-amber-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  &ldquo;trust paradox&rdquo;
                </a>
                —some societies show high interpersonal trust despite low governance scores.
                Averaging them obscures this insight.
              </p>
            </div>
            <div className="info-box info-box-slate">
              <div className="font-semibold text-slate-900 mb-2">
                Clearer Stories
              </div>
              <p className="text-sm text-slate-600">
                A country with high interpersonal trust but low institutional trust tells a different
                story than one with the opposite pattern. Separate pillars let researchers and
                journalists see these nuances instead of burying them in a single number.
              </p>
            </div>
          </div>
        </section>

        {/* Data Confidence */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Data Confidence</h2>
          <p className="text-slate-600 mb-6">
            Not all data is equally reliable. We show a confidence indicator and &ldquo;likely range&rdquo;
            for each score so you know how much weight to give it.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="info-box info-box-emerald">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-800">High confidence</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Recent survey data (within 3 years). This is our best data.
              </p>
              <div className="text-xs text-emerald-700 font-medium">
                Likely range: ±5 points
              </div>
            </div>
            <div className="info-box info-box-amber">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-semibold text-amber-800">Moderate confidence</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Older survey data (3-7 years). Still useful, but conditions may have changed.
              </p>
              <div className="text-xs text-amber-700 font-medium">
                Likely range: ±10 points
              </div>
            </div>
            <div className="info-box info-box-slate">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="font-semibold text-slate-700">Estimate</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Based on governance indicators only—no direct survey data available.
              </p>
              <div className="text-xs text-slate-500 font-medium">
                Likely range: ±15 points
              </div>
            </div>
          </div>
          <div className="info-box info-box-slate mt-6 text-sm text-slate-600">
            <strong>What&apos;s a &ldquo;likely range&rdquo;?</strong> It&apos;s the window where the true value
            probably falls. If Russia shows 24% with a range of 19-29, the actual level of interpersonal
            trust is most likely somewhere in that band. When comparing countries, overlapping ranges mean
            we can&apos;t confidently say which is higher.
          </div>
        </section>

        {/* Normalization */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Normalization</h2>
          <p className="text-slate-600 mb-4">
            All scores are normalized to a 0-100 scale for easy comparison:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-2">
            <li>Survey percentages (WVS, GSS, etc.) — used directly (already 0-100)</li>
            <li>CPI scores — used directly (already 0-100)</li>
            <li>WGI scores (-2.5 to +2.5) — rescaled: <code className="bg-slate-100 px-1 rounded">((x + 2.5) / 5) × 100</code></li>
            <li>WJP Rule of Law Index — used directly (already 0-100)</li>
          </ul>
        </section>

        {/* Data Sources */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Data Sources</h2>
          <p className="text-slate-600 mb-6">
            We collect data from many sources but apply strict methodology rules for the four pillars
            shown on the Explore page. Other sources remain available for stories and deeper analysis.
          </p>

          {/* Pillar sources */}
          <h3 className="font-semibold text-slate-900 mb-3">Used for Pillar Scores</h3>
          <p className="text-sm text-slate-600 mb-4">
            These sources power the Explore page. We use only methodologically compatible surveys
            to ensure scores are comparable across countries and time.
          </p>

          {/* Survey pillars */}
          <div className="info-box info-box-blue mb-4">
            <div className="font-medium text-blue-800 mb-2">Interpersonal &amp; Institutional Trust</div>
            <p className="text-sm text-blue-700 mb-3">
              WVS-family surveys only—identical question wording and response scales:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>World Values Survey (WVS) — 108 countries, 1981-2023</li>
              <li>European Values Study (EVS) — 47 countries, 1981-2021 <span className="text-blue-500">(interpersonal only)</span></li>
              <li>General Social Survey (GSS) — USA, 1972-2024</li>
              <li>American National Election Studies (ANES) — USA, 1958-2024</li>
              <li>Canadian Election Study (CES) — Canada, 2008-2021</li>
            </ul>
          </div>

          {/* Media */}
          <div className="info-box mb-4" style={{ backgroundColor: 'rgb(238 242 255)', borderColor: 'rgb(199 210 254)' }}>
            <div className="font-medium text-indigo-800 mb-2">Media Trust</div>
            <ul className="text-sm text-indigo-700 list-disc list-inside space-y-1">
              <li>Reuters Digital News Report — 47 countries, 2015-2025</li>
              <li>Standard Eurobarometer — 32 EU countries, 2024</li>
              <li>World Values Survey (press confidence) — 100+ countries, 1981-2023</li>
            </ul>
          </div>

          {/* Governance */}
          <div className="info-box info-box-emerald mb-6">
            <div className="font-medium text-emerald-800 mb-2">Governance Quality</div>
            <ul className="text-sm text-emerald-700 list-disc list-inside space-y-1">
              <li>Transparency International CPI — 180+ countries, 2012-2024</li>
              <li>World Bank WGI — 206 countries, 2008-2023</li>
              <li>World Justice Project Rule of Law Index — 142 countries, 2012-2024</li>
              <li>Freedom House — 189 countries, 2013-2024</li>
              <li>V-Dem — 176 countries, 2000-2024</li>
            </ul>
          </div>

          {/* Additional sources */}
          <h3 className="font-semibold text-slate-900 mb-3">Additional Sources (Stories &amp; Analysis)</h3>
          <p className="text-sm text-slate-600 mb-4">
            These sources aren&apos;t used for pillar scores due to methodology differences, but we use them
            for featured stories and deeper analysis where single-source consistency matters more than
            cross-country comparability.
          </p>

          <div className="info-box info-box-slate mb-4">
            <div className="font-medium text-slate-700 mb-2">Regional Surveys</div>
            <p className="text-sm text-slate-500 mb-2">
              Barometers are now integrated as supplementary sources (v0.7.0):
            </p>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>Afrobarometer — 39 African countries <span className="text-emerald-600">✓ Integrated</span></li>
              <li>Arab Barometer — 12 MENA countries <span className="text-emerald-600">✓ Integrated</span></li>
              <li>Asian Barometer — 15 Asian countries <span className="text-emerald-600">✓ Integrated</span></li>
              <li>Latinobarómetro — 18 Latin American countries <span className="text-emerald-600">✓ Integrated</span></li>
              <li>LAPOP AmericasBarometer — 34 countries <span className="text-slate-400">(planned)</span></li>
              <li>European Social Survey (ESS) — 30+ countries <span className="text-slate-400">(excluded: 0-10 scale)</span></li>
            </ul>
          </div>

          {/* Restricted access */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="font-medium text-amber-800 mb-2">Restricted Access Sources</div>
            <p className="text-sm text-amber-700 mb-3">
              Core microdata has access restrictions, but free alternatives exist:
            </p>
            <ul className="text-sm text-slate-700 space-y-3">
              <li>
                <strong className="text-amber-800">Gallup World Poll</strong> — subscription required for full microdata
                <ul className="text-xs text-slate-500 list-disc list-inside ml-4 mt-1">
                  <li>Free: Briq GPS (trust, 76 countries), World Risk Poll (142+ countries)</li>
                  <li>Academic: Available via Harvard, Yale, Penn, UVA libraries</li>
                </ul>
              </li>
              <li>
                <strong className="text-amber-800">Edelman Trust Barometer</strong> — public reports available
                <ul className="text-xs text-slate-500 list-disc list-inside ml-4 mt-1">
                  <li>Free: Annual PDF reports, dashboard exports</li>
                  <li>Microdata: Contact trustinstitute@edelman.com</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        {/* Licensing */}
        <section className="mb-16">
          <div className="section-header">
            <Scale className="section-header-icon text-amber-600" />
            <h2 className="section-title">Licensing &amp; Attribution</h2>
          </div>
          <div className="info-box info-box-amber">
            <p className="text-slate-700 mb-4">
              Trust Atlas is licensed under <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong>.
              You may share and adapt the data for any purpose, even commercially, with attribution.
            </p>
            <p className="text-slate-600 mb-4">
              Each data source has its own licensing terms. Some restrict commercial use or require specific citations.
            </p>
            <Link
              href="/attribution"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium"
            >
              View full attribution &amp; citation requirements →
            </Link>
          </div>
        </section>

        {/* API Access */}
        <section className="mb-16">
          <h2 className="section-title mb-4">API Access</h2>
          <p className="text-slate-600 mb-4">
            All Trust Atlas data is available via our public API:
          </p>
          <div className="code-block space-y-2">
            <div>GET /countries — List all countries</div>
            <div>GET /country/:iso3 — Time series for a country</div>
            <div>GET /trends/global?pillar= — Latest scores by pillar (for map)</div>
            <div>GET /trends/regions?pillar= — Regional averages</div>
            <div>GET /trends/country/:iso3 — Country trends</div>
            <div>GET /stats — Database statistics</div>
            <div>GET /methodology — Methodology as JSON</div>
            <div>GET /sources — Source metadata including licenses</div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Source code available on{' '}
            <a
              href="https://github.com/trustrevolution/trustatlas"
              className="text-amber-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>.
          </p>
        </section>

        {/* Version */}
        <section className="border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Methodology version 0.7.0 — Last updated January 2026
          </p>
          <p className="text-xs text-slate-400 mt-2">
            v0.7.0: Integrated regional barometers (Afrobarometer, Latinobarometer, Asian Barometer, Arab Barometer) as supplementary sources. 19,000+ observations across 210 countries.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
