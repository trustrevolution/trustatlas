/**
 * Trust Atlas brand assets
 *
 * Shared brand constants for use across the codebase.
 */

/**
 * Trust Atlas logo as inline SVG string.
 * Use for canvas rendering (PNG exports) or places where component import isn't practical.
 */
export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="8" r="6" fill="#3b82f6"/>
  <circle cx="9" cy="22" r="6" fill="#f59e0b"/>
  <circle cx="23" cy="22" r="6" fill="#10b981"/>
</svg>`

/**
 * Trust Atlas logo as base64 data URI.
 * Use for <img> tags where external URL isn't desired.
 */
export const LOGO_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSI4IiByPSI2IiBmaWxsPSIjM2I4MmY2Ii8+PGNpcmNsZSBjeD0iOSIgY3k9IjIyIiByPSI2IiBmaWxsPSIjZjU5ZTBiIi8+PGNpcmNsZSBjeD0iMjMiIGN5PSIyMiIgcj0iNiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg=='
