/**
 * Zamiana polskich nazw na adresy URL.
 *
 * Adres trasy powstaje z jej nazwy, a nie z identyfikatora („1A", „KP07"),
 * bo `/szlaki/slowacki-akcent` mówi człowiekowi i wyszukiwarce, co go czeka,
 * a `/szlaki/1a` nie mówi nic. Identyfikatory zostają wewnątrz danych.
 */

/**
 * Znaki diakrytyczne zamieniamy ręcznie, zamiast polegać na normalizacji
 * Unicode. Powód jest jeden: NFD rozkłada „ą" na „a" + ogonek i po usunięciu
 * znaków łączących wychodzi „a" — ale „ł" nie jest złożone z niczego, więc
 * przeżyłoby taką operację i wylądowało w adresie. Tablica nie ma tego
 * problemu i przy okazji widać w niej dokładnie, co się z czym dzieje.
 */
const DIAKRYTYKI: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ż: 'z', ź: 'z',
  Ą: 'a', Ć: 'c', Ę: 'e', Ł: 'l', Ń: 'n', Ó: 'o', Ś: 's', Ż: 'z', Ź: 'z',
  // Słowackie i czeskie znaki z nazw po drugiej stronie granicy —
  // część tras przekracza granicę, a szczyty mają tam swoje nazwy.
  á: 'a', č: 'c', ď: 'd', é: 'e', í: 'i', ĺ: 'l', ľ: 'l', ň: 'n', ô: 'o',
  ŕ: 'r', š: 's', ť: 't', ú: 'u', ý: 'y', ž: 'z', ě: 'e', ř: 'r', ů: 'u',
  Á: 'a', Č: 'c', É: 'e', Í: 'i', Ľ: 'l', Š: 's', Ť: 't', Ú: 'u', Ý: 'y', Ž: 'z',
}

/** Nazwa → człon adresu: „Wąwóz Homole" → „wawoz-homole". */
export function naSlug(tekst: string): string {
  return tekst
    .split('')
    .map((z) => DIAKRYTYKI[z] ?? z)
    .join('')
    .toLowerCase()
    // Cudzysłowy drukarskie z przewodnika PTTK („…") i apostrofy wypadają
    // bez śladu — inaczej zostawiłyby po sobie myślnik w środku wyrazu.
    .replace(/[„”"'’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Nadaje slugi całej kolekcji, pilnując, żeby żaden się nie powtórzył.
 *
 * Powtórki są realne: „Sokolica" bywa i szczytem, i punktem widokowym na
 * innej trasie. Gdyby dwa wpisy dostały ten sam adres, jeden przykryłby
 * drugi po cichu — przy budowaniu statycznym nikt by tego nie zauważył,
 * bo Next nadpisałby plik bez ostrzeżenia. Doklejamy więc rozróżnik.
 */
export function nadajUnikalneSlugi<T>(
  elementy: readonly T[],
  nazwa: (element: T) => string,
  rozroznik: (element: T) => string,
): Map<T, string> {
  const zajete = new Map<string, number>()
  const wynik = new Map<T, string>()

  for (const element of elementy) {
    const podstawa = naSlug(nazwa(element))
    const ileJuz = zajete.get(podstawa) ?? 0
    zajete.set(podstawa, ileJuz + 1)
    wynik.set(element, ileJuz === 0 ? podstawa : `${podstawa}-${naSlug(rozroznik(element))}`)
  }

  return wynik
}
