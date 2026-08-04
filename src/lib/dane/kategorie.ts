import type { Trasa } from './typy'

/**
 * Kategorie tras pokazywane na portalu.
 *
 * Nie wszystkie pochodzą wprost z aplikacji — część wyliczamy z danych, które
 * już mamy (czas, trudność, typy punktów). Każda kategoria musi dać się
 * uzasadnić danymi; dlatego nie ma tu „tras na zachód słońca" ani „tras
 * weekendowych" z briefu: nic w danych nie mówi, o której zachodzi słońce
 * ani co autor uznałby za weekend, a wymyślanie takiego podziału robiłoby
 * z portalu zgadywankę.
 */

export type DefinicjaKategorii = {
  slug: string
  nazwa: string
  /** Zdanie pod nagłówkiem — służy też jako opis dla wyszukiwarki. */
  opis: string
  pasuje: (trasa: Trasa) => boolean
}

/** Trasa całodniowa: powyżej pięciu godzin marszu w jedną stronę. */
const PROG_CALODNIOWEJ_MIN = 5 * 60

export const KATEGORIE_TRAS: DefinicjaKategorii[] = [
  {
    slug: 'piesze',
    nazwa: 'Szlaki piesze',
    opis:
      'Wszystkie trasy do przejścia na własnych nogach — od spacerów nad Grajcarkiem ' +
      'po całodniowe wyprawy w pienińskie granie.',
    pasuje: (trasa) => trasa.kategoria !== 'rowerowa',
  },
  {
    slug: 'rowerowe',
    nazwa: 'Trasy rowerowe',
    opis: 'Trasy przygotowane z myślą o rowerze, w tym przejazdy wzdłuż Dunajca.',
    pasuje: (trasa) => trasa.kategoria === 'rowerowa',
  },
  {
    slug: 'rodzinne',
    nazwa: 'Trasy z dziećmi',
    opis:
      'Krótsze wyjścia bez trudności technicznych, które dziecko przejdzie ' +
      'bez marudzenia — z miejscami na odpoczynek po drodze.',
    pasuje: (trasa) => trasa.kategoria === 'dzieci',
  },
  {
    slug: 'panoramy',
    nazwa: 'Najpiękniejsze panoramy',
    opis:
      'Trasy prowadzące przez punkty widokowe i szczyty, z których widać ' +
      'Pieniny, Tatry i dolinę Dunajca.',
    pasuje: (trasa) =>
      trasa.punkty.some((punkt) => punkt.typ === 'punkt_widokowy' || punkt.typ === 'szczyt'),
  },
  {
    slug: 'latwe',
    nazwa: 'Łatwe',
    opis: 'Trasy na spokojne pół dnia — niewielkie podejścia, krótki dystans.',
    pasuje: (trasa) => trasa.trudnosc === 'latwa',
  },
  {
    slug: 'srednie',
    nazwa: 'Średnie',
    opis: 'Solidne pół dnia w tempie marszowym, z wyraźnym podejściem.',
    pasuje: (trasa) => trasa.trudnosc === 'srednia',
  },
  {
    slug: 'trudne',
    nazwa: 'Trudne',
    opis: 'Całodniowe wyjścia z dużą sumą podejść. Wychodź wcześnie rano.',
    pasuje: (trasa) => trasa.trudnosc === 'trudna',
  },
  {
    slug: 'calodniowe',
    nazwa: 'Całodniowe',
    opis: 'Trasy, na które trzeba zarezerwować pełny dzień — ponad pięć godzin marszu.',
    pasuje: (trasa) => trasa.czasMin.tam >= PROG_CALODNIOWEJ_MIN,
  },
  {
    slug: 'petle',
    nazwa: 'Pętle',
    opis: 'Trasy wracające do punktu startu — nie trzeba organizować transportu powrotnego.',
    pasuje: (trasa) => trasa.petla,
  },
  {
    slug: 'przez-granice',
    nazwa: 'Przez granicę',
    opis:
      'Trasy przekraczające granicę ze Słowacją. Weź dowód osobisty lub paszport — ' +
      'kontrola bywa i mandat też.',
    pasuje: (trasa) => trasa.granica,
  },
  {
    slug: 'korony-pienin',
    nazwa: 'Korony Pienin',
    opis: 'Trasy wchodzące w skład pienińskiej kolekcji szczytów.',
    pasuje: (trasa) => trasa.kategoria === 'korony-pienin',
  },
]

export function znajdzKategorie(slug: string): DefinicjaKategorii | null {
  return KATEGORIE_TRAS.find((kategoria) => kategoria.slug === slug) ?? null
}
