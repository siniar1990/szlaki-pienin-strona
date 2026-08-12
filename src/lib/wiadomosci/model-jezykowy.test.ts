import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ileCzekac, KODY_DO_PONOWIENIA, ODCZEKANIA_MS, zapytajOJson } from './model-jezykowy'

/**
 * Testy zachowania przy błędach usługi modelu.
 *
 * Redakcja padła w nocy na kodzie 529 („przeciążone") — usterka nie po naszej
 * stronie i mijająca sama, ale kod nie próbował drugi raz, więc notka po
 * prostu nie powstawała. Sprawdzamy tutaj rozstrzygnięcia, od których zależy,
 * czy próbujemy dalej i jak długo czekamy.
 */

function odpowiedz(kod: number, naglowki: Record<string, string> = {}): Response {
  return new Response('', { status: kod, headers: naglowki })
}

describe('KODY_DO_PONOWIENIA', () => {
  it('obejmuje przeciążenie i awarie po stronie dostawcy', () => {
    // 529 to ten, który wywrócił nocny przebieg.
    for (const kod of [429, 500, 502, 503, 529]) {
      expect(KODY_DO_PONOWIENIA.has(kod)).toBe(true)
    }
  })

  it('nie obejmuje błędów, które powtórzą się identycznie', () => {
    // Zły klucz i wadliwe polecenie nie naprawią się przez powtórzenie —
    // ponawianie ich to strata budżetu, który i tak jest krótki.
    for (const kod of [400, 401, 403, 404, 413]) {
      expect(KODY_DO_PONOWIENIA.has(kod)).toBe(false)
    }
  })
})

describe('ileCzekac', () => {
  it('bez nagłówka bierze nasze odczekanie dla danego podejścia', () => {
    expect(ileCzekac(odpowiedz(529), 0)).toBe(ODCZEKANIA_MS[0])
    expect(ileCzekac(odpowiedz(529), 1)).toBe(ODCZEKANIA_MS[1])
  })

  it('słucha nagłówka retry-after, gdy dostawca go poda', () => {
    // Przy 429 to jego liczba obowiązuje, nie nasza — inaczej pukamy
    // do zamkniętych drzwi i przedłużamy sobie limit.
    expect(ileCzekac(odpowiedz(429, { 'retry-after': '2' }), 0)).toBe(2000)
  })

  it('ogranicza zbyt długie odczekanie', () => {
    // Minutę i tak przeczekalibyśmy poza budżetem funkcji; lepiej zdążyć
    // z komunikatem niż zostać uciętym w połowie.
    expect(ileCzekac(odpowiedz(429, { 'retry-after': '60' }), 0)).toBe(5000)
  })

  it('nie daje się zwieść śmieciom w nagłówku', () => {
    expect(ileCzekac(odpowiedz(429, { 'retry-after': 'wkrótce' }), 0)).toBe(ODCZEKANIA_MS[0])
    expect(ileCzekac(odpowiedz(429, { 'retry-after': '-5' }), 0)).toBe(ODCZEKANIA_MS[0])
    expect(ileCzekac(odpowiedz(429, { 'retry-after': '0' }), 0)).toBe(ODCZEKANIA_MS[0])
  })

  it('przy dalszych podejściach czeka dłużej niż przy pierwszym', () => {
    expect(ODCZEKANIA_MS[1]).toBeGreaterThan(ODCZEKANIA_MS[0])
  })
})


/* ── pętla ponawiania ────────────────────────────────────────────────────── */

/** Odpowiedź, jaką oddaje model przy powodzeniu. */
function udana(tresc: string): Response {
  return new Response(
    JSON.stringify({ content: [{ type: 'text', text: tresc }], stop_reason: 'end_turn' }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

const POLECENIE = { model: 'test', rolaSystemowa: 'rola', tresc: 'pytanie', czasMs: 30_000 }

describe('zapytajOJson — ponawianie', () => {
  beforeEach(() => {
    vi.stubEnv('KLUCZ_ANTHROPIC', 'klucz-testowy')
    // Odczekania skracamy do zera: sprawdzamy, ILE razy pytamy, a nie ile
    // sekund trwa test.
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('po przeciążeniu próbuje ponownie i zwraca wynik', async () => {
    // Dokładnie ten przypadek wywrócił nocny przebieg: 529 „overloaded".
    const wywolania: number[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        wywolania.push(1)
        return wywolania.length === 1
          ? new Response('{"error":"overloaded"}', { status: 529 })
          : udana('{"tytul":"Spływ"}')
      }),
    )

    await expect(zapytajOJson(POLECENIE)).resolves.toEqual({ tytul: 'Spływ' })
    expect(wywolania).toHaveLength(2)
  })

  it('nie ponawia błędu, który powtórzy się identycznie', async () => {
    const fetchujacy = vi.fn(async () => new Response('zły klucz', { status: 401 }))
    vi.stubGlobal('fetch', fetchujacy)

    await expect(zapytajOJson(POLECENIE)).rejects.toThrow(/401/)
    expect(fetchujacy).toHaveBeenCalledTimes(1)
  })

  it('po wyczerpaniu prób oddaje czytelny komunikat, nie surowy JSON', async () => {
    const fetchujacy = vi.fn(async () => new Response('{"error":"overloaded"}', { status: 529 }))
    vi.stubGlobal('fetch', fetchujacy)

    await expect(zapytajOJson(POLECENIE)).rejects.toThrow(/chwilowo niedostępna/)
    expect(fetchujacy).toHaveBeenCalledTimes(3)
  })

  it('nie zaczyna kolejnej próby, gdy budżet czasu jest już na wyczerpaniu', async () => {
    const fetchujacy = vi.fn(async () => new Response('', { status: 529 }))
    vi.stubGlobal('fetch', fetchujacy)

    // Pięć sekund starcza na jedno podejście, ale nie na odczekanie i drugie.
    await expect(zapytajOJson({ ...POLECENIE, czasMs: 5000 })).rejects.toThrow()
    expect(fetchujacy).toHaveBeenCalledTimes(1)
  })

  it('zepsuty JSON próbuje jeszcze raz — model bywa niekonsekwentny', async () => {
    let ile = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        ile += 1
        return ile === 1 ? udana('to nie jest JSON') : udana('{"ok":true}')
      }),
    )

    await expect(zapytajOJson(POLECENIE)).resolves.toEqual({ ok: true })
    expect(ile).toBe(2)
  })

  it('przycięcia limitem nie ponawia, bo drugi raz wyjdzie tak samo', async () => {
    const fetchujacy = vi.fn(
      async () =>
        new Response(JSON.stringify({ content: [{ type: 'text', text: '{"a":' }], stop_reason: 'max_tokens' }), {
          status: 200,
        }),
    )
    vi.stubGlobal('fetch', fetchujacy)

    await expect(zapytajOJson(POLECENIE)).rejects.toThrow(/przycięta/)
    expect(fetchujacy).toHaveBeenCalledTimes(1)
  })
})
