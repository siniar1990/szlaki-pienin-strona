import { describe, expect, it } from 'vitest'

import {
  DNI_W_MAPIE_NEWS,
  indeksMap,
  kanalRss,
  LIMIT_MAPY_NEWS,
  mapaNews,
  mapaWitryny,
  uciekaj,
  wOknieNews,
} from './xml'

/**
 * Testy kanałów XML.
 *
 * Sprawdzamy trzy rodzaje rzeczy i każda ma inny powód:
 *
 *  1. **Poprawność dokumentu.** Jeden nieuciekniony ampersand w tytule psuje
 *     całą mapę witryny, nie tylko jeden wpis — a tytuły przychodzą od modelu
 *     językowego i z cudzych serwisów, więc prędzej czy później się trafi.
 *  2. **Co wchodzi, a co nie.** Wymaganie „szkic nie może trafić do mapy" jest
 *     warunkiem, którego nie chcę weryfikować oglądaniem strony.
 *  3. **Zgodność z wymaganiami Google.** Okno dwóch dni i limit tysiąca pozycji
 *     to nie nasze ustalenia, tylko cudze reguły, o których łatwo zapomnieć
 *     przy następnej zmianie.
 */

/** Prosty sprawdzian poprawności: dokument musi się rozłożyć bez błędu. */
function poprawnyXml(dokument: string): boolean {
  // Deklaracja, jeden korzeń, brak nieuciekniętych znaków sterujących.
  if (!dokument.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) return false

  const bezDeklaracji = dokument.replace(/^<\?xml[^?]*\?>/, '').trim()
  const korzen = /^<([a-z:]+)[\s>]/i.exec(bezDeklaracji)
  if (!korzen) return false
  if (!bezDeklaracji.endsWith(`</${korzen[1]}>`)) return false

  // Ampersand wolno tylko w encji — to jest ten błąd, który psuje cały plik.
  const zleAmpersandy = bezDeklaracji.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi)
  return zleAmpersandy === null
}

const PORTAL = 'https://szlakipienin.pl'

describe('ucieczka znaków', () => {
  it('zamienia znaki, które psują dokument', () => {
    expect(uciekaj('Sokolica & Trzy Korony')).toBe('Sokolica &amp; Trzy Korony')
    expect(uciekaj('<script>')).toBe('&lt;script&gt;')
    expect(uciekaj('cudzysłów "prosty"')).toBe('cudzysłów &quot;prosty&quot;')
  })

  it('nie rusza polskich znaków', () => {
    expect(uciekaj('Wąwóz Homole')).toBe('Wąwóz Homole')
  })
})

describe('mapa witryny', () => {
  const wpisy = [
    { adres: `${PORTAL}/aktualnosci/pierwsza`, zmieniono: new Date('2026-08-01T10:00:00Z') },
    { adres: `${PORTAL}/aktualnosci/druga-i-trzecia`, zmieniono: new Date('2026-08-02T10:00:00Z') },
  ]

  it('zwraca poprawny dokument XML', () => {
    expect(poprawnyXml(mapaWitryny(wpisy))).toBe(true)
  })

  it('zawiera każdy podany adres', () => {
    const xml = mapaWitryny(wpisy)
    expect(xml).toContain('<loc>https://szlakipienin.pl/aktualnosci/pierwsza</loc>')
    expect(xml).toContain('<loc>https://szlakipienin.pl/aktualnosci/druga-i-trzecia</loc>')
  })

  it('podaje lastmod jako datę W3C', () => {
    expect(mapaWitryny(wpisy)).toContain('<lastmod>2026-08-01T10:00:00.000Z</lastmod>')
  })

  it('nie zawiera adresu, którego nie podano — szkic nie ma jak tu trafić', () => {
    const xml = mapaWitryny(wpisy)
    expect(xml).not.toContain('szkic')
  })

  it('przeżywa tytuł ze znakiem specjalnym w adresie', () => {
    const xml = mapaWitryny([{ adres: `${PORTAL}/szukaj?q=trzy&x=1` }])
    expect(poprawnyXml(xml)).toBe(true)
    expect(xml).toContain('q=trzy&amp;x=1')
  })
})

describe('indeks map', () => {
  it('wymienia mapy składowe i jest poprawny', () => {
    const xml = indeksMap([
      { adres: `${PORTAL}/sitemap-pages.xml`, zmieniono: new Date('2026-08-01T00:00:00Z') },
      { adres: `${PORTAL}/sitemap-posts.xml`, zmieniono: new Date('2026-08-02T00:00:00Z') },
    ])

    expect(poprawnyXml(xml)).toBe(true)
    expect(xml).toContain('<sitemapindex')
    expect(xml).toContain('sitemap-pages.xml')
    expect(xml).toContain('sitemap-posts.xml')
  })
})

describe('mapa Google News', () => {
  const publikacja = { nazwa: 'Szlaki Pienin', jezyk: 'pl' }
  const wpisy = [
    {
      adres: `${PORTAL}/aktualnosci/zamkniety-szlak`,
      tytul: 'Szlak na Sokolicę zamknięty',
      opublikowano: new Date('2026-08-09T06:30:00Z'),
    },
  ]

  it('zwraca poprawny dokument XML', () => {
    expect(poprawnyXml(mapaNews(wpisy, publikacja))).toBe(true)
  })

  it('zawiera wszystkie znaczniki wymagane przez Google', () => {
    const xml = mapaNews(wpisy, publikacja)
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"')
    expect(xml).toContain('<news:name>Szlaki Pienin</news:name>')
    expect(xml).toContain('<news:language>pl</news:language>')
    expect(xml).toContain('<news:publication_date>2026-08-09T06:30:00.000Z</news:publication_date>')
    expect(xml).toContain('<news:title>Szlak na Sokolicę zamknięty</news:title>')
  })

  it('pusta mapa jest poprawna — dwa dni bez publikacji to normalna sytuacja', () => {
    expect(poprawnyXml(mapaNews([], publikacja))).toBe(true)
  })

  it('nie przekracza limitu tysiąca pozycji', () => {
    const duzo = Array.from({ length: LIMIT_MAPY_NEWS + 50 }, (_, i) => ({
      adres: `${PORTAL}/aktualnosci/notka-${i}`,
      tytul: `Notka ${i}`,
      opublikowano: new Date(),
    }))

    const xml = mapaNews(duzo, publikacja)
    expect(xml.match(/<news:news>/g)?.length).toBe(LIMIT_MAPY_NEWS)
  })

  describe('okno dwóch dni', () => {
    const teraz = new Date('2026-08-09T12:00:00Z')

    it('przyjmuje notkę sprzed godziny', () => {
      expect(wOknieNews(new Date('2026-08-09T11:00:00Z'), teraz)).toBe(true)
    })

    it('przyjmuje notkę sprzed niecałych dwóch dni', () => {
      expect(wOknieNews(new Date('2026-08-07T13:00:00Z'), teraz)).toBe(true)
    })

    it('odrzuca notkę starszą niż dwa dni — tak wymaga Google', () => {
      expect(wOknieNews(new Date('2026-08-06T12:00:00Z'), teraz)).toBe(false)
      expect(DNI_W_MAPIE_NEWS).toBe(2)
    })
  })
})

describe('kanał RSS', () => {
  const kanal = {
    tytul: 'Szlaki Pienin — aktualności',
    adres: PORTAL,
    opis: 'Co słychać w Pieninach',
    jezyk: 'pl-PL',
  }
  const wpisy = [
    {
      adres: `${PORTAL}/aktualnosci/pierwsza`,
      tytul: 'Pierwsza notka',
      opis: 'Krótkie streszczenie.',
      opublikowano: new Date('2026-08-09T06:30:00Z'),
      zdjecie: `${PORTAL}/aktualnosci/pierwsza/zdjecie`,
    },
  ]

  it('zwraca poprawny dokument XML', () => {
    expect(poprawnyXml(kanalRss(wpisy, kanal))).toBe(true)
  })

  it('zawiera wymagane pola każdej pozycji', () => {
    const xml = kanalRss(wpisy, kanal)
    expect(xml).toContain('<title>Pierwsza notka</title>')
    expect(xml).toContain('<link>https://szlakipienin.pl/aktualnosci/pierwsza</link>')
    expect(xml).toContain('<guid isPermaLink="true">')
    expect(xml).toContain('<description>Krótkie streszczenie.</description>')
    // RFC 822, nie ISO — tego wymaga RSS 2.0.
    expect(xml).toContain('<pubDate>Sun, 09 Aug 2026 06:30:00 GMT</pubDate>')
  })

  it('podaje zdjęcie jako adres do pobrania, nie jako data: URL', () => {
    const xml = kanalRss(wpisy, kanal)
    expect(xml).toContain('<enclosure url="https://szlakipienin.pl/aktualnosci/pierwsza/zdjecie"')
    expect(xml).not.toContain('data:image')
  })

  it('pomija enclosure przy notce bez zdjęcia', () => {
    const xml = kanalRss([{ ...wpisy[0], zdjecie: undefined }], kanal)
    expect(xml).not.toContain('<enclosure')
    expect(poprawnyXml(xml)).toBe(true)
  })

  it('pusty kanał jest poprawny', () => {
    expect(poprawnyXml(kanalRss([], kanal))).toBe(true)
  })
})
