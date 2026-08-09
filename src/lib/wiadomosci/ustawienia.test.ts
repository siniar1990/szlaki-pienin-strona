import { describe, expect, it } from 'vitest'

import {
  godzinyPublikacji,
  ileNotekDoTejPory,
  NAJWIECEJ_NOTEK,
  ograniczLiczbe,
  OSTATNIA_GODZINA,
  PIERWSZA_GODZINA,
  poczatekDnia,
} from './ustawienia'

/**
 * Testy harmonogramu publikacji.
 *
 * Ten rachunek decyduje, ile notek powstanie i o której — czyli o zachowaniu,
 * którego skutek widać dopiero nazajutrz. Błąd tutaj objawiłby się jako
 * „redakcja pisze za dużo" albo „nie pisze wcale" i szukałoby się go w kodzie
 * modelu, a nie w dzieleniu przedziału.
 */

describe('ograniczanie liczby notek', () => {
  it('trzyma się przedziału od 1 do 10', () => {
    expect(ograniczLiczbe(0)).toBe(1)
    expect(ograniczLiczbe(-5)).toBe(1)
    expect(ograniczLiczbe(50)).toBe(NAJWIECEJ_NOTEK)
    expect(ograniczLiczbe(3)).toBe(3)
  })

  it('nie wywraca się na wartości spoza liczb', () => {
    expect(ograniczLiczbe(Number.NaN)).toBe(1)
  })
})

describe('godziny publikacji', () => {
  it('przy jednej notce publikuje o piątej', () => {
    expect(godzinyPublikacji(1)).toEqual([PIERWSZA_GODZINA])
  })

  it('dzieli przedział równo', () => {
    expect(godzinyPublikacji(2)).toEqual([5, 14])
    expect(godzinyPublikacji(3)).toEqual([5, 11, 17])
    expect(godzinyPublikacji(6)).toEqual([5, 8, 11, 14, 17, 20])
  })

  it('daje tyle godzin, ile notek', () => {
    for (let ile = 1; ile <= NAJWIECEJ_NOTEK; ile += 1) {
      expect(godzinyPublikacji(ile)).toHaveLength(ile)
    }
  })

  it('nigdy nie wychodzi poza przedział i zawsze rośnie', () => {
    for (let ile = 1; ile <= NAJWIECEJ_NOTEK; ile += 1) {
      const godziny = godzinyPublikacji(ile)
      expect(Math.min(...godziny)).toBeGreaterThanOrEqual(PIERWSZA_GODZINA)
      expect(Math.max(...godziny)).toBeLessThan(OSTATNIA_GODZINA)
      expect([...godziny].sort((a, b) => a - b)).toEqual(godziny)
    }
  })
})

describe('ile notek powinno już istnieć', () => {
  it('przed pierwszą godziną — żadna', () => {
    expect(ileNotekDoTejPory(3, 4)).toBe(0)
  })

  it('rośnie wraz z mijającymi porami', () => {
    expect(ileNotekDoTejPory(3, 5)).toBe(1)
    expect(ileNotekDoTejPory(3, 10)).toBe(1)
    expect(ileNotekDoTejPory(3, 11)).toBe(2)
    expect(ileNotekDoTejPory(3, 17)).toBe(3)
  })

  it('pod koniec dnia osiąga zadaną liczbę i nie przekracza jej', () => {
    expect(ileNotekDoTejPory(3, 23)).toBe(3)
    expect(ileNotekDoTejPory(10, 23)).toBe(10)
  })
})

describe('początek dnia', () => {
  it('jest wcześniejszy niż podana chwila i nie starszy niż doba', () => {
    const teraz = new Date('2026-08-09T20:15:00Z')
    const poczatek = poczatekDnia(teraz)

    expect(poczatek.getTime()).toBeLessThan(teraz.getTime())
    expect(teraz.getTime() - poczatek.getTime()).toBeLessThan(24 * 60 * 60 * 1000)
  })
})
