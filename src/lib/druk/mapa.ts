import { BARWY_SZLAKOW, KOLOR_BEZ_ZNAKOWANIA, hexBarwy } from '@/lib/mapa/barwy-szlakow'

import {
  type Punkt,
  type Zasieg,
  odlegloscM,
  podzialka,
  rzutowanie,
  sciezka,
  wygladz,
  zasiegPunktow,
} from './geometria'

/**
 * Mapa na karcie do druku — model do narysowania w SVG.
 *
 * **Skąd wie, którym szlakiem biegnie który odcinek.** Z tego samego pliku, co
 * mapa na stronie trasy: `dane/slady/<ID>.kolory.geojson`, gdzie ślad jest już
 * pocięty na odcinki z nazwą barwy znakowania. Nie ma tu drugiego opisu
 * przebiegu i nie ma czego zsynchronizować — jedno źródło zasila oba widoki.
 *
 * Gdy pliku barw nie ma, rysujemy całą trasę linią „bez znaków" i nie zgadujemy
 * kolorów. Kolor wzięty z sufitu byłby gorszy niż jego brak: turysta szukałby
 * na drzewach znaku, którego tam nie ma.
 */

export const SZEROKOSC = 1000
export const WYSOKOSC = 1080

/** Zapas na podpisy znaczników, które wychodzą poza sam ślad. */
const MARGINES = 105

export type OdcinekMapy = {
  /** Nazwa barwy z danych albo null dla odcinka bez znakowania. */
  barwa: string | null
  hex: string
  d: string
  /** Żółty na białym papierze ginie — dostaje ciemny obrys. */
  zObrysem: boolean
  /** Wzór kreskowania albo undefined dla linii ciągłej. */
  kreska: string | undefined
}

/**
 * Kreskowanie odróżniające szlaki na wydruku czarno-białym.
 *
 * **Skąd to się bierze.** Karta ma być czytelna na najprostszej drukarce,
 * a trzy barwy znakowania mają niemal tę samą jasność: niebieski 0,133,
 * zielony 0,155, czerwony 0,161. Po konwersji do szarości stają się jedną
 * i tą samą szarą linią — mapa przestaje odpowiadać na pytanie „za czym
 * teraz idę", czyli traci to, po co powstała.
 *
 * Żółty (0,730), szary „bez znaków" (0,289) i czarny (0,015) różnią się
 * jasnością dostatecznie i zostają linią ciągłą. Kreskujemy tylko te trzy,
 * które tego wymagają — dorzucanie wzoru wszystkim zamieniłoby mapę
 * w plątaninę kresek.
 *
 * To jedyne miejsce, w którym karta odchodzi od mockupu, i jest to odejście
 * przewidziane w zamówieniu: „jeśli nie [różnią się], dodaj różne wzory
 * kreskowania".
 */
const KRESKOWANIE: Record<string, string | undefined> = {
  czerwony: undefined,
  zielony: '30 9',
  niebieski: '10 8',
  zolty: undefined,
  czarny: undefined,
}

/** Odcinek bez znakowania — kreska rzadsza niż u szlaków, jak w mockupie. */
const KRESKA_BEZ_ZNAKOW = '16 13'

export type ZnacznikMapy = {
  numer: number
  nazwa: string
  x: number
  y: number
  /** Po której stronie kropki stoi podpis. */
  kotwica: 'start' | 'end' | 'middle'
  podpisX: number
  podpisY: number
}

export type MapaKarty = {
  odcinki: OdcinekMapy[]
  znaczniki: ZnacznikMapy[]
  podzialka: { dlugoscPx: number; etykieta: string }
  /** Nazwy barw występujących na tej trasie — do legendy pod mapą. */
  barwyWystepujace: (string | null)[]
  /** Opis przebiegu dla czytnika ekranu. */
  opis: string
}

type Odcinek = { barwa: string | null; punkty: Punkt[] }

/** Odcinki z pliku barw albo — gdy go nie ma — cały ślad jako „bez znaków". */
export function odcinkiZDanych(
  kolory: unknown | null,
  slad: readonly Punkt[],
): Odcinek[] {
  const cechy = (kolory as { features?: unknown })?.features
  if (!Array.isArray(cechy) || cechy.length === 0) {
    return slad.length >= 2 ? [{ barwa: null, punkty: [...slad] }] : []
  }

  const wynik: Odcinek[] = []
  for (const cecha of cechy) {
    const geometria = (cecha as { geometry?: { type?: string; coordinates?: unknown } })?.geometry
    if (geometria?.type !== 'LineString' || !Array.isArray(geometria.coordinates)) continue

    const punkty = (geometria.coordinates as number[][])
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .map((p) => [p[0], p[1]] as Punkt)
    if (punkty.length < 2) continue

    const nazwa = (cecha as { properties?: { kolor?: unknown } })?.properties?.kolor
    const barwa = typeof nazwa === 'string' && nazwa in BARWY_SZLAKOW ? nazwa : null
    wynik.push({ barwa, punkty })
  }

  return wynik
}

export type PunktEtapowy = { nazwa: string; wspolrzedne: Punkt }

export function zbudujMape(
  odcinki: Odcinek[],
  punktyEtapowe: readonly PunktEtapowy[],
): MapaKarty | null {
  const wszystkie = odcinki.flatMap((o) => o.punkty)
  if (wszystkie.length < 2) return null

  const zasieg = zasiegPunktow([...wszystkie, ...punktyEtapowe.map((p) => p.wspolrzedne)])
  if (!zasieg) return null

  const rzut = rzutowanie(rozszerz(zasieg), SZEROKOSC, WYSOKOSC, MARGINES)

  const narysowane: OdcinekMapy[] = odcinki.map((odcinek) => {
    const punkty = wygladz(odcinek.punkty.map(rzut) as Punkt[])
    return {
      barwa: odcinek.barwa,
      hex: odcinek.barwa ? hexBarwy(odcinek.barwa) : KOLOR_BEZ_ZNAKOWANIA,
      d: sciezka(punkty),
      zObrysem: odcinek.barwa === 'zolty',
      kreska: odcinek.barwa === null ? KRESKA_BEZ_ZNAKOW : KRESKOWANIE[odcinek.barwa],
    }
  })

  const znaczniki: ZnacznikMapy[] = punktyEtapowe.map((punkt, indeks) => {
    const [x, y] = rzut(punkt.wspolrzedne)
    // Podpis ucieka od krawędzi: przy lewym brzegu idzie w prawo i odwrotnie.
    const kotwica = x < SZEROKOSC * 0.42 ? 'start' : 'end'
    return {
      numer: indeks + 1,
      nazwa: punkt.nazwa,
      x,
      y,
      kotwica,
      podpisX: kotwica === 'start' ? x + 24 : x - 24,
      podpisY: y + 6,
    }
  })

  const barwyWystepujace: (string | null)[] = []
  for (const odcinek of odcinki) {
    if (!barwyWystepujace.includes(odcinek.barwa)) barwyWystepujace.push(odcinek.barwa)
  }

  return {
    odcinki: narysowane,
    znaczniki,
    podzialka: podzialka(rzut.jednostekNaMetr, SZEROKOSC),
    barwyWystepujace,
    opis: opisPrzebiegu(odcinki),
  }
}

/**
 * Zasięg rozsunięty o dziesiątą część — żeby ślad nie dotykał ramki.
 *
 * Trasa biegnąca dokładnie z zachodu na wschód ma zerową wysokość zasięgu;
 * bez rozsunięcia skala wyszłaby nieskończona.
 */
function rozszerz(zasieg: Zasieg): Zasieg {
  const [zachod, poludnie, wschod, polnoc] = zasieg
  const luzX = Math.max((wschod - zachod) * 0.06, 0.0015)
  const luzY = Math.max((polnoc - poludnie) * 0.06, 0.0015)
  return [zachod - luzX, poludnie - luzY, wschod + luzX, polnoc + luzY]
}

const NAZWY_BARW: Record<string, string> = {
  zolty: 'szlak żółty',
  niebieski: 'szlak niebieski',
  czerwony: 'szlak czerwony',
  zielony: 'szlak zielony',
  czarny: 'szlak czarny',
}

/** Wzór kreskowania do próbki w legendzie — ten sam, co na mapie. */
export function kreskaBarwy(barwa: string | null): string | undefined {
  return barwa === null ? KRESKA_BEZ_ZNAKOW : KRESKOWANIE[barwa]
}

export function nazwaBarwy(barwa: string | null): string {
  return barwa ? (NAZWY_BARW[barwa] ?? 'szlak') : 'bez znaków'
}

/**
 * Zdanie o przebiegu dla czytnika ekranu.
 *
 * Mapa jest obrazkiem i dla kogoś, kto jej nie widzi, sama w sobie nie niesie
 * nic. Barwa szlaku to informacja praktyczna, nie ozdoba — musi dać się
 * usłyszeć, a nie tylko zobaczyć.
 */
function opisPrzebiegu(odcinki: Odcinek[]): string {
  if (odcinki.length === 0) return 'Mapa trasy.'

  const dlugosci = odcinki.map((o) => {
    let suma = 0
    for (let i = 1; i < o.punkty.length; i += 1) suma += odlegloscM(o.punkty[i - 1], o.punkty[i])
    return suma
  })

  const czesci = odcinki.map((o, i) => {
    const km = dlugosci[i] / 1000
    return `${nazwaBarwy(o.barwa)} ${km.toFixed(1).replace('.', ',')} km`
  })

  return `Mapa trasy. Kolejno: ${czesci.join(', ')}.`
}
