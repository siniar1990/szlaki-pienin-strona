import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { zdjecieMiejscowosci } from '@/lib/dane/zdjecia-miejscowosci'
import { odmien } from '@/lib/format'
import { MIEJSCOWOSCI } from '@/lib/tresc/miejscowosci'
import { atrakcjeMiejscowosci, trasyMiejscowosci } from '@/lib/tresc/zbiory-miejscowosci'

/**
 * Rozdroże miejscowości.
 *
 * Trzy karty, bo tyle miejsc unosi treść tego portalu. Liczniki są prawdziwe
 * i liczone z danych — kafelek obiecujący „39 tras" musi po kliknięciu pokazać
 * trzydzieści dziewięć tras, inaczej pierwsza wizyta jest zarazem ostatnią.
 */

export const metadata: Metadata = {
  title: 'Miejscowości Pienin',
  description:
    'Szczawnica, Krościenko nad Dunajcem oraz Czorsztyn z Niedzicą — skąd wyruszyć, ' +
    'co zobaczyć na miejscu i którędy dojechać.',
  alternates: { canonical: '/miejscowosci' },
}

export default function StronaMiejscowosci() {
  const miejscowosci = MIEJSCOWOSCI.map((miejscowosc) => ({
    miejscowosc,
    liczbaTras: trasyMiejscowosci(miejscowosc).length,
    liczbaAtrakcji: atrakcjeMiejscowosci(miejscowosc).length,
    zdjecie: zdjecieMiejscowosci(miejscowosc.slug, miejscowosc.zdjecieZastepcze),
  }))

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Miejscowości', adres: '/miejscowosci' }]}
        tytul="Skąd wyruszyć w Pieniny"
        lead="Pieniny mają trzy bramy i każda otwiera się na coś innego: uzdrowisko ze szlakami w dwie strony, najkrótsze dojście na Trzy Korony i dwa zamki nad wodą."
      />

      <div className="obszar py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {miejscowosci.map(({ miejscowosc, liczbaTras, liczbaAtrakcji, zdjecie }) => (
            <article
              key={miejscowosc.slug}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-kamien-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-las-300 hover:shadow-uniesiony focus-within:-translate-y-1 focus-within:shadow-uniesiony"
            >
              <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-las-800">
                {zdjecie && (
                  <Image
                    src={zdjecie}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-heading text-xl font-semibold text-kamien-900">
                  {/*
                    Odnośnik rozciągnięty na całą kartę — klika się cały
                    kafelek, a nie same trzy słowa tytułu.
                  */}
                  <Link href={`/miejscowosci/${miejscowosc.slug}`} className="after:absolute after:inset-0">
                    {miejscowosc.nazwa}
                  </Link>
                </h2>

                {/*
                  Dwukropek zamiast przyimka. „z Szlachtowa, Jaworki" jest po
                  polsku błędem — przyimek wymusiłby narzędnik każdej nazwy,
                  a po dwukropku lista w mianowniku jest poprawna i czyta się
                  tak samo szybko.
                */}
                {miejscowosc.obejmuje && (
                  <p className="mt-1 text-sm text-kamien-500">
                    obejmuje: {miejscowosc.obejmuje.join(', ')}
                  </p>
                )}

                <p className="mt-3 flex-1 leading-relaxed text-kamien-600">{miejscowosc.lead}</p>

                <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-kamien-500">
                  <span className="font-semibold tabular-nums text-kamien-800">{liczbaTras}</span>
                  {odmien(liczbaTras, ['trasa', 'trasy', 'tras'])}
                  <span aria-hidden>·</span>
                  <span className="font-semibold tabular-nums text-kamien-800">
                    {liczbaAtrakcji}
                  </span>
                  {odmien(liczbaAtrakcji, ['atrakcja', 'atrakcje', 'atrakcji'])}
                </p>

                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-las-700">
                  Zobacz
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
            </article>
          ))}
        </div>

        {/*
          Uczciwe postawienie sprawy zamiast udawania, że Pieniny mają trzy
          wsie. Ktoś, kto szuka Sromowiec albo Kluszkowiec, ma tu od razu
          wiedzieć, gdzie ich szukać, zamiast wracać do wyszukiwarki.
        */}
        <p className="mt-12 max-w-[70ch] leading-relaxed text-kamien-600">
          Mniejsze wsie — Sromowce, Kluszkowce, Szlachtowa, Jaworki — opisujemy przy
          miejscowości, z którą łączy je dolina i dojazd, a nie granica gminy. Wszystkie
          atrakcje niezależnie od miejsca znajdziesz w{' '}
          <Link href="/atrakcje" className="font-medium text-las-700 hover:underline">
            katalogu atrakcji
          </Link>
          , a wszystkie trasy na{' '}
          <Link href="/mapa" className="font-medium text-las-700 hover:underline">
            mapie
          </Link>
          .
        </p>
      </div>
    </>
  )
}
