import { NextResponse, type NextRequest } from 'next/server'

import { RETENCJA_DNI, przeliczStatystyki, usunStareZdarzenia } from '@/lib/qr/agregacja'
import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'

/**
 * Dobowa konserwacja: przeliczenie statystyk i usunięcie starych zdarzeń.
 *
 * Dwie czynności w jednym zadaniu, bo darmowy plan Vercela pozwala uruchamiać
 * zadania cykliczne raz na dobę i dopuszcza ich niewiele. Rozbicie na dwa
 * osobne wpisy nie dałoby nic poza zużyciem limitu.
 *
 * Przeliczanie statystyk nie zależy jednak od tego zadania — panel robi to sam,
 * gdy tylko zauważy skany nowsze niż ostatnie przeliczenie. Zadanie dobowe jest
 * zabezpieczeniem na wypadek, gdyby nikt do panelu nie zajrzał, oraz jedynym
 * miejscem, które faktycznie kasuje zdarzenia po okresie retencji.
 */
export const dynamic = 'force-dynamic'

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const start = Date.now()
  const statystyki = await przeliczStatystyki()
  const usuniete = await usunStareZdarzenia()

  return NextResponse.json({
    ...statystyki,
    usunieteZdarzenia: usuniete,
    retencjaDni: RETENCJA_DNI,
    czasMs: Date.now() - start,
  })
}
