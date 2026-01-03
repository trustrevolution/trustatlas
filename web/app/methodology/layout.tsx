import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How Trust Atlas measures and normalizes trust data across three independent pillars.',
}

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
