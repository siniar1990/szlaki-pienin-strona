import { NextResponse, type NextRequest } from 'next/server'

import { RETENCJA_DNI, usunStareZdarzenia } from '@/lib/qr/agregacja'
import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'

/**
 * Usuwanie surowych zdarzeń starszych niż okres retencji.
 *
 * Uruchamiane raz na dobę. To nie jest sprzątanie miejsca na dysku, tylko
 * realizacja zasady minimalizacji danych: po przeliczeniu do sum dziennych
 * pojedyncze zdarzenia sprzed trzech miesięcy nie służą już niczemu.
 */
export const dynamic = 'force-dynamic'

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const usuniete = await usunStareZdarzenia()
  return NextResponse.json({ usuniete, retencjaDni: RETENCJA_DNI })
}
