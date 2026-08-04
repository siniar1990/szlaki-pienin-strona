import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowUpRight,
  Bike,
  Clock,
  Footprints,
  MapPin,
  MoveUpRight,
  RefreshCw,
  Route,
} from 'lucide-react'

import type { TrasaNaLiscie } from '@/lib/dane/typy'
import { TRUDNOSC_ETYKIETY, TRUDNOSC_STYLE, czas, kilometry, metry } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Karta trasy — podstawowa cegiełka wszystkich list w portalu.
 *
 * Zawiera to, na podstawie czego człowiek naprawdę wybiera trasę: obrazek,
 * skąd się zaczyna, nazwę, jedno zdanie o czym to jest, ile trwa i jak bardzo
 * zmęczy. Kolory szlaków zeszły z karty na stronę trasy — na liście
 * pięćdziesięciu pozycji pięć kolorowych kropek przy każdej robiło szum,
 * a nikt nie wybiera trasy dlatego, że jest znakowana na żółto.
 *
 * Cały kafelek jest klikalny, ale odnośnik obejmuje wyłącznie tytuł, a resztę
 * przykrywa rozciągnięta warstwa (`after:absolute inset-0`). Dzięki temu
 * czytnik ekranu ogłasza jeden sensowny odnośnik, a nie całą treść kafelka
 * jako jego nazwę — i nadal da się zaznaczyć tekst myszą.
 */
export function KafelekTrasy({
  trasa,
  priorytet = false,
  className,
}: {
  trasa: TrasaNaLiscie
  /** Ustaw dla kafelków widocznych od razu — poprawia LCP. */
  priorytet?: boolean
  className?: string
}) {
  const rowerowa = trasa.kategoria === 'rowerowa'
  const Ikona = rowerowa ? Bike : Footprints

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white',
        'shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki',
        'focus-within:-translate-y-1 focus-within:shadow-wysoki',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-kamien-100">
        {trasa.ilustracja ? (
          <Image
            src={trasa.ilustracja}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            priority={priorytet}
            loading={priorytet ? undefined : 'lazy'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-las-700 to-las-900 text-white/30">
            <Route className="size-10" aria-hidden />
          </div>
        )}

        <span
          className={cn(
            'absolute left-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm',
            TRUDNOSC_STYLE[trasa.trudnosc],
          )}
        >
          {TRUDNOSC_ETYKIETY[trasa.trudnosc]}
        </span>

        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-kamien-700 backdrop-blur-sm">
          <Ikona className="size-3" aria-hidden />
          {rowerowa ? 'Rowerowa' : 'Piesza'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium uppercase tracking-wider text-kamien-500">
          <MapPin className="size-3.5" aria-hidden />
          {trasa.miejscowoscStartu}
          {trasa.petla && (
            <>
              <span aria-hidden>·</span>
              <RefreshCw className="size-3" aria-hidden />
              Pętla
            </>
          )}
        </p>

        <h3 className="mt-2 font-heading text-xl font-semibold leading-snug text-kamien-900">
          <Link
            href={`/szlaki/${trasa.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-las-700"
          >
            {trasa.nazwa}
          </Link>
        </h3>

        {trasa.podsumowanie && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-kamien-600">
            {trasa.podsumowanie}
          </p>
        )}

        <dl className="mt-auto grid grid-cols-3 gap-3 pt-5 text-sm">
          <div>
            <dt className="sr-only">Długość</dt>
            <dd className="flex items-center gap-1.5 font-medium text-kamien-800">
              <Route className="size-4 text-kamien-400" aria-hidden />
              {kilometry(trasa.dlugoscKm)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Czas przejścia</dt>
            <dd className="flex items-center gap-1.5 font-medium text-kamien-800">
              <Clock className="size-4 text-kamien-400" aria-hidden />
              {czas(trasa.czasMin.tam)}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Suma podejść</dt>
            <dd className="flex items-center gap-1.5 font-medium text-kamien-800">
              <MoveUpRight className="size-4 text-kamien-400" aria-hidden />
              {metry(trasa.sumaPodejscM.tam)}
            </dd>
          </div>
        </dl>
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
