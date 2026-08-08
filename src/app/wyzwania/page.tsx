import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Medal } from 'lucide-react'

import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzTrasePoId, pobierzWyzwania } from '@/lib/dane/zrodlo'
import { czas, kilometry, metry } from '@/lib/format'

/**
 * Lista pienińskich odznak.
 *
 * Wszystkie wyzwania z danych aplikacji, w jej kolejności. Niedostępne też —
 * jako zapowiedź, bez odnośnika. Pominięcie ich byłoby wygodniejsze, ale
 * czytelnik planujący sezon woli wiedzieć, że szykuje się czwarta odznaka, niż
 * dowiedzieć się o tym przypadkiem.
 */

export const metadata: Metadata = {
  title: 'Pienińskie odznaki',
  description:
    'Diament Pienin, Rubin Szczawnicy i Szmaragd Dunajca — odznaki turystyczne ' +
    'PTTK Szczawnica. Trasy, regulaminy, szczyty do zaliczenia i okresy zdobywania.',
  alternates: { canonical: '/wyzwania' },
}

export default function StronaWyzwan() {
  const wyzwania = pobierzWyzwania()
  const dostepne = wyzwania.filter((w) => w.dostepne)
  const wPrzygotowaniu = wyzwania.filter((w) => !w.dostepne)

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Odznaki', adres: '/wyzwania' }]}
        tytul="Pienińskie odznaki"
        lead={`${dostepne.length} odznaki przyznawane przez PTTK Szczawnica. Każda to jedna trasa do przejścia w ciągu jednego dnia. Aplikacja liczy postęp na szlaku i podpowiada, czego jeszcze brakuje.`}
      />

      <div className="obszar py-14 lg:py-20">
        <div className="space-y-8">
          {dostepne.map((wyzwanie) => {
            const trasa = wyzwanie.idTrasy ? pobierzTrasePoId(wyzwanie.idTrasy) : null

            return (
              <article
                key={wyzwanie.id}
                className="group overflow-hidden rounded-3xl border border-kamien-200 bg-white transition-all duration-300 hover:border-las-300 hover:shadow-uniesiony"
              >
                <Link
                  href={`/wyzwania/${wyzwanie.slug}`}
                  className="grid gap-8 p-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-10"
                >
                  <div className="grid size-36 place-items-center rounded-2xl bg-kamien-50">
                    {wyzwanie.odznaka ? (
                      <Image
                        src={wyzwanie.odznaka}
                        alt={`Odznaka ${wyzwanie.nazwa}`}
                        width={144}
                        height={144}
                        className="size-32 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Medal className="size-12 text-las-600" aria-hidden />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-heading text-2xl font-semibold text-kamien-900 transition-colors group-hover:text-las-800">
                      {wyzwanie.nazwa}
                    </h2>
                    {wyzwanie.podtytul && (
                      <p className="mt-1 text-lg text-kamien-600">{wyzwanie.podtytul}</p>
                    )}

                    {wyzwanie.haslo && (
                      <p className="mt-4 italic leading-relaxed text-kamien-700">
                        {wyzwanie.haslo}
                      </p>
                    )}

                    {trasa && (
                      <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-kamien-600">
                        <span>{kilometry(trasa.dlugoscKm)}</span>
                        <span aria-hidden>·</span>
                        <span>{czas(trasa.czasMin.tam)}</span>
                        <span aria-hidden>·</span>
                        <span>↑ {metry(trasa.sumaPodejscM.tam)}</span>
                        {wyzwanie.szczyty.length > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{wyzwanie.szczyty.length} punktów do zaliczenia</span>
                          </>
                        )}
                      </p>
                    )}

                    {wyzwanie.okres && (
                      <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm text-amber-900">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {wyzwanie.okres}
                      </p>
                    )}

                    <p className="mt-6 inline-flex items-center gap-2 font-medium text-las-700">
                      Zobacz wyzwanie
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden
                      />
                    </p>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>

        {wPrzygotowaniu.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-lg font-semibold text-kamien-900">W przygotowaniu</h2>
            <ul className="mt-4 space-y-2">
              {wPrzygotowaniu.map((wyzwanie) => (
                <li
                  key={wyzwanie.id}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-kamien-300 px-5 py-4 text-kamien-600"
                >
                  <Medal className="size-4 shrink-0 text-kamien-400" aria-hidden />
                  {wyzwanie.nazwa}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-12 max-w-[70ch] text-sm leading-relaxed text-kamien-500">
          Odznaki przyznaje PTTK Oddział Pieniński w Szczawnicy. Zasady zdobywania,
          terminy i sposób potwierdzania przejścia określają regulaminy dostępne
          na stronie oddziału — portal ich nie zastępuje.
        </p>
      </div>
    </>
  )
}
