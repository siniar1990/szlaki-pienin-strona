import type { Trasa } from './typy'

/**
 * Kategorie tras.
 *
 * Pierwsza grupa to **kategorie aplikacji** — te same, w tej samej kolejności,
 * co na ekranie startowym w telefonie. Kolejność nie jest przypadkowa: idzie
 * od najkrótszych wyjść do najpoważniejszych, a wyzwania zamykają listę.
 * Trzymanie tego w zgodzie z aplikacją nie jest kaprysem — ktoś, kto zeskanuje
 * kod QR na szlaku, a potem pobierze aplikację, ma zobaczyć ten sam podział,
 * a nie uczyć się drugiego układu.
 *
 * Druga grupa to kategorie wyliczane przez portal (trudność, pętle, granica).
 * Aplikacja ich nie ma, ale wyszukiwarka dostaje po nich zapytania.
 */

export type DefinicjaKategorii = {
  slug: string
  nazwa: string
  /** Krótki podtytuł — ten sam, co pod kafelkiem w aplikacji. */
  podtytul?: string
  /** Zdanie pod nagłówkiem; służy też jako opis dla wyszukiwarki. */
  opis: string
  /**
   * Ilustracja na kafelek. Wszystkie pochodzą z aplikacji — to malowane
   * rysunki tras, nie zdjęcia z internetu, więc kafelki mają jednolity
   * charakter i są nasze.
   */
  ilustracja?: string
  pasuje: (trasa: Trasa) => boolean
}

/** Czy trasa należy do kategorii — także jako kategoria dodatkowa. */
function wKategorii(trasa: Trasa, id: string): boolean {
  return trasa.kategoria === id || trasa.kategorieDodatkowe.includes(id)
}

const ILUSTRACJE = '/dane/ilustracje'

/** Kategorie odwzorowane z ekranu startowego aplikacji — kolejność jak tam. */
export const KATEGORIE_APLIKACJI: DefinicjaKategorii[] = [
  {
    slug: 'krotkie',
    nazwa: 'Piesze trasy krótkie',
    podtytul: '2–4 h',
    opis:
      'Wyjścia na pół dnia — akurat tyle, żeby wrócić na obiad. Dobre na pierwszy ' +
      'dzień pobytu i na dzień, w którym pogoda jest niepewna.',
    ilustracja: `${ILUSTRACJE}/1A.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'krotka'),
  },
  {
    slug: 'srednie',
    nazwa: 'Piesze trasy średnie',
    podtytul: '4–6 h',
    opis:
      'Solidny dzień w górach z wyraźnym podejściem i widokami z grani. ' +
      'Wychodź rano, wracaj na kolację.',
    ilustracja: `${ILUSTRACJE}/1B.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'srednia'),
  },
  {
    slug: 'dlugie',
    nazwa: 'Piesze trasy długie',
    podtytul: 'ponad 6 h',
    opis:
      'Całodniowe wyprawy przez kilka szczytów. Wymagają wczesnego wyjścia, ' +
      'zapasu wody i sprawdzenia pogody dzień wcześniej.',
    ilustracja: `${ILUSTRACJE}/1C.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'dluga'),
  },
  {
    slug: 'trzy-korony',
    nazwa: 'Trzy Korony',
    podtytul: 'trzy warianty',
    opis:
      'Najsłynniejszy szczyt Pienin i trzy różne sposoby, żeby na niego wejść — ' +
      'od najłatwiejszego po najbardziej widokowy.',
    ilustracja: `${ILUSTRACJE}/TK1.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'trzy-korony'),
  },
  {
    slug: 'z-dziecmi',
    nazwa: 'Piesze trasy z dziećmi',
    podtytul: 'łatwe, rodzinne',
    opis:
      'Krótkie i bez trudności technicznych, z miejscami na odpoczynek. ' +
      'Takie, po których dziecko chce wrócić w góry, a nie odwrotnie.',
    // Zapas na wypadek usunięcia zdjęcia z `public/marka/kategorie/`:
    // brukowana promenada nad Grajcarkiem z dziećmi na hulajnogach.
    ilustracja: '/dane/zdjecia/dp_droga.jpg',
    pasuje: (trasa) => wKategorii(trasa, 'dzieci'),
  },
  {
    slug: 'rowerowe',
    nazwa: 'Trasy rowerowe',
    podtytul: 'na rowerze',
    opis: 'Przejazdy wzdłuż Dunajca i przez pienińskie doliny.',
    ilustracja: `${ILUSTRACJE}/R1.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'rowerowa'),
  },
  {
    slug: 'korony-pienin',
    nazwa: 'Korony Pienin ze Szczawnicy',
    podtytul: '24 szczyty, od najwyższego',
    opis:
      'Kolekcja dwudziestu czterech szczytów do zdobycia ze Szczawnicy — ' +
      'od najwyższego w dół.',
    ilustracja: `${ILUSTRACJE}/KP01.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'korony-pienin'),
  },
  {
    slug: 'wyzwania',
    nazwa: 'Pienińskie wyzwania',
    podtytul: 'odznaki turystyczne',
    opis:
      'Diament Pienin, Rubin Szczawnicy i Szmaragd Dunajca — odznaki PTTK ' +
      'z regulaminem, okresem zdobywania i odznaką na koniec.',
    ilustracja: `${ILUSTRACJE}/DIAMENT.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'wyzwania'),
  },
  {
    slug: 'z-psem',
    nazwa: 'Trasy z psem',
    podtytul: 'poza parkiem narodowym',
    opis:
      'W Pienińskim Parku Narodowym psy są zakazane — także na smyczy. ' +
      'Tu zbieramy trasy, które w park nie wchodzą: Małe Pieniny, dolina ' +
      'Grajcarka, grzbiety nad Jaworkami.',
    ilustracja: `${ILUSTRACJE}/2A.webp`,
    pasuje: (trasa) => wKategorii(trasa, 'z-psem'),
  },
]

/**
 * Kategorie wyliczane przez portal.
 *
 * Nie ma tu „tras na zachód słońca" ani „weekendowych" z pierwotnego zamówienia:
 * nic w danych nie mówi, o której zachodzi słońce ani co autor uznałby za
 * weekend, a wymyślanie takiego podziału robiłoby z portalu zgadywankę.
 */
const PROG_CALODNIOWEJ_MIN = 5 * 60

export const KATEGORIE_WYLICZANE: DefinicjaKategorii[] = [
  {
    slug: 'latwe',
    nazwa: 'Łatwe',
    opis: 'Trasy na spokojne pół dnia — niewielkie podejścia, krótki dystans.',
    pasuje: (trasa) => trasa.trudnosc === 'latwa',
  },
  {
    slug: 'srednio-trudne',
    nazwa: 'Średnio trudne',
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
    slug: 'panoramy',
    nazwa: 'Najpiękniejsze panoramy',
    opis:
      'Trasy prowadzące przez punkty widokowe i szczyty, z których widać Pieniny, ' +
      'Tatry i dolinę Dunajca.',
    pasuje: (trasa) =>
      trasa.punkty.some((punkt) => punkt.typ === 'punkt_widokowy' || punkt.typ === 'szczyt'),
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
]

export const KATEGORIE_TRAS: DefinicjaKategorii[] = [
  ...KATEGORIE_APLIKACJI,
  ...KATEGORIE_WYLICZANE,
]

export function znajdzKategorie(slug: string): DefinicjaKategorii | null {
  return KATEGORIE_TRAS.find((kategoria) => kategoria.slug === slug) ?? null
}
