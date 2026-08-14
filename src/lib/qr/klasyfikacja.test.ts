import { describe, expect, it } from 'vitest'

import { sklasyfikuj, type SygnalyZadania } from '@/lib/qr/klasyfikacja'
import { siecCentrumDanych } from '@/lib/qr/sieci-centrow'

/**
 * Testy filtra botów.
 *
 * Piszemy je, bo ten filtr można zepsuć w sposób niewidoczny: reguła za wąska
 * przepuszcza crawlery i licznik znowu kłamie, reguła za szeroka wycina
 * turystów i licznik kłamie tak samo, tylko w drugą stronę. Jedno i drugie
 * wygląda w panelu jak zwykła liczba.
 */

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'

function zadanie(zmiany: Partial<SygnalyZadania> = {}): SygnalyZadania {
  return {
    metoda: 'GET',
    userAgent: IPHONE,
    jezyki: 'pl-PL,pl;q=0.9',
    cel: null,
    ip: '31.0.100.5',
    ...zmiany,
  }
}

describe('sklasyfikuj', () => {
  it('turysty nie uznaje za bota, ale też nie ogłasza człowiekiem', () => {
    // Człowieka potwierdza dopiero JavaScript — tu ma wyjść „nie wiem".
    expect(sklasyfikuj(zadanie())).toMatchObject({
      klasyfikacja: 'NIEPEWNY',
      powodBota: null,
    })
  })

  it('rozpoznaje crawler Facebooka po nazwie własnej', () => {
    const werdykt = sklasyfikuj(
      zadanie({
        userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        jezyki: null,
      }),
    )
    // Brak `Accept-Language` wypada wcześniej niż lista nazw i tak ma być:
    // kolejność reguł jest częścią umowy, bo to ona trafia do bazy jako powód.
    expect(werdykt.klasyfikacja).toBe('BOT')
    expect(werdykt.powodBota).toBe('bez_accept_language')
  })

  it('rozpoznaje crawler Facebooka także wtedy, gdy poda język', () => {
    const werdykt = sklasyfikuj(
      zadanie({ userAgent: 'facebookexternalhit/1.1', jezyki: 'en-US' }),
    )
    expect(werdykt).toMatchObject({ klasyfikacja: 'BOT', powodBota: 'ua_blocklist' })
  })

  it.each([
    ['meta-externalagent/1.1', 'ua_blocklist'],
    ['curl/8.7.1', 'ua_blocklist'],
    ['python-requests/2.32.3', 'ua_blocklist'],
    ['Twitterbot/1.0', 'ua_blocklist'],
    ['SuperNowyBot/2.0', 'ua_generic'],
    ['UptimeMonitor/1.0', 'ua_generic'],
  ])('odsiewa %s', (ua, powod) => {
    expect(sklasyfikuj(zadanie({ userAgent: ua }))).toMatchObject({
      klasyfikacja: 'BOT',
      powodBota: powod,
    })
  })

  it('metodą HEAD nikt nie ogląda strony', () => {
    expect(sklasyfikuj(zadanie({ metoda: 'HEAD' }))).toMatchObject({
      powodBota: 'metoda_http',
    })
  })

  it('pobranie na zapas to nie odwiedziny', () => {
    expect(sklasyfikuj(zadanie({ cel: 'prefetch' }))).toMatchObject({ powodBota: 'prefetch' })
  })

  it('ruch z centrum danych Meta odsiewa nawet z niewinnym User-Agentem', () => {
    const werdykt = sklasyfikuj(zadanie({ ip: '157.240.1.1' }))
    expect(werdykt).toMatchObject({ klasyfikacja: 'BOT', powodBota: 'asn_centrum' })
    expect(werdykt.asn).toBe(32934)
  })
})

describe('siecCentrumDanych', () => {
  it('rozpoznaje znane sieci', () => {
    expect(siecCentrumDanych('8.8.8.8')).toBe(15169)
    expect(siecCentrumDanych('1.1.1.1')).toBe(13335)
  })

  it('nie widzi centrum danych tam, gdzie go nie ma', () => {
    // Adres z sieci prywatnej i adres operatora komórkowego.
    expect(siecCentrumDanych('192.168.1.10')).toBeNull()
    expect(siecCentrumDanych('83.24.0.1')).toBeNull()
  })

  it('radzi sobie z IPv6 i ze śmieciami', () => {
    expect(siecCentrumDanych('2a03:2880:f000::1')).toBe(32934)
    expect(siecCentrumDanych('to-nie-adres')).toBeNull()
    expect(siecCentrumDanych(null)).toBeNull()
  })
})
