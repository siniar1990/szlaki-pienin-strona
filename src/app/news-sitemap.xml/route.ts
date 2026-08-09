import { NextResponse } from 'next/server'

import { PORTAL } from '@/lib/konfiguracja'
import { NAGLOWKI_XML } from '@/lib/seo/naglowki'
import { mapaNews, wOknieNews } from '@/lib/seo/xml'
import { pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Mapa Google News — wyłącznie notki z ostatnich dwóch dni.
 *
 * **Dlaczego tylko dwa dni.** Bo tak brzmi wymaganie Google: „only include
 * recent URLs for articles that were created in the last two days", a starsze
 * mają zostać usunięte. To nie jest ograniczenie do obejścia — cały sens tego
 * kanału polega na tym, że wszystko w nim jest świeże. Wrzucenie archiwum nie
 * przyspiesza indeksowania, tylko odbiera sygnałowi znaczenie.
 *
 * **Dlaczego okno liczy się przy każdym żądaniu, a nie przy publikacji.**
 * Notka wypada z mapy sama, po prostu przez upływ czasu — nie ma tu żadnego
 * zadania cyklicznego, które mogłoby się nie wykonać i zostawić w kanale
 * tygodniowe artykuły.
 *
 * Pusta mapa jest poprawna i tak też ją oddajemy. Dwa dni bez publikacji to
 * przy tym portalu normalna sytuacja, a nie awaria.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  // Sto wystarczy z ogromnym zapasem: limit Google to tysiąc pozycji, a portal
  // publikuje najwyżej kilka notek dziennie.
  const notki = await pobierzWiadomosci(100)
  const swieze = notki.filter((notka) => wOknieNews(notka.opublikowano))

  const xml = mapaNews(
    swieze.map((notka) => ({
      adres: `${PORTAL.adres}/aktualnosci/${notka.slug}`,
      tytul: notka.tytul,
      opublikowano: notka.opublikowano,
    })),
    // Nazwa publikacji musi zgadzać się z nazwą portalu; język w kodzie ISO 639.
    { nazwa: PORTAL.nazwa, jezyk: 'pl' },
  )

  return new NextResponse(xml, { headers: NAGLOWKI_XML })
}
