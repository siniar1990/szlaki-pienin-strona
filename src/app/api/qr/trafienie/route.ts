import { after, NextResponse, type NextRequest } from 'next/server'

import { potwierdzTrafienie } from '@/lib/qr/zapisz-skan'
import { sprawdzToken } from '@/lib/qr/token-trafienia'

/**
 * Potwierdzenie skanu przez przeglądarkę.
 *
 * Skan zapisany przy wejściu na `/qr/:kod` czeka tu na jedno zdanie: „stronę
 * otworzył ktoś, kto wykonuje JavaScript". Crawlery Facebooka, Twittera
 * i wyszukiwarek tego zdania nie powiedzą, bo skryptów nie uruchamiają —
 * i o to w całym tym filtrze chodzi.
 *
 * **Dlaczego trasa jest otwarta.** Bo musi być: potwierdzenia przychodzą od
 * anonimowych turystów. Ochroną nie jest hasło, tylko token — podpisany
 * naszym sekretem, ważny pięć minut i wskazujący jeden konkretny wiersz.
 * Bez niego dałoby się napompować licznik dowolnej tabliczki w pętli.
 *
 * **Dlaczego 204 zawsze.** Nadawca i tak nie czyta odpowiedzi, bo
 * `sendBeacon` jej nie udostępnia. Odsyłanie „token nieważny" podpowiadałoby
 * tylko, jak trafić poprawnie.
 */
export const dynamic = 'force-dynamic'

export async function POST(zadanie: NextRequest) {
  const dane = (await zadanie.json().catch(() => null)) as { token?: unknown } | null
  const token = typeof dane?.token === 'string' ? dane.token : null

  after(async () => {
    try {
      const identyfikator = await sprawdzToken(token)
      if (!identyfikator) return

      await potwierdzTrafienie(identyfikator)
    } catch (blad) {
      // Nieudane potwierdzenie zostawia skan jako „niepewny" — to najgorsze,
      // co może się stać, i nie jest to powód, żeby cokolwiek przewracać.
      console.error('[qr] nie udało się potwierdzić trafienia', blad)
    }
  })

  return new NextResponse(null, { status: 204 })
}
