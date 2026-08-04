'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Malowane pasmo szczytów.
 *
 * Zamiast kafelków — jedna panorama ciągnąca się w prawo, z wierzchołkami
 * uszeregowanymi od najwyższego. Wysokość na rysunku odpowiada wysokości
 * w terenie, więc spadek od Radziejowej po Gabańkę widać jako realny profil
 * grani, a nie jako słupki.
 *
 * Skąd wrażenie ręcznej roboty, skoro to wektor:
 *
 *  • krawędzie grani są celowo nierówne — każdy odcinek dostaje drobne
 *    odchylenie z generatora pseudolosowego zasianego numerem punktu.
 *    Deterministycznie, więc serwer i przeglądarka rysują to samo, a linia
 *    przestaje wyglądać jak wykres w arkuszu;
 *  • trzy plany oddalone barwą (perspektywa powietrzna: im dalej, tym
 *    bledziej i bardziej niebiesko);
 *  • czapy śnieżne tylko na wierzchołkach powyżej 1000 m, bo tylko tam
 *    śnieg realnie leży dłużej;
 *  • ziarno papieru jako kafelkowany wzór szumu — nałożone na całość
 *    zbija cyfrową gładkość.
 *
 * Świadomie bez filtrów SVG (`feTurbulence` + `feDisplacementMap`), choć
 * dałyby podobny efekt: przy paśmie szerokim na sześć tysięcy pikseli
 * przeliczanie filtra potrafi zaciąć przewijanie na słabszym telefonie.
 * Nierówności policzone raz przy renderowaniu nic nie kosztują.
 */

export type SzczytPasma = {
  slug: string
  nazwa: string
  wysokoscM: number
  liczbaTras: number
}

/** Szerokość jednej kolumny szczytu. */
const KROK = 168
const WYSOKOSC = 470
/** Linia, na której kończą się zbocza i zaczyna pas z nazwami. */
const PODSTAWA = 366
const APEKS_MIN_Y = 58
const APEKS_MAX_Y = 250
/** Powyżej tej wysokości wierzchołek dostaje czapę śniegu. */
const PROG_SNIEGU_M = 1000

/**
 * Powtarzalny „szum" z liczby całkowitej — zawsze ta sama wartość dla tego
 * samego numeru punktu. Zwykły `Math.random()` dałby przy renderowaniu na
 * serwerze inny wynik niż w przeglądarce i React zgłosiłby rozjazd.
 */
function szum(ziarno: number): number {
  const x = Math.sin(ziarno * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function PasmoMalowane({ szczyty }: { szczyty: SzczytPasma[] }) {
  const tor = useRef<HTMLDivElement>(null)
  const [naPoczatku, ustawNaPoczatku] = useState(true)
  const [naKoncu, ustawNaKoncu] = useState(false)

  const zbadajPozycje = useCallback(() => {
    const el = tor.current
    if (!el) return
    ustawNaPoczatku(el.scrollLeft <= 1)
    ustawNaKoncu(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = tor.current
    if (!el) return
    zbadajPozycje()
    el.addEventListener('scroll', zbadajPozycje, { passive: true })
    window.addEventListener('resize', zbadajPozycje)
    return () => {
      el.removeEventListener('scroll', zbadajPozycje)
      window.removeEventListener('resize', zbadajPozycje)
    }
  }, [zbadajPozycje])

  const przesun = (kierunek: -1 | 1) => {
    const el = tor.current
    if (!el) return
    // Przesuwamy o pełne kolumny mieszczące się w widoku, minus jedna —
    // dzięki tej jednej widz nie gubi ciągłości grani.
    const ile = Math.max(1, Math.floor(el.clientWidth / KROK) - 1)
    el.scrollBy({ left: kierunek * KROK * ile, behavior: 'smooth' })
  }

  if (szczyty.length === 0) return null

  const najwyzszy = szczyty[0].wysokoscM
  const najnizszy = szczyty[szczyty.length - 1].wysokoscM
  const zakres = Math.max(1, najwyzszy - najnizszy)
  const szerokosc = szczyty.length * KROK + KROK / 2

  const naY = (m: number) =>
    APEKS_MAX_Y - ((m - najnizszy) / zakres) * (APEKS_MAX_Y - APEKS_MIN_Y)

  const wierzcholki = szczyty.map((szczyt, i) => ({
    szczyt,
    x: KROK / 2 + i * KROK,
    y: naY(szczyt.wysokoscM),
  }))

  /**
   * Buduje kontur grani.
   *
   * `plan` odsuwa pasmo w głąb: 0 to grzbiet główny, wartości dodatnie —
   * pasma za nim, spłaszczone i opuszczone. `chropowatosc` decyduje, jak
   * bardzo zbocza odchylają się od prostej.
   */
  function kontur(plan: number, splaszczenie: number, chropowatosc: number): string {
    const punkty = wierzcholki.map(({ x, y }, i) => ({
      x: x + plan * 26,
      y: PODSTAWA - (PODSTAWA - y) * splaszczenie + plan * 34,
      i,
    }))

    let d = `M ${-KROK} ${PODSTAWA} L ${-KROK} ${punkty[0].y + 70}`

    punkty.forEach((punkt, i) => {
      if (i > 0) {
        const poprz = punkty[i - 1]
        const roznica = Math.abs(punkt.y - poprz.y)
        const siodlo = Math.min(
          PODSTAWA - 8,
          Math.max(punkt.y, poprz.y) + 30 + roznica * 0.32,
        )
        const srodek = (poprz.x + punkt.x) / 2

        // Załamanie w połowie zbocza — bez niego stok jest idealnie prosty,
        // a takich stoków w Pieninach nie ma.
        const zalamanieX = poprz.x + (srodek - poprz.x) * 0.55
        const zalamanieY =
          poprz.y + (siodlo - poprz.y) * 0.5 + (szum(i * 3 + plan) - 0.5) * chropowatosc
        d += ` L ${zalamanieX.toFixed(1)} ${zalamanieY.toFixed(1)}`
        d += ` L ${srodek.toFixed(1)} ${siodlo.toFixed(1)}`

        const podejscieX = srodek + (punkt.x - srodek) * 0.45
        const podejscieY =
          siodlo + (punkt.y - siodlo) * 0.55 + (szum(i * 7 + plan) - 0.5) * chropowatosc
        d += ` L ${podejscieX.toFixed(1)} ${podejscieY.toFixed(1)}`
      }
      d += ` L ${punkt.x.toFixed(1)} ${punkt.y.toFixed(1)}`
    })

    const ostatni = punkty[punkty.length - 1]
    d += ` L ${szerokosc + KROK} ${ostatni.y + 80} L ${szerokosc + KROK} ${PODSTAWA} Z`
    return d
  }

  return (
    <div className="relative">
      <div
        ref={tor}
        className="-mx-5 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden"
      >
        <div className="relative" style={{ width: `${szerokosc}px` }}>
          <svg
            viewBox={`0 0 ${szerokosc} ${WYSOKOSC}`}
            width={szerokosc}
            height={WYSOKOSC}
            role="img"
            aria-label={`Panorama ${szczyty.length} szczytów, od najwyższego (${najwyzszy} m n.p.m.) do najniższego (${najnizszy} m n.p.m.)`}
            className="block"
          >
            <defs>
              <linearGradient id="pasmo-niebo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#DCEBF5" />
                <stop offset="0.55" stopColor="#EFF3EC" />
                <stop offset="1" stopColor="#F7F4E9" />
              </linearGradient>
              <linearGradient id="pasmo-daleki" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9DBFD4" />
                <stop offset="1" stopColor="#BCD2DE" />
              </linearGradient>
              <linearGradient id="pasmo-sredni" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5E8C7B" />
                <stop offset="1" stopColor="#88AA95" />
              </linearGradient>
              <linearGradient id="pasmo-bliski" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2F5D43" />
                <stop offset="0.6" stopColor="#1F4632" />
                <stop offset="1" stopColor="#143324" />
              </linearGradient>

              {/* Ziarno papieru — mały kafelek szumu powielony po całości.
                  Tanie w rysowaniu, a zbija cyfrową gładkość płaszczyzn. */}
              <filter id="pasmo-ziarno" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <pattern
                id="pasmo-papier"
                width="180"
                height="180"
                patternUnits="userSpaceOnUse"
              >
                <rect width="180" height="180" filter="url(#pasmo-ziarno)" opacity="0.5" />
              </pattern>
            </defs>

            <rect width={szerokosc} height={WYSOKOSC} fill="url(#pasmo-niebo)" />

            {/* Trzy plany. Najdalszy blednie i wpada w błękit — tak działa
                perspektywa powietrzna i to ona daje wrażenie głębi. */}
            <path d={kontur(2, 0.52, 26)} fill="url(#pasmo-daleki)" opacity="0.5" />
            <path d={kontur(1, 0.76, 20)} fill="url(#pasmo-sredni)" opacity="0.75" />
            <path d={kontur(0, 1, 14)} fill="url(#pasmo-bliski)" />

            {/* Czapy śnieżne na najwyższych wierzchołkach. */}
            {wierzcholki
              .filter(({ szczyt }) => szczyt.wysokoscM >= PROG_SNIEGU_M)
              .map(({ szczyt, x, y }) => (
                <path
                  key={`snieg-${szczyt.slug}`}
                  d={`M ${x - 26} ${y + 30} L ${x - 9} ${y + 8} L ${x} ${y} L ${x + 11} ${y + 10} L ${x + 27} ${y + 32} L ${x + 12} ${y + 24} L ${x - 4} ${y + 30} L ${x - 15} ${y + 22} Z`}
                  fill="#F7F4E9"
                  opacity="0.9"
                />
              ))}

            {/* Wierzchołki: znacznik, kreska prowadząca i wysokość. */}
            {wierzcholki.map(({ szczyt, x, y }) => (
              <g key={szczyt.slug}>
                <line
                  x1={x}
                  y1={y - 8}
                  x2={x}
                  y2={y - 30}
                  stroke="#8C9B92"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle cx={x} cy={y} r="4.5" fill="#F7F4E9" stroke="#143324" strokeWidth="2" />
                <text
                  x={x}
                  y={y - 38}
                  textAnchor="middle"
                  className="fill-kamien-700 font-heading text-[15px] font-semibold"
                >
                  {szczyt.wysokoscM} m
                </text>
              </g>
            ))}

            {/* Pas ziemi pod granią, na którym leżą nazwy. */}
            <rect x="0" y={PODSTAWA} width={szerokosc} height={WYSOKOSC - PODSTAWA} fill="#143324" />
            <rect
              width={szerokosc}
              height={WYSOKOSC}
              fill="url(#pasmo-papier)"
              opacity="0.09"
              style={{ mixBlendMode: 'multiply' }}
            />
          </svg>

          {/* Nazwy jako HTML — łamią się na dwie linie, dziedziczą krój
              strony i dają się zaznaczyć, czego `<text>` w SVG nie potrafi. */}
          <ul className="absolute inset-x-0 top-0 flex" style={{ height: `${WYSOKOSC}px` }}>
            {wierzcholki.map(({ szczyt, y }) => (
              <li key={szczyt.slug} className="shrink-0" style={{ width: `${KROK}px` }}>
                <Link
                  href={`/atrakcje/${szczyt.slug}`}
                  className="group flex h-full flex-col px-2 text-center"
                >
                  {/* Przezroczysta strefa sięgająca wierzchołka — kliknięcie
                      w szczyt na rysunku działa tak samo jak w nazwę. */}
                  <span aria-hidden style={{ height: `${y}px` }} />
                  <span
                    aria-hidden
                    className="flex-1 transition-colors duration-300 group-hover:bg-white/5"
                  />
                  <span className="block pb-4 pt-3">
                    <span className="block font-heading text-[0.95rem] font-semibold leading-tight text-kamien-50 transition-colors group-hover:text-las-200 group-focus-visible:text-las-200">
                      {szczyt.nazwa}
                    </span>
                    <span className="mt-0.5 block text-xs text-kamien-50/55">
                      {szczyt.liczbaTras}{' '}
                      {szczyt.liczbaTras === 1 ? 'trasa' : szczyt.liczbaTras < 5 ? 'trasy' : 'tras'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Przycisk kierunek="wstecz" wylaczony={naPoczatku} onClick={() => przesun(-1)} />
        <Przycisk kierunek="dalej" wylaczony={naKoncu} onClick={() => przesun(1)} />
        <p className="ml-2 text-sm text-kamien-500">
          {szczyty.length} szczytów, od Radziejowej ({najwyzszy} m) w dół
        </p>
      </div>
    </div>
  )
}

function Przycisk({
  kierunek,
  wylaczony,
  onClick,
}: {
  kierunek: 'wstecz' | 'dalej'
  wylaczony: boolean
  onClick: () => void
}) {
  const Ikona = kierunek === 'wstecz' ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={wylaczony}
      aria-label={kierunek === 'wstecz' ? 'Poprzednie szczyty' : 'Następne szczyty'}
      className={cn(
        'grid size-11 place-items-center rounded-full border transition-all duration-200',
        wylaczony
          ? 'cursor-default border-kamien-200 text-kamien-300'
          : 'border-kamien-300 text-kamien-800 hover:border-las-600 hover:bg-las-50 hover:text-las-800 active:scale-95',
      )}
    >
      <Ikona className="size-5" aria-hidden />
    </button>
  )
}
