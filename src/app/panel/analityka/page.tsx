import type { Metadata } from 'next'
import Link from 'next/link'

import { TabelaOdslon } from '@/components/panel/tabela-odslon'
import { najczestsze, suma } from '@/lib/analityka/statystyki'
import { pobierzAtrakcje, pobierzTrasy } from '@/lib/dane/zrodlo'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'
import { baza } from '@/lib/baza'
import { liczba, odmien } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Odsłony',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/** Okresy do wyboru. Trzydzieści dni jako domyślne — jeden pełny miesiąc. */
const OKRESY = [
  { dni: 7, etykieta: '7 dni' },
  { dni: 30, etykieta: '30 dni' },
  { dni: 90, etykieta: '90 dni' },
  { dni: 365, etykieta: 'rok' },
] as const

/**
 * Portal analityczny — co ludzie na portalu oglądają.
 *
 * **Dlaczego przewodnik i aktualności są rozdzielone.** Bo to dwa różne
 * pytania i dwie różne decyzje. Ranking atrakcji i szlaków mówi, które opisy
 * warto rozbudować i gdzie postawić tabliczkę. Ranking aktualności mówi, jakie
 * tematy czyta się w tym dziale — a to wpływa na kryteria wyboru artykułów
 * przez redakcję. Wspólna lista mieszałaby jedno z drugim: notka z dnia
 * publikacji zawsze przebije opis szlaku, który zbiera odsłony od roku.
 */
export default async function StronaAnalityki({ searchParams }: PageProps<'/panel/analityka'>) {
  const parametry = await searchParams
  const zadane = Number(Array.isArray(parametry.dni) ? parametry.dni[0] : parametry.dni)
  const dni = OKRESY.some((okres) => okres.dni === zadane) ? zadane : 30

  const [atrakcje, szlaki, aktualnosci, pobrania, notki] = await Promise.all([
    najczestsze('ATRAKCJA', dni, 15),
    najczestsze('SZLAK', dni, 15),
    najczestsze('AKTUALNOSC', dni, 15),
    suma('POBRANIE', dni),
    baza.wiadomosc.findMany({
      where: { stan: 'OPUBLIKOWANA' },
      select: { slug: true, tytul: true },
    }),
  ])

  /*
    Ładne nazwy zamiast samych adresów. Katalog atrakcji i trasy są w plikach
    projektu, więc nie kosztuje to ani jednego zapytania; tytuły notek trzeba
    dobrać z bazy, bo tam mieszkają.
  */
  const nazwyAtrakcji = new Map<string, string>([
    ...ATRAKCJE_TURYSTYCZNE.map((a) => [a.slug, a.nazwa] as const),
    ...pobierzAtrakcje().map((a) => [a.slug, a.nazwa] as const),
  ])
  const nazwySzlakow = new Map(pobierzTrasy().map((trasa) => [trasa.slug, trasa.nazwa]))
  const nazwyNotek = new Map(notki.map((notka) => [notka.slug, notka.tytul]))

  const razemPrzewodnik =
    atrakcje.reduce((s, p) => s + p.liczba, 0) + szlaki.reduce((s, p) => s + p.liczba, 0)
  const razemAktualnosci = aktualnosci.reduce((s, p) => s + p.liczba, 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">Odsłony</h1>

        <nav aria-label="Zakres czasu" className="flex gap-1 rounded-full bg-kamien-100 p-1">
          {OKRESY.map((okres) => (
            <Link
              key={okres.dni}
              href={`/panel/analityka?dni=${okres.dni}`}
              className={
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                (okres.dni === dni
                  ? 'bg-white text-kamien-900 shadow-sm'
                  : 'text-kamien-600 hover:text-kamien-900')
              }
            >
              {okres.etykieta}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kafelek
          etykieta="Przewodnik"
          wartosc={razemPrzewodnik}
          opis="odsłony atrakcji i szlaków"
        />
        <Kafelek
          etykieta="Aktualności"
          wartosc={razemAktualnosci}
          opis={`${notki.length} ${odmien(notki.length, ['opublikowana notka', 'opublikowane notki', 'opublikowanych notek'])}`}
        />
        <Kafelek
          etykieta="Pobrania aplikacji"
          wartosc={pobrania}
          opis="kliknięcia w odznaki sklepów"
          wyroznij
        />
      </div>

      {/*
        Uczciwość co do tego, czego te liczby nie obejmują. Bez tego zdania
        ktoś kiedyś porówna je z liczbą instalacji w App Store Connect
        i uzna, że system liczy źle.
      */}
      <p className="mt-4 max-w-[80ch] text-sm leading-relaxed text-kamien-500">
        Liczymy odsłony, nie ludzi: bez ciasteczek, bez adresów IP i bez
        identyfikatorów. Jedna osoba, która wróciła trzy razy, to trzy odsłony.
        Odwiedzający z blokadą skryptów nie są liczeni, więc wartości bezwzględne są
        przybliżeniem — proporcje między podstronami pozostają wiarygodne.
        {'„Pobrania”'} to kliknięcia w odznakę sklepu, a nie faktyczne instalacje;
        tych ostatnich portal nie widzi i widzieć nie może.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <TabelaOdslon
          tytul="Atrakcje"
          opis="Które miejsca z katalogu ludzie otwierają najczęściej."
          pozycje={atrakcje}
          adres="/atrakcje"
          nazwy={nazwyAtrakcji}
        />
        <TabelaOdslon
          tytul="Szlaki"
          opis="Które trasy z przewodnika czytają najczęściej."
          pozycje={szlaki}
          adres="/szlaki"
          nazwy={nazwySzlakow}
        />
      </div>

      <div className="mt-6">
        <TabelaOdslon
          tytul="Aktualności"
          opis="Które notki są czytane. To najlepszy sygnał, jakich tematów szukać dalej."
          pozycje={aktualnosci}
          adres="/aktualnosci"
          nazwy={nazwyNotek}
        />
      </div>
    </>
  )
}

function Kafelek({
  etykieta,
  wartosc,
  opis,
  wyroznij = false,
}: {
  etykieta: string
  wartosc: number
  opis: string
  wyroznij?: boolean
}) {
  return (
    <div
      className={
        'rounded-2xl border p-5 ' +
        (wyroznij ? 'border-las-200 bg-las-50' : 'border-kamien-200 bg-white')
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-kamien-500">{etykieta}</p>
      <p
        className={
          'mt-2 font-heading text-3xl font-semibold tabular-nums ' +
          (wyroznij ? 'text-las-800' : 'text-kamien-900')
        }
      >
        {liczba(wartosc)}
      </p>
      <p className="mt-1 text-sm text-kamien-500">{opis}</p>
    </div>
  )
}
