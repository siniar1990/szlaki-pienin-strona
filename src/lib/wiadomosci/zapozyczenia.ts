/**
 * Kontrola zapożyczeń dosłownych.
 *
 * Model dostaje w poleceniu zakaz przepisywania zdań, ale polecenie to prośba,
 * nie gwarancja. To jest sprawdzenie po fakcie: szukamy w napisanej notce
 * ciągów słów żywcem przeniesionych z cudzego artykułu.
 *
 * **Dlaczego nie wystarczy jeden próg długości.** Pierwsza wersja odrzucała
 * notkę, w której choć jeden ciąg siedmiu słów był identyczny jak w źródle.
 * W praktyce odrzucała wszystko. Po polsku, przy informacji o konkretnym
 * zdarzeniu, siedmiowyrazowe zbieżności są nie do uniknięcia: „Pieniński Park
 * Narodowy poinformował, że od poniedziałku" to nie zapożyczenie, tylko
 * jedyny naturalny sposób napisania tego zdania. Nazwy własne, urzędowe
 * sformułowania i daty same układają się tak samo u każdego piszącego.
 *
 * Dlatego patrzymy na dwie rzeczy naraz. Pojedynczy **długi** ciąg jest
 * podejrzany sam z siebie — dziesięć słów pod rząd nie układa się identycznie
 * przez przypadek. **Krótsze** zbieżności są niewinne pojedynczo, ale kilka
 * z nich w trzystuwyrazowym tekście znaczy, że autor szedł zdanie po zdaniu
 * za oryginałem.
 *
 * **Dlaczego cytaty są wyjmowane przed sprawdzeniem.** Polecenie dla modelu
 * wprost dopuszcza krótki cytat z wypowiedzi konkretnej osoby — a cytat MUSI
 * być identyczny jak w źródle, bo inaczej nie jest cytatem. Sprawdzanie ich
 * karałoby dokładnie to zachowanie, na które pozwoliliśmy.
 */

/** Ciąg tej długości wystarcza sam, żeby uznać notkę za przepisaną. */
const DLUGOSC_SILNA = 10

/** Ciągi tej długości liczymy — dopiero kilka z nich jest sygnałem. */
const DLUGOSC_SLABA = 8

/** Ile słabych zbieżności składa się na mocny sygnał. */
const PROG_SLABYCH = 3

/**
 * Wycina cytaty.
 *
 * Obsługujemy polskie cudzysłowy drukarskie i proste — model używa jednych
 * albo drugich zależnie od tego, co akurat zobaczył w źródle.
 */
function bezCytatow(tekst: string): string {
  return tekst
    .replace(/„[^”]*”/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/«[^»]*»/g, ' ')
}

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

function wspolne(slowaNotki: string[], zeZrodla: Set<string>, dlugosc: number): string[] {
  const trafienia: string[] = []
  for (const ciag of ciagi(slowaNotki, dlugosc)) {
    if (zeZrodla.has(ciag)) trafienia.push(ciag)
  }
  return trafienia
}

export type WynikKontroli = {
  czyste: boolean
  /** Znalezione zbieżności — do pokazania administratorowi. */
  zbieznosci: string[]
}

/**
 * Sprawdza, czy notka nie przepisuje zdań ze źródła.
 */
export function sprawdzZapozyczenia(notka: string, zrodlo: string): WynikKontroli {
  const slowaNotki = naSlowa(bezCytatow(notka))
  if (slowaNotki.length < DLUGOSC_SLABA) return { czyste: true, zbieznosci: [] }

  const slowaZrodla = naSlowa(zrodlo)
  const dlugie = wspolne(slowaNotki, ciagi(slowaZrodla, DLUGOSC_SILNA), DLUGOSC_SILNA)
  const krotkie = wspolne(slowaNotki, ciagi(slowaZrodla, DLUGOSC_SLABA), DLUGOSC_SLABA)

  const czyste = dlugie.length === 0 && krotkie.length < PROG_SLABYCH

  return {
    czyste,
    // Pokazujemy długie, jeśli są — one najlepiej tłumaczą, o co chodzi.
    zbieznosci: (dlugie.length > 0 ? dlugie : krotkie).slice(0, 5),
  }
}

/**
 * Udział słów notki, które pojawiają się w źródle w tej samej kolejności.
 *
 * Miara pomocnicza do dziennika w panelu: sama w sobie nie blokuje niczego,
 * ale rosnąca wartość przy kolejnych notkach jest sygnałem, że polecenie dla
 * modelu wymaga poprawy.
 */
export function udzialWspolnychTrojek(notka: string, zrodlo: string): number {
  const slowaNotki = naSlowa(bezCytatow(notka))
  if (slowaNotki.length < 3) return 0

  const zeZrodla = ciagi(naSlowa(zrodlo), 3)
  const trojkiNotki = [...ciagi(slowaNotki, 3)]
  if (trojkiNotki.length === 0) return 0

  const wspolneTrojki = trojkiNotki.filter((trojka) => zeZrodla.has(trojka)).length
  return Math.round((wspolneTrojki / trojkiNotki.length) * 100)
}
