import { describe, expect, it } from 'vitest'

import { coCzynne, OBIEKTY } from './czynne'

/**
 * Testy kalendarza otwarcia.
 *
 * Ten rachunek odpowiada na pytanie „czy warto tam dziś jechać" i myli się
 * w sposób, którego nie widać na ekranie: obiekt pokazany jako otwarty
 * w poniedziałek albo zamek zamknięty 1 maja wyglądają zupełnie normalnie
 * do chwili, gdy ktoś stanie przed zamkniętą bramą.
 *
 * Najwięcej uwagi poświęcamy zimowemu oknu zamków, bo przechodzi ono przez
 * koniec roku — od 1 października do 30 kwietnia. To jedyne miejsce w tym
 * module, gdzie zwykłe porównanie dat daje wynik odwrotny do zamierzonego.
 */

/** Data z godziną i dniem tygodnia policzonym z niej samej. */
function stan(iso: string, godzina: number, slug: string) {
  const data = new Date(iso)
  return coCzynne(data, godzina, data.getDay()).find((s) => s.obiekt.slug === slug)!
}

describe('zamek w Niedzicy', () => {
  it('w sezonie czynny codziennie do dziewiętnastej', () => {
    // 15 lipca 2026 to środa.
    expect(stan('2026-07-15', 12, 'zamek-dunajec-w-niedzicy').stan).toBe('otwarte')
    expect(stan('2026-07-15', 18, 'zamek-dunajec-w-niedzicy').stan).toBe('otwarte')
    expect(stan('2026-07-15', 19, 'zamek-dunajec-w-niedzicy').stan).toBe('po-zamknieciu')
  })

  it('w sezonie pracuje także w poniedziałek', () => {
    // 13 lipca 2026 to poniedziałek.
    expect(stan('2026-07-13', 12, 'zamek-dunajec-w-niedzicy').stan).toBe('otwarte')
  })

  it('poza sezonem zamknięty w poniedziałki', () => {
    // 12 stycznia 2026 to poniedziałek.
    const w = stan('2026-01-12', 12, 'zamek-dunajec-w-niedzicy')
    expect(w.stan).toBe('nieczynne')
    expect(w.dzisiaj).toBeNull()
  })

  it('poza sezonem czynny we wtorek, ale krócej', () => {
    // 13 stycznia 2026 to wtorek.
    const w = stan('2026-01-13', 12, 'zamek-dunajec-w-niedzicy')
    expect(w.stan).toBe('otwarte')
    expect(w.dzisiaj).toEqual({ otwarcie: 9, zamkniecie: 16 })
    expect(stan('2026-01-13', 17, 'zamek-dunajec-w-niedzicy').stan).toBe('po-zamknieciu')
  })

  it('okno zimowe obejmuje grudzień i styczeń — przechodzi przez Nowy Rok', () => {
    expect(stan('2026-12-15', 12, 'zamek-dunajec-w-niedzicy').dzisiaj).not.toBeNull()
    expect(stan('2026-01-15', 12, 'zamek-dunajec-w-niedzicy').dzisiaj).not.toBeNull()
  })
})

describe('zjeżdżalnia grawitacyjna', () => {
  it('poza sezonem zimą — nie tylko zamknięta', () => {
    expect(stan('2026-01-15', 12, 'zjezdzalnia-grawitacyjna-palenica').stan).toBe('poza-sezonem')
  })

  it('czynna latem', () => {
    expect(stan('2026-07-15', 12, 'zjezdzalnia-grawitacyjna-palenica').stan).toBe('otwarte')
  })

  it('granice sezonu: 14 kwietnia jeszcze nie, 15 kwietnia już tak', () => {
    expect(stan('2026-04-14', 12, 'zjezdzalnia-grawitacyjna-palenica').stan).toBe('poza-sezonem')
    expect(stan('2026-04-15', 12, 'zjezdzalnia-grawitacyjna-palenica').stan).toBe('otwarte')
  })
})

describe('Muzeum Pienińskie', () => {
  it('latem w niedzielę kończy godzinę wcześniej niż w sobotę', () => {
    // 18 lipca 2026 to sobota, 19 lipca to niedziela.
    expect(stan('2026-07-18', 16, 'muzeum-pieninskie-w-szlachtowej').dzisiaj?.zamkniecie).toBe(17)
    expect(stan('2026-07-19', 16, 'muzeum-pieninskie-w-szlachtowej').dzisiaj?.zamkniecie).toBe(16)
  })

  it('w poniedziałek nieczynne o każdej porze roku', () => {
    expect(stan('2026-07-13', 12, 'muzeum-pieninskie-w-szlachtowej').stan).toBe('nieczynne')
    expect(stan('2026-01-12', 12, 'muzeum-pieninskie-w-szlachtowej').stan).toBe('nieczynne')
  })
})

describe('Czerwony Klasztor', () => {
  it('czynny przez cały rok, tylko w różnych godzinach', () => {
    for (const dzien of ['2026-01-15', '2026-04-15', '2026-05-15', '2026-07-15', '2026-11-15']) {
      expect(stan(dzien, 12, 'czerwony-klasztor').dzisiaj).not.toBeNull()
    }
  })

  it('w wakacje otwiera się o ósmej', () => {
    expect(stan('2026-07-15', 8, 'czerwony-klasztor').stan).toBe('otwarte')
    expect(stan('2026-05-15', 8, 'czerwony-klasztor').stan).toBe('przed-otwarciem')
  })
})

describe('spójność danych', () => {
  it('każdy obiekt ma poprawne okna', () => {
    for (const obiekt of OBIEKTY) {
      expect(obiekt.okna.length).toBeGreaterThan(0)
      for (const okno of obiekt.okna) {
        expect(okno.otwarcie).toBeLessThan(okno.zamkniecie)
        expect(okno.od[0]).toBeGreaterThanOrEqual(1)
        expect(okno.od[0]).toBeLessThanOrEqual(12)
        expect(okno.do[0]).toBeGreaterThanOrEqual(1)
        expect(okno.do[0]).toBeLessThanOrEqual(12)
      }
    }
  })

  it('każdy obiekt wskazuje istniejącą stronę atrakcji', () => {
    for (const obiekt of OBIEKTY) {
      expect(obiekt.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
