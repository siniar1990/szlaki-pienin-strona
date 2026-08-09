import { NextResponse } from 'next/server'

import { PORTAL } from '@/lib/konfiguracja'
import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { kanalRss } from '@/lib/seo/xml'
import { adresZdjecia, pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Kanał RSS działu aktualności.
 *
 * **Po co, skoro jest mapa witryny.** Bo to dwa różne narzędzia dla dwóch
 * różnych odbiorców. Mapa mówi wyszukiwarce, co istnieje; kanał mówi ludziom
 * i czytnikom, co się właśnie ukazało. Przy okazji jest to ten sam interfejs,
 * którego my sami używamy do czytania cudzych serwisów w obchodzie — portal
 * wypada oddać to, z czego korzysta.
 *
 * Pięćdziesiąt najnowszych notek: tyle, żeby czytnik po miesiącu przerwy
 * nadrobił zaległość, i nie więcej, żeby plik nie rósł bez końca.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const notki = await pobierzWiadomosci(50)

  const xml = kanalRss(
    notki.map((notka) => ({
      adres: `${PORTAL.adres}/aktualnosci/${notka.slug}`,
      tytul: notka.tytul,
      opis: notka.lid,
      opublikowano: notka.opublikowano,
      // Zdjęcie podajemy przez trasę oddającą bajty, a nie jako `data:` URL —
      // czytniki muszą móc je pobrać.
      zdjecie: notka.maZdjecie ? `${PORTAL.adres}${adresZdjecia(notka.slug)}` : undefined,
    })),
    {
      tytul: `${PORTAL.nazwa} — aktualności`,
      adres: PORTAL.adres,
      opis: 'Co słychać w Pieninach: zmiany na szlakach, wydarzenia i warunki w górach.',
      jezyk: PORTAL.jezyk,
    },
  )

  return new NextResponse(xml, { headers: NAGLOWKI_XML })
}
