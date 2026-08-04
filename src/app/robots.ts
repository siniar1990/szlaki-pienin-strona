import type { MetadataRoute } from 'next'

import { PORTAL } from '@/lib/konfiguracja'

/**
 * Zasady dla robotów wyszukiwarek.
 *
 * Wpuszczamy wszystkich wszędzie poza stroną wyszukiwania — ta generuje
 * wyniki dopiero w przeglądarce, więc dla robota jest pustym formularzem.
 * Wskazanie mapy witryny jest tu ważniejsze niż same zakazy: to po niej
 * Google znajduje 130 podstron, do których nie prowadzi żadne menu.
 */
// Przy eksporcie statycznym trasy generujące pliki muszą zadeklarować, że są
// w pełni statyczne — inaczej Next zakłada, że mogą się zmieniać w czasie
// i przerywa budowanie, bo nie ma serwera, który by je przeliczał.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/szukaj',
      },
    ],
    sitemap: `${PORTAL.adres}/sitemap.xml`,
    host: PORTAL.adres,
  }
}
