import { describe, expect, it } from 'vitest'

import { najnowszaData, scalManifest, type ManifestDat } from './daty'

/**
 * Testy pamięci dat dla mapy witryny.
 *
 * Cała wartość `lastmod` wisi na jednej regule: data zmienia się wtedy
 * i tylko wtedy, gdy zmieniła się treść. Złamanie jej w którąkolwiek stronę
 * jest niewidoczne gołym okiem — XML nadal wygląda poprawnie — a skutek
 * (wyszukiwarka przestaje wierzyć w daty całej domeny) przychodzi po
 * tygodniach. Dlatego reguła siedzi w czystej funkcji i ma testy.
 */

const MANIFEST: ManifestDat = {
  wersja: 1,
  strony: {
    '/szlaki/sokolica': { skrot: 'aaa', zmieniono: '2026-05-10' },
    '/szlaki/trzy-korony': { skrot: 'bbb', zmieniono: '2026-06-01' },
  },
}

describe('scalManifest', () => {
  it('niezmieniony skrót zachowuje starą datę — wdrożenie to nie zmiana', () => {
    const wynik = scalManifest(MANIFEST, [
      { sciezka: '/szlaki/sokolica', skrot: 'aaa', dataZrodel: '2026-08-15' },
    ])
    expect(wynik.strony['/szlaki/sokolica']).toEqual({ skrot: 'aaa', zmieniono: '2026-05-10' })
  })

  it('zmieniony skrót dostaje datę zmiany źródeł', () => {
    const wynik = scalManifest(MANIFEST, [
      { sciezka: '/szlaki/sokolica', skrot: 'nowy', dataZrodel: '2026-08-15' },
    ])
    expect(wynik.strony['/szlaki/sokolica']).toEqual({ skrot: 'nowy', zmieniono: '2026-08-15' })
  })

  it('data nie cofa się, gdy zmiana przyszła przez plik ze starszą historią', () => {
    // Tak bywa przy stronach złożonych: kategoria zmienia odcisk przez kartę
    // trasy, ale data liczona z pliku definicji kategorii jest sprzed miesięcy.
    const wynik = scalManifest(MANIFEST, [
      { sciezka: '/szlaki/trzy-korony', skrot: 'nowy', dataZrodel: '2026-03-01' },
    ])
    expect(wynik.strony['/szlaki/trzy-korony']).toEqual({ skrot: 'nowy', zmieniono: '2026-06-01' })
  })

  it('nowa strona wchodzi z datą źródeł, usunięta wypada', () => {
    const wynik = scalManifest(MANIFEST, [
      { sciezka: '/szlaki/nowa-trasa', skrot: 'ccc', dataZrodel: '2026-08-15' },
    ])
    expect(wynik.strony['/szlaki/nowa-trasa']).toEqual({ skrot: 'ccc', zmieniono: '2026-08-15' })
    expect(wynik.strony['/szlaki/sokolica']).toBeUndefined()
  })

  it('pusty manifest przyjmuje wszystko z datami źródeł', () => {
    const wynik = scalManifest(null, [
      { sciezka: '/o-nas', skrot: 'ddd', dataZrodel: '2026-01-05' },
    ])
    expect(wynik.strony['/o-nas']).toEqual({ skrot: 'ddd', zmieniono: '2026-01-05' })
  })

  it('kolejność wejścia nie zmienia wyniku — diff pliku ma pokazywać zmiany, nie tasowanie', () => {
    const wpisy = [
      { sciezka: '/b', skrot: '2', dataZrodel: '2026-02-02' },
      { sciezka: '/a', skrot: '1', dataZrodel: '2026-01-01' },
    ]
    const prosto = JSON.stringify(scalManifest(null, wpisy))
    const odwrotnie = JSON.stringify(scalManifest(null, [...wpisy].reverse()))
    expect(prosto).toBe(odwrotnie)
    expect(prosto.indexOf('"/a"')).toBeLessThan(prosto.indexOf('"/b"'))
  })
})

describe('najnowszaData', () => {
  it('zwraca najpóźniejszą datę manifestu', () => {
    expect(najnowszaData(MANIFEST)).toBe('2026-06-01')
  })

  it('pusty manifest to brak daty, nie wymyślona', () => {
    expect(najnowszaData({ wersja: 1, strony: {} })).toBeNull()
  })
})
