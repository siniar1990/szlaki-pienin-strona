import { readFileSync } from 'node:fs'
import path from 'node:path'

import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { describe, expect, it } from 'vitest'

import { BARWY_SZLAKOW, KOLOR_BEZ_ZNAKOWANIA, hexBarwy } from './barwy-szlakow'
import { granice, liniaTrasy } from './slad'
import {
  ZRODLO_SZLAKOW,
  ZRODLO_WSTEGI,
  ZRODLO_ZNAKOWANIA,
  warstwaObrysuWstegi,
  warstwaPodkladuWstegi,
  warstwaStrzalek,
  warstwaZnakowania,
  warstwySzlakow,
} from './warstwy-trasy'

/**
 * Warstwy mapy trafiają do MapLibre dopiero w przeglądarce, więc błąd
 * w wyrażeniu — literówka w `interpolate`, zła liczba gałęzi `match` — nie
 * wychodzi ani przy budowaniu, ani w testach jednostkowych. Widać go w postaci
 * pustej mapy u kogoś, kto wszedł na stronę trasy.
 *
 * Dlatego przepuszczamy komplet warstw przez ten sam walidator, którego używa
 * sam MapLibre. TypeScript sprawdza kształt obiektu, walidator — czy wyrażenie
 * ma sens.
 */
function pelnyStyl() {
  const pusto = {
    type: 'geojson' as const,
    data: { type: 'FeatureCollection' as const, features: [] },
  }
  return {
    version: 8 as const,
    sources: { [ZRODLO_SZLAKOW]: pusto, [ZRODLO_WSTEGI]: pusto, [ZRODLO_ZNAKOWANIA]: pusto },
    layers: [
      ...warstwySzlakow(),
      warstwaObrysuWstegi(),
      warstwaPodkladuWstegi(),
      warstwaZnakowania(),
      warstwaStrzalek(),
    ],
  }
}

describe('warstwy przebiegu trasy', () => {
  it('są poprawnym stylem MapLibre', () => {
    const bledy = validateStyleMin(pelnyStyl()).filter(
      // Ikona strzałki powstaje w przeglądarce (`map.addImage`), więc walidator
      // słusznie nie znajduje jej w stylu. To jedyny dopuszczalny zarzut.
      (blad) => !/image.*not found|icon-image/i.test(blad.message),
    )
    expect(bledy.map((b) => `${b.identifier ?? ''}: ${b.message}`)).toEqual([])
  })

  it('mają identyfikatory bez powtórzeń', () => {
    const identyfikatory = pelnyStyl().layers.map((w) => w.id)
    expect(new Set(identyfikatory).size).toBe(identyfikatory.length)
  })

  it('kładą wstęgę na szlakach, a strzałki na wszystkim', () => {
    const kolejnosc = pelnyStyl().layers.map((w) => w.id)
    const ostatniSzlak = Math.max(...kolejnosc.flatMap((id, i) => (id.startsWith('szlak-') ? [i] : [])))

    expect(ostatniSzlak).toBeLessThan(kolejnosc.indexOf('trasa-wstega-obwodka'))
    expect(kolejnosc.indexOf('trasa-wstega-obwodka')).toBeLessThan(kolejnosc.indexOf('trasa-wstega-barwa'))
    expect(kolejnosc.at(-1)).toBe('trasa-strzalki')
  })

  it('wstęga jest wyraźnie szersza od szlaków w tle', () => {
    // Kształt ma odróżniać trasę od szlaków okolicy na każdym przybliżeniu.
    const szerokosc = (w: unknown) =>
      ((w as { paint: { 'line-width': unknown[] } }).paint['line-width'].at(-1) as number)

    const wstega = szerokosc(warstwaPodkladuWstegi())
    const szlak = szerokosc(warstwySzlakow().find((w) => w.id === 'szlak-czerwony')!)

    expect(wstega).toBeGreaterThan(szlak * 3)
  })
})

describe('barwy', () => {
  it('nieznaną nazwę i „brak" zamieniają na szarość, zamiast zgadywać', () => {
    expect(hexBarwy('brak')).toBe(KOLOR_BEZ_ZNAKOWANIA)
    expect(hexBarwy('fioletowy')).toBe(KOLOR_BEZ_ZNAKOWANIA)
    expect(hexBarwy(null)).toBe(KOLOR_BEZ_ZNAKOWANIA)
    expect(hexBarwy('zolty')).toBe(BARWY_SZLAKOW.zolty)
  })

  it('warstwa znakowania zna wszystkie pięć barw', () => {
    const wyrazenie = JSON.stringify(warstwaZnakowania().paint?.['line-color'])
    for (const hex of Object.values(BARWY_SZLAKOW)) expect(wyrazenie).toContain(hex)
  })
})

describe('ślad', () => {
  const wczytaj = (nazwa: string) =>
    JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dane', 'slady', nazwa), 'utf8'))

  it('sprowadza prawdziwy ślad do jednej cechy', () => {
    const linia = liniaTrasy(wczytaj('1A.geojson'))
    expect(linia?.features).toHaveLength(1)
    expect(linia?.features[0].geometry.coordinates.length).toBeGreaterThan(50)
  })

  it('liczy zasięg mieszczący się w Pieninach', () => {
    const zasieg = granice(liniaTrasy(wczytaj('1A.geojson'))!) as number[][]
    expect(zasieg[0][0]).toBeGreaterThan(19.5)
    expect(zasieg[1][0]).toBeLessThan(21)
    expect(zasieg[0][1]).toBeGreaterThan(49)
    expect(zasieg[1][1]).toBeLessThan(50)
  })

  it('odrzuca dane innego kształtu, zamiast rysować bzdurę', () => {
    expect(liniaTrasy(null)).toBeNull()
    expect(liniaTrasy({ features: [] })).toBeNull()
    expect(liniaTrasy({ features: [{ geometry: { type: 'Point', coordinates: [20, 49] } }] })).toBeNull()
    // Linia z jednego punktu to nie linia — MapLibre narysowałby nic.
    expect(liniaTrasy({ features: [{ geometry: { type: 'LineString', coordinates: [[20, 49]] } }] })).toBeNull()
  })
})
