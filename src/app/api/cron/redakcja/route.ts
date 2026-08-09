import { NextResponse, type NextRequest } from 'next/server'

import { sprawdzZadanieCykliczne } from '@/lib/panel/zadania'
import { napiszNotkeDnia } from '@/lib/wiadomosci/redakcja'

/**
 * Redakcja raz na dobę: wybór artykułu i napisanie szkicu notki.
 *
 * Trasa nigdy niczego nie publikuje. Najdalej, co robi, to zostawienie szkicu
 * w panelu — i to jest cała jej odpowiedzialność. Gdyby kiedyś ktoś chciał
 * „przyspieszyć" dział aktualności przez automatyczną publikację, to jest
 * miejsce, w którym trzeba by to zrobić świadomie, a nie przez przeoczenie.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(zadanie: NextRequest) {
  const odmowa = sprawdzZadanieCykliczne(zadanie)
  if (odmowa) return odmowa

  const wynik = await napiszNotkeDnia()
  return NextResponse.json(wynik)
}
