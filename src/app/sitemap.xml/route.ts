import { NextResponse } from 'next/server'

import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { indeksMap } from '@/lib/seo/xml'
import { PORTAL } from '@/lib/konfiguracja'
import { pobierzSlugiWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Mapa indeksowa — jedno wejście dla wyszukiwarek.
 *
 * **Dlaczego indeks, a nie jedna wielka mapa.** Dziś portal ma około stu
 * trzydziestu adresów i zmieściłby się w jednym pliku. Rozdział ma jednak
 * sens niezależnie od rozmiaru: strony przewodnika zmieniają się przy
 * wdrożeniu, notki przy publikacji. Osobne pliki znaczą osobne daty
 * `lastmod`, a te mówią wyszukiwarce, którą część warto sprawdzić ponownie.
 * Przy wspólnym pliku każda nowa notka zapraszałaby do przeczytania także
 * pięćdziesięciu czterech tras, w których nic się nie zmieniło.
 *
 * Adres pozostaje ten sam, co dotąd — wyszukiwarki znają go z `robots.txt`
 * i nie ma powodu go zmieniać.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const notki = await pobierzSlugiWiadomosci()
  const najnowsza = notki[0]

  const xml = indeksMap([
    // Strony przewodnika zmieniają się razem z wdrożeniem, a nie same z siebie.
    { adres: `${PORTAL.adres}/sitemap-pages.xml`, zmieniono: new Date() },
    {
      adres: `${PORTAL.adres}/sitemap-posts.xml`,
      zmieniono: najnowsza
        ? (najnowsza.zaktualizowano ?? najnowsza.opublikowano)
        : new Date(),
    },
    { adres: `${PORTAL.adres}/news-sitemap.xml`, zmieniono: najnowsza?.opublikowano ?? new Date() },
  ])

  return new NextResponse(xml, { headers: NAGLOWKI_XML })
}
