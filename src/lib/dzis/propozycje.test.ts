import { describe, expect, it } from 'vitest'

import type { TrasaNaLiscie } from '@/lib/dane/typy'

import { doZachodu } from './index'
import type { PogodaPunktu } from './pogoda'
import { powodDnia, zaproponujTrasy } from './propozycje'

/**
 * Testy reguły „co robić przy dzisiejszej pogodzie".
 *
 * Ta reguła decyduje, co portal podpowie komuś stojącemu rano w oknie —
 * i myli się cicho: propozycja wejścia na odsłoniętą grań przy porywach
 * wygląda dokładnie tak samo jak propozycja trafna. Najwięcej uwagi idzie
 * więc na kolejność warunków, bo pogoda rzadko bywa zła tylko na jeden sposób.
 */

const POGODA: PogodaPunktu = {
  temperatura: 18,
  odczuwalna: 18,
  opad: 0,
  wiatr: 8,
  kod: 0,
  snieg: 0,
}

function pogoda(zmiany: Partial<PogodaPunktu> = {}): PogodaPunktu {
  return { ...POGODA, ...zmiany }
}

function trasa(zmiany: Partial<TrasaNaLiscie> & { nazwa: string }): TrasaNaLiscie {
  return {
    id: zmiany.nazwa,
    slug: zmiany.nazwa.toLowerCase(),
    kategoria: 'krotkie',
    kategorieDodatkowe: [],
    dlugoscKm: 6,
    czasMin: { tam: 90, powrot: 80 },
    sumaPodejscM: { tam: 200, powrot: 20 },
    trudnosc: 'latwa',
    ilustracja: null,
    petla: false,
    granica: false,
    szlaki: [],
    wysokoscSzczytuM: null,
    miejscowoscStartu: 'Szczawnica',
    najwyzszyPunktM: 500,
    podsumowanie: null,
    ...zmiany,
  }
}

const TRASY = [
  trasa({ nazwa: 'Sokolica', najwyzszyPunktM: 747, dlugoscKm: 12 }),
  trasa({ nazwa: 'Trzy Korony', najwyzszyPunktM: 982, dlugoscKm: 14, trudnosc: 'srednia' }),
  trasa({ nazwa: 'Wąwóz Homole', najwyzszyPunktM: 700, dlugoscKm: 5 }),
  trasa({ nazwa: 'Bulwary', najwyzszyPunktM: 480, dlugoscKm: 4 }),
  trasa({ nazwa: 'Radziejowa', najwyzszyPunktM: 1262, dlugoscKm: 18, trudnosc: 'trudna' }),
]

describe('powodDnia', () => {
  it('przy spokojnej pogodzie proponuje widoki', () => {
    expect(powodDnia(pogoda(), pogoda({ temperatura: 12 }), 15)).toBe('pogodnie')
  })

  it('rozpoznaje deszcz po kodzie WMO, nawet gdy opad jeszcze zerowy', () => {
    expect(powodDnia(pogoda({ kod: 61 }), pogoda(), 10)).toBe('deszcz')
  })

  it('rozpoznaje deszcz po samym opadzie, nawet gdy kod mówi „pochmurno"', () => {
    expect(powodDnia(pogoda({ kod: 3, opad: 0.4 }), pogoda(), 10)).toBe('deszcz')
  })

  it('wichura wygrywa z deszczem', () => {
    // W deszczu da się chodzić, w porywach na grani nie — i to jest cała
    // różnica, którą ta kolejność ma utrwalić.
    expect(powodDnia(pogoda({ kod: 61 }), pogoda(), 70)).toBe('wichura')
  })

  it('śnieg na grani wygrywa z deszczem w dolinie', () => {
    expect(powodDnia(pogoda({ kod: 61 }), pogoda({ snieg: 20 }), 10)).toBe('snieg')
  })

  it('resztki śniegu w cieniu to jeszcze nie zima', () => {
    expect(powodDnia(pogoda(), pogoda({ snieg: 2 }), 10)).toBe('pogodnie')
  })

  it('upał tylko wtedy, gdy nie pada', () => {
    expect(powodDnia(pogoda({ temperatura: 30 }), pogoda(), 10)).toBe('upal')
    expect(powodDnia(pogoda({ temperatura: 30, kod: 61 }), pogoda(), 10)).toBe('deszcz')
  })
})

describe('zaproponujTrasy', () => {
  it('przy wichurze nie proponuje grani', () => {
    const { trasy } = zaproponujTrasy(TRASY, 'wichura')
    expect(trasy.map((t) => t.nazwa)).not.toContain('Trzy Korony')
    expect(trasy.map((t) => t.nazwa)).not.toContain('Radziejowa')
  })

  it('przy ładnej pogodzie stawia grań na początku, od najłatwiejszej', () => {
    // Trzy Korony są średnie i krótsze, Radziejowa trudna i najdłuższa —
    // trzy całodniowe wyprawy z rzędu to nie jest propozycja dla kogoś,
    // kto rano zajrzał na stronę.
    const { trasy } = zaproponujTrasy(TRASY, 'pogodnie')
    expect(trasy.slice(0, 2).map((t) => t.nazwa)).toEqual(['Trzy Korony', 'Radziejowa'])
  })

  it('przy deszczu stawia na początku krótkie i niskie', () => {
    const { trasy } = zaproponujTrasy(TRASY, 'deszcz')
    expect(trasy.slice(0, 2).map((t) => t.nazwa)).toEqual(['Bulwary', 'Wąwóz Homole'])
  })

  it('przy śniegu pomija trasy trudne', () => {
    const { trasy } = zaproponujTrasy(TRASY, 'snieg', 2)
    expect(trasy.map((t) => t.nazwa)).not.toContain('Radziejowa')
  })

  it('przy wichurze woli pokazać mniej niż dołożyć grań', () => {
    // Uzupełnianie „żeby były trzy kafelki" zamieniłoby radę w jej
    // przeciwieństwo — a to jest ta z dwóch pogód, przy której to boli.
    const wysokie = [
      trasa({ nazwa: 'Trzy Korony', najwyzszyPunktM: 982 }),
      trasa({ nazwa: 'Radziejowa', najwyzszyPunktM: 1262 }),
      trasa({ nazwa: 'Bulwary', najwyzszyPunktM: 480 }),
    ]
    const { trasy } = zaproponujTrasy(wysokie, 'wichura', 3)
    expect(trasy.map((t) => t.nazwa)).toEqual(['Bulwary'])
  })

  it('przy śniegu też nie uzupełnia na siłę', () => {
    const trudne = [
      trasa({ nazwa: 'Radziejowa', trudnosc: 'trudna', dlugoscKm: 6 }),
      trasa({ nazwa: 'Długa', dlugoscKm: 20 }),
    ]
    expect(zaproponujTrasy(trudne, 'snieg', 3).trasy).toEqual([])
  })

  it('zwraca tę samą kolejność przy każdym wywołaniu', () => {
    // Losowanie wyglądałoby żywiej, ale kto odświeża stronę i widzi inne
    // trasy, przestaje wierzyć, że stoi za tym jakakolwiek zasada.
    const raz = zaproponujTrasy(TRASY, 'pogodnie').trasy.map((t) => t.slug)
    const dwa = zaproponujTrasy(TRASY, 'pogodnie').trasy.map((t) => t.slug)
    expect(raz).toEqual(dwa)
  })

  it('uzupełnia listę, gdy filtr znajdzie za mało', () => {
    // „Pogodnie" pasują tylko dwie trasy z pięciu, a rząd ma trzy kafelki.
    const { trasy } = zaproponujTrasy(TRASY, 'pogodnie', 3)
    expect(trasy).toHaveLength(3)
  })

  it('nie powtarza trasy przy uzupełnianiu', () => {
    const { trasy } = zaproponujTrasy(TRASY, 'pogodnie', 5)
    expect(new Set(trasy.map((t) => t.slug)).size).toBe(trasy.length)
  })

  it('nie wywraca się na pustej liście tras', () => {
    expect(zaproponujTrasy([], 'deszcz').trasy).toEqual([])
  })

  it('bierze wysokość szczytu, gdy brak najwyższego punktu', () => {
    const bezPunktu = [trasa({ nazwa: 'Wysoka', najwyzszyPunktM: null, wysokoscSzczytuM: 1050 })]
    expect(zaproponujTrasy(bezPunktu, 'pogodnie').trasy).toHaveLength(1)
  })
})

describe('doZachodu', () => {
  it('liczy pozostały czas w godzinach i minutach', () => {
    const teraz = new Date('2026-08-10T17:20:00Z')
    const zachod = new Date('2026-08-10T19:05:00Z')
    expect(doZachodu(zachod, teraz)).toEqual({ godziny: 1, minuty: 45 })
  })

  it('po zachodzie zwraca null zamiast liczby ujemnej', () => {
    const teraz = new Date('2026-08-10T21:00:00Z')
    const zachod = new Date('2026-08-10T19:05:00Z')
    expect(doZachodu(zachod, teraz)).toBeNull()
  })

  it('dokładnie o zachodzie jest już po', () => {
    const chwila = new Date('2026-08-10T19:05:00Z')
    expect(doZachodu(chwila, chwila)).toBeNull()
  })
})
