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
            Trust Atlas measures trust across three primary dimensions, with the
            <strong> Trust-Quality Gap</strong>—the divergence between what citizens believe
            about institutions and how those institutions actually perform—as a key derived insight.
            All data sources are freely accessible—no paywalls, no proprietary datasets.
          </p>
          <div className="info-box info-box-amber text-sm text-slate-600">
            <strong>The Trust-Quality Gap</strong> is where the story lives. When citizens trust
            institutions that are corrupt, or distrust institutions that perform well—that&apos;s
            the signal worth investigating.
          </div>
        </section>

        {/* Three Pillars */}
        <section className="mb-16">
          <h2 className="section-title mb-8">The Three Pillars</h2>

          {/* Social Trust */}
          <div className="insight-box mb-10" style={{ borderColor: 'var(--color-pillar-interpersonal)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤝</span>
              <h3 className="font-display text-xl text-slate-900">Social Trust</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Do people trust each other? The foundation of social cohesion. Based on the classic survey question:
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

          {/* Institutional Trust */}
          <div className="insight-box mb-10" style={{ borderColor: 'var(--color-pillar-institutional)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-display text-xl text-slate-900">Institutional Trust</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Do people trust their government and institutions? This pillar combines two complementary measures:
              <strong> citizen perception</strong> (survey-based institutional trust) and
              <strong> institutional performance</strong> (expert-assessed governance quality).
            </p>

            {/* Trust-Quality Gap callout */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡</span>
                <span className="font-semibold text-amber-900">Trust-Quality Gap</span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                The gap between institutional trust and governance quality reveals critical patterns:
                <strong> naive trust</strong> (citizens trust corrupt institutions) or
                <strong> cynical distrust</strong> (citizens distrust well-performing institutions).
                This derived metric is often more informative than either measure alone.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="info-box info-box-amber text-sm">
                <strong className="text-amber-800">Citizen Perception</strong>
                <p className="text-amber-700 mt-1">
                  Survey-based confidence in government, parliament, courts. Sources: WVS, ANES, CES + regional barometers.
                </p>
              </div>
              <div className="info-box info-box-emerald text-sm">
                <strong className="text-emerald-800">Institutional Performance</strong>
                <p className="text-emerald-700 mt-1">
                  Expert assessments of corruption, rule of law, government effectiveness.
                  Sources: CPI, WGI, WJP, Freedom House, V-Dem.
                </p>
              </div>
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

        </section>

        {/* Supplementary Indicators */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Supplementary Indicators</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Beyond the three core pillars, we track additional trust dimensions as supplementary
            indicators. These are not included in pillar calculations but provide valuable context.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="info-box info-box-slate">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🔬</span>
                <strong className="text-slate-800">Science Trust</strong>
              </div>
              <p className="text-sm text-slate-600">
                Trust in scientists and scientific institutions. Sources: Wellcome Global Monitor, WVS.
              </p>
            </div>
            <div className="info-box info-box-slate">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏦</span>
                <strong className="text-slate-800">Financial Trust</strong>
              </div>
              <p className="text-sm text-slate-600">
                Confidence in banks and financial institutions. Sources: WVS E069_12, LiTS.
              </p>
            </div>
            <div className="info-box info-box-slate">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤖</span>
                <strong className="text-slate-800">AI/Tech Trust</strong>
              </div>
              <p className="text-sm text-slate-600">
                Emerging area. Trust in technology companies and AI systems. Sources: Under development.
              </p>
            </div>
          </div>
        </section>

        {/* Why This Architecture */}
        <section className="mb-16">
          <h2 className="section-title mb-4">Why This Architecture?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Many trust indices combine multiple measures into a single composite score. We chose a
            different approach—three independent pillars with the Trust-Quality Gap as a derived insight.
          </p>
          <div className="space-y-4 mb-6">
            <div className="info-box info-box-amber">
              <div className="font-semibold text-slate-900 mb-2">
                The Gap Is The Story
              </div>
              <p className="text-sm text-slate-600">
                When citizens trust corrupt institutions (naive trust) or distrust well-performing
                ones (cynical distrust), that divergence reveals something important about a society.
                Combining institutional trust and governance quality into a single number would obscure
                this critical insight.
              </p>
            </div>
            <div className="info-box info-box-blue">
              <div className="font-semibold text-slate-900 mb-2">
                Different Data Rhythms
              </div>
              <p className="text-sm text-slate-600">
                Survey data (WVS, GSS) is collected every 5-7 years. Governance data (CPI, WGI) is annual.
                Keeping them as separate inputs to the Institutional Trust pillar lets us track the gap
                over time without artificial volatility.
              </p>
            </div>
            <div className="info-box info-box-slate">
              <div className="font-semibold text-slate-900 mb-2">
                Clearer Stories
              </div>
              <p className="text-sm text-slate-600">
                A country with high social trust but low institutional trust tells a different
                story than one with the opposite pattern. Three pillars plus gap analysis gives
                researchers and journalists the tools to see these nuances.
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

          {/* Social Trust */}
          <div className="info-box info-box-blue mb-4">
            <div className="font-medium text-blue-800 mb-2">Social Trust</div>
            <p className="text-sm text-blue-700 mb-3">
              WVS-family surveys only—identical question wording and response scales:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>World Values Survey (WVS) — 108 countries, 1981-2023</li>
              <li>European Values Study (EVS) — 47 countries, 1981-2021</li>
              <li>General Social Survey (GSS) — USA, 1972-2024</li>
              <li>American National Election Studies (ANES) — USA, 1958-2024</li>
              <li>Canadian Election Study (CES) — Canada, 2008-2021</li>
            </ul>
          </div>

          {/* Institutional Trust */}
          <div className="info-box info-box-amber mb-4">
            <div className="font-medium text-amber-800 mb-2">Institutional Trust (Citizen Perception + Governance Quality)</div>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2">CITIZEN PERCEPTION</p>
                <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                  <li>World Values Survey (WVS) — 108 countries</li>
                  <li>ANES — USA, 1958-2024</li>
                  <li>CES — Canada, 2008-2021</li>
                  <li>Regional barometers</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2">GOVERNANCE QUALITY</p>
                <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                  <li>Transparency International CPI — 180+ countries</li>
                  <li>World Bank WGI — 206 countries</li>
                  <li>WJP Rule of Law Index — 142 countries</li>
                  <li>Freedom House, V-Dem</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="info-box mb-6" style={{ backgroundColor: 'rgb(238 242 255)', borderColor: 'rgb(199 210 254)' }}>
            <div className="font-medium text-indigo-800 mb-2">Media Trust</div>
            <ul className="text-sm text-indigo-700 list-disc list-inside space-y-1">
              <li>Reuters Digital News Report — 47 countries, 2015-2025</li>
              <li>Standard Eurobarometer — 32 EU countries, 2024</li>
              <li>World Values Survey (press confidence) — 100+ countries, 1981-2023</li>
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
            <div>GET /trends/countries?iso3=&amp;pillar= — Multi-country trends (max 20)</div>
            <div>GET /trends/regions?pillar= — Regional averages</div>
            <div>GET /trends/country/:iso3 — Country trends</div>
            <div>GET /stats — Database statistics</div>
            <div>GET /methodology — Methodology as JSON</div>
            <div>GET /sources — Source metadata including licenses</div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            <strong>Pillars:</strong> social, institutions, media<br />
            <strong>Supplementary:</strong> financial (bank trust)
          </p>
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
            Methodology version 0.8.0 — Last updated January 2026
          </p>
          <p className="text-xs text-slate-400 mt-2">
            v0.8.0: Simplified to three pillars (Social, Institutional, Media) with Trust-Quality Gap as derived insight. Added supplementary indicators tier (Science, Financial, AI/Tech).
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
