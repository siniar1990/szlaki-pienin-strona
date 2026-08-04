import { NextResponse, type NextRequest } from 'next/server'

import { przeliczStatystyki } from '@/lib/qr/agregacja'
import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'

/**
 * Przeliczenie statystyk skanowania.
 *
 * Wywoływane co pięć minut przez harmonogram dostawcy hostingu (`vercel.json`).
 * Trasa jest publiczna z punktu widzenia sieci, więc broni się sama sekretem
 * w nagłówku — bez niego ktokolwiek mógłby ją wywoływać w pętli i obciążać bazę.
 */
export const dynamic = 'force-dynamic'

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const start = Date.now()
  const wynik = await przeliczStatystyki()

  return NextResponse.json({
    ...wynik,
    czasMs: Date.now() - start,
  })
}
