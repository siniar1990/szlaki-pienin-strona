import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import type { AtrakcjaTurystyczna, GrupaAtrakcji } from '@/lib/tresc/atrakcje-turystyczne'
import { cn } from '@/lib/utils'

/**
 * Sekcja atrakcji w duchu folderu gminy.
 *
 * Trzy rzeczy stamtąd: wielkie wąskie wersaliki, pełnoformatowe barwne
 * płaszczyzny zamiast białych prostokątów i okrągła wstawka wychodząca poza
 * krawędź panelu. Czwarta — góralski haft — wraca jako subtelna tekstura
 * w tle każdej płaszczyzny.
 *
 * Fotografii tych atrakcji nie mamy, a zdjęcia z folderu są cudze. Zamiast
 * udawać zdjęcia szarym prostokątem, każda grupa dostaje własną barwę
 * i wielką inicjał-cyfrę — to czytelny, celowy język graficzny, a nie
 * dziura po obrazku.
 */

/** Barwy grup. Każda ciemna na tyle, by biały tekst trzymał kontrast AA. */
const BARWY: Record<GrupaAtrakcji, { od: string; do: string; jasny: string }> = {
  rzeka: { od: '#1F6DAD', do: '#12314A', jasny: '#7CC0EA' },
  wody: { od: '#0F8B8D', do: '#0B3A3B', jasny: '#8FD6D7' },
  rozrywka: { od: '#B5651D', do: '#5C3210', jasny: '#F0B87A' },
  konie: { od: '#7A5230', do: '#3B2617', jasny: '#D8B08C' },
  zabytki: { od: '#6B4C9A', do: '#2E1F47', jasny: '#C4AEE6' },
  przyroda: { od: '#1F8060', do: '#0B3A26', jasny: '#8FD8BC' },
  rower: { od: '#2F7DBB', do: '#14532D', jasny: '#A9D8F0' },
}

/**
 * Haft góralski jako tekstura tła.
 *
 * Ten sam ząbek z listkiem, co na ilustracjach kategorii, powielony wzorem
 * SVG. Przy 8% krycia nie czyta się jako ornament, tylko jako faktura —
 * i o to chodzi: ma podnosić płaszczyznę, a nie odciągać wzrok od napisu.
 */
function Haft({ kolor, id }: { kolor: string; id: string }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-[0.14]">
      <defs>
        <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M 0 34 l 24 -16 l 24 16 M 24 18 l 0 -9 M 16 13 l 8 -6 l 8 6"
            stroke={kolor}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export function SekcjaGrupy({
  grupa,
  nazwa,
  opis,
  atrakcje,
  numer,
}: {
  grupa: GrupaAtrakcji
  nazwa: string
  opis: string
  atrakcje: AtrakcjaTurystyczna[]
  /** Numer grupy — sekcje idą w ustalonej kolejności, więc numer coś znaczy. */
  numer: number
}) {
  const barwa = BARWY[grupa]
  const [pierwsza, ...reszta] = atrakcje

  return (
    <section aria-labelledby={`grupa-${grupa}`} className="scroll-mt-28" id={grupa}>
      {/* ── Pas tytułowy ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-14 sm:px-12 sm:py-16"
        style={{ background: `linear-gradient(135deg, ${barwa.od}, ${barwa.do})` }}
      >
        <Haft kolor="#FFFFFF" id={`haft-${grupa}`} />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p
              className="text-sm font-semibold uppercase tracking-[0.24em]"
              style={{ color: barwa.jasny }}
            >
              {String(numer).padStart(2, '0')} · {atrakcje.length}{' '}
              {atrakcje.length === 1 ? 'miejsce' : atrakcje.length < 5 ? 'miejsca' : 'miejsc'}
            </p>
            <h2
              id={`grupa-${grupa}`}
              className="mt-4 font-plakat text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.92] tracking-[0.01em] text-white"
            >
              {nazwa}
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/85">{opis}</p>
          </div>
        </div>
      </div>

      {/* ── Wyróżniona atrakcja ──────────────────────────────────────── */}
      {pierwsza && (
        <Link
          href={`/atrakcje/${pierwsza.slug}`}
          className="group relative -mt-10 ml-4 mr-4 flex flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white shadow-uniesiony transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki sm:ml-12 sm:mr-12 lg:flex-row"
        >
          {/* Okrągła wstawka wychodząca poza krawędź — cytat z folderu. */}
          <div
            className="relative grid shrink-0 place-items-center px-10 py-10 lg:w-64"
            style={{ background: `linear-gradient(160deg, ${barwa.od}, ${barwa.do})` }}
          >
            <Haft kolor="#FFFFFF" id={`haft-w-${grupa}`} />
            <span
              className="relative grid size-28 place-items-center rounded-full border-4 border-white/25 font-plakat text-4xl text-white"
              aria-hidden
            >
              {pierwsza.nazwa.charAt(0)}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center p-8 sm:p-10">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-kamien-500">
              <MapPin className="size-3.5" aria-hidden />
              {pierwsza.miejscowosc}
            </p>
            <h3 className="mt-3 font-plakat text-[clamp(1.6rem,3vw,2.4rem)] uppercase leading-[1.02] text-kamien-900 transition-colors group-hover:text-las-700">
              {pierwsza.nazwa}
            </h3>
            <p className="mt-4 max-w-[58ch] leading-relaxed text-kamien-600">{pierwsza.skrot}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-las-700">
              Czytaj dalej
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </span>
          </div>
        </Link>
      )}

      {/* ── Pozostałe ────────────────────────────────────────────────── */}
      {reszta.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reszta.map((atrakcja) => (
            <li key={atrakcja.slug}>
              <Link
                href={`/atrakcje/${atrakcja.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-uniesiony"
              >
                {/* Wąski pasek barwy grupy rozlewa się przy najechaniu —
                    drobny ruch, który pokazuje, że kafelek jest klikalny. */}
                <span
                  aria-hidden
                  className="h-1.5 w-full transition-all duration-300 group-hover:h-2.5"
                  style={{ background: `linear-gradient(90deg, ${barwa.od}, ${barwa.do})` }}
                />
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-kamien-500">
                    <MapPin className="size-3.5" aria-hidden />
                    {atrakcja.miejscowosc}
                  </p>
                  <h3 className="mt-3 font-plakat text-xl uppercase leading-tight text-kamien-900 transition-colors group-hover:text-las-700">
                    {atrakcja.nazwa}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-kamien-600">
                    {atrakcja.skrot}
                  </p>
                  {atrakcja.sezon && (
                    <p className="mt-5 text-xs uppercase tracking-wider text-kamien-400">
                      {atrakcja.sezon}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Pasek skrótów do grup — kotwice na górze strony atrakcji. */
export function SkrotyDoGrup({
  grupy,
}: {
  grupy: { klucz: GrupaAtrakcji; nazwa: string }[]
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {grupy.map((grupa) => (
        <li key={grupa.klucz}>
          <a
            href={`#${grupa.klucz}`}
            className={cn(
              'inline-block rounded-full border border-kamien-300 bg-white px-4 py-2',
              'text-sm font-medium text-kamien-700 transition-colors',
              'hover:border-las-500 hover:bg-las-50 hover:text-las-800',
            )}
          >
            {grupa.nazwa}
          </a>
        </li>
      ))}
    </ul>
  )
}
