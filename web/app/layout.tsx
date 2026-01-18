import type { Metadata } from 'next'
import Script from 'next/script'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',  // Show fallback immediately, swap when ready (faster LCP)
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Trust Atlas',
    template: '%s | Trust Atlas',
  },
  description: 'Trust is the invisible infrastructure of society. Open data on interpersonal trust, institutional trust, and governance quality across 210 countries. No paywalls. No black boxes.',
  keywords: ['trust data', 'social trust', 'institutional trust', 'governance quality', 'World Values Survey', 'transparency', 'open data', 'country comparison', 'rule of law', 'corruption index'],
  metadataBase: new URL('https://trustatlas.org'),
  openGraph: {
    title: 'Trust Atlas',
    description: 'Trust is the invisible infrastructure of society. Open data across 210 countries.',
    url: 'https://trustatlas.org',
    type: 'website',
    siteName: 'Trust Atlas',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Trust Atlas - Open data on global trust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trust Atlas',
    description: 'Trust is the invisible infrastructure of society. Open data across 210 countries.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=false;try{var o=Object.defineProperty({},'passive',{get:function(){s=true}});window.addEventListener('t',null,o);window.removeEventListener('t',null,o)}catch(e){}if(s){var orig=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,l,opts){var o=opts;if(['touchstart','touchmove','wheel','mousewheel'].indexOf(t)>-1){if(typeof o==='boolean')o={capture:o,passive:true};else if(typeof o==='object'&&o!==null){if(o.passive===undefined)o=Object.assign({},o,{passive:true})}else o={passive:true}}return orig.call(this,t,l,o)}}})();`,
          }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_SITE_ID && (
          <Script
            src="https://plausible.io/js/script.js"
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_SITE_ID}
            strategy="afterInteractive"
          />
        )}
        <SpeedInsights />
      </body>
    </html>
  )
}
