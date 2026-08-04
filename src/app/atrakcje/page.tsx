import type { Metadata } from 'next'
import Link from 'next/link'
import { Mountain } from 'lucide-react'

import { SekcjaGrupy, SkrotyDoGrup } from '@/components/atrakcje/sekcja-atrakcji'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzAtrakcje } from '@/lib/dane/zrodlo'
import { etykietaTypuMnoga, kolorTypu, metry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'
import {
  ATRAKCJE_TURYSTYCZNE,
  GRUPY_ATRAKCJI,
  atrakcjeWGrupie,
} from '@/lib/tresc/atrakcje-turystyczne'

export const metadata: Metadata = {
  title: 'Atrakcje Pienin',
  description:
    'Spływ Dunajcem, pijalnia wód mineralnych, zjeżdżalnie grawitacyjne, zamki, ' +
    'wąwozy i wodospady — atrakcje Szczawnicy, Krościenka i okolic, plus szczyty ' +
    'i punkty widokowe z opisanych tras.',
  alternates: { canonical: '/atrakcje' },
}

/**
 * Kolejność grup szczytowych. Najpierw to, po co ludzie przyjeżdżają
 * w Pieniny, na końcu punkty pomocnicze.
 */
const GRUPY_Z_TRAS = [
  'szczyt',
  'punkt_widokowy',
  'przelecz',
  'schronisko',
  'zamek',
  'muzeum',
  'kolej_linowa',
]

export default function StronaAtrakcji() {
  const zTras = pobierzAtrakcje()

  // Atrakcja opisana w katalogu ma pierwszeństwo przed punktem o tej samej
  // nazwie wyciągniętym z trasy — inaczej „Wodospad Zaskalnik" pojawiłby się
  // dwa razy, raz z opisem i raz bez.
  const slugiKatalogu = new Set(ATRAKCJE_TURYSTYCZNE.map((a) => a.slug))
  const punktyTras = zTras.filter((atrakcja) => !slugiKatalogu.has(atrakcja.slug))

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
        tytulOpis="Co zobaczyć w Szczawnicy, Krościenku i okolicy"
        lead={`${ATRAKCJE_TURYSTYCZNE.length} atrakcji turystycznych — od spływu Dunajcem po zamki nad jeziorem — oraz ${punktyTras.length} szczytów i punktów widokowych z opisanych u nas tras.`}
        dodatek={
          <SkrotyDoGrup
            grupy={GRUPY_ATRAKCJI.filter((g) => atrakcjeWGrupie(g.klucz).length > 0)}
          />
        }
      />

      <div className="obszar py-14 lg:py-20">
        {/* ── Atrakcje turystyczne ─────────────────────────────────────── */}
        <div className="space-y-24">
          {GRUPY_ATRAKCJI.map((grupa, indeks) => {
            const wGrupie = atrakcjeWGrupie(grupa.klucz)
            if (wGrupie.length === 0) return null

            return (
              <SekcjaGrupy
                key={grupa.klucz}
                grupa={grupa.klucz}
                nazwa={grupa.nazwa}
                opis={grupa.opis}
                atrakcje={wGrupie}
                numer={indeks + 1}
              />
            )
          })}
        </div>

        {/* ── Szczyty i punkty z tras ──────────────────────────────────── */}
        <div className="mt-24 border-t border-kamien-200 pt-16">
          <h2 className="text-tytul font-semibold text-kamien-900">
            Szczyty i punkty na szlakach
          </h2>
          <p className="mt-4 max-w-[64ch] text-lg text-kamien-600">
            Miejsca, przez które prowadzą opisane u nas trasy — z wysokością,
            położeniem i ciekawostkami z przewodnika.
          </p>

          {GRUPY_Z_TRAS.map((grupa) => {
            const wGrupie = punktyTras.filter((atrakcja) => atrakcja.typ === grupa)
            if (wGrupie.length === 0) return null

            return (
              <section key={grupa} className="mt-14">
                <h3 className="flex items-baseline gap-3 font-heading text-2xl font-semibold text-kamien-900">
                  {etykietaTypuMnoga(grupa)}
                  <span className="text-base font-normal text-kamien-500">{wGrupie.length}</span>
                </h3>

                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                          <Mountain className="size-4" style={{ color: kolorTypu(atrakcja.typ) }} />
                        </span>
                        <h4 className="mt-4 font-heading text-lg font-semibold leading-snug text-kamien-900 group-hover:text-las-700">
                          {atrakcja.nazwa}
                        </h4>
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
      </div>
    </>
  )
}
