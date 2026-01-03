import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for
 * handling Tailwind CSS class conflicts.
 *
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500')
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * HTML escape helper to prevent XSS in ECharts tooltips
 * ECharts tooltips render HTML directly, so any data from external sources
 * must be escaped before inclusion.
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe == null) return ''
  const str = String(unsafe)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
