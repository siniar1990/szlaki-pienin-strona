import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarRange, Info, MapPin, Mountain, Sparkles } from 'lucide-react'

import { MapaDynamiczna } from '@/components/mapa/mapa-dynamiczna'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { podpisZdjecia } from '@/lib/dane/podpisy-zdjec'
import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import type { Atrakcja } from '@/lib/dane/typy'
import {
  naListe,
  pobierzAtrakcje,
  pobierzAtrakcje1,
  pobierzTrasePoId,
} from '@/lib/dane/zrodlo'
import { czas, etykietaTypu, kilometry, kolorTypu, metry } from '@/lib/format'
import { PORTAL, ZRODLA } from '@/lib/konfiguracja'
import { nazwaKategorii, nazwaLokalizacji } from '@/lib/tresc/kategorie-atrakcji'
import {
  ATRAKCJE_TURYSTYCZNE,
  type AtrakcjaTurystyczna,
  miejsceAtrakcji,
  znajdzAtrakcjeTurystyczna,
} from '@/lib/tresc/atrakcje-turystyczne'

/**
 * Strona atrakcji.
 *
 * Pod jednym adresem żyją dwa rodzaje wpisów:
 *
 *  • atrakcje turystyczne z katalogu redakcyjnego (spływ, pijalnia, zamki),
 *  • miejsca wyciągnięte z punktów tras (szczyty, przełęcze, schroniska).
 *
 * Katalog ma pierwszeństwo — jeśli coś jest opisane ręcznie, pokazujemy opis,
 * a nie samą nazwę z listy punktów. Wspólny adres jest celowy: turysta szuka
 * „Wąwozu Homole", a nie zastanawia się, z której szuflady portal go wyjmie.
 */

export function generateStaticParams() {
  const zKatalogu = ATRAKCJE_TURYSTYCZNE.map((atrakcja) => atrakcja.slug)
  const zestaw = new Set(zKatalogu)

  return [
    ...zKatalogu.map((slug) => ({ slug })),
    ...pobierzAtrakcje()
      .filter((atrakcja) => !zestaw.has(atrakcja.slug))
      .map((atrakcja) => ({ slug: atrakcja.slug })),
  ]
}

export async function generateMetadata({
  params,
}: PageProps<'/atrakcje/[slug]'>): Promise<Metadata> {
  const { slug } = await params

  const zKatalogu = znajdzAtrakcjeTurystyczna(slug)
  if (zKatalogu) {
    return {
      title: zKatalogu.nazwa,
      description: `${miejsceAtrakcji(zKatalogu)}. ${zKatalogu.skrot}`.slice(0, 300),
      alternates: { canonical: `/atrakcje/${zKatalogu.slug}` },
      openGraph: {
        type: 'article',
        title: `${zKatalogu.nazwa} — ${miejsceAtrakcji(zKatalogu)}`,
        description: zKatalogu.skrot,
        url: `${PORTAL.adres}/atrakcje/${zKatalogu.slug}`,
      },
    }
  }

  const atrakcja = pobierzAtrakcje1(slug)
  if (!atrakcja) return {}

  const opis = [
    etykietaTypu(atrakcja.typ),
    'w Pieninach.',
    atrakcja.wysokoscM !== null ? `Wysokość ${metry(atrakcja.wysokoscM)} n.p.m.` : '',
    `Prowadzi tu ${atrakcja.trasy.length} opisanych tras.`,
    atrakcja.ciekawostki[0]?.tekst ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    title: atrakcja.nazwa,
    description: opis.slice(0, 300),
    alternates: { canonical: `/atrakcje/${atrakcja.slug}` },
    openGraph: {
      type: 'article',
      title: `${atrakcja.nazwa} — ${etykietaTypu(atrakcja.typ).toLowerCase()} w Pieninach`,
      description: opis.slice(0, 300),
      url: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
    },
  }
}

export default async function StronaAtrakcji({ params }: PageProps<'/atrakcje/[slug]'>) {
  const { slug } = await params

  const zKatalogu = znajdzAtrakcjeTurystyczna(slug)
  if (zKatalogu) return <WidokKatalogu atrakcja={zKatalogu} />

  const atrakcja = pobierzAtrakcje1(slug)
  if (!atrakcja) notFound()

  return <WidokZTras atrakcja={atrakcja} />
}

/* ── Atrakcja z katalogu redakcyjnego ────────────────────────────────────── */

function WidokKatalogu({ atrakcja }: { atrakcja: AtrakcjaTurystyczna }) {
  const kategoria = atrakcja.kategorie[0]
  const zdjecie = zdjecieAtrakcji(atrakcja.slug)
  const podpis = zdjecie ? podpisZdjecia(atrakcja.slug) : null

  /*
    Trasy z aplikacji po identyfikatorze. `filter(Boolean)` odsiewa te, których
    w danych nie ma — trasa mogła zostać przemianowana albo usunięta
    w aplikacji, a wtedy lepiej pokazać o jedną mniej niż wywalić stronę.
  */
  const trasyTedy = (atrakcja.trasy ?? [])
    .map((id) => pobierzTrasePoId(id))
    .filter((trasa): trasa is NonNullable<typeof trasa> => trasa !== null)
  /*
    Pokrewne szukamy najpierw w tej samej kategorii i tej samej miejscowości —
    „co jeszcze mogę zrobić tutaj" jest częstszym pytaniem niż „co jeszcze jest
    w tej kategorii w całych Pieninach". Gdy w okolicy nic nie ma, dobieramy
    z kategorii bez względu na miejsce.
  */
  const wKategorii = ATRAKCJE_TURYSTYCZNE.filter(
    (inna) => inna.slug !== atrakcja.slug && inna.kategorie.includes(kategoria),
  )
  const pokrewne = [
    ...wKategorii.filter((inna) => inna.lokalizacja === atrakcja.lokalizacja),
    ...wKategorii.filter((inna) => inna.lokalizacja !== atrakcja.lokalizacja),
  ].slice(0, 3)

  const dane = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: atrakcja.nazwa,
      description: atrakcja.skrot,
      url: `${PORTAL.adres}/atrakcje/${atrakcja.slug}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: miejsceAtrakcji(atrakcja),
        addressRegion: 'małopolskie',
        addressCountry: 'PL',
      },
      containedInPlace: { '@type': 'Place', name: 'Pieniny' },
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dane) }}
      />

      <NaglowekStrony
        okruszki={[
          { nazwa: 'Atrakcje', adres: '/atrakcje' },
          { nazwa: atrakcja.nazwa, adres: `/atrakcje/${atrakcja.slug}` },
        ]}
        tytul={atrakcja.nazwa}
        lead={atrakcja.skrot}
        dodatek={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-kamien-300 bg-white px-3.5 py-1.5 text-sm text-kamien-700">
              <MapPin className="size-3.5" aria-hidden />
              {miejsceAtrakcji(atrakcja)}
            </span>
            {kategoria && (
              <span className="rounded-full border border-kamien-300 bg-white px-3.5 py-1.5 text-sm text-kamien-700">
                {nazwaKategorii(kategoria)}
              </span>
            )}
            {atrakcja.sezon && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-kamien-300 bg-white px-3.5 py-1.5 text-sm text-kamien-700">
                <CalendarRange className="size-3.5" aria-hidden />
                {atrakcja.sezon}
              </span>
            )}
          </div>
        }
      />

      {/*
        Zdjęcie na całą szerokość treści, nad opisem.

        Karta w katalogu pokazuje je w kadrze 4:3 i w miniaturze; tutaj jest
        miejsce, żeby zobaczyć miejsce naprawdę. Proporcje szersze niż na
        karcie, bo krajobraz górski czyta się w poziomie, a wysokie zdjęcie
        spychałoby opis pod krawędź ekranu.
      */}
      {zdjecie && (
        <div className="obszar pt-10 lg:pt-14">
          <figure className="overflow-hidden rounded-2xl">
            <Image
              src={zdjecie}
              alt={`${atrakcja.nazwa} — ${miejsceAtrakcji(atrakcja)}`}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="aspect-[16/9] w-full object-cover"
            />
            {podpis && (
              <figcaption className="mt-2 text-xs text-kamien-500">
                fot.{' '}
                <a
                  href={podpis.strona}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline underline-offset-2 hover:text-las-700"
                >
                  {podpis.autor}
                </a>{' '}
                · {podpis.licencja}
              </figcaption>
            )}
          </figure>
        </div>
      )}

      <div className="obszar py-14 lg:py-20">
        <div className="max-w-[68ch] space-y-5 text-[1.0625rem] leading-[1.75] text-kamien-700">
          {atrakcja.opis.length > 0 ? (
            atrakcja.opis.map((akapit) => <p key={akapit.slice(0, 40)}>{akapit}</p>)
          ) : (
            /*
              Brak opisu mówimy wprost, zamiast zostawiać pustą stronę.
              Alternatywą byłoby dopisanie kilku ogólnych zdań o tym, że
              „to popularna atrakcja w Pieninach" — czyli tekstu, który nic nie
              wnosi, a wygląda na treść. Puste miejsce z uczciwym zdaniem jest
              lepsze: czytelnik wie, na czym stoi, a my wiemy, co uzupełnić.
            */
            <p className="rounded-2xl border border-dashed border-kamien-300 px-6 py-5 text-kamien-500">
              Opisu tej atrakcji jeszcze nie przygotowaliśmy. Wolimy zostawić to
              miejsce puste, niż wpisać zdania, których nie sprawdziliśmy.
            </p>
          )}
        </div>

        {/*
          Trasy, które tędy prowadzą.

          Nazwy, długości i czasy pobieramy z danych aplikacji po
          identyfikatorze trasy — w katalogu atrakcji stoi wyłącznie lista
          identyfikatorów. Gdyby przepisać je obok, po pierwszej korekcie
          w telefonie strona zaczęłaby podawać nieaktualne liczby, a nikt by
          tego nie zauważył.
        */}
        {trasyTedy.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-semibold text-kamien-900">
              Trasy, które tędy prowadzą
            </h2>
            <p className="mt-1 text-sm text-kamien-600">
              {trasyTedy.length === 1
                ? 'Jedna opisana trasa z aplikacji przechodzi przez to miejsce.'
                : `${trasyTedy.length} opisane trasy z aplikacji przechodzą przez to miejsce.`}
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {trasyTedy.map((trasa) => (
                <li key={trasa.id}>
                  <Link
                    href={`/szlaki/${trasa.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-kamien-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-las-300 hover:shadow-uniesiony"
                  >
                    <span className="font-heading text-base font-semibold text-kamien-900 transition-colors group-hover:text-las-700">
                      {trasa.nazwa}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-kamien-600">
                      <span>{kilometry(trasa.dlugoscKm)}</span>
                      <span aria-hidden className="text-kamien-300">
                        ·
                      </span>
                      <span>{czas(trasa.czasMin.tam)}</span>
                      <span aria-hidden className="text-kamien-300">
                        ·
                      </span>
                      <span>↑ {metry(trasa.sumaPodejscM.tam)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          Uczciwa nota zamiast udawania wszechwiedzy. Portal opisuje, czym
          dana atrakcja jest — godziny, ceny i terminy zmieniają się co sezon
          i sprawdza się je u operatora, a nie na stronie o szlakach.
        */}
        <p className="mt-10 flex max-w-[68ch] items-start gap-3 rounded-xl border border-kamien-200 bg-kamien-50 p-5 text-sm leading-relaxed text-kamien-600">
          <Info className="mt-0.5 size-4 shrink-0 text-kamien-500" aria-hidden />
          <span>
            Opisujemy, czym jest to miejsce — bez godzin otwarcia, cen i terminów.
            Takie dane zmieniają się co sezon, więc przed wyjazdem sprawdź je
            u operatora atrakcji.
            {atrakcja.doPotwierdzenia && ' Szczegóły działania tej atrakcji potwierdź na miejscu.'}
          </span>
        </p>

        {pokrewne.length > 0 && (
          <section className="mt-20 border-t border-kamien-200 pt-14">
            <h2 className="text-sekcja font-semibold text-kamien-900">
              {kategoria ? nazwaKategorii(kategoria) : 'Podobne atrakcje'}
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pokrewne.map((inna) => (
                <li key={inna.slug}>
                  <Link
                    href={`/atrakcje/${inna.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-kamien-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony"
                  >
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-las-600">
                      <MapPin className="size-3.5" aria-hidden />
                      {inna.miejscowosc}
                    </p>
                    <h3 className="mt-3 font-heading text-lg font-semibold text-kamien-900 group-hover:text-las-700">
                      {inna.nazwa}
                    </h3>
                    <p className="mt-2 text-sm text-kamien-600">{inna.skrot}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  )
}

/* ── Miejsce wyciągnięte z punktów tras ──────────────────────────────────── */

function WidokZTras({ atrakcja }: { atrakcja: Atrakcja }) {
  const trasy = atrakcja.trasy
    .map((id) => pobierzTrasePoId(id))
    .filter((trasa) => trasa !== null)

  const dane = [
    {
      '@context': 'https://schema.org',
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dane) }}
      />

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
                      <p className="mt-3 leading-relaxed text-kamien-700">{ciekawostka.tekst}</p>
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
                  osobnego opisu. Poniżej znajdziesz trasy, którymi da się tu dojść,
                  oraz położenie na mapie.
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
              <h2 className="mt-3 font-heading text-lg font-semibold text-kamien-900">W skrócie</h2>
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
