import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  Clock,
  Flame,
  Footprints,
  MapPin,
  MoveUpRight,
  RefreshCw,
  Route as RouteIcon,
  Smartphone,
  Sparkles,
} from 'lucide-react'

import { MapaDynamiczna } from '@/components/mapa/mapa-dynamiczna'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { ProfilWysokosciWykres } from '@/components/trasy/profil-wysokosci'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import {
  naListe,
  pobierzProfil,
  pobierzTrase,
  pobierzTrasy,
} from '@/lib/dane/zrodlo'
import type { Trasa } from '@/lib/dane/typy'
import {
  KOLORY_SZLAKOW,
  TRUDNOSC_ETYKIETY,
  TRUDNOSC_STYLE,
  czas,
  czasIso,
  etykietaTypu,
  kilometry,
  kolorTypu,
  metry,
} from '@/lib/format'
import { PORTAL, ZRODLA } from '@/lib/konfiguracja'
import { cn } from '@/lib/utils'

/**
 * Strona pojedynczej trasy.
 *
 * Powstaje raz, przy budowaniu, osobno dla każdej z 53 tras. Wszystko, co
 * widać — opis, punkty, profil, ciekawostki — pochodzi wprost z danych
 * aplikacji; strona niczego nie dopisuje od siebie poza wyliczoną trudnością,
 * która jest wyraźnie podpisana jako szacunek.
 */

export function generateStaticParams() {
  return pobierzTrasy().map((trasa) => ({ slug: trasa.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/szlaki/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const trasa = pobierzTrase(slug)
  if (!trasa) return {}

  // Opis dla wyszukiwarki: pierwsze zdanie opisu trasy plus twarde liczby.
  // Google ucina po ok. 160 znakach, więc liczby idą na początek — one
  // najczęściej decydują, czy ktoś kliknie.
  const liczby = `${kilometry(trasa.dlugoscKm)}, ${czas(trasa.czasMin.tam)}, ${metry(
    trasa.sumaPodejscM.tam,
  )} podejść.`
  const opis = trasa.opis
    ? `${liczby} ${trasa.opis.split(/(?<=\.)\s/)[0]}`
    : `${liczby} Trasa w Pieninach z opisem, mapą i profilem wysokości.`

  return {
    title: trasa.nazwa,
    description: opis.slice(0, 300),
    alternates: { canonical: `/szlaki/${trasa.slug}` },
    openGraph: {
      type: 'article',
      title: `${trasa.nazwa} — trasa w Pieninach`,
      description: opis.slice(0, 300),
      url: `${PORTAL.adres}/szlaki/${trasa.slug}`,
      images: trasa.ilustracja ? [{ url: trasa.ilustracja }] : undefined,
    },
  }
}

export default async function StronaTrasy({ params }: PageProps<'/szlaki/[slug]'>) {
  const { slug } = await params
  const trasa = pobierzTrase(slug)
  if (!trasa) notFound()

  const profil = pobierzProfil(trasa)
  const powiazane = znajdzPowiazane(trasa)

  const metryki = [
    { ikona: RouteIcon, etykieta: 'Długość', wartosc: kilometry(trasa.dlugoscKm) },
    { ikona: Clock, etykieta: 'Czas przejścia', wartosc: czas(trasa.czasMin.tam) },
    { ikona: MoveUpRight, etykieta: 'Suma podejść', wartosc: metry(trasa.sumaPodejscM.tam) },
    {
      ikona: Flame,
      etykieta: 'Wydatek energii',
      wartosc: trasa.kcal['70kg'] ? `${trasa.kcal['70kg']} kcal` : '—',
      podpis: 'przy masie 70 kg',
    },
  ]

  return (
    <>
      <DaneStrukturalne trasa={trasa} />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Szlaki', adres: '/szlaki' },
          { nazwa: trasa.nazwa, adres: `/szlaki/${trasa.slug}` },
        ]}
        tytul={trasa.nazwa}
        lead={trasa.opis ?? undefined}
        dodatek={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-semibold',
                TRUDNOSC_STYLE[trasa.trudnosc],
              )}
            >
              {TRUDNOSC_ETYKIETY[trasa.trudnosc]}
            </span>
            {trasa.petla && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kamien-300 bg-white px-3 py-1.5 text-sm text-kamien-700">
                <RefreshCw className="size-3.5" aria-hidden />
                Pętla
              </span>
            )}
            {trasa.granica && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
                Przekracza granicę — weź dokument
              </span>
            )}
            {trasa.szlaki.map((szlak) => {
              const kolor = KOLORY_SZLAKOW[szlak]
              return (
                <span
                  key={szlak}
                  className="inline-flex items-center gap-1.5 rounded-full border border-kamien-300 bg-white px-3 py-1.5 text-sm text-kamien-700"
                >
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: kolor?.tlo ?? '#94a3b8' }}
                  />
                  szlak {kolor?.nazwa ?? szlak}
                </span>
              )
            })}
          </div>
        }
      />

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0">
            {trasa.ilustracja && (
              <figure className="overflow-hidden rounded-3xl border border-kamien-200">
                <Image
                  src={trasa.ilustracja}
                  alt={`Ilustracja trasy ${trasa.nazwa}`}
                  width={1200}
                  height={800}
                  priority
                  sizes="(max-width: 1024px) 92vw, 60vw"
                  className="h-auto w-full"
                />
              </figure>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {metryki.map(({ ikona: Ikona, etykieta, wartosc, podpis }) => (
                <div
                  key={etykieta}
                  className="rounded-2xl border border-kamien-200 bg-white p-5"
                >
                  <Ikona className="size-5 text-las-600" aria-hidden />
                  <dt className="mt-3 text-sm text-kamien-500">{etykieta}</dt>
                  <dd className="mt-1 font-heading text-xl font-semibold text-kamien-900">
                    {wartosc}
                  </dd>
                  {podpis && <p className="mt-0.5 text-xs text-kamien-400">{podpis}</p>}
                </div>
              ))}
            </dl>

            <p className="mt-4 text-sm text-kamien-500">
              Trudność „{TRUDNOSC_ETYKIETY[trasa.trudnosc].toLowerCase()}" wyliczył portal
              z długości i sumy podejść (100 m w pionie liczone jak kilometr po płaskim).
              To szacunek, nie ocena autora przewodnika.
            </p>

            {trasa.ostrzezenia.length > 0 && (
              <section className="mt-12" aria-labelledby="ostrzezenia">
                <h2
                  id="ostrzezenia"
                  className="flex items-center gap-2 font-heading text-xl font-semibold text-kamien-900"
                >
                  <AlertTriangle className="size-5 text-amber-600" aria-hidden />
                  Zanim wyjdziesz
                </h2>
                <ul className="mt-4 space-y-3">
                  {trasa.ostrzezenia.map((ostrzezenie) => (
                    <li
                      key={ostrzezenie}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.95rem] leading-relaxed text-amber-950"
                    >
                      {ostrzezenie}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {trasa.slad && (
              <section className="mt-14" aria-labelledby="mapa-trasy">
                <h2 id="mapa-trasy" className="text-sekcja font-semibold text-kamien-900">
                  Przebieg trasy
                </h2>
                <MapaDynamiczna
                  klasa="mt-6 h-[26rem] w-full border border-kamien-200"
                  slady={[
                    {
                      id: `slad-${trasa.id}`,
                      adres: trasa.slad,
                      kolor: KOLORY_SZLAKOW[trasa.szlaki[0]]?.tlo ?? '#2f5d43',
                    },
                  ]}
                  markery={trasa.punkty.map((punkt, indeks) => ({
                    id: `${trasa.id}-${indeks}`,
                    nazwa: punkt.nazwa,
                    wspolrzedne: punkt.wspolrzedne,
                    typ: punkt.typ,
                    kolor: kolorTypu(punkt.typ),
                    opis: [
                      etykietaTypu(punkt.typ),
                      punkt.wysokoscM ? `${metry(punkt.wysokoscM)} n.p.m.` : null,
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  }))}
                />
              </section>
            )}

            {profil && (
              <section className="mt-14" aria-labelledby="profil">
                <h2 id="profil" className="text-sekcja font-semibold text-kamien-900">
                  Profil wysokości
                </h2>
                <ProfilWysokosciWykres profil={profil} className="mt-6" />
              </section>
            )}

            {trasa.segmenty.length > 0 && (
              <section className="mt-16" aria-labelledby="przebieg">
                <h2 id="przebieg" className="text-sekcja font-semibold text-kamien-900">
                  Opis odcinek po odcinku
                </h2>
                <ol className="mt-8 space-y-8">
                  {trasa.segmenty.map((segment, indeks) => (
                    <li key={`${segment.od}-${segment.do}`} className="relative pl-10">
                      {/* Pionowa linia łącząca kolejne odcinki — kończy się
                          na ostatnim, żeby nie wisiała w powietrzu. */}
                      {indeks < trasa.segmenty.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute left-[0.6875rem] top-8 h-[calc(100%+2rem)] w-px bg-kamien-200"
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute left-0 top-1 grid size-6 place-items-center rounded-full bg-las-600 text-xs font-semibold text-white"
                      >
                        {indeks + 1}
                      </span>
                      <h3 className="font-heading text-lg font-semibold text-kamien-900">
                        {segment.od} → {segment.do}
                      </h3>
                      <p className="mt-2 leading-relaxed text-kamien-700">{segment.tekst}</p>
                      {segment.wskazowka && (
                        <p className="mt-3 rounded-lg border-l-2 border-las-400 bg-las-50 px-4 py-2.5 text-sm text-las-900">
                          <span className="font-semibold">Wskazówka: </span>
                          {segment.wskazowka}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {trasa.ciekawostki.length > 0 && (
              <section className="mt-16" aria-labelledby="ciekawostki">
                <h2 id="ciekawostki" className="text-sekcja font-semibold text-kamien-900">
                  Ciekawostki po drodze
                </h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {trasa.ciekawostki.map((ciekawostka) => (
                    <article
                      key={ciekawostka.tytul}
                      className="rounded-2xl border border-kamien-200 bg-kamien-50 p-6"
                    >
                      <Sparkles className="size-5 text-las-600" aria-hidden />
                      <h3 className="mt-3 font-heading text-lg font-semibold text-kamien-900">
                        {ciekawostka.tytul}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-kamien-700">
                        {ciekawostka.tekst}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {trasa.zdjecia.length > 0 && (
              <section className="mt-16" aria-labelledby="galeria">
                <h2 id="galeria" className="text-sekcja font-semibold text-kamien-900">
                  Galeria
                </h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {trasa.zdjecia.map((zdjecie) => (
                    <figure key={zdjecie.adres}>
                      <Image
                        src={zdjecie.adres}
                        alt={zdjecie.podpis ?? ''}
                        width={900}
                        height={600}
                        sizes="(max-width: 640px) 92vw, 44vw"
                        className="h-auto w-full rounded-2xl border border-kamien-200"
                      />
                      {zdjecie.podpis && (
                        <figcaption className="mt-2 text-sm text-kamien-600">
                          {zdjecie.podpis}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Kolumna boczna ──────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-kamien-200 bg-white p-6">
              <h2 className="font-heading text-lg font-semibold text-kamien-900">
                Punkty na trasie
              </h2>
              <ol className="mt-5 space-y-4">
                {trasa.punkty.map((punkt) => (
                  <li key={`${punkt.nazwa}-${punkt.czasNarastMin.tam}`} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: kolorTypu(punkt.typ) }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-kamien-900">{punkt.nazwa}</p>
                      <p className="text-sm text-kamien-500">
                        {etykietaTypu(punkt.typ)}
                        {punkt.wysokoscM !== null && <> · {metry(punkt.wysokoscM)} n.p.m.</>}
                        {punkt.czasNarastMin.tam > 0 && <> · {czas(punkt.czasNarastMin.tam)}</>}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 rounded-2xl bg-las-800 p-6 text-white">
              <Smartphone className="size-6" aria-hidden />
              <h2 className="mt-3 font-heading text-lg font-semibold">Nawiguj w aplikacji</h2>
              <p className="mt-2 text-sm text-white/80">
                Ta trasa jest w aplikacji z nawigacją GPS, mapą offline i trybem
                „Na szlaku", który pilnuje, żebyś nie zszedł ze ścieżki.
              </p>
              <PrzyciskiSklepow className="mt-5" wariant="jasny" />
            </div>

            {(trasa.zrodla.czasy || trasa.pttk) && (
              <p className="mt-6 text-xs leading-relaxed text-kamien-500">
                Opis, punkty i czasy: przewodnik „{ZRODLA.przewodnik.tytul}"
                {' '}({ZRODLA.przewodnik.autor}, {ZRODLA.przewodnik.wydawca},{' '}
                {ZRODLA.przewodnik.wydanie}).
                {trasa.zrodla.geometria && <> Ślad i wysokości: {trasa.zrodla.geometria}.</>}
              </p>
            )}
          </aside>
        </div>

        {powiazane.length > 0 && (
          <section className="mt-20 border-t border-kamien-200 pt-16" aria-labelledby="powiazane">
            <h2 id="powiazane" className="text-sekcja font-semibold text-kamien-900">
              Podobne trasy
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {powiazane.map((inna) => (
                <KafelekTrasy key={inna.id} trasa={naListe(inna)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

/**
 * Podobne trasy.
 *
 * Najpierw te, które dzielą z tą trasą punkty w terenie — bo turysta stojący
 * na Palenicy chce wiedzieć, co jeszcze stąd prowadzi. Dopiero potem trasy
 * z tej samej kategorii o zbliżonej długości.
 */
function znajdzPowiazane(trasa: Trasa): Trasa[] {
  const nazwyPunktow = new Set(trasa.punkty.map((p) => p.nazwa))

  return pobierzTrasy()
    .filter((inna) => inna.id !== trasa.id)
    .map((inna) => {
      const wspolne = inna.punkty.filter((p) => nazwyPunktow.has(p.nazwa)).length
      const taSamaKategoria = inna.kategoria === trasa.kategoria ? 1 : 0
      const roznicaDlugosci = Math.abs(inna.dlugoscKm - trasa.dlugoscKm)
      return { inna, ocena: wspolne * 3 + taSamaKategoria * 2 - roznicaDlugosci / 20 }
    })
    .sort((a, b) => b.ocena - a.ocena)
    .slice(0, 3)
    .map((wpis) => wpis.inna)
}

/**
 * Opis strukturalny trasy.
 *
 * Google nie ma typu „szlak turystyczny", więc opisujemy trasę jako
 * `TouristTrip` — zawiera dystans, czas trwania i listę odwiedzanych miejsc,
 * czyli dokładnie to, czym trasa jest. Okruszki idą osobnym obiektem.
 */
function DaneStrukturalne({ trasa }: { trasa: Trasa }) {
  const dane = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristTrip',
      name: trasa.nazwa,
      description: trasa.opis ?? undefined,
      url: `${PORTAL.adres}/szlaki/${trasa.slug}`,
      image: trasa.ilustracja ? `${PORTAL.adres}${trasa.ilustracja}` : undefined,
      touristType: 'Turystyka piesza',
      estimatedCost: { '@type': 'MonetaryAmount', value: 0, currency: 'PLN' },
      itinerary: {
        '@type': 'ItemList',
        numberOfItems: trasa.punkty.length,
        itemListElement: trasa.punkty.map((punkt, indeks) => ({
          '@type': 'ListItem',
          position: indeks + 1,
          item: {
            '@type': 'TouristAttraction',
            name: punkt.nazwa,
            geo: {
              '@type': 'GeoCoordinates',
              latitude: punkt.wspolrzedne[1],
              longitude: punkt.wspolrzedne[0],
              elevation: punkt.wysokoscM ?? undefined,
            },
          },
        })),
      },
      subjectOf: {
        '@type': 'CreativeWork',
        name: ZRODLA.przewodnik.tytul,
        author: { '@type': 'Person', name: ZRODLA.przewodnik.autor },
      },
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
          name: trasa.nazwa,
          item: `${PORTAL.adres}/szlaki/${trasa.slug}`,
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
