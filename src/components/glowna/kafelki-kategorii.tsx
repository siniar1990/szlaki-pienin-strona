import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import type { DefinicjaKategorii } from '@/lib/dane/kategorie'

/**
 * Kafelki kategorii tras — w tej samej kolejności co na ekranie startowym
 * aplikacji.
 *
 * Każdy ma ilustrację, bo kategoria rozpoznawana obrazkiem wygrywa z listą
 * napisów: oko trafia w „Trzy Korony" po rysunku szczytu, zanim zdąży
 * przeczytać podpis. Ilustracje pochodzą z aplikacji — to malowane rysunki
 * tras, więc kafelki są nasze i trzymają jeden charakter.
 *
 * Gradient na dole nie jest ozdobą: bez niego biały napis wpadałby w jasne
 * partie rysunku i przy części kafelków znikał.
 */
export function KafelkiKategorii({
  kategorie,
  liczba,
  atrakcje,
}: {
  kategorie: DefinicjaKategorii[]
  /** Ile tras jest w danej kategorii — liczone przy budowaniu. */
  liczba: (kategoria: DefinicjaKategorii) => number
  /** Dziewiąty kafelek: atrakcje. Domyka siatkę do pełnych trzech rzędów. */
  atrakcje?: { ilustracja: string; ile: number }
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {kategorie.map((kategoria, indeks) => {
        const ile = liczba(kategoria)

        return (
          <li key={kategoria.slug}>
            <Link
              href={`/szlaki/kategorie/${kategoria.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-kamien-200 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki"
            >
              {kategoria.ilustracja ? (
                <Image
                  src={kategoria.ilustracja}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  // Pierwsze trzy kafelki bywają widoczne od razu po zjechaniu
                  // z sekcji powitalnej — ładujemy je bez zwłoki.
                  priority={indeks < 3}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="absolute inset-0 bg-las-100" />
              )}

              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-las-950/85 via-las-950/35 to-las-950/5"
              />

              <div className="relative z-10 p-6">
                <h3 className="font-heading text-xl font-semibold text-white">
                  {kategoria.nazwa}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-white/80">
                  {kategoria.podtytul && <span>{kategoria.podtytul}</span>}
                  {kategoria.podtytul && <span aria-hidden>·</span>}
                  <span>
                    {ile} {ile === 1 ? 'trasa' : ile < 5 ? 'trasy' : 'tras'}
                  </span>
                </p>
              </div>

              <span
                aria-hidden
                className="absolute right-5 top-5 z-10 grid size-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </li>
        )
      })}

      {atrakcje && (
        <li>
          <Link
            href="/atrakcje"
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-kamien-200 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki"
          >
            <Image
              src={atrakcje.ilustracja}
              alt=""
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            {/* Błękit Dunajca zamiast zieleni — kafelek atrakcji ma się
                odróżniać od ośmiu kategorii tras, przy których stoi. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-dunajec-900/90 via-dunajec-900/40 to-dunajec-900/5"
            />
            <div className="relative z-10 p-6">
              <h3 className="font-heading text-xl font-semibold text-white">Atrakcje Pienin</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-white/85">
                <MapPin className="size-3.5" aria-hidden />
                Spływ, wody mineralne, zamki · {atrakcje.ile} miejsc
              </p>
            </div>
            <span
              aria-hidden
              className="absolute right-5 top-5 z-10 grid size-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
            >
              <ArrowUpRight className="size-4" />
            </span>
          </Link>
        </li>
      )}
    </ul>
  )
}
