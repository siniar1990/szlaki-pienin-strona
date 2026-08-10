import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Car, Clock, MapPin, Mountain, Sparkles } from 'lucide-react'

import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { KartaAtrakcji } from '@/components/atrakcje/karta-atrakcji'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { podpisZdjecia } from '@/lib/dane/podpisy-zdjec'
import { maWlasneZdjecie, zdjecieMiejscowosci } from '@/lib/dane/zdjecia-miejscowosci'
import { pobierzDaneDnia } from '@/lib/dzis'
import { kilometry, odmien } from '@/lib/format'
import { metadaneStrony, obrazOG } from '@/lib/seo/open-graph'
import { MIEJSCOWOSCI, znajdzMiejscowosc } from '@/lib/tresc/miejscowosci'
import {
  atrakcjeMiejscowosci,
  czynneWMiejscowosci,
  notkaOMiejscowosci,
  trasyMiejscowosci,
} from '@/lib/tresc/zbiory-miejscowosci'
import { pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * Strona miejscowości.
 *
 * **Kolejność sekcji wynika z tego, po co ktoś tu przyszedł**, a nie z tego,
 * co mamy najładniejszego. Najpierw liczby i co czynne dziś — bo to zmienia
 * plan na najbliższe godziny. Potem trasy, potem atrakcje. Opis miejscowości
 * i dojazd na końcu: są ważne, ale czyta się je raz, a nie przed każdym
 * wyjściem.
 *
 * **Pusta sekcja nie powstaje.** Przy Krościenku nie ma sensu nagłówek
 * „Wiadomości z okolicy" nad niczym — brak sekcji jest uczciwy, pusta ramka
 * wygląda na zepsutą stronę.
 */

export const revalidate = 900

export function generateStaticParams() {
  return MIEJSCOWOSCI.map((miejscowosc) => ({ slug: miejscowosc.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const miejscowosc = znajdzMiejscowosc(slug)
  if (!miejscowosc) return {}

  return metadaneStrony({
    tytul: miejscowosc.nazwaPelna,
    opis: miejscowosc.lead,
    sciezka: `/miejscowosci/${miejscowosc.slug}`,
    obraz: obrazOG('miejscowosc', miejscowosc.slug),
  })
}

export default async function StronaMiejscowosci({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const miejscowosc = znajdzMiejscowosc(slug)
  if (!miejscowosc) notFound()

  const trasy = trasyMiejscowosci(miejscowosc)
  const atrakcje = atrakcjeMiejscowosci(miejscowosc)
  const zdjecie = zdjecieMiejscowosci(miejscowosc.slug, miejscowosc.zdjecieZastepcze)

  /*
    Zdjęcie pożyczone od atrakcji ma swój podpis w rejestrze podpisów —
    zdjęcie własne miejscowości nie ma go i mieć nie musi. Podpisujemy tylko
    to, co rzeczywiście jest cudze albo wymaga wyjaśnienia.
  */
  const podpis = maWlasneZdjecie(miejscowosc.slug)
    ? null
    : podpisZdjecia(miejscowosc.zdjecieZastepcze)

  const [daneDnia, wszystkieNotki] = await Promise.all([pobierzDaneDnia(), pobierzWiadomosci(20)])

  const czynne = czynneWMiejscowosci(miejscowosc, daneDnia.obiekty)
  const notki = wszystkieNotki.filter((notka) => notkaOMiejscowosci(miejscowosc, notka)).slice(0, 3)

  const lacznieKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  const liczby = [
    trasy.length > 0 && {
      ikona: Mountain,
      etykieta: 'tras stąd',
      wartosc: String(trasy.length),
    },
    atrakcje.length > 0 && {
      ikona: Sparkles,
      etykieta: 'atrakcji',
      wartosc: String(atrakcje.length),
    },
    trasy.length > 0 && {
      ikona: MapPin,
      etykieta: 'szlaków razem',
      wartosc: kilometry(lacznieKm),
    },
    czynne.length > 0 && {
      ikona: Clock,
      etykieta: 'czynne teraz',
      wartosc: `${czynne.filter((s) => s.stan === 'otwarte').length} z ${czynne.length}`,
    },
  ].filter((pozycja) => pozycja !== false)

  return (
    <>
      <NaglowekStrony
        okruszki={[
          { nazwa: 'Miejscowości', adres: '/miejscowosci' },
          { nazwa: miejscowosc.nazwa, adres: `/miejscowosci/${miejscowosc.slug}` },
        ]}
        tytul={miejscowosc.nazwaPelna}
        tytulOpis={miejscowosc.obejmuje && `obejmuje: ${miejscowosc.obejmuje.join(', ')}`}
        lead={miejscowosc.lead}
      />

      {zdjecie && (
        <figure className="relative">
          <div className="relative aspect-[21/9] max-h-[26rem] w-full bg-las-800">
            <Image
              src={zdjecie}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {/*
            Podpis z odnośnikiem do strony pliku, nie samo nazwisko. Licencje
            Creative Commons wymagają wskazania autora ORAZ dostępu do treści
            licencji — sama adnotacja „fot. Jan Kowalski" nie spełnia warunku.
          */}
          {podpis && (
            <figcaption className="obszar py-2 text-xs text-kamien-500">
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
      )}

      <div className="obszar py-12 lg:py-16">
        {/*
          ── Liczby ──────────────────────────────────────────────────────

          Kafelek bez wartości nie powstaje. Krościenko nie ma w tym portalu
          ani jednego obiektu z godzinami otwarcia, a „czynne teraz: —" jest
          gorsze niż brak kafelka: wygląda jak dane, których nie udało się
          wczytać, i podważa liczby stojące obok.
        */}
        {liczby.length > 0 && (
          <dl
            className={`grid gap-4 ${
              liczby.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {liczby.map((pozycja) => (
              <Liczba key={pozycja.etykieta} {...pozycja} />
            ))}
          </dl>
        )}

        {/* ── Co czynne dziś ────────────────────────────────────────────── */}
        {czynne.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
              Co jest tu dziś czynne
            </h2>
            <ul className="mt-6 divide-y divide-kamien-200 overflow-hidden rounded-2xl border border-kamien-200 bg-white">
              {czynne.map((stan) => (
                <li
                  key={stan.obiekt.slug}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5"
                >
                  <Link
                    href={`/atrakcje/${stan.obiekt.slug}`}
                    className="font-medium text-kamien-900 hover:text-las-700"
                  >
                    {stan.obiekt.nazwa}
                  </Link>
                  <span className="text-sm text-kamien-600">
                    {stan.stan === 'otwarte' && `otwarte do ${stan.dzisiaj!.zamkniecie}:00`}
                    {stan.stan === 'przed-otwarciem' && `otwiera się o ${stan.dzisiaj!.otwarcie}:00`}
                    {stan.stan === 'po-zamknieciu' && 'zamknięte na dziś'}
                    {stan.stan === 'nieczynne' && 'dziś nieczynne'}
                    {stan.stan === 'poza-sezonem' && 'poza sezonem'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-kamien-500">
              Godziny ze stron operatorów.{' '}
              <Link href="/dzis" className="font-medium text-las-700 hover:underline">
                Pełne warunki na dziś
              </Link>
            </p>
          </section>
        )}

        {/* ── Trasy ─────────────────────────────────────────────────────── */}
        {trasy.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
              Trasy stąd
            </h2>
            <p className="mt-3 max-w-[65ch] text-kamien-600">
              Od najkrótszej. Każda z opisem krok po kroku, profilem wysokości i punktami
              po drodze — te same, które prowadzi aplikacja.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trasy.slice(0, 9).map((trasa) => (
                <KafelekTrasy key={trasa.slug} trasa={trasa} />
              ))}
            </div>
            {trasy.length > 9 && (
              <Link
                href="/szlaki"
                className="group mt-8 inline-flex items-center gap-2 font-medium text-las-700 hover:text-las-800"
              >
                Pozostałe {trasy.length - 9}{' '}
                {odmien(trasy.length - 9, ['trasa', 'trasy', 'tras'])}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            )}
          </section>
        )}

        {/* ── Atrakcje ──────────────────────────────────────────────────── */}
        {atrakcje.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
              Co zobaczyć na miejscu
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {atrakcje.map((atrakcja) => (
                <KartaAtrakcji key={atrakcja.slug} atrakcja={atrakcja} />
              ))}
            </div>
          </section>
        )}

        {/* ── Opis i dojazd ─────────────────────────────────────────────── */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <section className="max-w-[46rem]">
            <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
              O {miejscowosc.wMiejscowniku}
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-kamien-700">
              {miejscowosc.opis.map((akapit) => (
                <p key={akapit.slice(0, 40)}>{akapit}</p>
              ))}
            </div>
          </section>

          <aside>
            <div className="rounded-2xl border border-kamien-200 bg-kamien-50 p-6">
              <h2 className="inline-flex items-center gap-2 font-heading text-base font-semibold text-kamien-900">
                <Car className="size-4" aria-hidden />
                Dojazd i parking
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-kamien-600">
                {miejscowosc.dojazd.map((punkt) => (
                  <li key={punkt.slice(0, 40)} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-las-600"
                    />
                    <span>{punkt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/mapa"
              className="group mt-6 flex items-center justify-between gap-4 rounded-2xl border border-kamien-200 px-5 py-4 transition-colors hover:border-las-300"
            >
              <span>
                <span className="block font-medium text-kamien-900">Zobacz na mapie</span>
                <span className="block text-sm text-kamien-500">wszystkie szlaki naraz</span>
              </span>
              <ArrowRight
                className="size-5 shrink-0 text-las-700 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </aside>
        </div>

        {/* ── Notki z okolicy ───────────────────────────────────────────── */}
        {notki.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
              Wiadomości z okolicy
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {notki.map((notka) => (
                <KartaWiadomosci key={notka.slug} wiadomosc={notka} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function Liczba({
  ikona: Ikona,
  etykieta,
  wartosc,
}: {
  ikona: React.ComponentType<{ className?: string }>
  etykieta: string
  wartosc: string
}) {
  return (
    <div className="rounded-2xl border border-kamien-200 bg-white p-5">
      <dt className="flex items-center gap-2 text-sm text-kamien-600">
        <Ikona className="size-4 text-las-700" aria-hidden />
        {etykieta}
      </dt>
      <dd className="mt-2 font-heading text-2xl font-semibold tabular-nums text-kamien-900">
        {wartosc}
      </dd>
    </div>
  )
}
