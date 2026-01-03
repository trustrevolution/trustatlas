'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Copy, Check, Terminal, Code2, BookOpen } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Hardcoded for documentation - always show production URL
const API_BASE_URL = 'https://api.trustatlas.org'

interface Endpoint {
  method: 'GET'
  path: string
  description: string
  example: string
  response: string
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/countries',
    description: 'List all countries with their latest trust scores and metadata.',
    example: `${API_BASE_URL}/countries`,
    response: `[
  {
    "iso3": "DNK",
    "name": "Denmark",
    "region": "Europe",
    "interpersonal": 74.2,
    "institutional": 62.1,
    "governance": 88.0,
    "media": 56.0
  },
  ...
]`,
  },
  {
    method: 'GET',
    path: '/country/:iso3',
    description: 'Get detailed time series data for a specific country.',
    example: `${API_BASE_URL}/country/USA`,
    response: `{
  "iso3": "USA",
  "name": "United States",
  "region": "North America",
  "series": [
    { "year": 2024, "interpersonal": 30.1, ... },
    { "year": 2022, "interpersonal": 31.2, ... }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/trends/global',
    description: 'Get latest scores for all countries by pillar. Use for map visualizations.',
    example: `${API_BASE_URL}/trends/global?pillar=governance`,
    response: `{
  "pillar": "governance",
  "year": 2024,
  "countries": [
    { "iso3": "DNK", "name": "Denmark", "score": 88.0 },
    ...
  ]
}`,
  },
  {
    method: 'GET',
    path: '/trends/regions',
    description: 'Get aggregated trust statistics by geographic region.',
    example: `${API_BASE_URL}/trends/regions?pillar=interpersonal`,
    response: `{
  "regions": [
    {
      "region": "Northern Europe",
      "avgScore": 62.4,
      "countryCount": 10
    },
    ...
  ]
}`,
  },
  {
    method: 'GET',
    path: '/methodology',
    description: 'Get the current methodology specification as JSON.',
    example: `${API_BASE_URL}/methodology`,
    response: `{
  "version": "0.6.0",
  "pillars": {
    "interpersonal": { ... },
    "institutional": { ... },
    "governance": { ... },
    "media": { ... }
  }
}`,
  },
  {
    method: 'GET',
    path: '/sources',
    description: 'Get metadata for all data sources including licenses and citations.',
    example: `${API_BASE_URL}/sources`,
    response: `[
  {
    "source": "WVS",
    "name": "World Values Survey",
    "license": "Custom Terms",
    "commercial_use_allowed": false,
    "citation_template": "World Values Survey..."
  },
  ...
]`,
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-md bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <pre className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-slate-300 font-mono">{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl')

  const examples = {
    curl: `curl "${endpoint.example}"`,
    js: `const response = await fetch("${endpoint.example}");
const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.get("${endpoint.example}")
data = response.json()
print(data)`,
  }

  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-800/30">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-md tracking-wide">
            {endpoint.method}
          </span>
          <code className="text-amber-400 font-mono text-sm">{endpoint.path}</code>
        </div>
        <p className="text-slate-400 text-sm">{endpoint.description}</p>
      </div>

      {/* Code Examples */}
      <div className="p-4 bg-slate-900/50">
        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          {(['curl', 'js', 'python'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {tab === 'js' ? 'JavaScript' : tab === 'python' ? 'Python' : 'cURL'}
            </button>
          ))}
        </div>

        <CodeBlock code={examples[activeTab]} />

        {/* Response Preview */}
        <details className="mt-3 group/details">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
            Example response
          </summary>
          <div className="mt-2">
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto text-xs">
              <code className="text-slate-400 font-mono">{endpoint.response}</code>
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header fixed wide />

      {/* Hero */}
      <header className="pt-32 pb-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Terminal className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-white">API</h1>
          </div>

          <p className="text-xl text-slate-400 mb-8">
            Programmatic access to global trust data. Open, free, no authentication required.
          </p>

          {/* Quick Info Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Base URL</div>
              <code className="text-amber-400 font-mono text-sm break-all">{API_BASE_URL}</code>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Format</div>
              <div className="text-white font-medium">JSON</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Auth</div>
              <div className="text-emerald-400 font-medium">None required</div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Start */}
      <section className="py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl text-white mb-6 flex items-center gap-3">
            <Code2 className="w-5 h-5 text-amber-400" />
            Quick Start
          </h2>

          <p className="text-slate-400 mb-4">
            Fetch trust data for any country in seconds:
          </p>

          <CodeBlock
            code={`curl "${API_BASE_URL}/country/USA"

# Response includes time series for all four pillars:
# interpersonal, institutional, governance, and media trust`}
          />
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-12 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl text-white mb-8 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Endpoints
          </h2>

          <div className="space-y-6">
            {endpoints.map((endpoint) => (
              <EndpointCard key={endpoint.path} endpoint={endpoint} />
            ))}
          </div>
        </div>
      </section>

      {/* Rate Limits & Links */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rate Limits */}
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="font-display text-lg text-white mb-3">Rate Limits</h3>
              <p className="text-slate-400 text-sm mb-2">
                100 requests per minute per IP. Responses are cached for 24 hours.
              </p>
              <p className="text-slate-500 text-xs">
                Need higher limits? Open an issue on GitHub.
              </p>
            </div>

            {/* Full Docs */}
            <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <h3 className="font-display text-lg text-white mb-3">Full Documentation</h3>
              <p className="text-slate-400 text-sm mb-4">
                Complete API reference with all parameters, error codes, and data schemas.
              </p>
              <a
                href="https://github.com/trustrevolution/trustatlas/blob/main/docs/API_REFERENCE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
              >
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
