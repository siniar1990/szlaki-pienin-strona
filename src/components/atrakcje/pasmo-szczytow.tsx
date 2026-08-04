import Link from 'next/link'

import type { Atrakcja } from '@/lib/dane/typy'
import { metry } from '@/lib/format'

/**
 * Pasmo szczytów — przewijana w prawo grań.
 *
 * Szczyty ustawione od najwyższego do najniższego rysują jedną, opadającą
 * ku prawej grań. To nie jest wykres z osią i podziałką, tylko obraz: wysokość
 * wierzchołka na rysunku odpowiada wysokości w terenie, więc różnica między
 * Radziejową a Gabańką widać, zanim ktokolwiek przeczyta liczby.
 *
 * Przewijanie w poziomie zamiast siatki kafelków, bo grań ma kierunek —
 * w siatce po czterech pozycjach w rzędzie łamałaby się i traciła sens.
 *
 * Całość to statyczny SVG plus natywne przewijanie. Zero JavaScriptu:
 * odnośniki są zwykłymi `<a>`, a przeglądarka sama dowija je do widoku,
 * gdy ktoś idzie po nich tabulatorem.
 */

/** Szerokość kolumny jednego szczytu. */
const KROK = 132
/** Wysokość rysunku i położenie linii podstawy. */
const WYSOKOSC = 360
const PODSTAWA = 300
/** Najwyższy szczyt sięga tej wysokości, najniższy zatrzymuje się niżej. */
const APEKS_MIN_Y = 46
const APEKS_MAX_Y = 210

export function PasmoSzczytow({ szczyty }: { szczyty: Atrakcja[] }) {
  const zWysokoscia = szczyty
    .filter((szczyt) => szczyt.wysokoscM !== null)
    .sort((a, b) => (b.wysokoscM ?? 0) - (a.wysokoscM ?? 0))

  if (zWysokoscia.length === 0) return null

  const najwyzszy = zWysokoscia[0].wysokoscM!
  const najnizszy = zWysokoscia[zWysokoscia.length - 1].wysokoscM!
  const zakres = Math.max(1, najwyzszy - najnizszy)

  const szerokosc = zWysokoscia.length * KROK + KROK
  const naY = (m: number) =>
    APEKS_MAX_Y - ((m - najnizszy) / zakres) * (APEKS_MAX_Y - APEKS_MIN_Y)
  const naX = (i: number) => KROK / 2 + i * KROK

  const wierzcholki = zWysokoscia.map((szczyt, i) => ({
    szczyt,
    x: naX(i),
    y: naY(szczyt.wysokoscM!),
  }))

  /**
   * Buduje kształt grani przechodzącej przez wszystkie wierzchołki.
   *
   * Między sąsiednimi szczytami wstawiamy siodło — inaczej powstałaby jedna
   * pochyła prosta, a nie pasmo. Siodło leży niżej od płytszego z sąsiadów
   * o wartość zależną od różnicy ich wysokości: równe szczyty rozdziela
   * płytka przełęcz, bardzo różne — głęboka dolina. Dokładnie tak, jak
   * wygląda to w terenie.
   */
  function grzbiet(przesuniecie: number, splaszczenie: number): string {
    const punkty = wierzcholki.map(({ x, y }) => ({
      x,
      y: PODSTAWA - (PODSTAWA - y) * splaszczenie + przesuniecie,
    }))

    let d = `M 0 ${PODSTAWA} L 0 ${punkty[0].y + 40}`
    punkty.forEach((punkt, i) => {
      if (i > 0) {
        const poprzedni = punkty[i - 1]
        const roznica = Math.abs(punkt.y - poprzedni.y)
        const siodlo = Math.min(PODSTAWA - 6, Math.max(punkt.y, poprzedni.y) + 26 + roznica * 0.35)
        d += ` L ${(poprzedni.x + punkt.x) / 2} ${siodlo}`
      }
      d += ` L ${punkt.x} ${punkt.y}`
    })
    d += ` L ${szerokosc} ${punkty[punkty.length - 1].y + 46} L ${szerokosc} ${PODSTAWA} Z`
    return d
  }

  return (
    <div className="relative">
      {/*
        `scroll-px` trzyma odstęp przy dowijaniu klawiaturą, a `snap-x`
        zatrzymuje przewijanie na pełnych kolumnach, żeby nazwa szczytu
        nie kończyła się w połowie przy krawędzi.
      */}
      <div className="-mx-5 overflow-x-auto scroll-px-5 pb-4 sm:-mx-8 lg:-mx-12">
        <div
          className="relative snap-x snap-mandatory px-5 sm:px-8 lg:px-12"
          style={{ width: `${szerokosc + 96}px` }}
        >
          <svg
            viewBox={`0 0 ${szerokosc} ${WYSOKOSC}`}
            width={szerokosc}
            height={WYSOKOSC}
            role="img"
            aria-label={`Pasmo ${zWysokoscia.length} szczytów od Radziejowej (${najwyzszy} m) po najniższy (${najnizszy} m)`}
            className="block"
          >
            <defs>
              <linearGradient id="niebo-pasma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-dunajec-50)" />
                <stop offset="1" stopColor="var(--color-kamien-50)" />
              </linearGradient>
              <linearGradient id="gran-daleka" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-las-300)" />
                <stop offset="1" stopColor="var(--color-las-200)" />
              </linearGradient>
              <linearGradient id="gran-bliska" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-las-700)" />
                <stop offset="1" stopColor="var(--color-las-900)" />
              </linearGradient>
            </defs>

            <rect width={szerokosc} height={WYSOKOSC} fill="url(#niebo-pasma)" />

            {/* Drugie pasmo z tyłu — spłaszczone i przesunięte w dół, daje
                głębię i sprawia, że grań nie wisi w pustce. */}
            <path d={grzbiet(58, 0.72)} fill="url(#gran-daleka)" opacity="0.55" />
            <path d={grzbiet(0, 1)} fill="url(#gran-bliska)" />

            {wierzcholki.map(({ szczyt, x, y }, indeks) => (
              <g key={szczyt.slug}>
                {/* Kreska od wierzchołka do liczby — bez niej przy gęstych
                    szczytach nie wiadomo, która wysokość do którego należy. */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={y - 22}
                  stroke="var(--color-kamien-400)"
                  strokeWidth="1"
                />
                <circle cx={x} cy={y} r="4" fill="var(--color-kamien-50)" />
                <circle cx={x} cy={y} r="4" fill="none" stroke="var(--color-las-800)" strokeWidth="2" />
                <text
                  x={x}
                  y={y - 30}
                  textAnchor="middle"
                  className="fill-kamien-700 text-[13px] font-semibold"
                >
                  {szczyt.wysokoscM} m
                </text>
                <text
                  x={x}
                  y={PODSTAWA + 26}
                  textAnchor="middle"
                  className="fill-kamien-400 text-[11px] font-semibold"
                >
                  {String(indeks + 1).padStart(2, '0')}
                </text>
              </g>
            ))}
          </svg>

          {/*
            Odnośniki jako warstwa nad rysunkiem. Tekst nazw jest zwykłym
            HTML-em, a nie `<text>` w SVG — dzięki temu łamie się na dwie
            linie, dziedziczy krój strony i daje się zaznaczyć.
          */}
          <ul className="absolute inset-x-0 bottom-0 flex px-5 sm:px-8 lg:px-12">
            {wierzcholki.map(({ szczyt, y }) => (
              <li
                key={szczyt.slug}
                className="shrink-0 snap-start"
                style={{ width: `${KROK}px` }}
              >
                <Link
                  href={`/atrakcje/${szczyt.slug}`}
                  className="group flex flex-col justify-end px-1.5 text-center"
                  style={{ height: `${WYSOKOSC}px` }}
                >
                  {/* Przezroczysty obszar sięgający wierzchołka — kliknięcie
                      w szczyt na rysunku ma działać tak samo jak w nazwę. */}
                  <span className="flex-1" style={{ minHeight: `${y}px` }} aria-hidden />
                  <span className="mt-auto block pb-1 text-sm font-medium leading-tight text-kamien-800 transition-colors group-hover:text-las-700 group-focus-visible:text-las-700">
                    {szczyt.nazwa}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zanik przy prawej krawędzi mówi, że lista się nie kończy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"
      />
    </div>
  )
}
