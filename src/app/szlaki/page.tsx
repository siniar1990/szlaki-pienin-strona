import type { Metadata } from 'next'
import Link from 'next/link'

import { ListaTras } from '@/components/trasy/lista-tras'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { naListe, pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'
import { PORTAL } from '@/lib/konfiguracja'

export const metadata: Metadata = {
  title: 'Szlaki i trasy w Pieninach',
  description:
    'Wszystkie trasy piesze i rowerowe w Pieninach — z opisem odcinek po odcinku, ' +
    'mapą, profilem wysokości i czasem przejścia. Filtruj po trudności i długości.',
  alternates: { canonical: '/szlaki' },
}

export default function StronaSzlakow() {
  const trasy = pobierzTrasy()
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

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
        lead={`${trasy.length} tras, razem ${kilometry(sumaKm)}. Każda z opisem odcinek po odcinku, punktami po drodze i czasem przejścia z przewodnika PTTK.`}
        dodatek={
          <ul className="flex flex-wrap gap-2">
            {KATEGORIE_TRAS.map((kategoria) => (
              <li key={kategoria.slug}>
                <Link
                  href={`/szlaki/kategorie/${kategoria.slug}`}
                  className="inline-block rounded-full border border-kamien-300 bg-white px-4 py-2 text-sm font-medium text-kamien-700 transition-colors hover:border-las-500 hover:bg-las-50 hover:text-las-800"
                >
                  {kategoria.nazwa}
                </Link>
              </li>
            ))}
          </ul>
        }
      />

      <div className="obszar py-14 lg:py-20">
        <ListaTras trasy={trasy.map(naListe)} />
      </div>
    </>
  )
}
