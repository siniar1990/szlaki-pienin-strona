import { KATEGORIE_TRAS } from '../dane/kategorie'
import { KOLEKCJE } from '../dane/kolekcje'
import { naListe, pobierzAtrakcje, pobierzTrasy, pobierzWyzwania } from '../dane/zrodlo'
import { ATRAKCJE_TURYSTYCZNE } from '../tresc/atrakcje-turystyczne'
import { MIEJSCOWOSCI } from '../tresc/miejscowosci'

/**
 * Spis stron przewodnika do mapy witryny — wraz ze źródłami treści każdej z nich.
 *
 * **Dlaczego jeden spis, a nie dwa.** Ten sam zestaw adresów czyta trasa
 * `sitemap-pages.xml` (żeby zbudować XML) i skrypt `zbuduj-daty-stron.ts`
 * (żeby policzyć daty zmian). Gdyby każdy trzymał własną listę, pierwszy
 * nowy rodzaj stron trafiłby tylko do jednej z nich — i mapa ogłaszałaby
 * adresy, o których datach nic nie wiemy, albo odwrotnie.
 *
 * **Po co `odcisk` i `datyZ`.** `lastmod` ma mówić, kiedy zmieniła się treść,
 * a nie kiedy było wdrożenie. Do tego trzeba wiedzieć, z czego treść strony
 * powstaje: `odcisk` to materiał do skrótu (zmienił się skrót = zmieniła się
 * strona), `datyZ` to pliki, których historia w gicie niesie datę tej zmiany.
 *
 * **Uwaga na importy.** Ten moduł czyta go także skrypt spod `tsx`, więc
 * importy muszą być względne — aliasu `@/` poza Nextem nikt nie rozwiąże.
 */

export type CzestotliwoscMapy = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type StronaMapy = {
  /** Ścieżka bez domeny: `/szlaki/sokolica`; strona główna to `/`. */
  sciezka: string
  czestotliwosc: CzestotliwoscMapy
  /**
   * `priority` nie jest obietnicą pozycji w wynikach, tylko podpowiedzią, co
   * w obrębie tej witryny jest ważniejsze. Trasy dostają więcej niż
   * kategorie, bo to one niosą treść.
   */
  waga: number
  /** Materiał do skrótu treści: pliki (ścieżki od korzenia repo) i/lub zserializowane wpisy. */
  odcisk: { pliki?: string[]; tresc?: string }
  /** Pliki lub katalogi, których data ostatniego commita datuje zmianę. */
  datyZ: string[]
}

/** Zamienia adres publiczny (`/dane/slady/1A.geojson`) na ścieżkę w repo. */
function plikPubliczny(adres: string): string {
  return `public${adres}`
}

/*
  Strony stałe — treść siedzi w komponentach, więc źródłem jest kod strony.
  Zmiana wspólnego układu (nagłówek, stopka) celowo nie datuje wszystkich
  stron naraz: to nie jest zmiana treści, którą wyszukiwarka miałaby czytać
  od nowa.

  `/aktualnosci` i `/dzis` zmieniają zawartość częściej niż kod — z bazy
  i z obchodu źródeł. Tu datujemy tylko ich szkielet; świeżość notek ogłaszają
  `sitemap-posts.xml` i mapa Google News, od tego są.
*/
const STRONY_STALE: StronaMapy[] = [
  {
    sciezka: '/',
    czestotliwosc: 'daily',
    waga: 1,
    odcisk: { pliki: ['src/app/page.tsx', 'src/components/glowna'] },
    datyZ: ['src/app/page.tsx', 'src/components/glowna'],
  },
  {
    sciezka: '/szlaki',
    czestotliwosc: 'weekly',
    waga: 0.9,
    odcisk: { pliki: ['src/app/szlaki/page.tsx', 'public/dane/trasy/index.json'] },
    datyZ: ['src/app/szlaki/page.tsx', 'public/dane/trasy/index.json'],
  },
  {
    sciezka: '/atrakcje',
    czestotliwosc: 'monthly',
    waga: 0.8,
    odcisk: { pliki: ['src/app/atrakcje/page.tsx', 'src/lib/tresc/atrakcje-turystyczne.ts'] },
    datyZ: ['src/app/atrakcje/page.tsx', 'src/lib/tresc/atrakcje-turystyczne.ts'],
  },
  {
    sciezka: '/miejscowosci',
    czestotliwosc: 'monthly',
    waga: 0.8,
    odcisk: { pliki: ['src/app/miejscowosci/page.tsx', 'src/lib/tresc/miejscowosci.ts'] },
    datyZ: ['src/app/miejscowosci/page.tsx', 'src/lib/tresc/miejscowosci.ts'],
  },
  {
    sciezka: '/mapa',
    czestotliwosc: 'monthly',
    waga: 0.7,
    odcisk: { pliki: ['src/app/mapa', 'src/components/mapa'] },
    datyZ: ['src/app/mapa', 'src/components/mapa'],
  },
  {
    sciezka: '/aktualnosci',
    czestotliwosc: 'daily',
    waga: 0.9,
    odcisk: { pliki: ['src/app/aktualnosci'] },
    datyZ: ['src/app/aktualnosci'],
  },
  // Treść zmienia się kilka razy dziennie — to jedyna strona stała,
  // przy której „daily" jest zaniżeniem, a nie grzecznościową deklaracją.
  {
    sciezka: '/dzis',
    czestotliwosc: 'hourly',
    waga: 0.8,
    odcisk: { pliki: ['src/app/dzis', 'src/components/dzis'] },
    datyZ: ['src/app/dzis', 'src/components/dzis'],
  },
  {
    sciezka: '/aplikacja',
    czestotliwosc: 'monthly',
    waga: 0.8,
    odcisk: { pliki: ['src/app/aplikacja', 'src/components/aplikacja'] },
    datyZ: ['src/app/aplikacja', 'src/components/aplikacja'],
  },
  {
    sciezka: '/wyzwania',
    czestotliwosc: 'monthly',
    waga: 0.6,
    odcisk: { pliki: ['src/app/wyzwania/page.tsx', 'public/dane/wyzwania.json'] },
    datyZ: ['src/app/wyzwania/page.tsx', 'public/dane/wyzwania.json'],
  },
  {
    sciezka: '/o-nas',
    czestotliwosc: 'yearly',
    waga: 0.5,
    odcisk: { pliki: ['src/app/o-nas'] },
    datyZ: ['src/app/o-nas'],
  },
  {
    sciezka: '/wsparcie',
    czestotliwosc: 'yearly',
    waga: 0.4,
    odcisk: { pliki: ['src/app/wsparcie'] },
    datyZ: ['src/app/wsparcie'],
  },
  {
    sciezka: '/kontakt',
    czestotliwosc: 'yearly',
    waga: 0.5,
    odcisk: { pliki: ['src/app/kontakt', 'src/components/kontakt'] },
    datyZ: ['src/app/kontakt', 'src/components/kontakt'],
  },
  {
    sciezka: '/prywatnosc',
    czestotliwosc: 'yearly',
    waga: 0.3,
    odcisk: { pliki: ['src/app/prywatnosc'] },
    datyZ: ['src/app/prywatnosc'],
  },
]

export function stronyMapy(): StronaMapy[] {
  const wszystkieTrasy = pobierzTrasy()

  const trasy: StronaMapy[] = wszystkieTrasy.map((trasa) => {
    // Strona trasy to opis plus ślad i ilustracja — zmiana każdego z nich
    // jest zmianą treści. GPX pomijamy: powstaje przy budowaniu ze śladu.
    const pliki = [`public/dane/trasy/${trasa.id}.json`]
    if (trasa.slad) pliki.push(plikPubliczny(trasa.slad))
    if (trasa.ilustracja) pliki.push(plikPubliczny(trasa.ilustracja))

    return {
      sciezka: `/szlaki/${trasa.slug}`,
      czestotliwosc: 'monthly' as const,
      waga: 0.8,
      odcisk: { pliki },
      datyZ: pliki,
    }
  })

  const miejscowosci: StronaMapy[] = MIEJSCOWOSCI.map((miejscowosc) => ({
    sciezka: `/miejscowosci/${miejscowosc.slug}`,
    czestotliwosc: 'weekly' as const,
    waga: 0.7,
    // Wpis z osobna, nie cały plik: poprawka w Szczawnicy nie jest zmianą
    // strony Krościenka.
    odcisk: { tresc: JSON.stringify(miejscowosc) },
    datyZ: ['src/lib/tresc/miejscowosci.ts'],
  }))

  /*
    Tylko wyzwania dostępne. Niedostępne nie mają własnej strony, więc wpis
    w mapie witryny prowadziłby wyszukiwarkę prosto w stronę 404.
  */
  const wyzwania: StronaMapy[] = pobierzWyzwania()
    .filter((wyzwanie) => wyzwanie.dostepne)
    .map((wyzwanie) => ({
      sciezka: `/wyzwania/${wyzwanie.slug}`,
      czestotliwosc: 'monthly' as const,
      waga: 0.7,
      odcisk: { tresc: JSON.stringify(wyzwanie) },
      datyZ: ['public/dane/wyzwania.json'],
    }))

  /*
    Strona kategorii czy kolekcji to definicja plus karty należących do niej
    tras — zmienia się także wtedy, gdy zmieni się któraś z kart. Dlatego
    odcisk obejmuje skróty tras, a daty biorą pod uwagę również ich pliki.
    Samego warunku `pasuje` nie da się zserializować, ale jego skutek —
    listę członków — widać w odcisku.
  */
  const kategorie: StronaMapy[] = KATEGORIE_TRAS.map((kategoria) => {
    const czlonkowie = wszystkieTrasy.filter(kategoria.pasuje)
    return {
      sciezka: `/szlaki/kategorie/${kategoria.slug}`,
      czestotliwosc: 'monthly' as const,
      waga: 0.6,
      odcisk: { tresc: JSON.stringify({ kategoria, trasy: czlonkowie.map(naListe) }) },
      datyZ: [
        'src/lib/dane/kategorie.ts',
        ...czlonkowie.map((trasa) => `public/dane/trasy/${trasa.id}.json`),
      ],
    }
  })

  const kolekcje: StronaMapy[] = KOLEKCJE.map((kolekcja) => {
    const czlonkowie = wszystkieTrasy.filter(kolekcja.pasuje)
    return {
      sciezka: `/szlaki/kolekcje/${kolekcja.slug}`,
      czestotliwosc: 'monthly' as const,
      waga: 0.6,
      odcisk: { tresc: JSON.stringify({ kolekcja, trasy: czlonkowie.map(naListe) }) },
      datyZ: [
        'src/lib/dane/kolekcje.ts',
        ...czlonkowie.map((trasa) => `public/dane/trasy/${trasa.id}.json`),
      ],
    }
  })

  /*
    Atrakcje pochodzą z dwóch źródeł: katalogu redakcyjnego i punktów na
    trasach. Slug jest wspólną przestrzenią nazw, więc scalamy źródła pod
    jednym adresem — inaczej ten sam URL pojawiłby się w mapie dwa razy,
    a jego data widziałaby tylko połowę treści.
  */
  const zrodlaAtrakcji = new Map<string, { tresc: string[]; datyZ: Set<string> }>()

  const dopisz = (slug: string, tresc: string, datyZ: string[]) => {
    const istniejace = zrodlaAtrakcji.get(slug) ?? { tresc: [], datyZ: new Set() }
    istniejace.tresc.push(tresc)
    for (const plik of datyZ) istniejace.datyZ.add(plik)
    zrodlaAtrakcji.set(slug, istniejace)
  }

  for (const atrakcja of ATRAKCJE_TURYSTYCZNE) {
    dopisz(atrakcja.slug, JSON.stringify(atrakcja), ['src/lib/tresc/atrakcje-turystyczne.ts'])
  }
  for (const atrakcja of pobierzAtrakcje()) {
    dopisz(
      atrakcja.slug,
      JSON.stringify(atrakcja),
      atrakcja.trasy.map((id) => `public/dane/trasy/${id}.json`),
    )
  }

  const atrakcje: StronaMapy[] = [...zrodlaAtrakcji.entries()].map(([slug, zrodla]) => ({
    sciezka: `/atrakcje/${slug}`,
    czestotliwosc: 'monthly' as const,
    waga: 0.6,
    odcisk: { tresc: zrodla.tresc.join('\n') },
    datyZ: [...zrodla.datyZ].sort(),
  }))

  return [
    ...STRONY_STALE,
    ...miejscowosci,
    ...trasy,
    ...wyzwania,
    ...kategorie,
    ...kolekcje,
    ...atrakcje,
  ]
}
