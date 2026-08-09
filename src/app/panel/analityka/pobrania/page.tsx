import type { Metadata } from 'next'
import { Apple, Play, Smartphone } from 'lucide-react'

import { najczestsze } from '@/lib/analityka/statystyki'
import { SKLEPY } from '@/lib/konfiguracja'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Pobrania',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const OKRESY = [7, 30, 90, 365] as const

const SKLEPY_OPIS: Record<string, { nazwa: string; ikona: typeof Apple }> = {
  'app-store': { nazwa: 'App Store', ikona: Apple },
  'google-play': { nazwa: 'Google Play', ikona: Play },
}

/**
 * Kliknięcia w odznaki sklepów.
 *
 * **Dlaczego to osobna strona, a nie kolumna w rankingu odsłon.** Bo mierzy
 * co innego. Odsłony mówią, co ludzi ciekawi; to mówi, ilu z nich przeszło od
 * czytania do działania. Przy portalu, którego celem jest doprowadzenie ludzi
 * do aplikacji, jest to jedyna liczba naprawdę opisująca skuteczność.
 *
 * **Czego ta liczba nie mówi.** Ile było instalacji. Kliknięcie w odznakę to
 * moment, w którym człowiek opuszcza portal — co dalej, wie App Store Connect
 * i Google Play Console, a my nie. Zestawienie obu liczb pokazuje, ilu ludzi
 * rozmyśliło się już w sklepie, i to jest ciekawsze niż każda z nich osobno.
 */
export default async function StronaPobran({ searchParams }: PageProps<'/panel/analityka/pobrania'>) {
  const parametry = await searchParams
  const zadane = Number(Array.isArray(parametry.dni) ? parametry.dni[0] : parametry.dni)
  const dni = (OKRESY as readonly number[]).includes(zadane) ? zadane : 30

  const okresy = await Promise.all(OKRESY.map((ile) => najczestsze('POBRANIE', ile, 10)))
  const wybrany = okresy[OKRESY.indexOf(dni as (typeof OKRESY)[number])] ?? []
  const razem = wybrany.reduce((suma, pozycja) => suma + pozycja.liczba, 0)

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Pobrania aplikacji</h1>
      <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-kamien-600">
        Ile razy ktoś kliknął w odznakę sklepu. To moment, w którym człowiek przechodzi
        od czytania o trasach do pobierania aplikacji — najważniejsza liczba na tym portalu.
      </p>

      <div className="mt-8 rounded-2xl border border-las-200 bg-las-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-las-700">
          Ostatnie {dni} dni
        </p>
        <p className="mt-2 font-heading text-5xl font-semibold tabular-nums text-las-900">
          {liczba(razem)}
        </p>
        <p className="mt-1 text-sm text-las-800/70">
          {razem === 1 ? 'kliknięcie' : 'kliknięć'} w odznaki sklepów
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Object.entries(SKLEPY_OPIS).map(([klucz, opis]) => {
          const pozycja = wybrany.find((p) => p.klucz === klucz)
          const dostepny =
            klucz === 'app-store' ? SKLEPY.appStore.length > 0 : SKLEPY.googlePlay.length > 0
          const Ikona = opis.ikona

          return (
            <div key={klucz} className="rounded-2xl border border-kamien-200 bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-kamien-700">
                <Ikona className="size-4" aria-hidden />
                {opis.nazwa}
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-kamien-900">
                {liczba(pozycja?.liczba ?? 0)}
              </p>
              {!dostepny && (
                <p className="mt-1 text-xs text-kamien-500">
                  Aplikacji nie ma jeszcze w tym sklepie — odznaka jest nieaktywna.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Porównanie okresów ──────────────────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-kamien-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-kamien-900">Jak to rośnie</h2>
        <p className="mt-1 text-sm text-kamien-500">
          Te same kliknięcia w czterech oknach czasu. Gdy liczba z siedmiu dni zbliża się do
          jednej czwartej liczby z trzydziestu, tempo się utrzymuje.
        </p>

        <ul className="mt-5 space-y-3">
          {OKRESY.map((ile, indeks) => {
            const suma = okresy[indeks].reduce((s, p) => s + p.liczba, 0)
            return (
              <li key={ile} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-sm text-kamien-600">
                  {ile === 365 ? 'rok' : `${ile} dni`}
                </span>
                <span className="text-lg font-semibold tabular-nums text-kamien-900">
                  {liczba(suma)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="mt-6 inline-flex max-w-[70ch] items-start gap-2 rounded-xl border border-kamien-200 bg-kamien-50 px-4 py-3 text-sm leading-relaxed text-kamien-600">
        <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          To nie są instalacje. Kliknięcie w odznakę kończy się przejściem do sklepu, a co
          dzieje się dalej, wie App Store Connect — portal tego nie widzi i widzieć nie może.
          Zestawienie obu liczb pokazuje, ilu ludzi rozmyśliło się już w sklepie.
        </span>
      </p>
    </>
  )
}
