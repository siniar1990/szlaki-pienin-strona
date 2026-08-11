import Link from 'next/link'

import type { DaneDnia, StanObiektu } from '@/lib/dzis'
import { godzina, podpisZrodel } from '@/lib/dzis/kafelki'

/**
 * Co jest dziś czynne — pełna lista pod siatką kafelków.
 *
 * Kafelek odpowiada „ile", ta lista „które i do której". To jest pytanie,
 * które pada zaraz po tamtym, więc odpowiedź stoi bezpośrednio pod nim,
 * a nie na osobnej stronie.
 *
 * Tu również mieszka podpis źródeł całej sekcji: skąd pochodzą liczby i o której
 * je odczytano. Ta sama zasada, którą portal trzyma przy trasach i notkach —
 * gdy prognoza się nie sprawdzi, czytelnik ma wiedzieć, czyja to była.
 */

/**
 * Wygląd stanu.
 *
 * `przed-otwarciem` dostaje bursztyn, a nie szarość: obiekt, który za godzinę
 * się otworzy, to inna wiadomość niż taki, który dziś nie pracuje — a szara
 * kropka przy obu kazałaby czytać drobny druk, żeby je odróżnić.
 */
const STANY: Record<StanObiektu['stan'], { kropka: string; napis: string }> = {
  otwarte: { kropka: 'bg-las-600', napis: 'text-las-800' },
  'przed-otwarciem': { kropka: 'bg-amber-500', napis: 'text-amber-800' },
  'po-zamknieciu': { kropka: 'bg-kamien-400', napis: 'text-kamien-600' },
  nieczynne: { kropka: 'bg-kamien-400', napis: 'text-kamien-600' },
  'poza-sezonem': { kropka: 'border border-kamien-400', napis: 'text-kamien-500' },
}

/**
 * Stan w jednym zdaniu.
 *
 * Mówimy, co z tym zrobić, a nie w jakim stanie jest obiekt: „otwarte do
 * 19:00" i „otwiera się o 9:00" prowadzą do decyzji, a samo „zamknięte"
 * zostawia czytelnika z pytaniem, po które tu przyszedł.
 */
function opisStanu(stan: StanObiektu): string {
  const godziny = stan.dzisiaj

  switch (stan.stan) {
    case 'otwarte':
      return `otwarte do ${godziny!.zamkniecie}:00`
    case 'przed-otwarciem':
      return `otwiera się o ${godziny!.otwarcie}:00`
    case 'po-zamknieciu':
      return `zamknięte, dziś było do ${godziny!.zamkniecie}:00`
    case 'nieczynne':
      return 'dziś nieczynne'
    case 'poza-sezonem':
      return 'poza sezonem'
  }
}

export function ListaObiektow({ dane }: { dane: DaneDnia }) {
  if (dane.obiekty.length === 0) return null

  return (
    <section className="mt-14">
      <h2 className="font-heading text-xl font-semibold text-kamien-900">Co jest dziś czynne</h2>
      <p className="mt-2 max-w-[65ch] text-kamien-600">
        Godziny pochodzą ze stron operatorów. Przed dalszą drogą warto je potwierdzić —
        zwłaszcza poza sezonem, gdy bywają skracane z dnia na dzień.
      </p>

      <ul className="mt-6 divide-y divide-kamien-200 overflow-hidden rounded-2xl border border-kamien-200 bg-white">
        {dane.obiekty.map((stan) => {
          const wyglad = STANY[stan.stan]

          return (
            <li
              key={stan.obiekt.slug}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5"
            >
              <div className="min-w-0">
                <Link
                  href={`/atrakcje/${stan.obiekt.slug}`}
                  className="font-medium text-kamien-900 hover:text-las-700"
                >
                  {stan.obiekt.nazwa}
                </Link>
                <span className="ml-2 text-sm text-kamien-500">{stan.obiekt.miejscowosc}</span>
                {stan.obiekt.uwaga && (
                  <p className="mt-0.5 text-sm leading-snug text-kamien-500">{stan.obiekt.uwaga}</p>
                )}
              </div>

              <p className={`flex shrink-0 items-center gap-2 text-sm ${wyglad.napis}`}>
                {/* Kropka jest ozdobą — stan mówi napis obok, więc czytnik
                    ekranu nie ma czego z niej odczytać. */}
                <span className={`size-2 rounded-full ${wyglad.kropka}`} aria-hidden />
                {opisStanu(stan)}
              </p>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 text-sm leading-relaxed text-kamien-500">
        {podpisZrodel(dane)}. Dane odświeżają się co kwadrans; ostatni odczyt o{' '}
        {godzina(dane.odczyt)}.
      </p>
    </section>
  )
}
