import type { Trasa } from './typy'

/**
 * Gotowe zestawy tras — punkt wyjścia dla kogoś, kto wchodzi pierwszy raz.
 *
 * Kolekcja odpowiada na pytanie „mam pół dnia i dziecko, co robić", a nie
 * „jakie są kategorie w bazie". Dlatego nazwy są zdaniami z życia, a nie
 * etykietami z danych.
 *
 * Czego tu nie ma i dlaczego:
 *
 *  • „Najpopularniejsze" — portal nie zbiera statystyk odwiedzin, więc
 *    popularności nie zna. Zamiast zmyślać, jest „Na dobry początek",
 *    liczone po kompletności opisu, co da się sprawdzić.
 *  • „Trasy na zachód słońca" — nic w danych nie mówi o porze dnia ani
 *    o ekspozycji zachodniej. Taka kolekcja byłaby zgadywanką.
 *  • „Trasy narciarskie" — w danych aplikacji nie ma ani jednej. Pojawi się
 *    sama, gdy trasy dojdą; wystarczy odkomentować wpis niżej.
 */

export type Kolekcja = {
  slug: string
  nazwa: string
  /** Jedno zdanie: dla kogo i kiedy. */
  opis: string
  /** Emoji-wolna ikona z Lucide, po nazwie — komponent ją rozwiązuje. */
  ikona: 'kompas' | 'dzieci' | 'panorama' | 'slonce' | 'rower' | 'gora' | 'zegar' | 'stopa'
  pasuje: (trasa: Trasa) => boolean
  /** Jak układać trasy w kolekcji. Domyślnie po nazwie. */
  sortuj?: (a: Trasa, b: Trasa) => number
}

const CALY_DZIEN_MIN = 5 * 60
const SPACER_MIN = 2.5 * 60

export const KOLEKCJE: Kolekcja[] = [
  {
    slug: 'na-dobry-poczatek',
    nazwa: 'Na dobry początek',
    opis: 'Trasy opisane najdokładniej — ze śladem, opisem odcinek po odcinku i ciekawostkami.',
    ikona: 'kompas',
    pasuje: (trasa) => trasa.slad !== null && trasa.opis !== null && trasa.segmenty.length >= 5,
    sortuj: (a, b) =>
      b.segmenty.length + b.ciekawostki.length - (a.segmenty.length + a.ciekawostki.length),
  },
  {
    slug: 'z-dziecmi',
    nazwa: 'Z dziećmi',
    opis: 'Krótkie, bez trudności technicznych, z miejscami na odpoczynek po drodze.',
    ikona: 'dzieci',
    pasuje: (trasa) =>
      trasa.kategoria === 'dzieci' || trasa.kategorieDodatkowe.includes('dzieci'),
  },
  {
    slug: 'krotkie-spacery',
    nazwa: 'Krótkie spacery',
    opis: 'Do dwóch i pół godziny — na popołudnie albo na dzień z niepewną pogodą.',
    ikona: 'stopa',
    pasuje: (trasa) => trasa.czasMin.tam <= SPACER_MIN,
    sortuj: (a, b) => a.czasMin.tam - b.czasMin.tam,
  },
  {
    slug: 'panoramy',
    nazwa: 'Najpiękniejsze panoramy',
    opis: 'Przez punkty widokowe i szczyty, z których widać Pieniny, Tatry i dolinę Dunajca.',
    ikona: 'panorama',
    pasuje: (trasa) =>
      trasa.punkty.some((punkt) => punkt.typ === 'punkt_widokowy') ||
      (trasa.najwyzszyPunktM ?? 0) >= 900,
    sortuj: (a, b) => (b.najwyzszyPunktM ?? 0) - (a.najwyzszyPunktM ?? 0),
  },
  {
    slug: 'calodniowe',
    nazwa: 'Całodniowe wyprawy',
    opis: 'Ponad pięć godzin marszu. Wyjdź rano, sprawdź pogodę dzień wcześniej.',
    ikona: 'zegar',
    pasuje: (trasa) => trasa.czasMin.tam >= CALY_DZIEN_MIN,
    sortuj: (a, b) => b.czasMin.tam - a.czasMin.tam,
  },
  {
    slug: 'rowerowe',
    nazwa: 'Na rowerze',
    opis: 'Przejazdy doliną Dunajca i pienińskimi dolinami.',
    ikona: 'rower',
    pasuje: (trasa) => trasa.kategoria === 'rowerowa',
  },
  {
    slug: 'dla-poczatkujacych',
    nazwa: 'Dla początkujących',
    opis: 'Niewielkie podejścia i krótki dystans — dobre pierwsze wyjście w góry.',
    ikona: 'stopa',
    pasuje: (trasa) => trasa.trudnosc === 'latwa',
    sortuj: (a, b) => a.dlugoscKm - b.dlugoscKm,
  },
  {
    slug: 'dla-zaawansowanych',
    nazwa: 'Dla zaawansowanych',
    opis: 'Duża suma podejść i długi dystans. Kondycja przyda się bardziej niż sprzęt.',
    ikona: 'gora',
    pasuje: (trasa) => trasa.trudnosc === 'trudna',
    sortuj: (a, b) => b.sumaPodejscM.tam - a.sumaPodejscM.tam,
  },
  {
    slug: 'korony-pienin',
    nazwa: 'Korony Pienin',
    opis: 'Dwadzieścia cztery szczyty do zdobycia ze Szczawnicy, od najwyższego.',
    ikona: 'gora',
    pasuje: (trasa) => trasa.kategoria === 'korony-pienin',
    sortuj: (a, b) => (b.wysokoscSzczytuM ?? 0) - (a.wysokoscSzczytuM ?? 0),
  },
  {
    slug: 'przez-granice',
    nazwa: 'Przez granicę',
    opis: 'Trasy wchodzące na słowacką stronę. Weź dowód osobisty albo paszport.',
    ikona: 'slonce',
    pasuje: (trasa) => trasa.granica,
  },
]

export function znajdzKolekcje(slug: string): Kolekcja | null {
  return KOLEKCJE.find((kolekcja) => kolekcja.slug === slug) ?? null
}

/** Trasy w kolekcji, w jej własnej kolejności. */
export function trasyWKolekcji(kolekcja: Kolekcja, trasy: Trasa[]): Trasa[] {
  const wybrane = trasy.filter(kolekcja.pasuje)
  return kolekcja.sortuj
    ? [...wybrane].sort(kolekcja.sortuj)
    : [...wybrane].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))
}
