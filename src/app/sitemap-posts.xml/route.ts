import { NextResponse } from 'next/server'

import { PORTAL } from '@/lib/konfiguracja'
import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { mapaWitryny } from '@/lib/seo/xml'
import { ostatniaZmiana, pobierzSlugiWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Mapa notek — wszystkie opublikowane, bez ograniczenia wieku.
 *
 * Odczyt pyta o notki opublikowane, więc szkice i odrzucone nie mają jak tu
 * trafić: warunek stanu siedzi w zapytaniu, a nie w filtrze nałożonym po
 * fakcie, którego dałoby się kiedyś zapomnieć.
 *
 * `lastmod` bierze datę ISTOTNEJ zmiany, nie każdego zapisu — poprawka
 * literówki nie jest powodem, żeby prosić wyszukiwarkę o ponowne odwiedziny.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const notki = await pobierzSlugiWiadomosci()

  const xml = mapaWitryny(
    notki.map((notka) => ({
      adres: `${PORTAL.adres}/aktualnosci/${notka.slug}`,
      zmieniono: ostatniaZmiana(notka),
      czestotliwosc: 'monthly' as const,
      waga: 0.7,
    })),
  )

  return new NextResponse(xml, { headers: NAGLOWKI_XML })
}
