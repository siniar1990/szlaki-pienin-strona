import { NextResponse, type NextRequest } from 'next/server'

import { przeliczOdslony, usunStareOdslony } from '@/lib/analityka/statystyki'
import { RETENCJA_DNI, przeliczStatystyki, usunStareZdarzenia } from '@/lib/qr/agregacja'
import { zamiecNiepotwierdzone } from '@/lib/qr/zamiatanie'
import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'

/**
 * Dobowa konserwacja: przeliczenie statystyk i usunięcie starych zdarzeń.
 *
 * Harmonogram tej trasy opisuje `vercel.json` — plik bez komentarzy, bo Vercel
 * odrzuca wszystko poza znanymi mu polami. Wyjaśnienie mieszka więc tutaj.
 *
 * **Dlaczego raz na dobę, a nie co pięć minut.** Darmowy plan Vercela na
 * częstsze nie pozwala; wdrożenie kończy się wtedy błędem „Hobby accounts are
 * limited to daily cron jobs". Płacenie za plan wyższy tylko po to, żeby
 * przeliczać liczby częściej, byłoby złym powodem — dlatego statystyki
 * przeliczają się tam, gdzie ktoś na nie patrzy: pulpit i lista tabliczek
 * wołają `przeliczJesliTrzeba()` przy każdym wejściu.
 *
 * To zadanie zostaje z dwóch powodów: jest siatką bezpieczeństwa, gdyby nikt
 * do panelu nie zaglądał tygodniami, i jedynym miejscem, które faktycznie
 * kasuje zdarzenia po okresie retencji.
 *
 * **Dlaczego dwie czynności w jednej trasie.** Darmowy plan ogranicza także
 * liczbę zadań. Rozbicie na dwa wpisy zużyłoby limit, nie dając nic w zamian.
 */
export const dynamic = 'force-dynamic'

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const start = Date.now()

  // Zamiatanie przed przeliczeniem: dopiero po nim wiadomo, które trafienia
  // są botami. Odwrotna kolejność liczyłaby dzień na podstawie wczorajszej
  // wiedzy — nie zmieniłaby sum (niepotwierdzone i tak nie wchodzą), ale
  // rozbicie na powody byłoby o dobę do tyłu.
  const zamiecione = await zamiecNiepotwierdzone()
  const statystyki = await przeliczStatystyki()
  const usuniete = await usunStareZdarzenia()

  // Odsłony podstron chodzą tą samą drogą co skany tabliczek: agregacja
  // dzienna i ta sama retencja. Jedno zadanie, bo darmowy plan i tak nie
  // pozwoli na dwa — i bo obie rzeczy sprzątają dokładnie tak samo.
  const odslony = await przeliczOdslony()
  const usunieteOdslony = await usunStareOdslony()

  return NextResponse.json({
    ...statystyki,
    ...zamiecione,
    usunieteZdarzenia: usuniete,
    przeliczoneOdslony: odslony,
    usunieteOdslony,
    retencjaDni: RETENCJA_DNI,
    czasMs: Date.now() - start,
  })
}
