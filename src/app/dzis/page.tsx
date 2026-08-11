import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Smartphone } from 'lucide-react'

import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { ListaObiektow } from '@/components/dzis/lista-obiektow'
import { SiatkaDzis } from '@/components/dzis/siatka-dzis'
import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzTrasy } from '@/lib/dane/zrodlo'
import { pobierzDaneDnia } from '@/lib/dzis'
import { powodDnia, zaproponujTrasy } from '@/lib/dzis/propozycje'
import { pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

/**
 * „Dziś w Pieninach" — warunki na dziś w jednym miejscu.
 *
 * **Po co osobna strona, skoro pasek jest na głównej.** Bo to jedyna treść
 * na portalu, po którą wraca się codziennie, a więc jedyna, którą ktoś zechce
 * dodać do zakładek albo na ekran główny telefonu. Pasek pod powitaniem
 * odpowiada na pytanie zadane mimochodem; ta strona na pytanie zadane serio.
 *
 * **Dlaczego nie jest statyczna.** Pogoda i wodowskaz zmieniają się w ciągu
 * dnia, więc strona odświeża się razem z nimi — co kwadrans, tyle samo co
 * pamięć podręczna źródeł. Częściej nie ma po co, bo dane u dostawców i tak
 * się nie zmieniają.
 */

export const revalidate = 900

export const metadata: Metadata = {
  title: 'Dziś w Pieninach',
  description:
    'Pogoda w Szczawnicy i na Trzech Koronach, stan wody na Dunajcu, godziny ' +
    'otwarcia zamków i muzeów oraz propozycje tras na dzisiejszą pogodę.',
  alternates: { canonical: '/dzis' },
}

export default async function StronaDzis() {
  const dane = await pobierzDaneDnia()
  const trasy = pobierzTrasy()

  /*
    Propozycje tras liczymy tylko wtedy, gdy mamy pogodę. Bez niej nie ma
    z czego wyciągnąć wniosku, a trzy trasy „na chybił trafił" udawałyby
    poradę, której nikt nie udzielił.
  */
  const propozycja = dane.pogoda
    ? zaproponujTrasy(
        trasy,
        powodDnia(dane.pogoda.dolina, dane.pogoda.gran, dane.pogoda.porywy),
      )
    : null

  const wiadomosci = await pobierzWiadomosci(3)

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Dziś w Pieninach', adres: '/dzis' }]}
        tytul="Dziś w Pieninach"
        lead="Pogoda w dolinie i na grani, stan Dunajca, co jest dziś czynne i ile zostało światła. Wszystko z bieżących odczytów, nie z prognozy sprzed tygodnia."
      />

      <div className="obszar py-12 lg:py-16">
        <SiatkaDzis dane={dane} />

        {/*
          Lista obiektów zostaje pod siatką. Kafelek mówi „ile", ta lista
          mówi „które i do której" — a to jest pytanie, które pada zaraz po
          tamtym.
        */}
        <ListaObiektow dane={dane} />
      </div>

      {propozycja && propozycja.trasy.length > 0 && (
        <section className="sekcja bg-kamien-50">
          <div className="obszar">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-las-700">
              Co z tym zrobić
            </p>
            <h2 className="mt-3 font-heading text-sekcja font-semibold text-kamien-900">
              Trasy na dzisiejszą pogodę
            </h2>
            <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-kamien-600">
              {propozycja.wstep}
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {propozycja.trasy.map((trasa) => (
                <KafelekTrasy key={trasa.slug} trasa={trasa} />
              ))}
            </div>

            <Link
              href="/szlaki"
              className="group mt-8 inline-flex items-center gap-2 font-medium text-las-700 hover:text-las-800"
            >
              Wszystkie trasy
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </section>
      )}

      {wiadomosci.length > 0 && (
        <section className="sekcja">
          <div className="obszar">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="font-heading text-sekcja font-semibold text-kamien-900">
                Co słychać w Pieninach
              </h2>
              <Link
                href="/aktualnosci"
                className="text-sm font-medium text-las-700 hover:text-las-800"
              >
                Wszystkie wiadomości
              </Link>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {wiadomosci.map((wiadomosc) => (
                <KartaWiadomosci key={wiadomosc.slug} wiadomosc={wiadomosc} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/*
        Przypomnienie o aplikacji akurat tutaj, a nie byle gdzie: kto czyta
        warunki na dziś, najprawdopodobniej za chwilę wychodzi — a w Pieninach
        zasięg kończy się szybciej niż szlak.
      */}
      <section className="sekcja pt-0">
        <div className="obszar">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-kamien-200 bg-white px-6 py-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-las-50 text-las-700">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <p className="min-w-[16rem] flex-1 leading-relaxed text-kamien-700">
              <strong className="font-semibold text-kamien-900">Idziesz w góry?</strong> Mapa
              w aplikacji działa bez zasięgu — warto ją wczytać, póki jeszcze jest internet.
            </p>
            <Link
              href="/aplikacja"
              className="inline-flex items-center gap-2 rounded-full bg-las-800 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-900"
            >
              O aplikacji
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
