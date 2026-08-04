import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import {
  SchematKapliczek,
  SchematMiejsca,
  SchematTrasy,
  SchematWyzwan,
  type SurowaTrasa,
} from './schematy'
import { naSlug, nadajUnikalneSlugi } from './slug'
import type {
  Atrakcja,
  Ciekawostka,
  Miejsce,
  Punkt,
  StatystykiPortalu,
  Trasa,
  TrasaNaLiscie,
  Trudnosc,
  TypPunktu,
  Wspolrzedne,
  Wyzwanie,
} from './typy'

/**
 * Jedyne miejsce w projekcie, które czyta pliki z dysku.
 *
 * Cała reszta portalu rozmawia z funkcjami wyeksportowanymi niżej i nie wie,
 * czy dane leżą w katalogu, w CMS-ie, czy przychodzą z API. Gdy kiedyś
 * wjedzie Sanity albo Strapi, wystarczy napisać drugą implementację tych
 * samych funkcji — komponentów nie trzeba będzie ruszać.
 *
 * Uwaga: ten moduł działa wyłącznie przy budowaniu. Portal jest eksportem
 * statycznym, więc każda strona powstaje raz, na maszynie budującej, i tam
 * `node:fs` jest dostępne. Do przeglądarki nic z tego nie trafia.
 */

const KATALOG_DANYCH = path.join(process.cwd(), 'public', 'dane')

/** Publiczny adres pliku z danymi — `public/dane/x` widać jako `/dane/x`. */
function adresPubliczny(...czesci: string[]): string {
  return `/dane/${czesci.join('/')}`
}

function wczytajJson(...czesci: string[]): unknown {
  return JSON.parse(readFileSync(path.join(KATALOG_DANYCH, ...czesci), 'utf8'))
}

/* ── Trudność ────────────────────────────────────────────────────────────
   Aplikacja nie ma pola „trudność", a portal jej potrzebuje: brief prosi
   o kategorie łatwe/średnie/trudne, a turysta chce wiedzieć, w co się pakuje.

   Liczymy ją tak, jak od dawna liczy się w turystyce górskiej — sprowadzając
   podejście do „dodatkowych kilometrów". Przyjęta zamiana: 100 m w pionie
   męczy mniej więcej tyle, co kilometr po płaskim. Suma daje kilometry
   ekwiwalentne, a progi wynikają z tego, ile taka trasa realnie zajmuje:

     do 8 km ekw.   — łatwa    (spokojne pół dnia, da się z dzieckiem)
     do 16 km ekw.  — średnia  (dobre pół dnia w tempie marszowym)
     powyżej        — trudna   (całodniowe wyjście, trzeba wyjść wcześnie)

   To jest szacunek portalu, nie ocena autora przewodnika — i tak właśnie
   jest podpisany na stronie trasy.                                        */

const KM_NA_100_M_PODEJSCIA = 1

export function kilometryEkwiwalentne(dlugoscKm: number, podejscieM: number): number {
  return dlugoscKm + (podejscieM / 100) * KM_NA_100_M_PODEJSCIA
}

export function ustalTrudnosc(dlugoscKm: number, podejscieM: number): Trudnosc {
  const ekwiwalent = kilometryEkwiwalentne(dlugoscKm, podejscieM)
  if (ekwiwalent <= 8) return 'latwa'
  if (ekwiwalent <= 16) return 'srednia'
  return 'trudna'
}

/* ── Zamiana surowych plików na model domenowy ─────────────────────────── */

const ZNANE_TYPY_PUNKTOW: ReadonlySet<string> = new Set<TypPunktu>([
  'szczyt', 'przelecz', 'schronisko', 'punkt_widokowy', 'miejscowosc', 'zamek',
  'kolej_linowa', 'muzeum', 'przejscie_graniczne', 'atrakcja', 'kaplica',
  'kosciol', 'zrodlo', 'inny',
])

/**
 * W danych zdarza się „punktWidokowy" zamiast „punkt_widokowy" — jeden punkt
 * na 253. Zamiast poprawiać to w aplikacji i czekać na synchronizację,
 * przyjmujemy obie pisownie. Wszystko, czego nie znamy, ląduje jako „inny”,
 * bo lepiej pokazać punkt bez ikony niż wywalić budowanie z powodu literówki.
 */
function normalizujTypPunktu(typ: string): TypPunktu {
  const zPodkresleniami = typ.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
  return (ZNANE_TYPY_PUNKTOW.has(zPodkresleniami) ? zPodkresleniami : 'inny') as TypPunktu
}

/** Ucina ewentualną trzecią wartość (wysokość) ze współrzędnych GeoJSON. */
function naWspolrzedne(coord: readonly number[]): Wspolrzedne {
  return [coord[0], coord[1]]
}

function naTrase(surowa: SurowaTrasa, slug: string): Trasa {
  const punkty: Punkt[] = surowa.punkty.map((p) => ({
    nazwa: p.nazwa,
    typ: normalizujTypPunktu(p.typ),
    wspolrzedne: naWspolrzedne(p.coord),
    czasNarastMin: p.czas_narast_min,
    wysokoscM: p.wysokosc_m ?? null,
    zdjecie: p.zdjecie ?? null,
  }))

  return {
    id: surowa.id,
    slug,
    nazwa: surowa.nazwa,
    opis: surowa.opis ?? null,
    kategoria: surowa.kategoria,
    kategorieDodatkowe: surowa.kategorie_dodatkowe ?? [],
    dlugoscKm: surowa.dlugosc_km,
    czasMin: surowa.czas_min,
    sumaPodejscM: surowa.suma_podejsc_m,
    kcal: surowa.kcal,
    granica: surowa.granica,
    petla: surowa.petla ?? false,
    pttk: surowa.pttk,
    szlaki: surowa.szlaki,
    koloryOdcinkow: (surowa.kolory_odcinkow ?? []).map((o) => ({
      kolor: o.kolor,
      do: o.do ?? null,
    })),
    wysokoscSzczytuM: surowa.wysokosc_szczytu_m ?? null,
    grupaGorska: surowa.grupa_gorska ?? null,
    punkty,
    segmenty: surowa.segmenty_opisu.map((s) => ({
      od: s.od,
      do: s.do,
      tekst: s.tekst,
      wskazowka: s.wskazowka ?? null,
    })),
    ciekawostki: surowa.ramki.map((r) => ({
      wspolrzedne: naWspolrzedne(r.coord),
      tytul: r.tytul,
      tekst: r.tekst,
    })),
    ostrzezenia: surowa.ostrzezenia,
    zdjecia: surowa.zdjecia.map((z) =>
      typeof z === 'string'
        ? { adres: adresPubliczny('zdjecia', z), podpis: null }
        : { adres: adresPubliczny('zdjecia', z.plik), podpis: z.podpis ?? null },
    ),
    ilustracja: surowa.ilustracja ? adresPubliczny('ilustracje', surowa.ilustracja) : null,
    // W aplikacji ślad jest zapisany jako `assets/trasy/gpx/1A.geojson`.
    // Skrypt synchronizujący przenosi te pliki do `dane/slady/`, więc bierzemy
    // z tej ścieżki wyłącznie nazwę pliku.
    slad: surowa.geometry
      ? adresPubliczny('slady', path.basename(surowa.geometry))
      : null,
    trudnosc: ustalTrudnosc(surowa.dlugosc_km, surowa.suma_podejsc_m.tam),
    zrodla: {
      czasy: surowa._zrodlo_czasow ?? null,
      geometria: surowa._zrodlo_geometrii ?? null,
    },
  }
}

/* ── Wczytywanie ─────────────────────────────────────────────────────────── */

let pamiecTras: Trasa[] | null = null

/**
 * Wczytuje wszystkie trasy, waliduje i porządkuje.
 *
 * Wynik trzymamy w pamięci modułu, bo przy budowaniu pytają o niego dziesiątki
 * stron naraz — bez tego 53 pliki JSON czytałyby się z dysku setki razy.
 */
export function pobierzTrasy(): Trasa[] {
  if (pamiecTras) return pamiecTras

  const pliki = readdirSync(path.join(KATALOG_DANYCH, 'trasy'))
    .filter((plik) => plik.endsWith('.json') && plik !== 'index.json')
    .sort()

  const surowe = pliki.map((plik) => {
    const wynik = SchematTrasy.safeParse(wczytajJson('trasy', plik))
    if (!wynik.success) {
      // Przerywamy budowanie zamiast publikować stronę z dziurą. Komunikat
      // wskazuje plik, bo szuka się go potem w repozytorium aplikacji.
      throw new Error(
        `Trasa ${plik} nie zgadza się ze schematem:\n${wynik.error.issues
          .map((u) => `  • ${u.path.join('.')}: ${u.message}`)
          .join('\n')}`,
      )
    }
    return wynik.data
  })

  const slugi = nadajUnikalneSlugi(surowe, (t) => t.nazwa, (t) => t.id)
  pamiecTras = surowe
    .map((surowa) => naTrase(surowa, slugi.get(surowa)!))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))

  return pamiecTras
}

export function pobierzTrase(slug: string): Trasa | null {
  return pobierzTrasy().find((trasa) => trasa.slug === slug) ?? null
}

export function pobierzTrasePoId(id: string): Trasa | null {
  return pobierzTrasy().find((trasa) => trasa.id === id) ?? null
}

/** Wersja skrócona — tyle, ile potrzebuje kafelek na liście. */
export function naListe(trasa: Trasa): TrasaNaLiscie {
  return {
    id: trasa.id,
    slug: trasa.slug,
    nazwa: trasa.nazwa,
    kategoria: trasa.kategoria,
    dlugoscKm: trasa.dlugoscKm,
    czasMin: trasa.czasMin,
    sumaPodejscM: trasa.sumaPodejscM,
    trudnosc: trasa.trudnosc,
    ilustracja: trasa.ilustracja,
    petla: trasa.petla,
    granica: trasa.granica,
    szlaki: trasa.szlaki,
    wysokoscSzczytuM: trasa.wysokoscSzczytuM,
  }
}

/* ── Atrakcje ────────────────────────────────────────────────────────────
   Osobnego zbioru atrakcji w aplikacji nie ma. Buduje się go z punktów tras:
   ten sam szczyt bywa punktem na sześciu trasach, więc scalamy powtórzenia
   po nazwie i zapamiętujemy, którędy da się tam dojść.                     */

/**
 * Typy punktów, które zasługują na własną stronę.
 *
 * Nie ma tu typu „atrakcja" z danych aplikacji — trafiały do niego rzeczy
 * nieporównywalne: grota, przydrożna kaplica i zamek obok siebie. Naprawdę
 * warte osobnej strony spośród nich (wodospad, zamek, muzeum) opisujemy
 * w katalogu atrakcji turystycznych. Nie ma też „źródła": jedno wystąpienie
 * i to nazwane doliną, więc jako atrakcja wprowadzałoby w błąd.
 */
const TYPY_ATRAKCJI: ReadonlySet<TypPunktu> = new Set<TypPunktu>([
  'szczyt', 'punkt_widokowy', 'przelecz', 'schronisko', 'zamek', 'muzeum',
  'kolej_linowa',
])

/**
 * Koleje linowe scalone do jednego wpisu.
 *
 * W danych trasy stacja dolna i górna to osobne punkty — słusznie, bo to dwa
 * różne miejsca na szlaku. Ale jako atrakcja jest to jedna kolej i nikt nie
 * szuka „górnej stacji" osobno. Sprowadzamy więc obie do wspólnej nazwy;
 * pozycję dostaje ta, która trafi pierwsza, czyli stacja dolna — i dobrze,
 * bo to od niej się zaczyna.
 */
const SCALONE_KOLEJE: { wzorzec: RegExp; nazwa: string }[] = [
  { wzorzec: /stacj[ai].*kolei na Palenic/i, nazwa: 'Kolej krzesełkowa na Palenicę' },
  { wzorzec: /stacj[ai].*wyciągu w Jaworkach/i, nazwa: 'Wyciąg krzesełkowy w Jaworkach' },
]

function scalNazwe(nazwa: string, typ: TypPunktu): string {
  if (typ !== 'kolej_linowa') return nazwa
  return SCALONE_KOLEJE.find((k) => k.wzorzec.test(nazwa))?.nazwa ?? nazwa
}

/**
 * Ciekawostka „należy" do atrakcji, jeśli leży w promieniu 400 m od niej.
 *
 * Ramki w przewodniku nie mają odnośnika do punktu — mają tylko własne
 * współrzędne, zwykle postawione tam, skąd widać opisywaną rzecz. 400 m to
 * kompromis: dość, by ramka „Panorama z Szafranówki" trafiła na Szafranówkę,
 * i za mało, by przykleiła się do sąsiedniego szczytu.
 */
const PROMIEN_CIEKAWOSTKI_M = 400

/** Odległość w metrach — wzór haversine, w zupełności wystarcza na tę skalę. */
export function odlegloscM(a: Wspolrzedne, b: Wspolrzedne): number {
  const R = 6_371_000
  const naRadiany = (stopnie: number) => (stopnie * Math.PI) / 180
  const dLat = naRadiany(b[1] - a[1])
  const dLon = naRadiany(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(naRadiany(a[1])) * Math.cos(naRadiany(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

let pamiecAtrakcji: Atrakcja[] | null = null

export function pobierzAtrakcje(): Atrakcja[] {
  if (pamiecAtrakcji) return pamiecAtrakcji

  const trasy = pobierzTrasy()
  const wszystkieCiekawostki: Ciekawostka[] = trasy.flatMap((t) => t.ciekawostki)

  type Zebrane = {
    nazwa: string
    typ: TypPunktu
    wspolrzedne: Wspolrzedne
    wysokoscM: number | null
    trasy: Set<string>
  }
  const wgNazwy = new Map<string, Zebrane>()

  for (const trasa of trasy) {
    for (const punkt of trasa.punkty) {
      if (!TYPY_ATRAKCJI.has(punkt.typ)) continue

      const nazwa = scalNazwe(punkt.nazwa, punkt.typ)
      const klucz = naSlug(nazwa)
      const istniejacy = wgNazwy.get(klucz)

      if (istniejacy) {
        istniejacy.trasy.add(trasa.id)
        // Wysokość bywa podana tylko przy części wystąpień — bierzemy pierwszą,
        // jaka się trafi, zamiast zostawiać puste pole.
        istniejacy.wysokoscM ??= punkt.wysokoscM
      } else {
        wgNazwy.set(klucz, {
          nazwa,
          typ: punkt.typ,
          wspolrzedne: punkt.wspolrzedne,
          wysokoscM: punkt.wysokoscM,
          trasy: new Set([trasa.id]),
        })
      }
    }
  }

  pamiecAtrakcji = [...wgNazwy.entries()]
    .map(([slug, zebrane]) => ({
      slug,
      nazwa: zebrane.nazwa,
      typ: zebrane.typ,
      wspolrzedne: zebrane.wspolrzedne,
      wysokoscM: zebrane.wysokoscM,
      trasy: [...zebrane.trasy].sort(),
      ciekawostki: wszystkieCiekawostki.filter(
        (c) => odlegloscM(c.wspolrzedne, zebrane.wspolrzedne) <= PROMIEN_CIEKAWOSTKI_M,
      ),
    }))
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))

  return pamiecAtrakcji
}

export function pobierzAtrakcje1(slug: string): Atrakcja | null {
  return pobierzAtrakcje().find((a) => a.slug === slug) ?? null
}

/* ── Pozostałe zbiory ───────────────────────────────────────────────────── */

let pamiecMiejsc: Miejsce[] | null = null

/** Noclegi, sklepy i restauracje z okolicy — warstwa użytkowa mapy. */
export function pobierzMiejsca(): Miejsce[] {
  if (pamiecMiejsc) return pamiecMiejsc

  const surowe = SchematMiejsca.array().parse(wczytajJson('okolica', 'miejsca.json'))
  pamiecMiejsc = surowe.map((m) => ({
    nazwa: m.nazwa,
    typ: m.typ,
    wspolrzedne: [m.lon, m.lat] as Wspolrzedne,
  }))
  return pamiecMiejsc
}

/**
 * Kapliczki, krzyże i figury przydrożne Szczawnicy.
 *
 * Osobny zbiór z własnym przewodnikiem — w przeciwieństwie do noclegów mają
 * opisy, więc na mapie pokazujemy je z treścią w dymku, a nie samą nazwą.
 */
export function pobierzKapliczki(): (Miejsce & { opis: string | null })[] {
  const surowe = SchematKapliczek.parse(wczytajJson('szlaki', 'kapliczki.json'))
  return surowe.kapliczki
    .filter((k) => typeof k.lat === 'number' && typeof k.lon === 'number')
    .map((k) => ({
      nazwa: k.nazwa,
      typ: 'kapliczka',
      wspolrzedne: [k.lon!, k.lat!] as Wspolrzedne,
      opis: k.opis ?? null,
    }))
}

export function pobierzWyzwania(): Wyzwanie[] {
  const surowe = SchematWyzwan.parse(wczytajJson('wyzwania.json'))
  return surowe.wyzwania.map((w) => ({
    id: w.id,
    nazwa: w.nazwa,
    podtytul: w.podtytul ?? null,
    idTrasy: w.id_trasy ?? null,
    odznaka: w.odznaka ? adresPubliczny('wyzwania', path.basename(w.odznaka)) : null,
    film: w.film ?? null,
    regulamin: w.regulamin ?? null,
    dostepne: w.dostepne ?? false,
  }))
}

/* ── Ślad i profil wysokości ─────────────────────────────────────────────── */

/** Punkt profilu: ile kilometrów od startu i na jakiej wysokości. */
export type PunktProfilu = {
  km: number
  wysokoscM: number
}

export type ProfilWysokosci = {
  punkty: PunktProfilu[]
  minM: number
  maxM: number
  dlugoscKm: number
}

/**
 * Wyciąga profil wysokości ze śladu GeoJSON.
 *
 * Ślady mają trzecią wartość we współrzędnych — wysokość z modelu terenu
 * EU-DEM. Liczymy odległość narastająco i zwracamy serię punktów gotową
 * do narysowania.
 *
 * Punktów w śladzie bywa kilka tysięcy, a wykres ma kilkaset pikseli
 * szerokości — rysowanie wszystkiego byłoby marnowaniem miejsca w HTML-u
 * (każdy punkt to kilkanaście znaków w atrybucie `d`). Przerzedzamy więc
 * serię do około 240 punktów, biorąc co n-ty. Kształt zostaje ten sam,
 * bo profil terenu nie ma detali cieńszych niż jeden piksel wykresu.
 */
const PUNKTOW_W_PROFILU = 240

export function pobierzProfil(trasa: Trasa): ProfilWysokosci | null {
  if (!trasa.slad) return null

  // `trasa.slad` to adres publiczny (`/dane/slady/1A.geojson`); na dysku
  // odpowiada mu plik w `public/`.
  const sciezka = path.join(process.cwd(), 'public', trasa.slad)

  let geojson: {
    features?: { geometry?: { type?: string; coordinates?: number[][] } }[]
  }
  try {
    geojson = JSON.parse(readFileSync(sciezka, 'utf8'))
  } catch {
    // Brak pliku śladu nie jest powodem, żeby wywalić budowanie — strona
    // trasy poradzi sobie bez wykresu, a mapa pokaże same punkty.
    return null
  }

  const linia = geojson.features?.find((f) => f.geometry?.type === 'LineString')
  const wspolrzedne = linia?.geometry?.coordinates
  if (!wspolrzedne || wspolrzedne.length < 2) return null

  // Wysokość jest opcjonalna — jeśli ślad jej nie ma, nie ma czego rysować.
  if (wspolrzedne[0].length < 3) return null

  const wszystkie: PunktProfilu[] = []
  let narastajaco = 0

  for (let i = 0; i < wspolrzedne.length; i += 1) {
    if (i > 0) {
      narastajaco += odlegloscM(
        [wspolrzedne[i - 1][0], wspolrzedne[i - 1][1]],
        [wspolrzedne[i][0], wspolrzedne[i][1]],
      )
    }
    wszystkie.push({ km: narastajaco / 1000, wysokoscM: wspolrzedne[i][2] })
  }

  const krok = Math.max(1, Math.ceil(wszystkie.length / PUNKTOW_W_PROFILU))
  const punkty = wszystkie.filter((_, i) => i % krok === 0)
  // Ostatni punkt musi zostać, inaczej wykres urywa się przed końcem trasy.
  if (punkty[punkty.length - 1] !== wszystkie[wszystkie.length - 1]) {
    punkty.push(wszystkie[wszystkie.length - 1])
  }

  const wysokosci = punkty.map((p) => p.wysokoscM)

  return {
    punkty,
    minM: Math.min(...wysokosci),
    maxM: Math.max(...wysokosci),
    dlugoscKm: narastajaco / 1000,
  }
}

/**
 * Liczby do sekcji powitalnej.
 *
 * Wszystkie policzone z danych — żadna nie jest wpisana z ręki. Brief prosił
 * też o ocenę w sklepie i liczbę pobrań; tych tu nie ma i nie będzie, dopóki
 * aplikacja nie trafi do sklepów i nie zacznie ich realnie mieć.
 */
export function pobierzStatystyki(): StatystykiPortalu {
  const trasy = pobierzTrasy()
  const atrakcje = pobierzAtrakcje()

  return {
    liczbaTras: trasy.length,
    sumaKm: Math.round(trasy.reduce((suma, t) => suma + t.dlugoscKm, 0)),
    liczbaSzczytow: atrakcje.filter((a) => a.typ === 'szczyt').length,
    liczbaPunktowWidokowych: atrakcje.filter((a) => a.typ === 'punkt_widokowy').length,
    liczbaCiekawostek: trasy.reduce((suma, t) => suma + t.ciekawostki.length, 0),
    liczbaSchronisk: atrakcje.filter((a) => a.typ === 'schronisko').length,
  }
}
