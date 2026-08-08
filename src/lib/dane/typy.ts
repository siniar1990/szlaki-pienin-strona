/**
 * Model domenowy portalu.
 *
 * To jest kształt, którego używają komponenty — nazwy pól po polsku, ale
 * w camelCase, bez podkreśleń i bez pól technicznych z aplikacji. Warstwa
 * ładująca (`trasy.ts`) tłumaczy surowe pliki na te typy i to jedyne miejsce
 * w projekcie, które wie, jak wyglądają dane w repozytorium aplikacji.
 *
 * Dzięki temu podmiana źródła na CMS albo API sprowadza się do napisania
 * nowej implementacji `ZrodloDanych` — komponenty nie zauważą różnicy.
 */

/** [długość geograficzna, szerokość geograficzna] — kolejność jak w GeoJSON. */
export type Wspolrzedne = [number, number]

/** Wartość osobno dla marszu tam i z powrotem. */
export type TamPowrot = {
  tam: number
  powrot: number
}

/**
 * Trudność nie przychodzi z aplikacji — wyliczamy ją z długości i sumy
 * podejść. Zawsze podajemy przy niej, skąd się wzięła, żeby nikt nie wziął
 * jej za ocenę autora przewodnika.
 */
export type Trudnosc = 'latwa' | 'srednia' | 'trudna'

export type TypPunktu =
  | 'szczyt'
  | 'przelecz'
  | 'schronisko'
  | 'punkt_widokowy'
  | 'miejscowosc'
  | 'zamek'
  | 'kolej_linowa'
  | 'muzeum'
  | 'przejscie_graniczne'
  | 'atrakcja'
  | 'kaplica'
  | 'kosciol'
  | 'zrodlo'
  | 'inny'

export type Punkt = {
  nazwa: string
  typ: TypPunktu
  wspolrzedne: Wspolrzedne
  /** Czas dojścia od początku trasy, narastająco. */
  czasNarastMin: TamPowrot
  wysokoscM: number | null
  zdjecie: string | null
}

export type Segment = {
  od: string
  do: string
  tekst: string
  wskazowka: string | null
}

/** Ciekawostka przypięta do miejsca — w przewodniku PTTK zwana „ramką". */
export type Ciekawostka = {
  wspolrzedne: Wspolrzedne
  tytul: string
  tekst: string
}

export type OdcinekKoloru = {
  kolor: string
  do: string | null
}

/** Fotografia z przewodnika wraz z podpisem. */
export type Zdjecie = {
  adres: string
  podpis: string | null
}

export type Trasa = {
  id: string
  slug: string
  nazwa: string
  opis: string | null
  kategoria: string
  kategorieDodatkowe: string[]
  dlugoscKm: number
  czasMin: TamPowrot
  sumaPodejscM: TamPowrot
  kcal: Record<string, number>
  /** Czy trasa przekracza granicę ze Słowacją — wymaga dokumentu tożsamości. */
  granica: boolean
  petla: boolean
  /** Czy trasa pochodzi z przewodnika PTTK „Szlaki pełne zdrowia". */
  pttk: boolean
  szlaki: string[]
  koloryOdcinkow: OdcinekKoloru[]
  wysokoscSzczytuM: number | null
  grupaGorska: string | null
  punkty: Punkt[]
  segmenty: Segment[]
  ciekawostki: Ciekawostka[]
  ostrzezenia: string[]
  zdjecia: Zdjecie[]
  /** Adres ilustracji w katalogu publicznym albo null, gdy trasa jej nie ma. */
  ilustracja: string | null
  /** Adres śladu GeoJSON albo null, gdy ślad nie został jeszcze zdigitalizowany. */
  slad: string | null
  trudnosc: Trudnosc
  /** Miejscowość, z której trasa się zaczyna — do filtrowania i kart. */
  miejscowoscStartu: string
  /** Najwyższy punkt na trasie w metrach n.p.m. */
  najwyzszyPunktM: number | null
  /** Pierwsze zdanie opisu — streszczenie na kartę. */
  podsumowanie: string | null
  /** Adres pliku GPX do pobrania albo null, gdy trasa nie ma śladu. */
  gpx: string | null
  /** Skąd pochodzą czasy i geometria — pokazujemy to na stronie trasy. */
  zrodla: {
    czasy: string | null
    geometria: string | null
  }
}

/** Skrócony zapis trasy na listy i kafelki — bez segmentów i ciekawostek. */
export type TrasaNaLiscie = Pick<
  Trasa,
  | 'id'
  | 'slug'
  | 'nazwa'
  | 'kategoria'
  | 'dlugoscKm'
  | 'czasMin'
  | 'sumaPodejscM'
  | 'trudnosc'
  | 'ilustracja'
  | 'petla'
  | 'granica'
  | 'szlaki'
  | 'wysokoscSzczytuM'
  | 'miejscowoscStartu'
  | 'najwyzszyPunktM'
  | 'podsumowanie'
  | 'kategorieDodatkowe'
>


/**
 * Miejsce na mapie: szczyt, punkt widokowy, schronisko, zamek.
 *
 * Powstaje z punktów tras — nie z osobnego zbioru, bo takiego w aplikacji
 * nie ma. Ten sam szczyt bywa punktem na kilku trasach, więc scalamy go
 * w jeden wpis i zapamiętujemy, którędy da się do niego dojść.
 */
export type Atrakcja = {
  slug: string
  nazwa: string
  typ: TypPunktu
  wspolrzedne: Wspolrzedne
  wysokoscM: number | null
  /** Identyfikatory tras prowadzących do tego miejsca. */
  trasy: string[]
  /** Ciekawostki z przewodnika przypięte w pobliżu tego punktu. */
  ciekawostki: Ciekawostka[]
}

/** Punkt użytkowy z okolicy — nocleg, sklep, restauracja. */
export type Miejsce = {
  nazwa: string
  typ: string
  wspolrzedne: Wspolrzedne
}

export type Wyzwanie = {
  id: string
  /** Adres strony wyzwania: `/wyzwania/diament`. */
  slug: string
  nazwa: string
  podtytul: string | null
  /** Zdanie-motto z aplikacji, np. „Rozpocznij o wschodzie, zakończ o zachodzie". */
  haslo: string | null
  /** Opis rozbity na akapity — dokładnie tak, jak trzyma go aplikacja. */
  akapity: string[]
  /** Szczyty i miejsca do zaliczenia, w kolejności z regulaminu. */
  szczyty: string[]
  wskazowki: string[]
  /** Okres, w którym można zdobyć odznakę; `null` = bez ograniczenia. */
  okres: string | null
  /** Dlaczego okres jest ograniczony. */
  okresUwaga: string | null
  idTrasy: string | null
  odznaka: string | null
  film: string | null
  /** Kto nagrał film — wymóg wobec autorów, nie ozdoba. */
  filmZrodlo: string | null
  regulamin: string | null
  /** Kolejność z aplikacji; wyzwania bez numeru idą na koniec. */
  kolejnosc: number
  dostepne: boolean
}

/** Liczby pokazywane w sekcji powitalnej — wyłącznie policzone z danych. */
export type StatystykiPortalu = {
  liczbaTras: number
  sumaKm: number
  liczbaSzczytow: number
  liczbaPunktowWidokowych: number
  liczbaCiekawostek: number
  liczbaSchronisk: number
}
