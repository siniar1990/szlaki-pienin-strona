import { baza } from '@/lib/baza'

/**
 * Nadawanie identyfikatorów tabliczek: P001, P002, P003…
 *
 * Trzy cyfry wystarczają na 999 tabliczek przy planowanych dwustu. Gdy kiedyś
 * zabraknie, numeracja przejdzie na cztery cyfry sama — sortowanie tekstowe
 * przestanie wtedy odpowiadać liczbowemu, ale to problem panelu, nie adresów.
 *
 * Numer bierzemy z największego istniejącego, nie z liczby wierszy. Gdyby
 * ktoś skasował P003 z dwustu kodów, liczenie wierszy dałoby numer już zajęty.
 */

const PRZEDROSTEK = 'P'
const MINIMUM_CYFR = 3

export async function nastepnyKod(): Promise<string> {
  const ostatni = await baza.kodQr.findFirst({
    where: { kod: { startsWith: PRZEDROSTEK } },
    orderBy: { kod: 'desc' },
    select: { kod: true },
  })

  const numer = ostatni ? Number(ostatni.kod.slice(PRZEDROSTEK.length)) + 1 : 1
  return sformatuj(numer)
}

/**
 * Ciąg kolejnych identyfikatorów do wygenerowania paczki.
 *
 * Jedno zapytanie zamiast `ile` zapytań w pętli — przy dwustu kodach różnica
 * między jednym a dwustoma odczytami z bazy jest wyraźna.
 */
export async function nastepneKody(ile: number): Promise<string[]> {
  const pierwszy = await nastepnyKod()
  const od = Number(pierwszy.slice(PRZEDROSTEK.length))
  return Array.from({ length: ile }, (_, i) => sformatuj(od + i))
}

function sformatuj(numer: number): string {
  return `${PRZEDROSTEK}${String(numer).padStart(MINIMUM_CYFR, '0')}`
}
