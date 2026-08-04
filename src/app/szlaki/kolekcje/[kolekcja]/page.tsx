import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { KOLEKCJE, trasyWKolekcji, znajdzKolekcje } from '@/lib/dane/kolekcje'
import { naListe, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

/**
 * Strona jednej kolekcji.
 *
 * Każdy zestaw ma własny adres, bo każdy odpowiada na inne zapytanie
 * w wyszukiwarce — „pieniny z dziećmi", „pieniny krótkie trasy",
 * „korony pienin". Jedna wspólna lista z filtrami nie miałaby na nie szans,
 * bo filtr nie zostawia śladu w adresie.
 */

export function generateStaticParams() {
  return KOLEKCJE.map((kolekcja) => ({ kolekcja: kolekcja.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/szlaki/kolekcje/[kolekcja]'>): Promise<Metadata> {
  const { kolekcja: slug } = await params
  const kolekcja = znajdzKolekcje(slug)
  if (!kolekcja) return {}

  const ile = trasyWKolekcji(kolekcja, pobierzTrasy()).length

  return {
    title: `${kolekcja.nazwa} — trasy w Pieninach`,
    description: `${ile} tras. ${kolekcja.opis}`.slice(0, 300),
    alternates: { canonical: `/szlaki/kolekcje/${kolekcja.slug}` },
    openGraph: {
      type: 'website',
      title: `${kolekcja.nazwa} — trasy w Pieninach`,
      description: kolekcja.opis,
      url: `${PORTAL.adres}/szlaki/kolekcje/${kolekcja.slug}`,
    },
  }
}

export default async function StronaKolekcji({
  params,
}: PageProps<'/szlaki/kolekcje/[kolekcja]'>) {
  const { kolekcja: slug } = await params
  const kolekcja = znajdzKolekcje(slug)
  if (!kolekcja) notFound()

  const trasy = trasyWKolekcji(kolekcja, pobierzTrasy())
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  const dane = [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: kolekcja.nazwa,
      description: kolekcja.opis,
      numberOfItems: trasy.length,
      itemListElement: trasy.map((trasa, indeks) => ({
        '@type': 'ListItem',
        position: indeks + 1,
        name: trasa.nazwa,
        url: `${PORTAL.adres}/szlaki/${trasa.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
        { '@type': 'ListItem', position: 2, name: 'Szlaki', item: `${PORTAL.adres}/szlaki` },
        {
          '@type': 'ListItem',
          position: 3,
          name: kolekcja.nazwa,
          item: `${PORTAL.adres}/szlaki/kolekcje/${kolekcja.slug}`,
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dane) }}
      />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Szlaki', adres: '/szlaki' },
          { nazwa: kolekcja.nazwa, adres: `/szlaki/kolekcje/${kolekcja.slug}` },
        ]}
        tytul={kolekcja.nazwa}
        lead={`${kolekcja.opis} ${trasy.length} ${trasy.length === 1 ? 'trasa' : trasy.length < 5 ? 'trasy' : 'tras'}, razem ${kilometry(sumaKm)}.`}
        dodatek={
          <ul className="flex flex-wrap gap-2">
            {KOLEKCJE.filter((inna) => inna.slug !== kolekcja.slug).map((inna) => (
              <li key={inna.slug}>
                <Link
                  href={`/szlaki/kolekcje/${inna.slug}`}
                  className="inline-block rounded-full border border-kamien-300 bg-white px-4 py-2 text-sm font-medium text-kamien-700 transition-colors hover:border-las-500 hover:bg-las-50 hover:text-las-800"
                >
                  {inna.nazwa}
                </Link>
              </li>
            ))}
          </ul>
        }
      />

      <div className="obszar py-14 lg:py-20">
        {trasy.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trasy.map((trasa, indeks) => (
              <KafelekTrasy key={trasa.id} trasa={naListe(trasa)} priorytet={indeks < 3} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-kamien-300 p-12 text-center text-kamien-500">
            W tym zestawie nie ma jeszcze żadnej trasy.
          </p>
        )}
      </div>
    </>
  )
}
