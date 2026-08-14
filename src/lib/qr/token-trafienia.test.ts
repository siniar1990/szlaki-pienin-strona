import { beforeAll, describe, expect, it, vi } from 'vitest'

import { nowyIdentyfikator, sprawdzToken, wystawToken } from '@/lib/qr/token-trafienia'

/**
 * Testy tokena potwierdzającego skan.
 *
 * Token jest jedyną rzeczą, która stoi między licznikiem tabliczki
 * a kimkolwiek, kto potrafi wysłać żądanie POST. Jeśli przyjmie podpis
 * z cudzej ręki albo sprzed godziny, filtr botów przestaje mieć znaczenie.
 */

beforeAll(() => {
  process.env.SEKRET_TRAFIEN = 'sekret-na-czas-testu'
})

describe('token trafienia', () => {
  it('wystawiony przyjmuje się i wskazuje swoje zdarzenie', async () => {
    const identyfikator = nowyIdentyfikator()
    const token = await wystawToken(identyfikator)

    expect(token).not.toBeNull()
    expect(await sprawdzToken(token)).toBe(identyfikator)
  })

  it('podrobiony podpis odpada', async () => {
    const token = await wystawToken(nowyIdentyfikator())
    const [id, wygasa] = token!.split('.')

    expect(await sprawdzToken(`${id}.${wygasa}.0000`)).toBeNull()
    expect(await sprawdzToken(`${id}.${wygasa}.${'a'.repeat(64)}`)).toBeNull()
  })

  it('cudzy identyfikator z cudzym podpisem nie przechodzi', async () => {
    // Podmiana identyfikatora przy zachowaniu podpisu to najprostsza próba
    // przepisania potwierdzenia na inną tabliczkę.
    const token = await wystawToken(nowyIdentyfikator())
    const [, wygasa, podpis] = token!.split('.')

    expect(await sprawdzToken(`${nowyIdentyfikator()}.${wygasa}.${podpis}`)).toBeNull()
  })

  it('po pięciu minutach token jest martwy', async () => {
    const token = await wystawToken(nowyIdentyfikator())

    vi.useFakeTimers()
    try {
      vi.setSystemTime(Date.now() + 6 * 60_000)
      expect(await sprawdzToken(token)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('śmieci nie wywracają sprawdzenia', async () => {
    expect(await sprawdzToken(null)).toBeNull()
    expect(await sprawdzToken('')).toBeNull()
    expect(await sprawdzToken('bezkropek')).toBeNull()
    expect(await sprawdzToken('a.b.c')).toBeNull()
  })
})
