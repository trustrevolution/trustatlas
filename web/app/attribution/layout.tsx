import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Sources',
  description: 'Attribution and licensing information for all data sources used in Trust Atlas.',
}

export default function AttributionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
