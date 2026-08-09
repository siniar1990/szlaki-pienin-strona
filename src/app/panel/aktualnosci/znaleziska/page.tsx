import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, PenLine, RefreshCw, Sparkles, X } from 'lucide-react'

import { baza } from '@/lib/baza'
import { ETYKIETY_ZNALEZISKA, ileTemu } from '@/lib/wiadomosci/etykiety'
import { kluczDostepny } from '@/lib/wiadomosci/model-jezykowy'

import { notkaZeZnaleziska, odrzucZnalezisko, uruchomObchod, uruchomRedakcje } from '../dzialania'

export const metadata: Metadata = {
  title: 'Znaleziska',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Wykaz artykułów znalezionych u źródeł.
 *
 * **Po co ta strona istnieje, skoro redakcja wybiera sama.** Bo wybiera jedną
 * rzecz dziennie i bywa, że nie tę. Tu widać całą pulę: administrator może
 * sam wskazać temat, o którym chce napisać, i zrobić to natychmiast, bez
 * czekania na nocne zadanie. Ta strona jest też jedynym miejscem, w którym
 * widać, czy obchód w ogóle cokolwiek przynosi — pusty wykaz przy dwudziestu
 * źródłach znaczy, że coś jest nie tak z odczytem, a nie że w Pieninach nic
 * się nie dzieje.
 *
 * Odrzucone pokazujemy osobno i krótko: służą do sprawdzenia, czy redakcja
 * nie wyrzuca rzeczy, które powinny przejść.
 */
export default async function StronaZnalezisk() {
  const [nowe, odrzucone, klucz] = await Promise.all([
    baza.znalezionyArtykul.findMany({
      where: { stan: 'NOWY' },
      orderBy: [{ opublikowano: 'desc' }, { znaleziono: 'desc' }],
      take: 80,
      include: { zrodlo: { select: { nazwa: true } } },
    }),
    baza.znalezionyArtykul.findMany({
      where: { stan: 'ODRZUCONE' },
      orderBy: { znaleziono: 'desc' },
      take: 20,
      include: { zrodlo: { select: { nazwa: true } } },
    }),
    Promise.resolve(kluczDostepny()),
  ])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">
          Znaleziska
          <span className="ml-3 text-base font-normal text-kamien-500">{nowe.length}</span>
        </h1>

        <div className="flex flex-wrap gap-3">
          <form action={uruchomObchod}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-700 transition-colors hover:border-las-400 hover:text-las-800"
            >
              <RefreshCw className="size-4" aria-hidden />
              Obejdź źródła teraz
            </button>
          </form>

          <form action={uruchomRedakcje}>
            <button
              type="submit"
              disabled={!klucz}
              title={klucz ? undefined : 'Ustaw KLUCZ_ANTHROPIC, żeby włączyć redakcję maszynową'}
              className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="size-4" aria-hidden />
              Napisz notkę dnia
            </button>
          </form>
        </div>
      </div>

      {!klucz && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Redakcja maszynowa jest wyłączona — brakuje zmiennej{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            KLUCZ_ANTHROPIC
          </code>
          . Obchód działa normalnie, a notki można pisać ręcznie z tego wykazu.
        </p>
      )}

      {nowe.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-kamien-300 p-12 text-center text-kamien-500">
          Nic nowego. Sprawdź{' '}
          <Link href="/panel/aktualnosci/zrodla" className="font-medium text-las-700 hover:underline">
            listę źródeł
          </Link>{' '}
          — przy każdym widać, kiedy był ostatni obchód i czy się udał.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-kamien-100 rounded-2xl border border-kamien-200 bg-white">
          {nowe.map((znalezisko) => {
            const napisz = notkaZeZnaleziska.bind(null, znalezisko.id)
            const odrzuc = odrzucZnalezisko.bind(null, znalezisko.id)

            return (
              <li key={znalezisko.id} className="flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-kamien-500">
                    {znalezisko.zrodlo.nazwa} ·{' '}
                    {znalezisko.opublikowano
                      ? ileTemu(znalezisko.opublikowano)
                      : `znalezione ${ileTemu(znalezisko.znaleziono)}`}
                  </p>

                  <h2 className="mt-1 font-medium leading-snug text-kamien-900">
                    <a
                      href={znalezisko.adres}
                      target="_blank"
                      rel="noopener nofollow"
                      className="inline-flex items-start gap-1.5 hover:text-las-700"
                    >
                      {znalezisko.tytul}
                      <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden />
                    </a>
                  </h2>

                  {znalezisko.opis && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-kamien-600">
                      {znalezisko.opis}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <form action={napisz}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-4 py-2 text-sm font-medium text-kamien-700 transition-colors hover:border-las-400 hover:text-las-800"
                    >
                      <PenLine className="size-3.5" aria-hidden />
                      Napisz notkę
                    </button>
                  </form>
                  <form action={odrzuc}>
                    <button
                      type="submit"
                      aria-label="Odrzuć znalezisko"
                      className="rounded-full p-2 text-kamien-400 transition-colors hover:bg-kamien-100 hover:text-kamien-700"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {odrzucone.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-medium text-kamien-600 hover:text-las-700">
            Ostatnio odrzucone ({odrzucone.length})
          </summary>
          <ul className="mt-4 space-y-2">
            {odrzucone.map((znalezisko) => {
              const stan = ETYKIETY_ZNALEZISKA[znalezisko.stan]
              return (
                <li
                  key={znalezisko.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-kamien-100/60 px-4 py-3 text-sm"
                >
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${stan.klasa}`}>
                    {stan.tekst}
                  </span>
                  <span className="text-kamien-700">{znalezisko.tytul}</span>
                  {znalezisko.uzasadnienie && (
                    <span className="text-xs text-kamien-500">— {znalezisko.uzasadnienie}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </>
  )
}
