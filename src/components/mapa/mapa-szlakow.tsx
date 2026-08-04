'use client'

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import maplibregl, { type Map as MapaGl, type MapMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Clock, MoveUpRight, RefreshCw, Route, Search, X } from 'lucide-react'

import { naSlug } from '@/lib/dane/slug'
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
  kolor: string
}

type Slad = {
  type: 'Feature'
  properties: WlasciwosciSladu
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}

type ZbiorSladow = { type: 'FeatureCollection'; features: Slad[] }

/**
 * React Query trzyma pobrany plik w pamięci, więc powrót na mapę po wejściu
 * w trasę nie pobiera go drugi raz. Klient tworzymy w stanie komponentu —
 * inaczej każde przerysowanie robiłoby nowy i pamięć podręczna byłaby pusta.
 */
export function MapaSzlakow() {
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
      <Zawartosc />
    </QueryClientProvider>
  )
}

function Zawartosc() {
  const { data, isPending, isError } = useQuery<ZbiorSladow>({
    queryKey: ['slady-szlakow'],
    queryFn: async () => {
      const odpowiedz = await fetch(ADRES_SLADOW)
      if (!odpowiedz.ok) throw new Error(`Nie udało się pobrać śladów (${odpowiedz.status})`)
      return odpowiedz.json()
    },
  })

  const pojemnik = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaGl | null>(null)
  const [gotowa, ustawGotowa] = useState(false)
  const [wybrany, ustawWybrany] = useState<string | null>(null)
  const [fraza, ustawFraze] = useState('')

  const slady = useMemo(() => data?.features ?? [], [data])

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

  /** Dojeżdża do wskazanego śladu, zostawiając margines na krawędziach. */
  const pokazSlad = useCallback((slad: Slad) => {
    const m = mapa.current
    if (!m) return

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

    m.on('click', 'szlaki-klikalne', przyKliknieciu)
    m.on('mouseenter', 'szlaki-klikalne', wskaznikNad)
    m.on('mouseleave', 'szlaki-klikalne', wskaznikPoza)

    // Kliknięcie w puste miejsce zdejmuje zaznaczenie.
    const przyKliknieciuWTlo = (zdarzenie: MapMouseEvent) => {
      const trafione = m.queryRenderedFeatures(zdarzenie.point, { layers: ['szlaki-klikalne'] })
      if (trafione.length === 0) ustawWybrany(null)
    }
    m.on('click', przyKliknieciuWTlo)

    return () => {
      m.off('click', 'szlaki-klikalne', przyKliknieciu)
      m.off('mouseenter', 'szlaki-klikalne', wskaznikNad)
      m.off('mouseleave', 'szlaki-klikalne', wskaznikPoza)
      m.off('click', przyKliknieciuWTlo)
    }
  }, [gotowa, data])

  // Podświetlenie wybranego śladu.
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa || !m.getLayer('szlaki-wybrany')) return

    m.setFilter('szlaki-wybrany', ['==', ['get', 'id'], wybrany ?? ''])
    // Niewybrane ślady bledną, żeby wybrany dało się prześledzić wzrokiem
    // przez plątaninę czterdziestu dziewięciu linii.
    m.setPaintProperty('szlaki-linia', 'line-opacity', wybrany ? 0.28 : 1)
    m.setPaintProperty('szlaki-obwodka', 'line-opacity', wybrany ? 0.3 : 0.85)
  }, [wybrany, gotowa])

  const wybranySlad = slady.find((slad) => slad.properties.id === wybrany) ?? null

  // Kliknięcie śladu na mapie przewija listę do jego pozycji.
  useEffect(() => {
    if (!wybrany) return
    document
      .getElementById(`szlak-${wybrany}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [wybrany])

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]">
      {/* ── Lista szlaków ─────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl border border-kamien-200 bg-white lg:h-[78vh]">
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

        <ul className="min-h-0 flex-1 divide-y divide-kamien-100 overflow-y-auto">
          {widoczne.map((slad) => {
            const w = slad.properties
            const aktywny = w.id === wybrany

            return (
              <li key={w.id} id={`szlak-${w.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    ustawWybrany(aktywny ? null : w.id)
                    if (!aktywny) pokazSlad(slad)
                  }}
                  aria-pressed={aktywny}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
                    aktywny ? 'bg-las-50' : 'hover:bg-kamien-50',
                  )}
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1 w-6 shrink-0 rounded-full"
                    style={{ backgroundColor: w.kolor }}
                  />
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
                    </span>
                  </span>
                </button>
              </li>
            )
          })}

          {!isPending && widoczne.length === 0 && (
            <li className="p-8 text-center text-sm text-kamien-500">
              Żaden szlak nie pasuje do wpisanej nazwy.
            </li>
          )}
        </ul>
      </div>

      {/* ── Mapa ──────────────────────────────────────────────────────── */}
      <div className="relative h-[60vh] overflow-hidden rounded-2xl border border-kamien-200 bg-kamien-100 lg:h-[78vh]">
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
