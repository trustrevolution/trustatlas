/**
 * OG Image Generator
 *
 * This is a Next.js ImageResponse component for generating the OG image.
 * The static image is served from /public/og-image.png
 *
 * To regenerate:
 * 1. Temporarily move this file to app/opengraph-image.tsx
 * 2. Run: curl http://localhost:3000/opengraph-image -o public/og-image.png
 * 3. Move file back to scripts/
 */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Trust Atlas - Open data on global trust'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // Load brand fonts from Google Fonts
  const [playfairItalic, playfairRegular, sourceSans] = await Promise.all([
    fetch(
      'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf'
    ).then((res) => res.arrayBuffer()),
    fetch(
      'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf'
    ).then((res) => res.arrayBuffer()),
    fetch(
      'https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf'
    ).then((res) => res.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #020617 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '72px',
            fontFamily: 'Playfair Display',
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex' }}>
            Trust is the&nbsp;<span style={{ color: '#f59e0b', fontStyle: 'italic' }}>invisible</span>
          </div>
          <span>infrastructure of society.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '36px',
            fontFamily: 'Source Sans 3',
            color: '#94a3b8',
            marginBottom: '56px',
          }}
        >
          We're mapping it.
        </div>

        {/* Brand lockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Logo + Name row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            {/* Three-pillar logo */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  marginBottom: '4px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '44px',
                fontFamily: 'Playfair Display',
                color: '#ffffff',
              }}
            >
              Trust Atlas
            </div>
          </div>
          {/* Descriptor */}
          <div
            style={{
              display: 'flex',
              fontSize: '18px',
              fontFamily: 'Source Sans 3',
              color: '#64748b',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Open data on global trust
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Playfair Display',
          data: playfairItalic,
          style: 'italic',
          weight: 400,
        },
        {
          name: 'Playfair Display',
          data: playfairRegular,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Source Sans 3',
          data: sourceSans,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
