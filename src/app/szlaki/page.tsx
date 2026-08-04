import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowUpRight,
  Baby,
  Bike,
  Clock,
  Compass,
  Footprints,
  Mountain,
  Sun,
  Telescope,
} from 'lucide-react'

import { KafelkiKategorii } from '@/components/glowna/kafelki-kategorii'
import { PrzegladarkaTras, type TrasaDoPrzegladania } from '@/components/trasy/przegladarka-tras'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { NaglowekSekcji } from '@/components/uklad/naglowek-sekcji'
import { KATEGORIE_APLIKACJI } from '@/lib/dane/kategorie'
import { KOLEKCJE, trasyWKolekcji } from '@/lib/dane/kolekcje'
import { naListe, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Szlaki i trasy w Pieninach',
  description:
    'Wszystkie trasy piesze i rowerowe w Pieninach — z opisem odcinek po odcinku, ' +
    'mapą, profilem wysokości i plikiem GPX. Filtruj po trudności, długości, ' +
    'czasie przejścia i miejscowości startowej.',
  alternates: { canonical: '/szlaki' },
}

/**
 * Strona szlaków.
 *
 * Układ prowadzi od ogółu do szczegółu, bo tak szuka człowiek, który jest tu
 * pierwszy raz: najpierw pole szukania (kto wie, czego chce, wpisuje nazwę),
 * potem gotowe zestawy („mam pół dnia i dziecko"), potem kategorie z aplikacji,
 * a dopiero na końcu pełna lista z filtrami.
 *
 * Wcześniej wszystkie 53 trasy leciały jedną listą od razu pod nagłówkiem.
 * Dla kogoś, kto wie, że szuka Sokolicy, to było w porządku; dla reszty —
 * ściana kafelków bez podpowiedzi, od czego zacząć.
 */

const IKONY = {
  kompas: Compass,
  dzieci: Baby,
  panorama: Telescope,
  slonce: Sun,
  rower: Bike,
  gora: Mountain,
  zegar: Clock,
  stopa: Footprints,
} as const

export default function StronaSzlakow() {
  const trasy = pobierzTrasy()
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  const doPrzegladania: TrasaDoPrzegladania[] = trasy.map((trasa) => ({
    ...naListe(trasa),
    punkty: trasa.punkty.map((punkt) => punkt.nazwa),
  }))

  const kolekcje = KOLEKCJE.map((kolekcja) => ({
    kolekcja,
    ile: trasyWKolekcji(kolekcja, trasy).length,
  })).filter((k) => k.ile > 0)

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Szlaki', item: `${PORTAL.adres}/szlaki` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Szlaki', adres: '/szlaki' }]}
        tytul="Szlaki i trasy w Pieninach"
        lead={`${trasy.length} tras, razem ${kilometry(sumaKm)}. Każda z opisem odcinek po odcinku, punktami po drodze, czasem przejścia z przewodnika PTTK i plikiem GPX do pobrania.`}
      />

      {/* ── Kolekcje ─────────────────────────────────────────────────────── */}
      <section className="sekcja" aria-labelledby="kolekcje">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Od czego zacząć"
            tytul="Gotowe zestawy tras"
            opis="Wybierz sytuację, a nie kategorię z bazy. Każdy zestaw ma własną stronę z pełną listą."
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kolekcje.map(({ kolekcja, ile }) => {
              const Ikona = IKONY[kolekcja.ikona]
              return (
                <li key={kolekcja.slug}>
                  <Link
                    href={`/szlaki/kolekcje/${kolekcja.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-kamien-200 bg-white p-6 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-las-50 text-las-700 transition-colors group-hover:bg-las-100">
                        <Ikona className="size-5" aria-hidden />
                      </span>
                      <span className="text-sm text-kamien-400">
                        {ile} {ile === 1 ? 'trasa' : ile < 5 ? 'trasy' : 'tras'}
                      </span>
                    </div>
                    <h3 className="mt-5 flex items-center gap-1.5 font-heading text-xl font-semibold text-kamien-900 group-hover:text-las-700">
                      {kolekcja.nazwa}
                      <ArrowUpRight
                        className="size-4 text-kamien-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-las-600"
                        aria-hidden
                      />
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-kamien-600">{kolekcja.opis}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── Kategorie z aplikacji ────────────────────────────────────────── */}
      <section className="sekcja bg-kamien-50" aria-labelledby="kategorie">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Jak w aplikacji"
            tytul="Kategorie tras"
            opis="Ten sam podział, który widzisz na ekranie startowym w telefonie."
          />
          <div className="mt-10">
            <KafelkiKategorii
              kategorie={KATEGORIE_APLIKACJI}
              liczba={(kategoria) => trasy.filter(kategoria.pasuje).length}
            />
          </div>
        </div>
      </section>

      {/* ── Pełna lista z filtrami ───────────────────────────────────────── */}
      <section className="sekcja" aria-labelledby="wszystkie">
        <div className="obszar">
          <NaglowekSekcji
            nadtytul="Wszystkie trasy"
            tytul="Znajdź swoją trasę"
            opis="Zawęź po trudności, długości, czasie albo miejscowości startowej. Filtry działają od razu, bez przeładowania strony."
          />

          <div className="mt-10">
            <PrzegladarkaTras trasy={doPrzegladania} />
          </div>
        </div>
      </section>
    </>
  )
}
