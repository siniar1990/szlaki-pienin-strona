import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import type { AtrakcjaTurystyczna, GrupaAtrakcji } from '@/lib/tresc/atrakcje-turystyczne'
import { cn } from '@/lib/utils'

/**
 * Lista atrakcji w jednej grupie.
 *
 * Poprzednia wersja dawała każdej z siedmiu grup własny barwny pas i własny
 * kolor przewodni. Siedem kolorów na jednej stronie to nie system, tylko
 * bałagan — strona wyglądała jak siedem różnych stron sklejonych razem.
 * Teraz obowiązuje jedna barwa i jeden kształt kafelka; grupy rozróżnia
 * numer i tytuł, a nie kolor.
 *
 * Kafelek jest przygotowany na zdjęcie. Dopóki go nie ma, pole obrazka
 * wypełnia spokojna zielona płaszczyzna z góralskim haftem i inicjałem —
 * czytelny znak zastępczy, a nie dziura.
 */

/**
 * Haft góralski jako faktura pola bez zdjęcia. Ten sam motyw, co na
 * ilustracjach — przy niskim kryciu czyta się jako tło, nie jako ornament.
 */
function Haft({ id }: { id: string }) {
  return (
    <svg aria-hidden className="absolute inset-0 size-full opacity-[0.18]">
      <defs>
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <path
            d="M 0 32 l 22 -15 l 22 15 M 22 17 l 0 -8 M 15 12 l 7 -5 l 7 5"
            stroke="#F5F0E3"
            strokeWidth="1.8"
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

function KafelekAtrakcji({ atrakcja }: { atrakcja: AtrakcjaTurystyczna }) {
  const zdjecie = zdjecieAtrakcji(atrakcja.slug)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-uniesiony focus-within:-translate-y-1 focus-within:shadow-uniesiony">
      <div className="relative aspect-[16/10] overflow-hidden bg-las-800">
        {zdjecie ? (
          <Image
            src={zdjecie}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-las-700 to-las-900" />
            <Haft id={`haft-${atrakcja.slug}`} />
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center font-plakat text-6xl text-white/25"
            >
              {atrakcja.nazwa.charAt(0)}
            </span>
          </>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold text-kamien-700 backdrop-blur-sm">
          <MapPin className="size-3" aria-hidden />
          {atrakcja.miejscowosc}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-plakat text-xl uppercase leading-tight text-kamien-900">
          <Link
            href={`/atrakcje/${atrakcja.slug}`}
            className="after:absolute after:inset-0 after:content-[''] group-hover:text-las-700"
          >
            {atrakcja.nazwa}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-kamien-600">{atrakcja.skrot}</p>
        {atrakcja.sezon && (
          <p className="mt-5 text-xs uppercase tracking-wider text-kamien-400">{atrakcja.sezon}</p>
        )}
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute bottom-5 right-5 grid size-9 place-items-center rounded-full bg-las-700 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <ArrowUpRight className="size-4" />
      </span>
    </article>
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
  numer: number
}) {
  return (
    <section aria-labelledby={`grupa-${grupa}`} className="scroll-mt-28" id={grupa}>
      <div className="flex items-end justify-between gap-8 border-b border-kamien-200 pb-6">
        <div className="max-w-2xl">
          <p className="font-plakat text-sm uppercase tracking-[0.22em] text-las-600">
            {String(numer).padStart(2, '0')}
          </p>
          <h2
            id={`grupa-${grupa}`}
            className="mt-2 font-plakat text-[clamp(1.9rem,4vw,3rem)] uppercase leading-[0.98] text-kamien-900"
          >
            {nazwa}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-kamien-600">{opis}</p>
        </div>
        <p className="hidden shrink-0 text-sm text-kamien-500 sm:block">
          {atrakcje.length}{' '}
          {atrakcje.length === 1 ? 'miejsce' : atrakcje.length < 5 ? 'miejsca' : 'miejsc'}
        </p>
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {atrakcje.map((atrakcja) => (
          <li key={atrakcja.slug}>
            <KafelekAtrakcji atrakcja={atrakcja} />
          </li>
        ))}
      </ul>
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
