import { baza } from '@/lib/baza'

/**
 * Nadawanie identyfikatorów tabliczek: P001, P002, P003…
 *
 * Trzy cyfry wystarczają na 999 tabliczek przy planowanych dwustu. Gdy kiedyś
 * zabraknie, numeracja przejdzie na cztery cyfry sama — sortowanie tekstowe
 * przestanie wtedy odpowiadać liczbowemu, ale to problem panelu, nie adresów.
 *
 * Numer bierzemy z największego, jaki kiedykolwiek nadano — nie z liczby
 * wierszy i nie z samych istniejących kodów.
 *
 * Liczenie wierszy zawodzi po skasowaniu kodu ze środka: przy dwustu
 * tabliczkach bez P003 dałoby numer już zajęty. Ale patrzenie wyłącznie na
 * istniejące kody zawodzi tak samo po skasowaniu OSTATNIEGO — numer wracał
 * wtedy do puli i trafiał na kolejną tabliczkę. Tabliczka jest przedmiotem;
 * wydrukowany egzemplarz P042 może leżeć w szufladzie i nie wie, że jego
 * wpis usunięto. Dlatego skasowane numery zostają zajęte na zawsze,
 * w tabeli `UsunietaTabliczka`.
 */

const PRZEDROSTEK = 'P'
const MINIMUM_CYFR = 3

export async function nastepnyKod(): Promise<string> {
  const [istniejacy, wycofany] = await Promise.all([
    baza.kodQr.findFirst({
      where: { kod: { startsWith: PRZEDROSTEK } },
      orderBy: { kod: 'desc' },
      select: { kod: true },
    }),
    baza.usunietaTabliczka.findFirst({
      where: { kod: { startsWith: PRZEDROSTEK } },
      orderBy: { kod: 'desc' },
      select: { kod: true },
    }),
  ])

  const numer = Math.max(numerKodu(istniejacy?.kod), numerKodu(wycofany?.kod)) + 1
  return sformatuj(numer)
}

/** Numer z identyfikatora; 0, gdy kodu nie ma albo ma nieoczekiwaną postać. */
function numerKodu(kod: string | undefined): number {
  if (!kod) return 0
  const numer = Number(kod.slice(PRZEDROSTEK.length))
  return Number.isFinite(numer) ? numer : 0
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
