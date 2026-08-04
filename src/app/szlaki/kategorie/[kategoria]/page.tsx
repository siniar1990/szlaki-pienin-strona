import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { KATEGORIE_TRAS, znajdzKategorie } from '@/lib/dane/kategorie'
import { naListe, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

/**
 * Lista tras w jednej kategorii.
 *
 * Każda kategoria dostaje własny adres i własny opis — to one łapią zapytania
 * w rodzaju „pieniny trasy z dziećmi" czy „łatwe szlaki pieniny", z którymi
 * jedna wspólna lista tras nie miałaby szans.
 */

export function generateStaticParams() {
  return KATEGORIE_TRAS.map((kategoria) => ({ kategoria: kategoria.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/szlaki/kategorie/[kategoria]'>): Promise<Metadata> {
  const { kategoria: slug } = await params
  const kategoria = znajdzKategorie(slug)
  if (!kategoria) return {}

  const ile = pobierzTrasy().filter(kategoria.pasuje).length

  return {
    title: `${kategoria.nazwa} w Pieninach`,
    description: `${ile} tras. ${kategoria.opis}`.slice(0, 300),
    alternates: { canonical: `/szlaki/kategorie/${kategoria.slug}` },
  }
}

export default async function StronaKategorii({
  params,
}: PageProps<'/szlaki/kategorie/[kategoria]'>) {
  const { kategoria: slug } = await params
  const kategoria = znajdzKategorie(slug)
  if (!kategoria) notFound()

  const trasy = pobierzTrasy().filter(kategoria.pasuje)
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Szlaki', item: `${PORTAL.adres}/szlaki` },
      {
        '@type': 'ListItem',
        position: 3,
        name: kategoria.nazwa,
        item: `${PORTAL.adres}/szlaki/kategorie/${kategoria.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneOkruszkow) }}
      />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Szlaki', adres: '/szlaki' },
          { nazwa: kategoria.nazwa, adres: `/szlaki/kategorie/${kategoria.slug}` },
        ]}
        tytul={`${kategoria.nazwa} w Pieninach`}
        lead={`${kategoria.opis} ${trasy.length} tras, razem ${kilometry(sumaKm)}.`}
        dodatek={
          <ul className="flex flex-wrap gap-2">
            {KATEGORIE_TRAS.filter((inna) => inna.slug !== kategoria.slug).map((inna) => (
              <li key={inna.slug}>
                <Link
                  href={`/szlaki/kategorie/${inna.slug}`}
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
            W tej kategorii nie ma jeszcze żadnej trasy.
          </p>
        )}
      </div>
    </>
  )
}
