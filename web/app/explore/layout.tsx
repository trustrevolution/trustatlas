import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Interactive world map showing trust levels across 210 countries.',
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
