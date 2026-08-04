import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Mountain, Sparkles } from 'lucide-react'

import { MapaDynamiczna } from '@/components/mapa/mapa-dynamiczna'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import type { Atrakcja } from '@/lib/dane/typy'
import {
  naListe,
  pobierzAtrakcje,
  pobierzAtrakcje1,
  pobierzTrasePoId,
} from '@/lib/dane/zrodlo'
import { etykietaTypu, kolorTypu, metry } from '@/lib/format'
import { PORTAL, ZRODLA } from '@/lib/konfiguracja'

/**
 * Strona pojedynczej atrakcji.
 *
 * Cała treść pochodzi z danych: nazwa i wysokość z punktów tras, ciekawostki
 * z „ramek" przewodnika leżących w pobliżu, trasy — z tego, które z nich
 * przez to miejsce prowadzą. Portal nie dopisuje tu własnych opisów; te,
 * zgodnie z ustaleniem, powstaną jako szkice do zatwierdzenia.
 */

export function generateStaticParams() {
  return pobierzAtrakcje().map((atrakcja) => ({ slug: atrakcja.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/atrakcje/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const atrakcja = pobierzAtrakcje1(slug)
  if (!atrakcja) return {}

  const czesci = [
    etykietaTypu(atrakcja.typ),
    'w Pieninach.',
    atrakcja.wysokoscM !== null ? `Wysokość ${metry(atrakcja.wysokoscM)} n.p.m.` : '',
    `Prowadzi tu ${atrakcja.trasy.length} opisanych tras.`,
    atrakcja.ciekawostki[0]?.tekst ?? '',
  ]

  return {
    title: atrakcja.nazwa,
    description: czesci.filter(Boolean).join(' ').slice(0, 300),
    alternates: { canonical: `/atrakcje/${atrakcja.slug}` },
    openGraph: {
      type: 'article',
      title: `${atrakcja.nazwa} — ${etykietaTypu(atrakcja.typ).toLowerCase()} w Pieninach`,
      description: czesci.filter(Boolean).join(' ').slice(0, 300),
      url: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
    },
  }
}

export default async function StronaAtrakcji({ params }: PageProps<'/atrakcje/[slug]'>) {
  const { slug } = await params
  const atrakcja = pobierzAtrakcje1(slug)
  if (!atrakcja) notFound()

  const trasy = atrakcja.trasy
    .map((id) => pobierzTrasePoId(id))
    .filter((trasa) => trasa !== null)

  return (
    <>
      <DaneStrukturalne atrakcja={atrakcja} />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Atrakcje', adres: '/atrakcje' },
          { nazwa: atrakcja.nazwa, adres: `/atrakcje/${atrakcja.slug}` },
        ]}
        tytul={atrakcja.nazwa}
        lead={[
          etykietaTypu(atrakcja.typ),
          atrakcja.wysokoscM !== null ? `${metry(atrakcja.wysokoscM)} n.p.m.` : null,
          `${trasy.length} ${trasy.length === 1 ? 'trasa prowadzi' : 'tras prowadzi'} przez to miejsce`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            {atrakcja.ciekawostki.length > 0 ? (
              <section aria-labelledby="ciekawostki">
                <h2 id="ciekawostki" className="text-sekcja font-semibold text-kamien-900">
                  Co warto wiedzieć
                </h2>
                <div className="mt-8 space-y-6">
                  {atrakcja.ciekawostki.map((ciekawostka) => (
                    <article
                      key={ciekawostka.tytul}
                      className="rounded-2xl border border-kamien-200 bg-kamien-50 p-7"
                    >
                      <Sparkles className="size-5 text-las-600" aria-hidden />
                      <h3 className="mt-3 font-heading text-xl font-semibold text-kamien-900">
                        {ciekawostka.tytul}
                      </h3>
                      <p className="mt-3 leading-relaxed text-kamien-700">
                        {ciekawostka.tekst}
                      </p>
                    </article>
                  ))}
                </div>
                <p className="mt-6 text-sm text-kamien-500">
                  Źródło: przewodnik „{ZRODLA.przewodnik.tytul}" ({ZRODLA.przewodnik.autor},{' '}
                  {ZRODLA.przewodnik.wydawca}, {ZRODLA.przewodnik.wydanie}).
                </p>
              </section>
            ) : (
              <section
                aria-labelledby="brak-opisu"
                className="rounded-2xl border border-dashed border-kamien-300 p-8"
              >
                <h2 id="brak-opisu" className="font-heading text-lg font-semibold text-kamien-900">
                  Opis w przygotowaniu
                </h2>
                <p className="mt-3 leading-relaxed text-kamien-600">
                  Do tego miejsca prowadzą opisane u nas trasy, ale nie mamy jeszcze
                  osobnego opisu samej atrakcji. Poniżej znajdziesz trasy, którymi
                  da się tu dojść, oraz położenie na mapie.
                </p>
              </section>
            )}

            <section className="mt-14" aria-labelledby="polozenie">
              <h2 id="polozenie" className="text-sekcja font-semibold text-kamien-900">
                Położenie
              </h2>
              <MapaDynamiczna
                klasa="mt-6 h-[24rem] w-full border border-kamien-200"
                dopasujDoSladow={false}
                markery={[
                  {
                    id: atrakcja.slug,
                    nazwa: atrakcja.nazwa,
                    wspolrzedne: atrakcja.wspolrzedne,
                    typ: atrakcja.typ,
                    kolor: kolorTypu(atrakcja.typ),
                    opis: etykietaTypu(atrakcja.typ),
                  },
                ]}
              />
              <p className="mt-3 flex items-center gap-2 text-sm text-kamien-600">
                <MapPin className="size-4" aria-hidden />
                {atrakcja.wspolrzedne[1].toFixed(5)} N, {atrakcja.wspolrzedne[0].toFixed(5)} E
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-kamien-200 bg-white p-6">
              <Mountain className="size-6 text-las-600" aria-hidden />
              <h2 className="mt-3 font-heading text-lg font-semibold text-kamien-900">
                W skrócie
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-kamien-500">Rodzaj</dt>
                  <dd className="font-medium text-kamien-900">{etykietaTypu(atrakcja.typ)}</dd>
                </div>
                {atrakcja.wysokoscM !== null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-kamien-500">Wysokość</dt>
                    <dd className="font-medium text-kamien-900">
                      {metry(atrakcja.wysokoscM)} n.p.m.
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-kamien-500">Tras dojścia</dt>
                  <dd className="font-medium text-kamien-900">{trasy.length}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        {trasy.length > 0 && (
          <section className="mt-20 border-t border-kamien-200 pt-16" aria-labelledby="trasy">
            <h2 id="trasy" className="text-sekcja font-semibold text-kamien-900">
              Trasy przez {atrakcja.nazwa}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trasy.map((trasa) => (
                <KafelekTrasy key={trasa.id} trasa={naListe(trasa)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function DaneStrukturalne({ atrakcja }: { atrakcja: Atrakcja }) {
  const dane = [
    {
      '@context': 'https://schema.org',
      // `TouristAttraction` dziedziczy po `Place`, więc jednym typem
      // obsługujemy oba wymagania z briefu.
      '@type': 'TouristAttraction',
      name: atrakcja.nazwa,
      url: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
      description: atrakcja.ciekawostki[0]?.tekst,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: atrakcja.wspolrzedne[1],
        longitude: atrakcja.wspolrzedne[0],
        elevation: atrakcja.wysokoscM ?? undefined,
      },
      containedInPlace: {
        '@type': 'Place',
        name: 'Pieniny',
        address: { '@type': 'PostalAddress', addressCountry: 'PL' },
      },
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
        { '@type': 'ListItem', position: 2, name: 'Atrakcje', item: `${PORTAL.adres}/atrakcje` },
        {
          '@type': 'ListItem',
          position: 3,
          name: atrakcja.nazwa,
          item: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
        },
      ],
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dane) }}
    />
  )
}
