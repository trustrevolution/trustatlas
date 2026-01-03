import { Suspense } from 'react'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Grapher } from '@/components/grapher'

export const metadata: Metadata = {
  title: 'Trust Grapher | Trust Atlas',
  description: 'Interactive data exploration tool for comparing trust levels across countries and time.',
  openGraph: {
    title: 'Trust Grapher | Trust Atlas',
    description: 'Interactive data exploration tool for comparing trust levels across countries and time.',
  },
}

function GrapherLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64 mb-6" />
        <div className="h-10 bg-slate-200 rounded w-48 mb-4" />
        <div className="h-12 bg-slate-200 rounded w-full mb-6" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

export default function GrapherPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header fixed activePage="explore" />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Suspense fallback={<GrapherLoading />}>
            <Grapher />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}
