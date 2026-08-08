import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Download, ExternalLink, Lightbulb, MapPin, Mountain } from 'lucide-react'

import { TeaserWideo } from '@/components/aplikacja/teaser-wideo'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { naListe, pobierzTrasePoId, pobierzWyzwania, pobierzWyzwanie } from '@/lib/dane/zrodlo'
import { czas, kilometry, metry } from '@/lib/format'

/**
 * Strona jednego pienińskiego wyzwania.
 *
 * Cała treść pochodzi z `wyzwania.json` w aplikacji: motto, akapity opisu,
 * lista szczytów do zaliczenia, wskazówki, okres zdobywania wraz z powodem
 * ograniczenia, odnośnik do regulaminu PTTK, odznaka i film. Portal nie dopisuje
 * tu ani zdania od siebie — kto przeczyta stronę, a potem otworzy aplikację, ma
 * zobaczyć to samo.
 *
 * Liczby trasy (długość, czas, podejścia) biorą się z opisu trasy wskazanej
 * przez `id_trasy`, a nie z drugiego zapisu obok. Gdyby stały tu osobno,
 * po pierwszej korekcie w aplikacji zaczęłyby kłamać.
 */

const OPIS_FILMU = 'Film z trasy wyzwania — pionowy, z dźwiękiem wyciszonym na starcie'

export function generateStaticParams() {
  return pobierzWyzwania()
    .filter((wyzwanie) => wyzwanie.dostepne)
    .map((wyzwanie) => ({ slug: wyzwanie.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/wyzwania/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const wyzwanie = pobierzWyzwanie(slug)
  if (!wyzwanie) return {}

  return {
    title: wyzwanie.nazwa,
    // Pierwszy akapit z aplikacji obcięty do długości, którą wyszukiwarki
    // pokazują — własne streszczenie byłoby trzecią wersją tego samego opisu.
    description: wyzwanie.akapity[0]?.slice(0, 155) ?? wyzwanie.podtytul ?? wyzwanie.nazwa,
    alternates: { canonical: `/wyzwania/${wyzwanie.slug}` },
  }
}

export default async function StronaWyzwania({ params }: PageProps<'/wyzwania/[slug]'>) {
  const { slug } = await params
  const wyzwanie = pobierzWyzwanie(slug)

  if (!wyzwanie || !wyzwanie.dostepne) notFound()

  const trasa = wyzwanie.idTrasy ? pobierzTrasePoId(wyzwanie.idTrasy) : null
  const film = wyzwanie.film ? `/marka/wyzwania/${wyzwanie.slug}.mp4` : null

  return (
    <>
      <NaglowekStrony
        okruszki={[
          { nazwa: 'Odznaki', adres: '/wyzwania' },
          { nazwa: wyzwanie.nazwa, adres: `/wyzwania/${wyzwanie.slug}` },
        ]}
        tytul={wyzwanie.nazwa}
        lead={
          wyzwanie.podtytul
            ? `Pienińskie wyzwanie · ${wyzwanie.podtytul}`
            : 'Pienińskie wyzwanie'
        }
      />

      <div className="obszar py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          {/* ── Treść ─────────────────────────────────────────────────────── */}
          <div className="min-w-0">
            {wyzwanie.haslo && (
              <p className="border-l-4 border-las-500 pl-5 font-heading text-xl italic leading-relaxed text-kamien-800 sm:text-2xl">
                {wyzwanie.haslo}
              </p>
            )}

            <div className="mt-10 space-y-5 text-lg leading-relaxed text-kamien-700">
              {wyzwanie.akapity.map((akapit) => (
                <p key={akapit.slice(0, 40)}>{akapit}</p>
              ))}
            </div>

            {wyzwanie.szczyty.length > 0 && (
              <section className="mt-12">
                <h2 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-kamien-900">
                  <Mountain className="size-5 text-las-600" aria-hidden />
                  Do zaliczenia
                </h2>
                <p className="mt-2 text-kamien-600">
                  {/* Liczba wynika z listy, nie jest wpisana obok niej — inaczej
                      rozjechałaby się przy pierwszej zmianie regulaminu. */}
                  {wyzwanie.szczyty.length} punktów na trasie, w kolejności z regulaminu.
                </p>
                <ol className="mt-5 grid gap-2 sm:grid-cols-2">
                  {wyzwanie.szczyty.map((szczyt, indeks) => (
                    <li
                      key={szczyt}
                      className="flex items-center gap-3 rounded-xl border border-kamien-200 bg-white px-4 py-3"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-las-50 text-sm font-semibold tabular-nums text-las-800">
                        {indeks + 1}
                      </span>
                      <span className="text-kamien-800">{szczyt}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {wyzwanie.wskazowki.length > 0 && (
              <section className="mt-12">
                <h2 className="flex items-center gap-2.5 font-heading text-xl font-semibold text-kamien-900">
                  <Lightbulb className="size-5 text-las-600" aria-hidden />
                  Wskazówki
                </h2>
                <ul className="mt-5 space-y-3">
                  {wyzwanie.wskazowki.map((wskazowka) => (
                    <li
                      key={wskazowka.slice(0, 40)}
                      className="flex gap-3 leading-relaxed text-kamien-700"
                    >
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-las-500" />
                      {wskazowka}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {film && (
              <section className="mt-14">
                <h2 className="font-heading text-xl font-semibold text-kamien-900">Film z trasy</h2>
                <div className="mt-5 max-w-sm">
                  <TeaserWideo
                    zrodlo={film}
                    plakat={`/marka/wyzwania/${wyzwanie.slug}-plakat.webp`}
                    opis={OPIS_FILMU}
                    zDzwiekiem
                  />
                </div>
                {wyzwanie.filmZrodlo && (
                  <p className="mt-3 text-sm text-kamien-500">Film: {wyzwanie.filmZrodlo}</p>
                )}
              </section>
            )}

            {trasa && (
              <section className="mt-14">
                <h2 className="font-heading text-xl font-semibold text-kamien-900">Trasa wyzwania</h2>
                <div className="mt-5 max-w-md">
                  <KafelekTrasy trasa={naListe(trasa)} />
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/szlaki/${trasa.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
                  >
                    <MapPin className="size-4" aria-hidden />
                    Opis odcinek po odcinku
                  </Link>
                  <a
                    href={`/dane/gpx/${trasa.id}.gpx`}
                    download
                    className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
                  >
                    <Download className="size-4" aria-hidden />
                    Ślad GPX
                  </a>
                </div>
              </section>
            )}
          </div>

          {/* ── Kolumna boczna ────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            {wyzwanie.odznaka && (
              <div className="grid place-items-center rounded-3xl border border-kamien-200 bg-kamien-50 p-8">
                <Image
                  src={wyzwanie.odznaka}
                  alt={`Odznaka ${wyzwanie.nazwa}`}
                  width={224}
                  height={224}
                  className="size-40 object-contain sm:size-48"
                />
                <p className="mt-5 text-center text-sm text-kamien-600">
                  Odznakę przyznaje PTTK Oddział Pieniński w Szczawnicy.
                </p>
              </div>
            )}

            {trasa && (
              <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-kamien-200 bg-kamien-200 text-center">
                {(
                  [
                    ['Długość', kilometry(trasa.dlugoscKm)],
                    ['Czas', czas(trasa.czasMin.tam)],
                    ['Podejścia', metry(trasa.sumaPodejscM.tam)],
                  ] as const
                ).map(([etykieta, wartosc]) => (
                  <div key={etykieta} className="bg-white px-3 py-4">
                    <dt className="text-xs uppercase tracking-wider text-kamien-500">{etykieta}</dt>
                    <dd className="mt-1 font-heading text-lg font-semibold tabular-nums text-kamien-900">
                      {wartosc}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {wyzwanie.okres ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <CalendarDays className="size-4" aria-hidden />
                  Okres zdobywania
                </p>
                <p className="mt-2 font-medium text-amber-950">{wyzwanie.okres}</p>
                {wyzwanie.okresUwaga && (
                  <p className="mt-2 text-sm leading-relaxed text-amber-900">{wyzwanie.okresUwaga}</p>
                )}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-kamien-200 bg-white p-5 text-sm text-kamien-600">
                Odznakę można zdobywać przez cały rok — w danych nie ma ograniczenia
                terminu. O warunkach na szlaku decyduje pogoda.
              </p>
            )}

            {wyzwanie.regulamin && (
              <a
                href={wyzwanie.regulamin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 rounded-full border border-kamien-300 px-5 py-3 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
              >
                Regulamin PTTK
                <ExternalLink className="size-3.5" aria-hidden />
                {/* Odnośnik otwiera się w nowej karcie — mówimy o tym wprost,
                    bo dla czytnika ekranu to niespodzianka. */}
                <span className="sr-only">(otwiera się w nowej karcie)</span>
              </a>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
