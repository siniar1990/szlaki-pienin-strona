import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { kilometry } from '@/lib/format'
import type { Wyzwanie } from '@/lib/dane/typy'

/**
 * Kafelki pienińskich wyzwań.
 *
 * Kształt, proporcje i zachowanie po najechaniu są takie same jak przy
 * kategoriach tras — stoją w tej samej sekcji, więc rozjechanie ich byłoby
 * widoczne od razu. Różnią się trzema rzeczami i każda z nich mówi to samo:
 * „to nie jest kolejna kategoria".
 *
 *  1. **Nadtytuł „Pienińskie wyzwanie"** — informacja podana wprost, dla
 *     każdego i dla czytnika ekranu.
 *  2. **Odznaka w kadrze.** Ta sama grafika, którą aplikacja przyznaje za
 *     przejście. Odznaka jest tu jedynym elementem, którego kategorie nie mają
 *     w ogóle, więc rozpoznaje się ją bez czytania.
 *  3. **Barwa przyciemnienia od kamienia wyzwania** — diament chłodny, rubin
 *     czerwony, szmaragd zielony. Sama barwa niczego nie przesądza, bo nie
 *     każdy ją odczyta; niesie ją nadtytuł i odznaka.
 *
 * Odnośnik prowadzi na stronę wyzwania, a nie do listy kategorii: wyzwanie to
 * jedna konkretna trasa z regulaminem, nie zbiór tras do przeglądania.
 */

/** Przyciemnienie w barwie kamienia. Klasy wypisane wprost, bo Tailwind
 *  skanuje źródła i nie zobaczyłby nazwy sklejanej w czasie działania. */
const PRZYCIEMNIENIE: Record<string, string> = {
  diament: 'from-dunajec-950/90 via-dunajec-900/45 to-dunajec-900/10',
  rubin: 'from-[#4a1116]/92 via-[#4a1116]/45 to-[#4a1116]/10',
  szmaragd: 'from-las-950/90 via-las-950/45 to-las-950/10',
}

const PRZYCIEMNIENIE_ZAPAS = 'from-kamien-950/90 via-kamien-900/45 to-kamien-900/10'

export function KafelkiWyzwan({
  wyzwania,
}: {
  wyzwania: {
    wyzwanie: Wyzwanie
    ilustracja: string | null
    dlugoscKm: number | null
  }[]
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {wyzwania.map(({ wyzwanie, ilustracja, dlugoscKm }) => (
        <li key={wyzwanie.slug}>
          <Link
            href={`/wyzwania/${wyzwanie.slug}`}
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-kamien-200 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki"
          >
            {ilustracja ? (
              <Image
                src={ilustracja}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div className="absolute inset-0 bg-las-100" />
            )}

            <div
              aria-hidden
              className={`absolute inset-0 bg-gradient-to-t ${
                PRZYCIEMNIENIE[wyzwanie.id] ?? PRZYCIEMNIENIE_ZAPAS
              }`}
            />

            {wyzwanie.odznaka && (
              <Image
                src={wyzwanie.odznaka}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                className="absolute left-5 top-5 z-10 size-16 object-contain drop-shadow-[0_2px_8px_rgb(0_0_0_/_0.45)] transition-transform duration-500 group-hover:scale-110 sm:size-[4.5rem]"
              />
            )}

            <div className="relative z-10 p-6 [text-shadow:0_1px_10px_rgb(11_58_38_/_0.55)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/75">
                Pienińskie wyzwanie
              </p>
              <h3 className="mt-1.5 font-heading text-2xl font-semibold leading-tight text-white sm:text-[1.6rem]">
                {wyzwanie.nazwa}
              </h3>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-base text-white/85">
                {wyzwanie.podtytul && <span>{wyzwanie.podtytul}</span>}
                {wyzwanie.podtytul && dlugoscKm !== null && <span aria-hidden>·</span>}
                {dlugoscKm !== null && <span>{kilometry(dlugoscKm)}</span>}
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
      ))}
    </ul>
  )
}
