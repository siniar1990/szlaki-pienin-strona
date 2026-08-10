import { describe, expect, it } from 'vitest'

import { zPolskiegoCzasu } from './czas'

/**
 * Testy odczytu polskiego czasu bez oznaczenia strefy.
 *
 * Ten błąd już raz wyszedł na produkcji i był lokalnie niewidoczny — bo
 * lokalnie strefa maszyny i strefa Polski to ta sama strefa. Dlatego
 * porównujemy wynik nie z godziną lokalną, tylko z chwilą w UTC: to jedyne
 * sprawdzenie, które zachowuje się tak samo na laptopie i na serwerze.
 */

describe('zPolskiegoCzasu', () => {
  it('latem odejmuje dwie godziny (czas letni)', () => {
    expect(zPolskiegoCzasu('2026-08-09 23:50')?.toISOString()).toBe('2026-08-09T21:50:00.000Z')
  })

  it('zimą odejmuje jedną godzinę (czas środkowoeuropejski)', () => {
    expect(zPolskiegoCzasu('2026-01-15 12:00')?.toISOString()).toBe('2026-01-15T11:00:00.000Z')
  })

  it('czyta zarówno spację, jak i literę T', () => {
    const zeSpacja = zPolskiegoCzasu('2026-08-09 23:50')
    const zLitera = zPolskiegoCzasu('2026-08-09T23:50')
    expect(zeSpacja?.getTime()).toBe(zLitera?.getTime())
  })

  it('radzi sobie z sekundami', () => {
    expect(zPolskiegoCzasu('2026-08-09 23:50:30')?.toISOString()).toBe(
      '2026-08-09T21:50:30.000Z',
    )
  })

  it('dzień przed zmianą czasu liczy jeszcze po letniemu', () => {
    // Zegary cofają się w nocy z 24 na 25 października 2026.
    expect(zPolskiegoCzasu('2026-10-24 12:00')?.toISOString()).toBe('2026-10-24T10:00:00.000Z')
  })

  it('dzień po zmianie czasu liczy już po zimowemu', () => {
    expect(zPolskiegoCzasu('2026-10-26 12:00')?.toISOString()).toBe('2026-10-26T11:00:00.000Z')
  })

  it('wiosenna zmiana czasu: 28 marca zimowy, 30 marca letni', () => {
    // Zegary przestawiają się w nocy z 28 na 29 marca 2026.
    expect(zPolskiegoCzasu('2026-03-28 12:00')?.toISOString()).toBe('2026-03-28T11:00:00.000Z')
    expect(zPolskiegoCzasu('2026-03-30 12:00')?.toISOString()).toBe('2026-03-30T10:00:00.000Z')
  })

  it('na śmieciach zwraca null zamiast daty wziętej z niczego', () => {
    expect(zPolskiegoCzasu('wczoraj wieczorem')).toBeNull()
    expect(zPolskiegoCzasu('')).toBeNull()
  })
})
