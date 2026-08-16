import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { adresKodu, kodJakoPng, kodJakoSvg } from './generuj-kod'
import { podpisJakoSciezka } from './podpis'

/**
 * Testy obrazów kodów QR.
 *
 * Najważniejszy jest ten ze skanowaniem: pas z identyfikatorem dokleja się
 * do gotowego obrazu i błąd w geometrii (napis wchodzący w strefę ciszy,
 * przesunięty kompozyt) nie wywali żadnego wyjątku — po prostu część
 * wydrukowanych tabliczek przestanie się skanować. To dokładnie klasa błędu,
 * której nie widać w podglądzie, a którą widzi czytnik.
 */

describe('podpisJakoSciezka', () => {
  it('zwraca kontury i szerokość rosnącą z rozmiarem', () => {
    const maly = podpisJakoSciezka('P001', 5)
    const duzy = podpisJakoSciezka('P001', 10)

    expect(maly.d).toContain('M')
    expect(maly.szerokosc).toBeGreaterThan(0)
    expect(duzy.szerokosc).toBeCloseTo(maly.szerokosc * 2, 5)
  })
})

describe('kodJakoSvg', () => {
  it('bez opcji zostaje kwadratowy i bez podpisu', async () => {
    const svg = await kodJakoSvg('P001')
    expect(svg).toMatch(/viewBox="0 0 (\d+) \1"/)
    expect(svg).not.toContain('translate')
  })

  it('z identyfikatorem dostaje pas na dole, a strefa ciszy zostaje pusta', async () => {
    const svg = await kodJakoSvg('P001', { zIdentyfikatorem: true })

    const okno = svg.match(/viewBox="0 0 (\d+) (\d+)"/)
    expect(okno).not.toBeNull()
    const [, szerokosc, wysokosc] = okno!.map(Number)
    expect(wysokosc).toBe(szerokosc + 6)

    // Napis to ścieżka, nie <text> — drukarnia nie może potrzebować fontu.
    expect(svg).toContain('translate')
    expect(svg).not.toContain('<text')

    // Podpis zaczyna się pod strefą ciszy: przesunięcie w pionie to bok
    // kodu plus linia bazowa pasa, nigdy mniej niż bok.
    const przesuniecie = svg.match(/translate\([\d.]+ ([\d.]+)\)/)
    expect(Number(przesuniecie![1])).toBeGreaterThanOrEqual(szerokosc)
  })
})

describe('kodJakoPng', () => {
  it('bez opcji zostaje kwadratowy', async () => {
    const meta = await sharp(await kodJakoPng('P001')).metadata()
    expect(meta.height).toBe(meta.width)
  })

  it('z identyfikatorem jest wyższy o pas i nadal się skanuje', async () => {
    const png = await kodJakoPng('P001', { zIdentyfikatorem: true })
    const meta = await sharp(png).metadata()
    expect(meta.height!).toBeGreaterThan(meta.width!)

    const piksele = PNG.sync.read(
      await sharp(png).ensureAlpha().png().toBuffer(),
    )
    const odczyt = jsQR(
      new Uint8ClampedArray(piksele.data.buffer, piksele.data.byteOffset, piksele.data.byteLength),
      piksele.width,
      piksele.height,
    )

    expect(odczyt?.data).toBe(adresKodu('P001'))
  })
})
