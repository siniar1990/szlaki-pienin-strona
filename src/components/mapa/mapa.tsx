'use client'

import maplibregl, { type Map as MapaGl } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'

import type { Wspolrzedne } from '@/lib/dane/typy'
import { granice, liniaTrasy } from '@/lib/mapa/slad'
import { GESTOSC_STRZALKI, rysujStrzalke } from '@/lib/mapa/strzalka'
import {
  ADRES_SZLAKOW,
  IKONA_STRZALKI,
  ZRODLO_SZLAKOW,
  ZRODLO_WSTEGI,
  ZRODLO_ZNAKOWANIA,
  warstwaObrysuWstegi,
  warstwaPodkladuWstegi,
  warstwaStrzalek,
  warstwaZnakowania,
  warstwySzlakow,
} from '@/lib/mapa/warstwy-trasy'
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

/**
 * Przebieg trasy do narysowania na mapie.
 *
 * Dwa pliki, bo odpowiadają na dwa różne pytania: `slad` mówi „którędy",
 * `kolory` — „za czym iść patrzeć na drzewach". Bez `kolory` wstęga jest
 * szara na całej długości i to jest poprawny obraz świata, a nie awaria.
 */
export type PrzebiegTrasy = {
  slad: string
  kolory: string | null
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
  /** Średnica kropki w pikselach. Puste = domyślne 14. */
  rozmiar?: number
  /**
   * Barwa obwódki. Domyślnie biała, żeby kropka odcinała się od podkładu.
   * Podanie barwy razem z białym wypełnieniem daje kółko puste w środku —
   * kształt czytelny niezależnie od rozpoznawania barw.
   */
  obrys?: string
}

/** Pieniny w całości — punkt wyjścia, gdy nie ma czego dopasować. */
const WIDOK_POCZATKOWY: { srodek: Wspolrzedne; przyblizenie: number } = {
  srodek: [20.42, 49.43],
  przyblizenie: 11,
}

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

export function Mapa({
  przebieg,
  markery = [],
  klasa,
  dopasujWidok = true,
}: {
  przebieg?: PrzebiegTrasy
  markery?: MarkerMapy[]
  klasa?: string
  /** Czy dosunąć widok do przebiegu trasy. Bez `przebieg` nie ma znaczenia. */
  dopasujWidok?: boolean
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

    // Zaraz po utworzeniu, zanim cokolwiek zdąży się narysować.
    zwinAtrybucje(pojemnik.current)

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

  /*
    Przebieg trasy — wstęga, znakowanie i szlaki w tle.

    Kolejność dodawania warstw JEST specyfikacją, nie przypadkiem. MapLibre
    kładzie każdą kolejną na wierzchu poprzednich, a role są takie:

      1. szlaki znakowane   — tło, po którym turysta się orientuje,
      2. ciemny obrys       — odcina wstęgę od podkładu,
      3. szara podkładka    — wypełnia dziury, żeby wstęga się nie urwała,
      4. barwy znakowania   — odpowiedź na „za czym teraz idę",
      5. strzałki           — kierunek marszu, na samym wierzchu.

    Odwrócenie 1 i 2–4 zabrałoby wstędze pierwszeństwo i trasa zginęłaby wśród
    szlaków okolicy, czyli dokładnie odwrotnie, niż ma być.
  */
  useEffect(() => {
    const m = mapa.current
    if (!m || !gotowa || !przebieg) return

    // Odpowiedź z sieci potrafi przyjść po odmontowaniu komponentu; wtedy
    // `m` jest już usunięte i dokładanie warstw rzuca wyjątkiem.
    let aktualne = true

    const rysuj = async () => {
      let linia
      try {
        const odpowiedz = await fetch(przebieg.slad)
        if (!odpowiedz.ok) return
        linia = liniaTrasy(await odpowiedz.json())
      } catch {
        // Ślad się nie wczytał — zostaje sama mapa ze znacznikami punktów
        // etapowych. To wciąż użyteczna strona, więc nie robimy z tego błędu.
        return
      }
      if (!aktualne || !linia || !mapa.current || m.getSource(ZRODLO_WSTEGI)) return

      m.addSource(ZRODLO_SZLAKOW, { type: 'geojson', data: ADRES_SZLAKOW })
      warstwySzlakow().forEach((warstwa) => m.addLayer(warstwa))

      m.addSource(ZRODLO_WSTEGI, { type: 'geojson', data: linia })
      m.addLayer(warstwaObrysuWstegi())
      m.addLayer(warstwaPodkladuWstegi())

      if (przebieg.kolory) {
        // Źródłem jest wprost adres pliku — nazwy barw na wartości
        // szesnastkowe przekłada wyrażenie w warstwie.
        m.addSource(ZRODLO_ZNAKOWANIA, { type: 'geojson', data: przebieg.kolory })
        m.addLayer(warstwaZnakowania())
      }

      const ikona = rysujStrzalke()
      if (ikona) {
        if (!m.hasImage(IKONA_STRZALKI)) {
          m.addImage(IKONA_STRZALKI, ikona, { pixelRatio: GESTOSC_STRZALKI })
        }
        m.addLayer(warstwaStrzalek())
      }

      if (dopasujWidok) {
        const zasieg = granice(linia)
        if (zasieg) m.fitBounds(zasieg, { padding: 56, duration: 0 })
      }
    }

    void rysuj()
    return () => {
      aktualne = false
    }
  }, [przebieg, gotowa, dopasujWidok])

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
      const srednica = marker.rozmiar ?? 14

      const element = document.createElement('button')
      element.type = 'button'
      element.setAttribute('aria-label', marker.etykieta ? `${marker.nazwa}, ${marker.etykieta}` : marker.nazwa)
      element.className = 'group relative block'
      element.style.width = `${srednica}px`
      element.style.height = `${srednica}px`

      const kropka = document.createElement('span')
      kropka.className =
        'block size-full rounded-full shadow-md transition-transform group-hover:scale-125 group-focus-visible:scale-125'
      kropka.style.backgroundColor = marker.kolor
      // Obwódka rośnie z kropką, ale nie liniowo — przy dużych znacznikach
      // dwupikselowa nitka ginie, a przy małych czteropikselowa zjada środek.
      kropka.style.border = `${Math.max(2, Math.round(srednica / 7))}px solid ${marker.obrys ?? '#ffffff'}`
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
          'pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[13px] font-semibold leading-5 tabular-nums text-kamien-800 shadow-sm ring-1 ring-kamien-300'
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
