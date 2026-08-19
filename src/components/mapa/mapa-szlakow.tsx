'use client'

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import maplibregl, { type Map as MapaGl, type MapMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Clock, MoveUpRight, RefreshCw, Route, Search, X } from 'lucide-react'

import { naSlug } from '@/lib/dane/slug'
import {
  ADRES_OBSZAROW,
  GESTOSC_KRESEK,
  WZOR_KRESEK,
  ZRODLO_ZAKAZOW,
  rysujKreski,
  warstwyZakazow,
} from '@/lib/mapa/obszary-bez-psow'
import { TRUDNOSC_ETYKIETY, TRUDNOSC_STYLE, czas, kilometry, metry } from '@/lib/format'
import { cn } from '@/lib/utils'

import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * Mapa szlaków: lista po lewej, mapa po prawej.
 *
 * Na mapie są wyłącznie szlaki — żadnych noclegów, sklepów ani kapliczek.
 * Zaznaczenie działa w obie strony: kliknięcie pozycji na liście podświetla
 * ślad i dojeżdża do niego, kliknięcie śladu na mapie przewija listę do
 * właściwej pozycji.
 *
 * Wszystkie ślady siedzą w jednym pliku GeoJSON (budowanym skryptem
 * `narzedzia/zbuduj-geojson.ts`), więc mapa robi jedno żądanie i utrzymuje
 * jedną warstwę zamiast czterdziestu dziewięciu.
 */

const ADRES_SLADOW = '/dane/szlaki.geojson'
const ZRODLO = 'szlaki'

/** Widok początkowy — Pieniny w całości. */
const SRODEK: [number, number] = [20.42, 49.45]
const PRZYBLIZENIE = 10.5

type WlasciwosciSladu = {
  id: string
  nazwa: string
  slug: string
  adres: string
  dlugoscKm: number
  czasMin: number
  podejscieM: number
  trudnosc: 'latwa' | 'srednia' | 'trudna'
  petla: boolean
  /** Trasa z przewodnika PTTK „Szlaki pełne zdrowia". */
  pttk: boolean
  /** Czy trasa ma zdigitalizowany ślad. Bez niego zostaje sam punkt szczytu. */
  maSlad: boolean
  /** Kategoria z aplikacji — po niej grupuje się lista. */
  kategoria: string
  kategoriaNazwa: string
  kategoriaKolejnosc: number
  kolor: string
}

type Slad = {
  type: 'Feature'
  properties: WlasciwosciSladu
  geometry:
    | { type: 'LineString'; coordinates: [number, number][] }
    | { type: 'Point'; coordinates: [number, number] }
}

type ZbiorSladow = { type: 'FeatureCollection'; features: Slad[] }

/**
 * React Query trzyma pobrany plik w pamięci, więc powrót na mapę po wejściu
 * w trasę nie pobiera go drugi raz. Klient tworzymy w stanie komponentu —
 * inaczej każde przerysowanie robiłoby nowy i pamięć podręczna byłaby pusta.
 */
/**
 * Zwinięcie paska atrybucji zaraz po utworzeniu mapy.
 *
 * MapLibre w trybie zwartym rysuje przycisk „i", ale otwiera go domyślnie —
 * kontener dostaje klasę `maplibregl-compact-show` od pierwszej klatki.
 * Zdejmujemy ją raz, tuż po utworzeniu mapy, więc pasek nigdy nie zdąży
 * mrugnąć. Robimy to tu, a nie po zdarzeniu `load`: przy wolnym łączu mapa
 * wczytuje się kilka sekund i przez ten czas napis leżałby na ekranie.
 *
 * Czego świadomie NIE robimy: nie usuwamy atrybucji. Dane pochodzą
 * z OpenStreetMap na licencji ODbL, która wymaga wskazania źródła,
 * a OpenFreeMap udostępnia kafelki za darmo pod tym samym warunkiem. Treść
 * zostaje o jedno stuknięcie dalej, zamiast zniknąć.
 */
function zwinAtrybucje(pojemnik: HTMLElement | null): void {
  pojemnik
    ?.querySelectorAll('.maplibregl-ctrl-attrib')
    .forEach((element) => element.classList.remove('maplibregl-compact-show'))
}

/**
 * Tryb wysokości mapy.
 *
 * `sekcja` to mapa osadzona w toku strony — ma stałą wysokość i zostawia
 * miejsce na treść nad i pod sobą. `pelna` wypełnia rodzica i służy stronie
 * poświęconej wyłącznie mapie, gdzie wszystko inne jest tylko ramką.
 *
 * Dlaczego to jest przełącznik, a nie osobny komponent: różnica sprowadza się
 * do dwóch klas wysokości, a wszystko poniżej — filtrowanie, zaznaczanie,
 * synchronizacja listy z mapą — jest identyczne. Dwa komponenty znaczyłyby
 * dwa miejsca do poprawiania przy każdej zmianie zachowania.
 */
export type WysokoscMapy = 'sekcja' | 'pelna'

/**
 * Co mapa pokazuje poza szlakami.
 *
 * `zLista` wyłącza kolumnę z listą — mapa bierze wtedy całą szerokość.
 * Karta wybranego szlaku zostaje, więc kliknięcie w ślad nadal prowadzi do
 * jego opisu; lista jest wygodą, nie jedyną drogą.
 *
 * `zZakazamiDlaPsow` dokłada obszary, w które nie wolno wejść z psem.
 * Nie włączamy ich wszędzie: na ogólnej mapie szlaków czerwone kreskowanie
 * przez pół Pienin mówiłoby o czymś, o co nikt nie pytał, a zasłaniałoby
 * szlaki, po które ta mapa istnieje.
 *
 * Oba są przełącznikami, a nie osobnymi komponentami — z tego samego powodu
 * co `wysokosc`: wszystko poniżej, czyli wczytywanie śladów, zaznaczanie
 * i synchronizacja z listą, jest identyczne.
 */
export function MapaSzlakow({
  wysokosc = 'sekcja',
  zLista = true,
  zZakazamiDlaPsow = false,
}: {
  wysokosc?: WysokoscMapy
  zLista?: boolean
  zZakazamiDlaPsow?: boolean
} = {}) {
  const [klient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Ślady zmieniają się razem z publikacją strony, nie w trakcie
            // jej oglądania — nie ma czego odświeżać.
            staleTime: Infinity,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={klient}>
      <Zawartosc wysokosc={wysokosc} zLista={zLista} zZakazamiDlaPsow={zZakazamiDlaPsow} />
    </QueryClientProvider>
  )
}

function Zawartosc({
  wysokosc,
  zLista,
  zZakazamiDlaPsow,
}: {
  wysokosc: WysokoscMapy
  zLista: boolean
  zZakazamiDlaPsow: boolean
}) {
  const { data, isPending, isError } = useQuery<ZbiorSladow>({
    queryKey: ['slady-szlakow'],
    queryFn: async () => {
      const odpowiedz = await fetch(ADRES_SLADOW)
      if (!odpowiedz.ok) throw new Error(`Nie udało się pobrać śladów (${odpowiedz.status})`)
      return odpowiedz.json()
    },
  })

  const pojemnik = useRef<HTMLDivElement>(null)
  const ramkaMapy = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaGl | null>(null)
  const [gotowa, ustawGotowa] = useState(false)
  const [wybrany, ustawWybrany] = useState<string | null>(null)
  const [fraza, ustawFraze] = useState('')

  const slady = useMemo(() => data?.features ?? [], [data])

  /**
   * Przewinięcie do mapy po wybraniu trasy z listy.
   *
   * Tylko na wąskim ekranie. Na dużym lista i mapa stoją obok siebie, mapa jest
   * już widoczna i przewijanie strony byłoby szarpnięciem bez powodu — dlatego
   * pytamy o szerokość, a nie przewijamy zawsze.
   *
   * Próg 1024 px to ten sam punkt, w którym siatka przechodzi na dwie kolumny
   * (`lg` w Tailwindzie). Gdyby te dwie liczby się rozjechały, przewijanie
   * działoby się w układzie dwukolumnowym albo nie działo w jednokolumnowym.
   */
  const przewinDoMapy = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) return
    ramkaMapy.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const widoczne = useMemo(() => {
    const szukane = naSlug(fraza)
    const wybrane =
      szukane.length < 2
        ? slady
        : slady.filter((slad) => naSlug(slad.properties.nazwa).includes(szukane))
    return [...wybrane].sort((a, b) =>
      a.properties.nazwa.localeCompare(b.properties.nazwa, 'pl'),
    )
  }, [slady, fraza])

  /**
   * Lista pogrupowana po kategoriach z aplikacji.
   *
   * Pięćdziesiąt trzy nazwy jedna pod drugą to ściana tekstu, w której nic
   * nie widać. Podzielone na „Piesze trasy krótkie", „Korony Pienin",
   * „Trasy rowerowe" — od razu wiadomo, gdzie szukać. Kolejność grup jest ta
   * sama, co na ekranie startowym aplikacji, bo grupy niosą numer porządkowy.
   */
  const grupy = useMemo(() => {
    const wgKategorii = new Map<string, { nazwa: string; kolejnosc: number; slady: Slad[] }>()

    for (const slad of widoczne) {
      const { kategoria, kategoriaNazwa, kategoriaKolejnosc } = slad.properties
      const grupa = wgKategorii.get(kategoria)
      if (grupa) grupa.slady.push(slad)
      else
        wgKategorii.set(kategoria, {
          nazwa: kategoriaNazwa,
          kolejnosc: kategoriaKolejnosc,
          slady: [slad],
        })
    }

    return [...wgKategorii.entries()]
      .map(([klucz, grupa]) => ({ klucz, ...grupa }))
      .sort((a, b) => a.kolejnosc - b.kolejnosc)
  }, [widoczne])

  /** Dojeżdża do wskazanej trasy, zostawiając margines na krawędziach. */
  const pokazSlad = useCallback((slad: Slad) => {
    const m = mapa.current
    if (!m) return

    // Trasa bez śladu to pojedynczy punkt — nie ma z czego liczyć zasięgu,
    // więc po prostu dolatujemy do niego z sensownym przybliżeniem.
    if (slad.geometry.type === 'Point') {
      m.flyTo({ center: slad.geometry.coordinates, zoom: 13.5, duration: 700 })
      return
    }

    const granice = new maplibregl.LngLatBounds()
    slad.geometry.coordinates.forEach((punkt) => granice.extend(punkt))
    m.fitBounds(granice, { padding: 64, duration: 700 })
  }, [])

  // Utworzenie mapy — raz.
  useEffect(() => {
    if (!pojemnik.current || mapa.current) return

    const instancja = new maplibregl.Map({
      container: pojemnik.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: SRODEK,
      zoom: PRZYBLIZENIE,
      // Kółko myszy przewija stronę, nie przybliża mapę — z wyjątkiem
      // przewijania z wciśniętym Ctrl. Inaczej mapa łapie stronę w pułapkę.
      scrollZoom: false,
      attributionControl: { compact: true },
    })

    // Zaraz po utworzeniu, zanim cokolwiek zdąży się narysować.
    zwinAtrybucje(pojemnik.current)

    instancja.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    instancja.addControl(new maplibregl.FullscreenControl(), 'top-right')
    instancja.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left')

    instancja.on('load', () => ustawGotowa(true))
    mapa.current = instancja

    return () => {
      instancja.remove()
      mapa.current = null
    }
  }, [])

  // Warstwy ze śladami.
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa || !data || m.getSource(ZRODLO)) return

    m.addSource(ZRODLO, { type: 'geojson', data })

    /*
      Obszary bez psów idą POD ślady: są tłem, a nie treścią mapy. Dodajemy je
      przed warstwami szlaków, więc MapLibre samo ułoży je niżej — bez
      wskazywania warstwy, przed którą mają wylądować.
    */
    if (zZakazamiDlaPsow && !m.getSource(ZRODLO_ZAKAZOW)) {
      m.addSource(ZRODLO_ZAKAZOW, { type: 'geojson', data: ADRES_OBSZAROW })
      const kreski = rysujKreski()
      if (kreski && !m.hasImage(WZOR_KRESEK)) {
        m.addImage(WZOR_KRESEK, kreski, { pixelRatio: GESTOSC_KRESEK })
      }
      for (const warstwa of warstwyZakazow()) {
        // Bez wzoru kreskowanie nie ma czym wypełnić — zostaje podkładka
        // i obwódka, czyli obszar nadal widać.
        if (warstwa.id === 'zakazy-kreski' && !kreski) continue
        m.addLayer(warstwa)
      }
    }

    // Biała obwódka pod spodem — bez niej kolorowy ślad ginie i nad ciemnym
    // lasem, i nad jasną łąką.
    m.addLayer({
      id: 'szlaki-obwodka',
      type: 'line',
      source: ZRODLO,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.85 },
    })

    m.addLayer({
      id: 'szlaki-linia',
      type: 'line',
      source: ZRODLO,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'kolor'], 'line-width': 3 },
    })

    // Warstwa zaznaczenia: ten sam zbiór, ale filtr przepuszcza tylko wybrany
    // ślad. Filtr jest tańszy niż przebudowa źródła przy każdym kliknięciu.
    m.addLayer({
      id: 'szlaki-wybrany',
      type: 'line',
      source: ZRODLO,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ['get', 'kolor'], 'line-width': 6 },
      filter: ['==', ['get', 'id'], ''],
    })

    // Trasy bez zdigitalizowanego śladu — sam szczyt jako znacznik. Rysujemy
    // je pierścieniem, a nie linią, żeby na pierwszy rzut oka było widać,
    // że to nie jest przebieg trasy, tylko jej cel.
    m.addLayer({
      id: 'szlaki-punkty',
      type: 'circle',
      source: ZRODLO,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#ffffff',
        'circle-stroke-width': 3,
        'circle-stroke-color': ['get', 'kolor'],
      },
    })

    // Szeroka, przezroczysta warstwa wyłącznie do łapania kliknięć. Trafienie
    // palcem w linię grubości 3 px jest praktycznie niemożliwe; 20 px daje
    // margines błędu, którego wymaga WCAG 2.2 dla celów dotykowych.
    m.addLayer({
      id: 'szlaki-klikalne',
      type: 'line',
      source: ZRODLO,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 20 },
    })

    const przyKliknieciu = (zdarzenie: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const cecha = zdarzenie.features?.[0]
      if (!cecha) return
      ustawWybrany(String(cecha.properties.id))
    }

    const wskaznikNad = () => {
      m.getCanvas().style.cursor = 'pointer'
    }
    const wskaznikPoza = () => {
      m.getCanvas().style.cursor = ''
    }

    for (const warstwa of ['szlaki-klikalne', 'szlaki-punkty']) {
      m.on('click', warstwa, przyKliknieciu)
      m.on('mouseenter', warstwa, wskaznikNad)
      m.on('mouseleave', warstwa, wskaznikPoza)
    }

    // Kliknięcie w puste miejsce zdejmuje zaznaczenie.
    const przyKliknieciuWTlo = (zdarzenie: MapMouseEvent) => {
      const trafione = m.queryRenderedFeatures(zdarzenie.point, {
        layers: ['szlaki-klikalne', 'szlaki-punkty'],
      })
      if (trafione.length === 0) ustawWybrany(null)
    }
    m.on('click', przyKliknieciuWTlo)

    return () => {
      for (const warstwa of ['szlaki-klikalne', 'szlaki-punkty']) {
        m.off('click', warstwa, przyKliknieciu)
        m.off('mouseenter', warstwa, wskaznikNad)
        m.off('mouseleave', warstwa, wskaznikPoza)
      }
      m.off('click', przyKliknieciuWTlo)
    }
  }, [gotowa, data, zZakazamiDlaPsow])

  // Podświetlenie wybranego śladu.
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa || !m.getLayer('szlaki-wybrany')) return

    m.setFilter('szlaki-wybrany', ['==', ['get', 'id'], wybrany ?? ''])
    // Niewybrane ślady bledną, żeby wybrany dało się prześledzić wzrokiem
    // przez plątaninę czterdziestu dziewięciu linii.
    m.setPaintProperty('szlaki-linia', 'line-opacity', wybrany ? 0.28 : 1)
    m.setPaintProperty('szlaki-obwodka', 'line-opacity', wybrany ? 0.3 : 0.85)
    if (m.getLayer('szlaki-punkty')) {
      m.setPaintProperty('szlaki-punkty', 'circle-opacity', wybrany ? 0.35 : 1)
      m.setPaintProperty('szlaki-punkty', 'circle-stroke-opacity', wybrany ? 0.35 : 1)
    }
  }, [wybrany, gotowa])

  const wybranySlad = slady.find((slad) => slad.properties.id === wybrany) ?? null

  /*
    Kliknięcie śladu na mapie przewija listę do jego pozycji — ale tylko wtedy,
    gdy lista stoi obok mapy.

    Na telefonie lista jest pod mapą, więc to samo przewinięcie ściągałoby ekran
    z mapy w dół, zaraz po tym, jak ktoś stuknął w ślad. Kliknięcie na mapie ma
    otworzyć dymek i nic poza tym.
  */
  useEffect(() => {
    if (!wybrany) return
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    document
      .getElementById(`szlak-${wybrany}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [wybrany])

  const pelna = wysokosc === 'pelna'

  /*
    Przy trybie pełnym wysokość dyktuje rodzic: siatka rozciąga się na cały
    dostępny obszar, a oba kafle biorą z niego sto procent. `min-h-0` jest tu
    konieczne — bez niego element siatki nie zejdzie poniżej wysokości swojej
    treści i lista zamiast przewijać się wewnątrz, rozepchnęłaby stronę.
  */
  /*
    Lista ma stałą szerokość, a cały zysk z szerszego okna idzie do mapy.
    Zwężenie jej przy okazji rozciągania strony wyglądało na optymalizację,
    a w praktyce łamało plakietki tras do drugiej linii — każdy wiersz urósł
    wtedy o połowę i lista mieściła mniej szlaków niż przed zmianą.
  */
  const wysokoscSiatki = pelna ? 'lg:h-full lg:min-h-0' : ''
  const wysokoscKafla = pelna ? 'lg:h-full lg:min-h-0' : 'lg:h-[78vh]'

  return (
    <div
      className={cn(
        'grid gap-6',
        // Bez listy mapa bierze całą szerokość — jedna kolumna, żadnego
        // pustego pasa po lewej.
        zLista && 'lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]',
        wysokoscSiatki,
      )}
    >
      {/*
        ── Lista szlaków ───────────────────────────────────────────────
        Na telefonie idzie POD mapę, na dużym ekranie wraca na lewo.
        Kolejność w kodzie zostaje ta sama, przestawia ją `order` — dzięki temu
        czytnik ekranu i nawigacja klawiaturą dostają listę przed mapą, czyli
        treść przed narzędziem, niezależnie od szerokości ekranu.

        Wąski ekran nie mieści obu naraz. Lista na górze znaczyła, że mapa
        zaczyna się poniżej krawędzi ekranu i trzeba do niej doscrollować,
        żeby zobaczyć cokolwiek — a to mapa jest tu powodem wejścia.
      */}
      {zLista && (
        <div
          className={cn(
            'order-2 flex flex-col rounded-2xl border border-kamien-200 bg-white lg:order-1',
            wysokoscKafla,
          )}
        >
          <div className="border-b border-kamien-200 p-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-kamien-400"
                aria-hidden
              />
              <input
                type="search"
                value={fraza}
                onChange={(zdarzenie) => ustawFraze(zdarzenie.target.value)}
                placeholder="Szukaj szlaku…"
                aria-label="Szukaj szlaku na liście"
                className="w-full rounded-xl border border-kamien-300 py-2.5 pl-10 pr-3 text-sm text-kamien-900 placeholder:text-kamien-400"
              />
            </div>
            <p aria-live="polite" className="mt-2.5 px-1 text-xs text-kamien-500">
              {isPending
                ? 'Wczytywanie szlaków…'
                : `${widoczne.length} ${widoczne.length === 1 ? 'szlak' : 'szlaków'} na mapie`}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {grupy.map((grupa) => (
              <section key={grupa.klucz} aria-labelledby={`grupa-${grupa.klucz}`}>
                {/*
                  Nagłówek grupy przykleja się do góry listy przy przewijaniu —
                  po zjechaniu w dwudziestą czwartą Koronę Pienin nadal widać,
                  w której kategorii się jest.
                */}
                <h3
                  id={`grupa-${grupa.klucz}`}
                  className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-y border-kamien-200 bg-kamien-50/95 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-kamien-700 backdrop-blur-sm"
                >
                  {grupa.nazwa}
                  <span className="font-normal normal-case tracking-normal text-kamien-500">
                    {grupa.slady.length}
                  </span>
                </h3>

                <ul className="divide-y divide-kamien-100">
                  {grupa.slady.map((slad) => {
                    const w = slad.properties
                    const aktywny = w.id === wybrany

                    return (
                      <li key={w.id} id={`szlak-${w.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      ustawWybrany(aktywny ? null : w.id)
                      if (!aktywny) {
                        pokazSlad(slad)
                        przewinDoMapy()
                      }
                    }}
                    aria-pressed={aktywny}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
                      aktywny ? 'bg-las-50' : 'hover:bg-kamien-50',
                    )}
                  >
                    {/* Trasa ze śladem dostaje kreskę, trasa bez śladu —
                        kółko. Ten sam sygnał co na mapie, więc jedno spojrzenie
                        wystarczy, żeby wiedzieć, czego się spodziewać. */}
                    {w.maSlad ? (
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-6 shrink-0 rounded-full"
                        style={{ backgroundColor: w.kolor }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="mt-1 size-3 shrink-0 rounded-full border-2 bg-white"
                        style={{ borderColor: w.kolor }}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block font-medium leading-snug',
                          aktywny ? 'text-las-800' : 'text-kamien-900',
                        )}
                      >
                        {w.nazwa}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-kamien-500">
                        <span className="inline-flex items-center gap-1">
                          <Route className="size-3" aria-hidden />
                          {kilometry(w.dlugoscKm)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden />
                          {czas(w.czasMin)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MoveUpRight className="size-3" aria-hidden />
                          {metry(w.podejscieM)}
                        </span>
                        {w.petla && (
                          <span className="inline-flex items-center gap-1">
                            <RefreshCw className="size-3" aria-hidden />
                            pętla
                          </span>
                        )}
                        {w.pttk && (
                          <span className="rounded-full bg-las-50 px-2 py-0.5 text-[0.7rem] font-medium text-las-800">
                            PTTK
                          </span>
                        )}
                        {!w.maSlad && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-medium text-amber-900">
                            ślad w przygotowaniu
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                        </li>
                    )
                  })}
                </ul>
              </section>
            ))}

            {!isPending && widoczne.length === 0 && (
              <p className="p-8 text-center text-sm text-kamien-500">
                Żaden szlak nie pasuje do wpisanej nazwy.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Mapa ──────────────────────────────────────────────────────── */}
      <div
        ref={ramkaMapy}
        className={`order-1 relative h-[60vh] overflow-hidden rounded-2xl border border-kamien-200 bg-kamien-100 lg:order-2 ${wysokoscKafla}`}
      >
        <div ref={pojemnik} className="size-full" />

        {(!gotowa || isPending) && !isError && (
          <div className="absolute inset-0 grid place-items-center bg-kamien-100 text-sm text-kamien-500">
            Wczytywanie mapy…
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 grid place-items-center bg-kamien-100 p-8 text-center text-sm text-kamien-600">
            Nie udało się wczytać śladów szlaków. Odśwież stronę — a jeśli to nie
            pomoże, trasy są dostępne także na{' '}
            <Link href="/szlaki" className="ml-1 font-medium text-las-700 underline">
              liście szlaków
            </Link>
            .
          </div>
        )}

        {/* Karta wybranego szlaku — nad mapą, w rogu, żeby nie zasłaniała trasy. */}
        {wybranySlad && (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-kamien-200 bg-white/95 p-5 shadow-wysoki backdrop-blur-sm sm:right-auto sm:w-[22rem]">
            <button
              type="button"
              onClick={() => ustawWybrany(null)}
              aria-label="Zamknij kartę szlaku"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-kamien-500 hover:bg-kamien-100"
            >
              <X className="size-4" aria-hidden />
            </button>

            <span
              className={cn(
                'inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                TRUDNOSC_STYLE[wybranySlad.properties.trudnosc],
              )}
            >
              {TRUDNOSC_ETYKIETY[wybranySlad.properties.trudnosc]}
            </span>

            <h2 className="mt-2 pr-8 font-heading text-lg font-semibold text-kamien-900">
              {wybranySlad.properties.nazwa}
            </h2>

            <p className="mt-1.5 text-sm text-kamien-600">
              {kilometry(wybranySlad.properties.dlugoscKm)} ·{' '}
              {czas(wybranySlad.properties.czasMin)} ·{' '}
              {metry(wybranySlad.properties.podejscieM)} podejść
            </p>

            <Link
              href={wybranySlad.properties.adres}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-las-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
            >
              Otwórz opis trasy
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
