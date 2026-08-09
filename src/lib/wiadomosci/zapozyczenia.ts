/**
 * Kontrola zapożyczeń dosłownych.
 *
 * Model dostaje w poleceniu zakaz przepisywania zdań, ale polecenie to prośba,
 * nie gwarancja. To jest sprawdzenie po fakcie: szukamy w napisanej notce
 * ciągów słów żywcem przeniesionych z cudzego artykułu.
 *
 * **Dlaczego siedem słów.** Krótsze zbieżności są nieuniknione i niewinne —
 * „Pieniński Park Narodowy poinformował, że od poniedziałku" to jedyny
 * naturalny sposób napisania tej informacji po polsku i nikt nie nazwie tego
 * zapożyczeniem. Przy siedmiu słowach przypadkowe trafienie przestaje być
 * prawdopodobne, a zaczyna się przepisywanie.
 *
 * **Dlaczego to blokuje szkic, a nie tylko ostrzega.** Notka z przepisanym
 * fragmentem czeka w panelu wyglądając jak każda inna. Administrator nie ma
 * jak zauważyć, że akurat to zdanie jest cudze, bo nie czytał oryginału.
 * Sprawdzenie, które tylko ostrzega, jest sprawdzeniem, które się przeoczy.
 */

/** Najkrótszy ciąg słów, który uznajemy za zapożyczenie. */
const DLUGOSC_CIAGU = 7

/** Ile zbieżnych ciągów wystarczy, żeby odrzucić notkę. */
const PROG_ODRZUCENIA = 1

function naSlowa(tekst: string): string[] {
  return tekst
    .toLowerCase()
    // Interpunkcja nie ma znaczenia — zmiana przecinka na myślnik nie czyni
    // zdania własnym.
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function ciagi(slowa: string[], dlugosc: number): Set<string> {
  const wynik = new Set<string>()
  for (let i = 0; i + dlugosc <= slowa.length; i += 1) {
    wynik.add(slowa.slice(i, i + dlugosc).join(' '))
  }
  return wynik
}

export type WynikKontroli = {
  czyste: boolean
  /** Znalezione zbieżności — do pokazania administratorowi w dzienniku. */
  zbieznosci: string[]
}

/**
 * Sprawdza, czy notka nie przepisuje zdań ze źródła.
 */
export function sprawdzZapozyczenia(notka: string, zrodlo: string): WynikKontroli {
  const slowaNotki = naSlowa(notka)
  if (slowaNotki.length < DLUGOSC_CIAGU) return { czyste: true, zbieznosci: [] }

  const zeZrodla = ciagi(naSlowa(zrodlo), DLUGOSC_CIAGU)
  const zbieznosci: string[] = []

  for (const ciag of ciagi(slowaNotki, DLUGOSC_CIAGU)) {
    if (zeZrodla.has(ciag)) {
      zbieznosci.push(ciag)
      if (zbieznosci.length >= 5) break
    }
  }

  return { czyste: zbieznosci.length < PROG_ODRZUCENIA, zbieznosci }
}

/**
 * Udział słów notki, które pojawiają się w źródle w tej samej kolejności.
 *
 * Miara pomocnicza dla dziennika w panelu: sama w sobie nie blokuje niczego,
 * ale rosnąca wartość przy kolejnych notkach jest sygnałem, że polecenie dla
 * modelu wymaga poprawy.
 */
export function udzialWspolnychTrojek(notka: string, zrodlo: string): number {
  const slowaNotki = naSlowa(notka)
  if (slowaNotki.length < 3) return 0

  const zeZrodla = ciagi(naSlowa(zrodlo), 3)
  const trojkiNotki = [...ciagi(slowaNotki, 3)]
  if (trojkiNotki.length === 0) return 0

  const wspolne = trojkiNotki.filter((trojka) => zeZrodla.has(trojka)).length
  return Math.round((wspolne / trojkiNotki.length) * 100)
}
