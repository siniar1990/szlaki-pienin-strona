import { describe, expect, it } from 'vitest'

import { odlegloscM, podzialka, rzutowanie, wygladz, zasiegPunktow } from './geometria'
import { odcinkiZDanych } from './mapa'

describe('rzutowanie śladu na mapę karty', () => {
  /*
    Pieniny leżą na 49° szerokości, gdzie stopień długości jest o jedną trzecią
    krótszy niż stopień szerokości. Bez korekty `cos(lat)` kwadrat w stopniach
    wychodzi na rysunku prostokątem, a pętla trasy — rozciągniętym owalem.
  */
  it('ściska oś poziomą o cosinus szerokości', () => {
    // Kwadrat 0,1° × 0,1° w okolicy Szczawnicy.
    const rzut = rzutowanie([20.4, 49.4, 20.5, 49.5], 1000, 1000, 0)

    const [x0, y0] = rzut([20.4, 49.5])
    const [x1, y1] = rzut([20.5, 49.4])

    const szerokoscRysunku = x1 - x0
    const wysokoscRysunku = y1 - y0

    // cos(49,45°) ≈ 0,65 — obszar ma być wyraźnie niższy niż szerszy.
    expect(szerokoscRysunku / wysokoscRysunku).toBeCloseTo(Math.cos((49.45 * Math.PI) / 180), 2)
  })

  it('mieści ślad w ramce razem z marginesem', () => {
    const rzut = rzutowanie([20.4, 49.4, 20.5, 49.5], 1000, 1080, 100)

    for (const punkt of [[20.4, 49.4], [20.5, 49.5], [20.45, 49.45]] as [number, number][]) {
      const [x, y] = rzut(punkt)
      expect(x).toBeGreaterThanOrEqual(100 - 0.001)
      expect(x).toBeLessThanOrEqual(900 + 0.001)
      expect(y).toBeGreaterThanOrEqual(100 - 0.001)
      expect(y).toBeLessThanOrEqual(980 + 0.001)
    }
  })
})

describe('wygładzanie', () => {
  it('zostawia końce na miejscu', () => {
    // Końce trzymają znaczniki punktów etapowych i styki barw — przesunięcie
    // rozjechałoby jedno i drugie.
    const punkty: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [20, 10],
    ]
    const wygladzone = wygladz(punkty, 2)

    expect(wygladzone[0]).toEqual([0, 0])
    expect(wygladzone[wygladzone.length - 1]).toEqual([20, 10])
    expect(wygladzone.length).toBeGreaterThan(punkty.length)
  })

  it('nie wywraca się na dwóch punktach', () => {
    expect(wygladz([[0, 0], [1, 1]], 2)).toHaveLength(2)
  })
})

describe('podziałka', () => {
  it('dobiera okrągłą odległość zajmującą sensowną część mapy', () => {
    // Trasa po miasteczku i trasa przez całe Pieniny nie mogą dostać tej samej
    // kreski: raz zajęłaby pół mapy, raz byłaby niewidoczna.
    const gesta = podzialka(1, 1000)
    const rzadka = podzialka(0.02, 1000)

    expect(gesta.etykieta).toBe('200 m')
    expect(rzadka.etykieta).toBe('10 km')
    for (const p of [gesta, rzadka]) {
      expect(p.dlugoscPx).toBeGreaterThan(50)
      expect(p.dlugoscPx).toBeLessThan(400)
    }
  })
})

describe('odcinki barw', () => {
  it('nieznanej nazwy barwy nie zgaduje — odcinek idzie jako bez znaków', () => {
    const odcinki = odcinkiZDanych(
      {
        features: [
          {
            type: 'Feature',
            properties: { kolor: 'fioletowy' },
            geometry: { type: 'LineString', coordinates: [[20, 49], [20.1, 49.1]] },
          },
        ],
      },
      [],
    )

    expect(odcinki).toHaveLength(1)
    expect(odcinki[0].barwa).toBeNull()
  })

  it('bez pliku barw rysuje cały ślad jako bez znaków', () => {
    const odcinki = odcinkiZDanych(null, [
      [20, 49],
      [20.1, 49.1],
    ])

    expect(odcinki).toHaveLength(1)
    expect(odcinki[0].barwa).toBeNull()
    expect(odcinki[0].punkty).toHaveLength(2)
  })
})

describe('odległość', () => {
  it('liczy dystans w metrach', () => {
    // Stopień szerokości to około 111 km — kontrola rzędu wielkości.
    expect(odlegloscM([20, 49], [20, 50])).toBeGreaterThan(110_000)
    expect(odlegloscM([20, 49], [20, 50])).toBeLessThan(112_000)
  })
})

describe('zasięg', () => {
  it('obejmuje wszystkie punkty', () => {
    expect(zasiegPunktow([[20, 49], [21, 50], [19.5, 48.5]])).toEqual([19.5, 48.5, 21, 50])
  })
})

describe('kod QR na karcie', () => {
  it('daje się odczytać', async () => {
    /*
      Kod jest rysowany modułami, które sami układamy w siatkę — łatwo tu
      o pomyłkę w przeliczeniu wierszy na kolumny, a taki błąd wygląda jak
      prawidłowy kod i wychodzi dopiero wtedy, gdy ktoś stanie na szlaku
      z telefonem. Odczytujemy go tym samym dekoderem, którego portal używa
      do sprawdzania tabliczek.
    */
    const { kodQr } = await import('./qr')
    const jsQR = (await import('jsqr')).default

    const adres = 'https://szlakipienin.pl/szlaki/wilcza-chata'
    const kod = await kodQr(adres)

    // Odbicie siatki na piksele, z marginesem wymaganym przez normę.
    const margines = 4
    const skala = 4
    const bok = (kod.bok + margines * 2) * skala
    const piksele = new Uint8ClampedArray(bok * bok * 4).fill(255)

    for (const modul of kod.moduly) {
      for (let y = 0; y < skala; y += 1) {
        for (let x = 0; x < skala; x += 1) {
          const px = (modul.x + margines) * skala + x
          const py = (modul.y + margines) * skala + y
          const i = (py * bok + px) * 4
          piksele[i] = 0
          piksele[i + 1] = 0
          piksele[i + 2] = 0
        }
      }
    }

    expect(jsQR(piksele, bok, bok)?.data).toBe(adres)
  })
})
