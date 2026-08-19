import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Ban, Dog, Footprints, Info, MapPin } from 'lucide-react'

import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { obszaryBezPsow } from '@/lib/dane/obszary'
import { KATEGORIE_TRAS } from '@/lib/dane/kategorie'
import { PORTAL } from '@/lib/konfiguracja'

/**
 * Trasy z psem — mapa, nie lista.
 *
 * **Dlaczego ta jedna kategoria ma własną stronę.** Wszystkie pozostałe
 * odpowiadają na pytanie „które trasy", więc listą kafelków mówią wszystko,
 * co mają do powiedzenia. Ta odpowiada na pytanie „gdzie NIE wolno", a tego
 * lista nie pokaże: zakaz jest obszarem na mapie, nie cechą trasy. Aplikacja
 * rozstrzygnęła to tak samo — tam „Trasy z psem" to też mapa z zaznaczonym
 * parkiem, a nie lista (`lib/data/providers.dart`).
 *
 * Trasa Next.js statyczna wygrywa z dynamiczną `[kategoria]`, więc ten plik
 * przejmuje adres `/szlaki/kategorie/z-psem` bez żadnego przełącznika
 * w tamtej stronie. Kategoria zostaje w `KATEGORIE_APLIKACJI`, bo kafelek na
 * stronie głównej i wpis w mapie witryny nadal mają sens.
 */

const MapaSzlakow = dynamic(
  () => import('@/components/mapa/mapa-szlakow').then((m) => m.MapaSzlakow),
  {
    loading: () => (
      <div className="grid h-[60vh] place-items-center rounded-2xl bg-kamien-100 text-sm text-kamien-500">
        Wczytywanie mapy…
      </div>
    ),
  },
)

export const metadata: Metadata = {
  title: 'W Pieniny z psem — gdzie wolno, a gdzie nie',
  description:
    'Mapa Pienin z zaznaczonymi obszarami, w które nie wolno wejść z psem: park ' +
    'narodowy, rezerwaty Wąwóz Homole i Biała Woda, wzgórze zamkowe w Czorsztynie. ' +
    'Gdzie zostaje miejsce na spacer i o czym pamiętać.',
  alternates: { canonical: '/szlaki/kategorie/z-psem' },
}

/** Gdzie z psem można — nazwane wprost, bo mapa pokazuje głównie zakazy. */
const GDZIE_MOZNA = [
  {
    nazwa: 'Małe Pieniny poza rezerwatami',
    opis:
      'Grzbiet od Szafranówki po Wysoką leży poza parkiem narodowym. Zakazane ' +
      'są tylko wcięcia rezerwatów — Homole i Biała Woda — które widać na mapie.',
  },
  {
    nazwa: 'Dolina Grajcarka',
    opis:
      'Deptak nad potokiem i droga w stronę Jaworek. Płasko, blisko wody, ' +
      'bez podejść — dobre na pierwszy dzień i na upał.',
  },
  {
    nazwa: 'Velo Dunajec i Droga Pienińska',
    opis:
      'Asfalt i szuter wzdłuż Dunajca. Droga Pienińska prowadzi skrajem parku, ' +
      'więc trzymaj się jezdni i nie schodź na ścieżki w górę zbocza.',
  },
  {
    nazwa: 'Lawendowe Wzgórza i okolice Szczawnicy',
    opis: 'Widokowe wzniesienia nad miastem, poza granicami ochrony.',
  },
]

export default function StronaZPsem() {
  const obszary = obszaryBezPsow()

  const daneOkruszkow = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Start', item: PORTAL.adres },
      { '@type': 'ListItem', position: 2, name: 'Szlaki', item: `${PORTAL.adres}/szlaki` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Trasy z psem',
        item: `${PORTAL.adres}/szlaki/kategorie/z-psem`,
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
          { nazwa: 'Trasy z psem', adres: '/szlaki/kategorie/z-psem' },
        ]}
        tytul="W Pieniny z psem"
        lead={
          'W Pienińskim Parku Narodowym psy są zakazane — także na smyczy i także ' +
          'na szlaku. Zamiast listy tras pokazujemy mapę: na czerwono obszary, ' +
          'w które wejść nie wolno, pod spodem wszystkie szlaki okolicy.'
        }
        dodatek={
          <ul className="flex flex-wrap gap-2">
            {KATEGORIE_TRAS.filter((inna) => inna.slug !== 'z-psem')
              .slice(0, 6)
              .map((inna) => (
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

      {/*
        Mapa idzie pełną szerokością, jak na `/mapa`: każdy piksel to kawałek
        Pienin widoczny bez przesuwania. Reszta strony wraca do `obszar`, bo
        to już są zdania i te czyta się w węższej kolumnie.
      */}
      <div className="px-5 pt-10 sm:px-8 lg:px-6">
        <MapaSzlakow zLista={false} zZakazamiDlaPsow />

        <p className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-kamien-600">
          <span className="inline-flex items-center gap-2">
            {/* Ta sama czerwień i to samo kreskowanie co na mapie — legenda ma
                wyglądać jak rzecz, którą opisuje. */}
            <span
              aria-hidden
              className="inline-block size-4 rounded-[3px] border border-[#C62828]"
              style={{
                backgroundColor: 'rgb(198 40 40 / 0.2)',
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgb(198 40 40 / 0.85) 0 2px, transparent 2px 6px)',
              }}
            />
            Zakaz wprowadzania psów
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4 text-kamien-500" aria-hidden />
            Kliknij ślad, żeby otworzyć opis trasy
          </span>
        </p>
      </div>

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="min-w-0">
            <h2 className="text-sekcja font-semibold text-kamien-900">
              Gdzie z psem nie wolno
            </h2>
            <p className="mt-3 text-kamien-600">
              Cztery obszary — te same, które zaznacza mapa. Zakaz nie kończy się na
              parku narodowym, a dwa rezerwaty leżą całkiem poza jego granicą.
            </p>

            <ul className="mt-8 space-y-4">
              {obszary.map((obszar) => (
                <li
                  key={obszar.nazwa}
                  className="rounded-2xl border border-kamien-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <Ban className="mt-0.5 size-5 shrink-0 text-[#C62828]" aria-hidden />
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-kamien-900">
                        {obszar.nazwa}
                      </h3>
                      <p className="mt-1 text-sm text-kamien-600">{obszar.powod}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 text-sekcja font-semibold text-kamien-900">
              Gdzie z psem można
            </h2>
            <p className="mt-3 text-kamien-600">
              Zostaje więcej, niż się wydaje po spojrzeniu na mapę. Pieniny to nie
              tylko park narodowy — Małe Pieniny i doliny leżą poza ochroną ścisłą.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {GDZIE_MOZNA.map((miejsce) => (
                <li
                  key={miejsce.nazwa}
                  className="rounded-2xl border border-kamien-200 bg-white p-5"
                >
                  <Footprints className="size-5 text-las-600" aria-hidden />
                  <h3 className="mt-3 font-heading text-lg font-semibold text-kamien-900">
                    {miejsce.nazwa}
                  </h3>
                  <p className="mt-1.5 text-sm text-kamien-600">{miejsce.opis}</p>
                </li>
              ))}
            </ul>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-kamien-200 bg-white p-6">
              <Dog className="size-6 text-las-600" aria-hidden />
              <h2 className="mt-3 font-heading text-lg font-semibold text-kamien-900">
                Zanim wyjdziesz z psem
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-kamien-600">
                <li>
                  <strong className="font-medium text-kamien-800">Smycz nie znosi zakazu.</strong>{' '}
                  W parku narodowym i w rezerwatach pies nie może być nawet
                  prowadzony — nie ma tu wersji {'„na krótkiej smyczy"'}.
                </li>
                <li>
                  <strong className="font-medium text-kamien-800">Sprawdź trasę na mapie.</strong>{' '}
                  Szlak potrafi wejść w czerwony obszar tylko na krótkim odcinku,
                  a to wystarczy, żeby zawrócić.
                </li>
                <li>
                  <strong className="font-medium text-kamien-800">Owce i bacówki.</strong> Na
                  halach pasą się owce pod opieką psów pasterskich. Obejdź stado
                  z daleka i weź psa na smycz, zanim was zobaczą.
                </li>
                <li>
                  <strong className="font-medium text-kamien-800">Woda.</strong> Grzbiety Małych
                  Pienin są suche — potoki zostają w dolinach. W upał zabierz
                  wodę także dla psa.
                </li>
                <li>
                  <strong className="font-medium text-kamien-800">Spływ Dunajcem.</strong>{' '}
                  O psa na tratwie pytaj z góry u flisaków — to ich decyzja,
                  nie reguła portalu.
                </li>
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-kamien-200 bg-kamien-50 p-6">
              <Info className="size-5 text-kamien-500" aria-hidden />
              <h2 className="mt-3 font-heading text-base font-semibold text-kamien-900">
                Skąd te granice
              </h2>
              <p className="mt-2 text-sm text-kamien-600">
                Obrysy pochodzą z OpenStreetMap (licencja ODbL) i są tymi samymi,
                których używa aplikacja. Są szczegółowe — sam park ma blisko
                tysiąc czterysta punktów — żeby nie zamykać ścieżek biegnących
                tuż obok granicy.
              </p>
              <p className="mt-3 text-sm text-kamien-500">
                Przepisy sprawdź przed wyjściem u źródła: zakazy bywają
                zmieniane, a mapa jest pomocą w planowaniu, nie dokumentem.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
