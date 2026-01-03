'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Monitor } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Dynamic imports - only load on desktop to save mobile bandwidth
const TrustMap = dynamic(() => import('@/components/TrustMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-slate-400">Loading map...</div>
    </div>
  )
})
const FilterBar = dynamic(() => import('@/components/FilterBar'), { ssr: false })
const ExplorePanel = dynamic(() => import('@/components/ExplorePanel'), { ssr: false })

export type Pillar = 'interpersonal' | 'institutional' | 'governance' | 'media'

export default function ExplorePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedPillar, setSelectedPillar] = useState<Pillar>('interpersonal')
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect desktop on mount - avoids loading heavy components on mobile
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Mobile Notice - visible only on small screens */}
      <div className="md:hidden fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <Monitor className="w-12 h-12 text-amber-400 mb-6" />
        <h2 className="text-xl font-display text-white mb-3">
          Explore
        </h2>
        <p className="text-slate-400 mb-8 max-w-xs text-sm leading-relaxed">
          The interactive atlas works best on desktop or tablet.
          We&apos;re working on a mobile experience—check back soon.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm"
        >
          Explore the Homepage
        </Link>
      </div>

      <Header wide activePage="explore" />

      {/* Only render heavy components on desktop */}
      {isDesktop && (
        <>
          {/* Filter Bar with Pillar Selector */}
          <FilterBar
            onCountrySelect={setSelectedCountry}
            selectedPillar={selectedPillar}
            onPillarChange={setSelectedPillar}
          />

          {/* Main Content: Map + Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Map */}
            <div className="flex-1 relative">
              <TrustMap
                selectedCountry={selectedCountry}
                onCountrySelect={setSelectedCountry}
                pillar={selectedPillar}
              />
            </div>

            {/* Detail Panel */}
            <div className="w-[320px] lg:w-[380px] xl:w-[420px] flex-shrink-0">
              <ExplorePanel
                selectedCountry={selectedCountry}
                onClose={() => setSelectedCountry(null)}
                selectedPillar={selectedPillar}
                onPillarChange={setSelectedPillar}
              />
            </div>
          </div>
        </>
      )}

      <Footer compact />
    </div>
  )
}
