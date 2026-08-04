import type { Trudnosc } from '@/lib/dane/typy'

/**
 * Zamiana liczb z danych na napisy dla człowieka.
 *
 * Wszystko w jednym miejscu, bo te same wartości pojawiają się na kafelku,
 * na stronie trasy i w danych strukturalnych dla wyszukiwarki. Gdy „2 h 55 min"
 * w jednym miejscu, a „175 min" w drugim, strona wygląda na sklejoną z dwóch.
 */

/** 175 → „2 h 55 min", 45 → „45 min", 120 → „2 h". */
export function czas(minuty: number): string {
  const godziny = Math.floor(minuty / 60)
  const reszta = minuty % 60
  if (godziny === 0) return `${reszta} min`
  if (reszta === 0) return `${godziny} h`
  return `${godziny} h ${reszta} min`
}

/** Wersja dla atrybutu `datetime` i danych strukturalnych: ISO 8601. */
export function czasIso(minuty: number): string {
  const godziny = Math.floor(minuty / 60)
  const reszta = minuty % 60
  return `PT${godziny ? `${godziny}H` : ''}${reszta ? `${reszta}M` : ''}` || 'PT0M'
}

/**
 * 10.5 → „10,5 km". Przecinek, bo to polska strona — a przy okazji ucinamy
 * zbędne zero po przecinku: „12 km" czyta się lepiej niż „12,0 km".
 */
export function kilometry(km: number): string {
  const zaokraglone = Math.round(km * 10) / 10
  return `${zaokraglone.toString().replace('.', ',')} km`
}

export function metry(m: number): string {
  return `${new Intl.NumberFormat('pl-PL').format(Math.round(m))} m`
}

export function liczba(n: number): string {
  return new Intl.NumberFormat('pl-PL').format(n)
}

export const TRUDNOSC_ETYKIETY: Record<Trudnosc, string> = {
  latwa: 'Łatwa',
  srednia: 'Średnia',
  trudna: 'Trudna',
}

/**
 * Barwy trudności. Zieleń–bursztyn–ceglany zamiast zieleń–żółć–czerwień:
 * czysta żółć na białym tle nie wyrabia kontrastu 4,5:1 i napis na niej
 * przestaje być czytelny dla części czytających.
 */
export const TRUDNOSC_STYLE: Record<Trudnosc, string> = {
  latwa: 'bg-las-50 text-las-800 border-las-200',
  srednia: 'bg-amber-50 text-amber-900 border-amber-200',
  trudna: 'bg-orange-50 text-orange-900 border-orange-200',
}

/** Nazwy kategorii z aplikacji w formie, którą można pokazać na stronie. */
export const KATEGORIE_ETYKIETY: Record<string, string> = {
  krotka: 'Krótka',
  srednia: 'Średnia',
  dluga: 'Długa',
  dzieci: 'Z dziećmi',
  rowerowa: 'Rowerowa',
  'korony-pienin': 'Korony Pienin',
  'trzy-korony': 'Trzy Korony',
  wyzwania: 'Wyzwanie',
}

export function etykietaKategorii(kategoria: string): string {
  return KATEGORIE_ETYKIETY[kategoria] ?? kategoria
}

/**
 * Kolory szlaków turystycznych — do kropek przy nazwie trasy.
 * Wartości dobrane tak, żeby na białym tle były rozróżnialne także dla osób
 * z zaburzeniami rozpoznawania barw; dlatego przy kropce zawsze stoi nazwa.
 */
export const KOLORY_SZLAKOW: Record<string, { tlo: string; nazwa: string }> = {
  czerwony: { tlo: '#c0392b', nazwa: 'czerwony' },
  niebieski: { tlo: '#1f6dad', nazwa: 'niebieski' },
  zielony: { tlo: '#2b7a4b', nazwa: 'zielony' },
  zolty: { tlo: '#d69a00', nazwa: 'żółty' },
  czarny: { tlo: '#2f3437', nazwa: 'czarny' },
}

/** Nazwy typów punktów w formie do pokazania czytelnikowi. */
export const TYPY_PUNKTOW_ETYKIETY: Record<string, string> = {
  szczyt: 'Szczyt',
  przelecz: 'Przełęcz',
  schronisko: 'Schronisko',
  punkt_widokowy: 'Punkt widokowy',
  miejscowosc: 'Miejscowość',
  zamek: 'Zamek',
  kolej_linowa: 'Kolej linowa',
  muzeum: 'Muzeum',
  przejscie_graniczne: 'Przejście graniczne',
  atrakcja: 'Atrakcja',
  kaplica: 'Kaplica',
  kosciol: 'Kościół',
  zrodlo: 'Źródło',
  inny: 'Punkt na trasie',
  hotel: 'Nocleg',
  sklep: 'Sklep',
  restauracja: 'Restauracja',
  kapliczka: 'Kapliczka',
}

export function etykietaTypu(typ: string): string {
  return TYPY_PUNKTOW_ETYKIETY[typ] ?? 'Punkt'
}

/**
 * Nazwy grup na liście atrakcji — w liczbie mnogiej.
 *
 * Nagłówek nad dwudziestoma szczytami nie może brzmieć „Szczyt". To osobna
 * tablica, a nie próba doklejania końcówek do liczby pojedynczej: polska
 * odmiana nie da się załatwić regułą („zamek → zamki", ale „muzeum → muzea"),
 * więc formy wypisujemy wprost.
 */
export const TYPY_PUNKTOW_MNOGIE: Record<string, string> = {
  szczyt: 'Szczyty',
  przelecz: 'Przełęcze',
  schronisko: 'Schroniska',
  punkt_widokowy: 'Punkty widokowe',
  miejscowosc: 'Miejscowości',
  zamek: 'Zamki',
  kolej_linowa: 'Koleje linowe i wyciągi',
  muzeum: 'Muzea',
  przejscie_graniczne: 'Przejścia graniczne',
  kaplica: 'Kaplice',
  kosciol: 'Kościoły',
  inny: 'Pozostałe punkty',
}

export function etykietaTypuMnoga(typ: string): string {
  return TYPY_PUNKTOW_MNOGIE[typ] ?? etykietaTypu(typ)
}

/**
 * Barwy znaczników na mapie.
 *
 * Dobrane tak, żeby sąsiadujące kategorie różniły się nie tylko odcieniem,
 * ale i jasnością — inaczej przy nietypowym widzeniu barw punkt widokowy
 * i schronisko zlewają się w jedną plamę. Kategoria jest zawsze podpisana
 * w dymku, więc kolor jest podpowiedzią, a nie jedynym nośnikiem informacji.
 */
export const KOLORY_TYPOW: Record<string, string> = {
  szczyt: '#2f5d43',
  punkt_widokowy: '#1f6dad',
  przelecz: '#7c8b3f',
  schronisko: '#b5651d',
  zamek: '#6b4c9a',
  muzeum: '#8a5a44',
  kolej_linowa: '#c0392b',
  zrodlo: '#0f8b8d',
  atrakcja: '#d69a00',
  kapliczka: '#946b3c',
  hotel: '#4a5568',
  restauracja: '#a0522d',
  sklep: '#6b7280',
  miejscowosc: '#334155',
  inny: '#94a3b8',
}

export function kolorTypu(typ: string): string {
  return KOLORY_TYPOW[typ] ?? KOLORY_TYPOW.inny
}
