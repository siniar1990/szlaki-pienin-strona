import Link from 'next/link'

import { godzina } from '@/lib/dzis/kafelki'
import type { DaneDnia } from '@/lib/dzis'

import { SiatkaDzis } from './siatka-dzis'

import './kafelki.css'

/**
 * Warunki w Pieninach na stronie głównej.
 *
 * **Ta sama siatka, co na `/dzis` — trzy na dwa, bez przewijania.** Wcześniej
 * stał tu pasek przewijany w poziomie: sześć wąskich kafelków, z których na
 * ekranie mieściło się pięć, a szósty wystawał zza krawędzi i czekał, aż ktoś
 * go znajdzie. Przewijanie w poziomie na stronie, która przewija się w pionie,
 * jest ruchem, o którym trzeba się domyślić — i połowa ludzi się nie domyśla.
 * Siatka pokazuje wszystkie sześć odczytów naraz, więc nie ma czego szukać.
 *
 * **Dlaczego wprost `SiatkaDzis`, a nie jej mniejszy wariant.** Bo to dokładnie
 * te same dane i ten sam zestaw sześciu kafelków. Osobny wariant znaczyłby dwa
 * miejsca do poprawiania przy każdej zmianie odczytu, a różnica sprowadzałaby
 * się do wielkości pisma. Siatka sama zwija się do dwóch kolumn poniżej 980 px
 * i do jednej poniżej 640 px — patrz `kafelki.css`.
 *
 * Nagłówek zostaje: mówi, że dane są z dzisiaj, i wpuszcza na `/dzis` po
 * resztę — godziny otwarcia obiektów, propozycje tras, ostrzeżenia.
 */
export function SkrotDzis({ dane }: { dane: DaneDnia }) {
  return (
    <section aria-labelledby="skrot-dzis-naglowek" className="border-y border-las-100 bg-las-50">
      <div className="obszar py-10 lg:py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="skrot-dzis-naglowek"
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-las-800"
          >
            <span className="zywa-kropka" aria-hidden />
            Dziś w Pieninach
          </h2>
          <p className="text-xs text-kamien-500">
            ostatni odczyt {godzina(dane.odczyt)}
            <span className="mx-2" aria-hidden>
              ·
            </span>
            <Link href="/dzis" className="font-medium text-las-700 hover:underline">
              pełne warunki
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <SiatkaDzis dane={dane} />
        </div>
      </div>
    </section>
  )
}
