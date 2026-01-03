import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'REST API documentation for programmatic access to Trust Atlas data.',
}

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
