import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NAJWIEKSZY_LADUNEK, ZdjecieZaDuze, zdjecieZPliku } from './zdjecie'

/**
 * Testy przygotowania zdjęcia przed wysłaniem.
 *
 * To jest ten rachunek, który wywracał zapis notki: gdy `data:` URL przekroczy
 * megabajt, Next odrzuca całą akcję serwerową kodem 413 i przeglądarka pokazuje
 * biały ekran, bez śladu w formularzu. Sprawdzamy więc jedną rzecz przede
 * wszystkim — że wynik ZAWSZE mieści się w limicie albo kończy się jawnym
 * błędem, którego formularz ma co pokazać.
 *
 * `canvas` w środowisku testowym nie istnieje, więc podstawiamy własny.
 * Symuluje to, co robi prawdziwy koder: im niższa jakość i mniejszy obraz,
 * tym krótszy wynik.
 */

/** Ile znaków „waży" zakodowany obraz — z grubsza jak prawdziwy JPEG. */
let gestosc = 1

function podstawPlotno() {
  vi.stubGlobal('document', {
    createElement: () => {
      const plotno = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: () => {} }),
        toDataURL: (_typ: string, jakosc: number) =>
          'data:image/jpeg;base64,' +
          'x'.repeat(Math.round(plotno.width * plotno.height * jakosc * gestosc)),
      }
      return plotno
    },
  })
}

function podstawObraz(szerokosc: number, wysokosc: number) {
  vi.stubGlobal('createImageBitmap', async () => ({
    width: szerokosc,
    height: wysokosc,
    close: () => {},
  }))
}

const PLIK = new File([], 'zdjecie.jpg')

beforeEach(() => {
  vi.unstubAllGlobals()
  gestosc = 1
  podstawPlotno()
})

describe('zdjecieZPliku', () => {
  it('zwykłe zdjęcie zachowuje zadaną jakość', async () => {
    podstawObraz(4000, 3000)
    gestosc = 0.08

    const dane = await zdjecieZPliku(PLIK, 1600, 0.82)
    expect(dane.length).toBeLessThanOrEqual(NAJWIEKSZY_LADUNEK)
    expect(dane.startsWith('data:image/jpeg;base64,')).toBe(true)
  })

  it('zdjęcie gęste w szczegóły też mieści się w limicie', async () => {
    // To jest przypadek, który psuł zapis: las, skały, panorama — obraz,
    // przy którym stała jakość 0,82 dawała grubo ponad megabajt.
    podstawObraz(4000, 3000)
    gestosc = 0.55

    const dane = await zdjecieZPliku(PLIK, 1600, 0.82)
    expect(dane.length).toBeLessThanOrEqual(NAJWIEKSZY_LADUNEK)
  })

  it('nigdy nie zwraca czegoś ponad limit — nawet dla absurdalnie ciężkiego obrazu', async () => {
    // Gęstość tak wysoka, że nie ratuje ani zejście jakością, ani zmniejszenie
    // obrazu. Prawdziwe zdjęcie tak nie wygląda; chodzi o to, żeby wynikiem
    // był wtedy jawny błąd, a nie ładunek, którego serwer nie przyjmie.
    podstawObraz(4000, 3000)
    gestosc = 6

    await expect(zdjecieZPliku(PLIK, 1600, 0.82)).rejects.toBeInstanceOf(ZdjecieZaDuze)
  })

  it('mały obraz nie jest powiększany', async () => {
    podstawObraz(600, 400)
    gestosc = 0.05

    const dane = await zdjecieZPliku(PLIK, 1600, 0.82)
    // 600×400 przy jakości 0,82 i gęstości 0,05 to ~9840 znaków; gdyby
    // funkcja skalowała w górę do 1600 px, wyszłoby wielokrotnie więcej.
    expect(dane.length).toBeLessThan(20_000)
  })

  it('zwalnia bitmapę także wtedy, gdy się nie udało', async () => {
    const zamknij = vi.fn()
    vi.stubGlobal('createImageBitmap', async () => ({
      width: 4000,
      height: 3000,
      close: zamknij,
    }))
    gestosc = 6

    await expect(zdjecieZPliku(PLIK, 1600, 0.82)).rejects.toBeInstanceOf(ZdjecieZaDuze)
    expect(zamknij).toHaveBeenCalled()
  })

  it('limit zostawia zapas pod limitem akcji serwerowej', () => {
    // Do zdjęcia dochodzi treść notki i pozostałe pola; gdyby ktoś kiedyś
    // podniósł ten próg do samego megabajta, zapis znów zacząłby padać.
    expect(NAJWIEKSZY_LADUNEK).toBeLessThan(1024 * 1024 * 0.9)
  })
})
