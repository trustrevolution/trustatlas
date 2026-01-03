'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Scale, FileText, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SourceInfo {
  name: string
  license: string
  citation: string
  url: string
  commercial: boolean
  notes?: string
}

const sources: Record<string, SourceInfo[]> = {
  'Survey Sources (WVS Family)': [
    {
      name: 'World Values Survey (WVS)',
      license: 'Custom Terms (non-commercial academic use)',
      citation: 'World Values Survey: Round Seven - Country-Pooled Datafile Version X.X. Madrid, Spain & Vienna, Austria: JD Systems Institute & WVSA Secretariat. doi:10.14281/18241.20',
      url: 'https://www.worldvaluessurvey.org',
      commercial: false,
    },
    {
      name: 'European Values Study (EVS)',
      license: 'Custom Terms (non-commercial academic use)',
      citation: 'European Values Study [Year]: Integrated Dataset (EVS [Year]). GESIS Data Archive, Cologne. ZA7500 Data file Version X.X.X, doi:10.4232/1.13511',
      url: 'https://europeanvaluesstudy.eu',
      commercial: false,
      notes: 'Same methodology as WVS (A165 question). Used for interpersonal trust only.',
    },
    {
      name: 'General Social Survey (GSS)',
      license: 'Public Domain',
      citation: 'Davern, Michael, et al.; General Social Survey 1972-2024. [Machine-readable data file]. NORC ed. Chicago.',
      url: 'https://gss.norc.org',
      commercial: true,
      notes: 'Project of NORC at University of Chicago with NSF funding',
    },
    {
      name: 'American National Election Studies (ANES)',
      license: 'CC0 (Public Domain)',
      citation: 'American National Election Studies. [Year]. ANES [Year] Time Series Study. www.electionstudies.org',
      url: 'https://electionstudies.org',
      commercial: true,
    },
    {
      name: 'Canadian Election Study (CES)',
      license: 'Academic Use',
      citation: 'Stephenson, Laura B; Harell, Allison; Rubenson, Daniel; Loewen, Peter John. [Year] Canadian Election Study. Harvard Dataverse.',
      url: 'https://ces-eec.arts.ubc.ca',
      commercial: false,
    },
  ],
  'Media Trust Sources': [
    {
      name: 'Reuters Institute Digital News Report',
      license: 'CC BY (reports and data)',
      citation: 'Newman, N., et al. ([Year]). Reuters Institute Digital News Report. Reuters Institute for the Study of Journalism.',
      url: 'https://reutersinstitute.politics.ox.ac.uk/digital-news-report',
      commercial: true,
      notes: 'Primary source (40% weight). Data starts 2015 when the standardized "trust most news" question was introduced.',
    },
    {
      name: 'Standard Eurobarometer',
      license: 'Scientific research/training',
      citation: 'European Commission, Brussels ([Year]): Eurobarometer [XX.X]. GESIS Data Archive.',
      url: 'https://www.gesis.org/en/eurobarometer-data-service',
      commercial: false,
      notes: 'Primary EU source (40% weight). QA6_1: Trust in Media. Covers 32 EU member and candidate countries.',
    },
    {
      name: 'World Values Survey (Media)',
      license: 'Custom Terms (non-commercial academic use)',
      citation: 'World Values Survey: Round Seven - Country-Pooled Datafile. Madrid, Spain & Vienna, Austria: JD Systems Institute & WVSA Secretariat.',
      url: 'https://www.worldvaluessurvey.org',
      commercial: false,
      notes: 'Supplementary source (20% weight). E069_07/08: Confidence in the press/television. Provides historical depth back to 1981.',
    },
  ],
  'Governance Sources': [
    {
      name: 'Transparency International CPI',
      license: 'CC BY 4.0 (datasets)',
      citation: 'Corruption Perceptions Index [Year] by Transparency International is licensed under CC BY 4.0',
      url: 'https://www.transparency.org/cpi',
      commercial: true,
    },
    {
      name: 'World Bank WGI',
      license: 'CC BY 4.0',
      citation: 'Worldwide Governance Indicators, [Year] Revision, World Bank (www.govindicators.org)',
      url: 'https://info.worldbank.org/governance/wgi',
      commercial: true,
    },
    {
      name: 'V-Dem',
      license: 'CC BY-SA 4.0',
      citation: 'Coppedge, Michael, et al. [Year]. "V-Dem Dataset v[XX]" Varieties of Democracy Project.',
      url: 'https://www.v-dem.net',
      commercial: true,
      notes: 'ShareAlike license requires derived works use same license',
    },
    {
      name: 'World Justice Project',
      license: 'Non-commercial',
      citation: 'World Justice Project. Rule of Law Index [Year]. Washington, DC: World Justice Project.',
      url: 'https://worldjusticeproject.org/rule-of-law-index',
      commercial: false,
    },
    {
      name: 'Freedom House',
      license: 'Non-commercial with citation',
      citation: 'Freedom House. Freedom in the World [Year]. Washington, DC: Freedom House.',
      url: 'https://freedomhouse.org/report/freedom-world',
      commercial: false,
    },
  ],
  'Regional Surveys': [
    {
      name: 'European Social Survey (ESS)',
      license: 'CC BY-NC-SA 4.0',
      citation: 'ESS ERIC ([Year]) ESS[Round] - integrated file [Data set]. Sikt.',
      url: 'https://www.europeansocialsurvey.org',
      commercial: false,
      notes: 'Non-commercial only; ShareAlike for derivatives',
    },
    {
      name: 'Afrobarometer',
      license: 'Non-commercial with attribution',
      citation: 'Afrobarometer Data, [Country(ies)], [Round(s)], [Year(s)], available at http://www.afrobarometer.org',
      url: 'https://www.afrobarometer.org',
      commercial: false,
    },
    {
      name: 'Latinobarómetro',
      license: 'Non-commercial academic use',
      citation: 'Latinobarómetro [Year]. Latinobarómetro Corporation. www.latinobarometro.org',
      url: 'https://www.latinobarometro.org',
      commercial: false,
    },
    {
      name: 'Asian Barometer',
      license: 'Academic use only',
      citation: 'Asian Barometer Project ([Years]), co-directed by Professors Fu Hu and Yun-han Chu.',
      url: 'https://www.asianbarometer.org',
      commercial: false,
    },
    {
      name: 'Arab Barometer',
      license: 'Non-commercial with attribution',
      citation: 'Arab Barometer: Public Opinion Survey. Princeton University.',
      url: 'https://www.arabbarometer.org',
      commercial: false,
    },
    {
      name: 'LAPOP AmericasBarometer',
      license: 'Research purposes only',
      citation: 'Data from Latin American Public Opinion Project at Vanderbilt University.',
      url: 'https://www.vanderbilt.edu/lapop',
      commercial: false,
      notes: 'LAPOP takes no responsibility for interpretations',
    },
  ],
  'European Data': [
    {
      name: 'Eurobarometer (GESIS)',
      license: 'Scientific research/training',
      citation: 'European Commission, Brussels ([Year]): Eurobarometer [XX.X]. GESIS Data Archive.',
      url: 'https://www.gesis.org/en/eurobarometer-data-service',
      commercial: false,
    },
    {
      name: 'EU-SILC (Eurostat)',
      license: 'CC BY 4.0 (aggregates)',
      citation: 'Source: Eurostat, EU-SILC, accessed on [date]',
      url: 'https://ec.europa.eu/eurostat',
      commercial: true,
    },
    {
      name: 'EBRD Life in Transition Survey',
      license: 'Non-commercial',
      citation: 'EBRD Life in Transition Survey [Year]. London: EBRD.',
      url: 'https://www.ebrd.com/what-we-do/economic-research-and-data/data/lits.html',
      commercial: false,
    },
    {
      name: 'CRRC Caucasus Barometer',
      license: 'Free with citation',
      citation: 'Caucasus Research Resource Centers. [Year] "Caucasus Barometer". caucasusbarometer.org',
      url: 'https://caucasusbarometer.org',
      commercial: true,
    },
  ],
}

export default function AttributionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header fixed wide />

      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <Link href="/" className="page-back-link">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="page-title">Data Attribution</h1>
          <p className="page-subtitle">
            Licensing, citation requirements, and credits for all data sources.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="page-content">
        {/* Trust Atlas License */}
        <section className="mb-16">
          <div className="section-header">
            <Scale className="section-header-icon text-amber-600" />
            <h2 className="section-title">Trust Atlas License</h2>
          </div>
          <div className="info-box info-box-amber">
            <p className="text-slate-700 mb-4">
              Trust Atlas is licensed under <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong>.
            </p>
            <p className="text-slate-600 mb-4">
              You are free to share and adapt this work for any purpose, even commercially,
              as long as you provide attribution and distribute derivatives under the same license.
            </p>
            <a
              href="https://creativecommons.org/licenses/by-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium"
            >
              View full license
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Important Note */}
        <section className="mb-16">
          <div className="section-header">
            <FileText className="section-header-icon text-blue-600" />
            <h2 className="section-title">Data Usage Note</h2>
          </div>
          <div className="info-box info-box-blue">
            <p className="text-slate-700 mb-4">
              <strong>Trust Atlas uses only derived aggregate statistics, not raw microdata.</strong>
            </p>
            <p className="text-slate-600 mb-4">
              We process survey microdata locally to compute country-level trust percentages
              (e.g., &ldquo;65% of respondents trust others&rdquo;). The raw survey responses
              are never stored in our database or served via our API.
            </p>
            <p className="text-slate-600">
              This approach is similar to citing aggregate findings in academic publications
              and is generally permitted under source terms of use. However, users should
              still cite the original data sources when using Trust Atlas data.
            </p>
          </div>
        </section>

        {/* How to Cite */}
        <section className="mb-16">
          <div className="section-header">
            <Users className="section-header-icon text-emerald-600" />
            <h2 className="section-title">How to Cite Trust Atlas</h2>
          </div>
          <div className="info-box info-box-slate">
            <p className="text-slate-600 mb-4">When using Trust Atlas data, please cite:</p>
            <div className="code-block-light">
              Trust Atlas. (2025). Trust Atlas: Open Data for Measuring Trust.
              Trust Revolution. https://trustatlas.org.
              Licensed under CC BY-SA 4.0.
            </div>
            <p className="text-slate-500 text-sm mt-4">
              For specific data sources, please also cite the original source using their required format (see below).
            </p>
          </div>
        </section>

        {/* Data Sources */}
        <section>
          <h2 className="section-title mb-6">Data Source Credits</h2>

          {Object.entries(sources).map(([category, sourceList]) => (
            <div key={category} className="mb-10">
              <h3 className="section-subtitle">{category}</h3>
              <div className="space-y-4">
                {sourceList.map((source) => (
                  <div key={source.name} className="source-card">
                    <div className="source-card-header">
                      <h4 className="source-card-title">{source.name}</h4>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link-icon"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="source-card-badges">
                      <span className="badge badge-slate">{source.license}</span>
                      {source.commercial ? (
                        <span className="badge badge-emerald">Commercial OK</span>
                      ) : (
                        <span className="badge badge-amber">Non-commercial</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 mb-2">
                      <strong className="text-slate-700">Citation:</strong>{' '}
                      <span className="italic">{source.citation}</span>
                    </div>
                    {source.notes && (
                      <div className="text-xs text-slate-500 bg-slate-50 rounded p-2 mt-2">
                        {source.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* API Endpoint */}
        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="font-display text-xl text-slate-900 mb-4">Programmatic Access</h2>
          <p className="text-slate-600 mb-4">
            Source metadata is also available via our API:
          </p>
          <div className="code-block">
            GET /sources — Returns all source metadata including licenses and citations
          </div>
        </section>

        {/* Version */}
        <section className="border-t border-slate-200 pt-8 mt-8">
          <p className="text-sm text-slate-500">
            Last updated January 2026 — Compliance verified for 21 data sources
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
