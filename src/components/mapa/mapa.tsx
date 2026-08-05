'use client'

import maplibregl, { type LngLatBoundsLike, type Map as MapaGl } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'

import type { Wspolrzedne } from '@/lib/dane/typy'
import { cn } from '@/lib/utils'

import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * Mapa oparta na MapLibre.
 *
 * Podkład bierzemy z OpenFreeMap — te same kafelki, których używa aplikacja
 * mobilna, więc mapa na stronie i w telefonie wyglądają tak samo. Nie wymaga
 * klucza ani konta, a dostawca jest już wymieniony w polityce prywatności.
 *
 * Komponent jest ładowany dynamicznie, bez renderowania po stronie serwera:
 * MapLibre sięga do `window` już przy imporcie, więc przy budowaniu wywaliłby
 * eksport. Dodatkowo waży ~200 kB — nie ma powodu, żeby ładował się komuś,
 * kto do mapy w ogóle nie dojdzie.
 */

export type WarstwaSladu = {
  id: string
  adres: string
  kolor: string
}

export type MarkerMapy = {
  id: string
  nazwa: string
  wspolrzedne: Wspolrzedne
  typ: string
  kolor: string
  /** Dokąd prowadzi kliknięcie w nazwę w dymku. Puste = dymek bez odnośnika. */
  adres?: string
  opis?: string
  /**
   * Krótki podpis widoczny przy znaczniku bez najeżdżania — na tyle krótki,
   * żeby zmieścił się w pigułce pod punktem. Puste = sam punkt.
   */
  etykieta?: string
}

/** Pieniny w całości — punkt wyjścia, gdy nie ma czego dopasować. */
const WIDOK_POCZATKOWY: { srodek: Wspolrzedne; przyblizenie: number } = {
  srodek: [20.42, 49.43],
  przyblizenie: 11,
}

export function Mapa({
  slady = [],
  markery = [],
  klasa,
  dopasujDoSladow = true,
}: {
  slady?: WarstwaSladu[]
  markery?: MarkerMapy[]
  klasa?: string
  dopasujDoSladow?: boolean
}) {
  const pojemnik = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaGl | null>(null)
  const [gotowa, ustawGotowa] = useState(false)

  // Inicjalizacja — raz na życie komponentu.
  useEffect(() => {
    if (!pojemnik.current || mapa.current) return

    const instancja = new maplibregl.Map({
      container: pojemnik.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: WIDOK_POCZATKOWY.srodek,
      zoom: WIDOK_POCZATKOWY.przyblizenie,
      // Bez tego mapa przechwytuje przewijanie strony: użytkownik chce zjechać
      // niżej, a zamiast tego przybliża Pieniny. Zoom zostaje na przyciskach,
      // szczypaniu dwoma palcami i Ctrl + kółko.
      scrollZoom: false,
      attributionControl: { compact: true },
    })

    instancja.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    instancja.addControl(new maplibregl.FullscreenControl(), 'top-right')
    instancja.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }),
      'bottom-left',
    )

    instancja.on('load', () => ustawGotowa(true))
    mapa.current = instancja

    return () => {
      instancja.remove()
      mapa.current = null
    }
  }, [])

  // Ślady tras.
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa) return

    const granice = new maplibregl.LngLatBounds()
    let sa = false

    slady.forEach((slad) => {
      if (m.getSource(slad.id)) return

      m.addSource(slad.id, { type: 'geojson', data: slad.adres })

      // Dwie linie jedna pod drugą: szersza biała pod spodem robi obwódkę,
      // dzięki której kolorowy ślad jest czytelny nad ciemnym lasem i nad
      // jasną łąką. Bez niej trasa ginie na połowie podkładu.
      m.addLayer({
        id: `${slad.id}-obwodka`,
        type: 'line',
        source: slad.id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.9 },
      })
      m.addLayer({
        id: `${slad.id}-linia`,
        type: 'line',
        source: slad.id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': slad.kolor, 'line-width': 3.5 },
      })
    })

    if (!dopasujDoSladow) return

    // Dopasowanie widoku wymaga znajomości zasięgu śladu, a ten jest
    // dociągany asynchronicznie. Czekamy, aż źródło zgłosi gotowość.
    const dopasuj = () => {
      slady.forEach((slad) => {
        const cechy = m.querySourceFeatures(slad.id)
        cechy.forEach((cecha) => {
          if (cecha.geometry.type !== 'LineString') return
          cecha.geometry.coordinates.forEach((punkt) => {
            granice.extend(punkt as [number, number])
            sa = true
          })
        })
      })
      if (sa) m.fitBounds(granice as LngLatBoundsLike, { padding: 56, duration: 0 })
    }

    m.on('idle', dopasuj)
    return () => {
      m.off('idle', dopasuj)
    }
  }, [slady, gotowa, dopasujDoSladow])

  // Znaczniki punktów.
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa) return

    const utworzone = markery.map((marker) => {
      /*
        Znacznik to przycisk z kropką w środku, a nie sama kropka. Rozdzielenie
        jest potrzebne, gdy dochodzi podpis: powiększenie po najechaniu ma objąć
        wyłącznie kropkę. Gdyby skalował się cały przycisk, rosłaby razem z nim
        etykieta i po najechaniu na gęsty fragment mapy podpisy zachodziłyby na
        siebie dokładnie tam, gdzie najbardziej przeszkadzają.
      */
      const element = document.createElement('button')
      element.type = 'button'
      element.setAttribute('aria-label', marker.etykieta ? `${marker.nazwa}, ${marker.etykieta}` : marker.nazwa)
      element.className = 'group relative block size-3.5'

      const kropka = document.createElement('span')
      kropka.className =
        'block size-full rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150 group-focus-visible:scale-150'
      kropka.style.backgroundColor = marker.kolor
      element.append(kropka)

      if (marker.etykieta) {
        /*
          Podpis pod kropką, wyśrodkowany. Umieszczenie go z boku przesuwałoby
          wzrok w jedną stronę i przy dwóch tabliczkach obok siebie podpis
          jednej lądowałby na kropce drugiej. `pointer-events-none` zostawia
          całe klikanie kropce — podpis ma być widoczny, nie klikalny.
        */
        const etykieta = document.createElement('span')
        etykieta.className =
          'pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-px text-[11px] font-semibold leading-4 tabular-nums text-kamien-700 shadow-sm ring-1 ring-kamien-300'
        etykieta.textContent = marker.etykieta
        element.append(etykieta)
      }

      const dymek = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
        [
          '<div style="font-family:inherit;padding:2px 4px;max-width:220px">',
          marker.adres
            ? `<a href="${marker.adres}" style="font-weight:600;color:#2f5d43;text-decoration:none">${escapujHtml(marker.nazwa)}</a>`
            : `<strong>${escapujHtml(marker.nazwa)}</strong>`,
          marker.opis
            ? `<div style="margin-top:4px;color:#4b5563;font-size:12px">${escapujHtml(marker.opis)}</div>`
            : '',
          '</div>',
        ].join(''),
      )

      return new maplibregl.Marker({ element })
        .setLngLat(marker.wspolrzedne)
        .setPopup(dymek)
        .addTo(m)
    })

    return () => utworzone.forEach((marker) => marker.remove())
  }, [markery, gotowa])

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-kamien-100', klasa)}>
      <div ref={pojemnik} className="size-full" />
      {!gotowa && (
        <div className="absolute inset-0 grid place-items-center bg-kamien-100 text-sm text-kamien-500">
          Wczytywanie mapy…
        </div>
      )}
    </div>
  )
}

/**
 * Dymki MapLibre przyjmują HTML, a nazwy punktów pochodzą z danych.
 * Dane są nasze, ale traktowanie ich jak zaufanego HTML-a to nawyk, który
 * kiedyś się zemści — więc uciekamy znaki specjalne.
 */
function escapujHtml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
