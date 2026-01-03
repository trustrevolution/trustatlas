import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Three-dot pillar mark for Apple touch icon
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-950
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 32 32"
        >
          {/* Blue - Interpersonal (top) */}
          <circle cx="16" cy="8" r="6" fill="#3b82f6" />
          {/* Amber - Institutional (bottom-left) */}
          <circle cx="9" cy="22" r="6" fill="#f59e0b" />
          {/* Emerald - Governance (bottom-right) */}
          <circle cx="23" cy="22" r="6" fill="#10b981" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
