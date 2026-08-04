import type { Metadata } from 'next'
import Link from 'next/link'
import { Mountain } from 'lucide-react'

import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzAtrakcje } from '@/lib/dane/zrodlo'
import { etykietaTypu, kolorTypu, metry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Atrakcje Pienin',
  description:
    'Szczyty, punkty widokowe, przełęcze, schroniska i zamki w Pieninach — ' +
    'z wysokościami, ciekawostkami z przewodnika i trasami, którymi da się tam dojść.',
  alternates: { canonical: '/atrakcje' },
}

/** Kolejność grup na stronie — od tego, czego ludzie szukają najczęściej. */
const GRUPY = [
  'szczyt',
  'punkt_widokowy',
  'zamek',
  'schronisko',
  'przelecz',
  'muzeum',
  'kolej_linowa',
  'atrakcja',
  'zrodlo',
]

export default function StronaAtrakcji() {
  const atrakcje = pobierzAtrakcje()

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Atrakcje', item: `${PORTAL.adres}/atrakcje` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Atrakcje', adres: '/atrakcje' }]}
        tytul="Atrakcje Pienin"
        lead={`${atrakcje.length} miejsc, do których prowadzą opisane u nas trasy — z wysokością, położeniem i ciekawostkami z przewodnika.`}
      />

      <div className="obszar py-14 lg:py-20">
        {GRUPY.map((grupa) => {
          const wGrupie = atrakcje.filter((atrakcja) => atrakcja.typ === grupa)
          if (wGrupie.length === 0) return null

          return (
            <section key={grupa} className="mb-16 last:mb-0">
              <h2 className="flex items-baseline gap-3 text-sekcja font-semibold text-kamien-900">
                {etykietaTypu(grupa)}
                <span className="text-base font-normal text-kamien-500">{wGrupie.length}</span>
              </h2>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {wGrupie.map((atrakcja) => (
                  <li key={atrakcja.slug}>
                    <Link
                      href={`/atrakcje/${atrakcja.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-kamien-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                    >
                      <span
                        aria-hidden
                        className="grid size-9 place-items-center rounded-lg"
                        style={{ backgroundColor: `${kolorTypu(atrakcja.typ)}1a` }}
                      >
                        <Mountain
                          className="size-4"
                          style={{ color: kolorTypu(atrakcja.typ) }}
                        />
                      </span>
                      <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-kamien-900 group-hover:text-las-700">
                        {atrakcja.nazwa}
                      </h3>
                      <p className="mt-1 text-sm text-kamien-500">
                        {atrakcja.wysokoscM !== null && <>{metry(atrakcja.wysokoscM)} n.p.m. · </>}
                        {atrakcja.trasy.length}{' '}
                        {atrakcja.trasy.length === 1
                          ? 'trasa'
                          : atrakcja.trasy.length < 5
                            ? 'trasy'
                            : 'tras'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
