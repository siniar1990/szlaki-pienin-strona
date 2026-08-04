import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Medal } from 'lucide-react'

import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { naListe, pobierzTrasePoId, pobierzWyzwania } from '@/lib/dane/zrodlo'

export const metadata: Metadata = {
  title: 'Pienińskie odznaki',
  description:
    'Diament Pienin i Rubin Szczawnicy — odznaki turystyczne PTTK Szczawnica. ' +
    'Trasy, regulaminy i sposób liczenia postępu w aplikacji.',
  alternates: { canonical: '/wyzwania' },
}

export default function StronaWyzwan() {
  const wyzwania = pobierzWyzwania()

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Odznaki', adres: '/wyzwania' }]}
        tytul="Pienińskie odznaki"
        lead="Dwie odznaki przyznawane przez PTTK Szczawnica. Aplikacja liczy postęp na szlaku i podpowiada, czego jeszcze brakuje."
      />

      <div className="obszar py-14 lg:py-20">
        <div className="space-y-10">
          {wyzwania.map((wyzwanie) => {
            const trasa = wyzwanie.idTrasy ? pobierzTrasePoId(wyzwanie.idTrasy) : null

            return (
              <article
                key={wyzwanie.id}
                className="overflow-hidden rounded-3xl border border-kamien-200 bg-white"
              >
                <div className="grid gap-8 p-8 sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-10">
                  <div className="grid size-32 place-items-center rounded-2xl bg-kamien-50">
                    {wyzwanie.odznaka ? (
                      <Image
                        src={wyzwanie.odznaka}
                        alt={`Odznaka ${wyzwanie.nazwa}`}
                        width={128}
                        height={128}
                        className="size-28 object-contain"
                      />
                    ) : (
                      <Medal className="size-12 text-las-600" aria-hidden />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-heading text-2xl font-semibold text-kamien-900">
                      {wyzwanie.nazwa}
                    </h2>
                    {wyzwanie.podtytul && (
                      <p className="mt-1 text-lg text-kamien-600">{wyzwanie.podtytul}</p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {trasa && (
                        <Link
                          href={`/szlaki/${trasa.slug}`}
                          className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
                        >
                          Zobacz trasę odznaki
                        </Link>
                      )}
                      {wyzwanie.regulamin && (
                        <a
                          href={wyzwanie.regulamin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
                        >
                          Regulamin PTTK
                          <ExternalLink className="size-3.5" aria-hidden />
                          {/* Odnośnik otwiera się w nowej karcie — mówimy o tym
                              wprost, bo dla czytnika ekranu to niespodzianka. */}
                          <span className="sr-only">(otwiera się w nowej karcie)</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {trasa && (
                  <div className="border-t border-kamien-200 bg-kamien-50 p-8 sm:p-10">
                    <h3 className="font-heading text-lg font-semibold text-kamien-900">
                      Trasa odznaki
                    </h3>
                    <div className="mt-5 max-w-md">
                      <KafelekTrasy trasa={naListe(trasa)} />
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <p className="mt-12 max-w-[70ch] text-sm leading-relaxed text-kamien-500">
          Odznaki przyznaje PTTK Oddział Pieniński w Szczawnicy. Zasady zdobywania,
          terminy i sposób potwierdzania przejścia określają regulaminy dostępne
          na stronie oddziału — portal ich nie zastępuje.
        </p>
      </div>
    </>
  )
}
