import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'

import type { DefinicjaKategorii } from '@/lib/dane/kategorie'
import { maZdjecie, obrazekKategorii } from '@/lib/dane/zdjecia-kategorii'
import { cn } from '@/lib/utils'

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
        const obrazek = obrazekKategorii(kategoria)
        const zdjecie = maZdjecie(kategoria)

        return (
          <li key={kategoria.slug}>
            <Link
              href={`/szlaki/kategorie/${kategoria.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-kamien-200 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki"
            >
              {obrazek ? (
                <Image
                  src={obrazek}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                  /*
                    Bez `priority`. Kafelki leżą pod pełnoekranowym zdjęciem
                    tytułowym, więc przy wejściu na stronę nikt ich nie widzi —
                    a cztery obrazki wstawione do kolejki priorytetowej
                    konkurowały o pasmo z tym jednym, od którego zależy LCP.
                  */
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="absolute inset-0 bg-las-100" />
              )}

              {/* Nad fotografią przyciemnienie musi być mocniejsze niż nad
                  rysunkiem — zdjęcia bywają jasne przy dolnej krawędzi
                  i biały napis się na nich gubi. */}
              <div
                aria-hidden
                className={cn(
                  'absolute inset-0 bg-gradient-to-t',
                  zdjecie
                    ? 'from-las-950/90 via-las-950/45 to-las-950/10'
                    : 'from-las-950/85 via-las-950/35 to-las-950/5',
                )}
              />

              {/*
                Cień pod tekstem tylko na zdjęciach. Gradient wystarcza nad
                rysunkiem, ale fotografia potrafi mieć u dołu jasną trawę albo
                białe owce — wtedy sam gradient nie ratuje białego napisu,
                a delikatny cień tak, nie brudząc przy tym ciemnych kadrów.
              */}
              <div
                className={cn(
                  'relative z-10 p-6',
                  zdjecie && '[text-shadow:0_1px_10px_rgb(11_58_38_/_0.55)]',
                )}
              >
                <h3 className="font-heading text-2xl font-semibold leading-tight text-white sm:text-[1.6rem]">
                  {kategoria.nazwa}
                </h3>
                {/*
                  Liczbę tras pokazujemy tylko wtedy, gdy jakieś są. Kategorie
                  „Szlaki niecodzienne" i „Trasy z psem" czekają na dobór tras
                  w aplikacji — napis „0 tras" wyglądałby jak usterka, a sam
                  podtytuł mówi, czego się spodziewać.
                */}
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-base text-white/85">
                  {kategoria.podtytul && <span>{kategoria.podtytul}</span>}
                  {kategoria.podtytul && ile > 0 && <span aria-hidden>·</span>}
                  {ile > 0 && (
                    <span>
                      {ile} {ile === 1 ? 'trasa' : ile < 5 ? 'trasy' : 'tras'}
                    </span>
                  )}
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
              <h3 className="font-heading text-2xl font-semibold text-white sm:text-[1.6rem]">Atrakcje Pienin</h3>
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
