import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ChevronRight } from 'lucide-react'

import { pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'

/**
 * Mapa szlaków.
 *
 * **Dlaczego ta strona nie ma zwykłego nagłówka.** Wszystkie inne podstrony
 * zaczynają się od paska z tytułem, lidem i powietrzem wokół — bo na nich
 * treścią jest tekst. Tutaj treścią jest mapa i każdy centymetr zabrany na
 * wstęp jest centymetrem, na którym nie widać szlaku. Nagłówek zostaje, ale
 * ściśnięty do jednego rzędu: okruszki, tytuł i liczby w jednej linii.
 *
 * **Dlaczego mimo to nie usuwamy go zupełnie.** `h1` jest tu potrzebny —
 * i czytelnikowi, który musi wiedzieć, gdzie trafił, i wyszukiwarce, dla
 * której strona bez nagłówka to strona bez tematu.
 *
 * **Dlaczego ta strona nie trzyma się szerokości `obszar`.** Reszta portalu
 * ogranicza treść do 1280 pikseli, bo dłuższe wiersze tekstu czyta się gorzej —
 * to jest reguła typograficzna i ma sens wszędzie tam, gdzie treścią są zdania.
 * Mapa nie jest zdaniem. Każdy piksel szerokości to kawałek Pienin widoczny
 * bez przesuwania, a na szerokim ekranie ograniczenie zostawiało po obu
 * stronach po sto czterdzieści pikseli pustego tła. Zostaje wąski margines,
 * żeby ramka nie kleiła się do krawędzi okna.
 *
 * Sama mapa doładowuje się w przeglądarce — MapLibre sięga do `window` już
 * przy imporcie, więc przy budowaniu statycznym nie ma prawa się wykonać,
 * a przy okazji nie obciąża stron, na których mapy nie ma.
 */
const MapaSzlakow = dynamic(
  () => import('@/components/mapa/mapa-szlakow').then((m) => m.MapaSzlakow),
  {
    loading: () => (
      <div className="grid h-[60vh] place-items-center rounded-2xl bg-kamien-100 text-sm text-kamien-500 lg:h-full">
        Wczytywanie mapy…
      </div>
    ),
  },
)

export const metadata: Metadata = {
  title: 'Mapa szlaków Pienin',
  description:
    'Interaktywna mapa szlaków w Pieninach. Kliknij ślad na mapie albo wybierz ' +
    'trasę z listy, żeby zobaczyć jej długość, czas przejścia i pełny opis.',
  alternates: { canonical: '/mapa' },
}

export default function StronaMapy() {
  const trasy = pobierzTrasy()
  const zeSladem = trasy.filter((trasa) => trasa.slad !== null)
  // Suma z wszystkich tras, nie tylko tych ze śladem — na mapie są wszystkie,
  // cztery ostatnie jako punkt szczytu zamiast linii.
  const sumaKm = trasy.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  return (
    <>
      {/*
        Na dużym ekranie cała ta ramka ma wysokość okna pomniejszoną o pasek
        nawigacji (6rem), a mapa dostaje z niej wszystko, co zostanie po
        zwartym nagłówku. Jednostka `dvh` zamiast `vh` ze względu na telefony:
        `vh` liczy się tam względem okna z rozwiniętym paskiem adresu, więc
        przy zwiniętym treść wystawałaby poza ekran.

        Poniżej `lg` układ zostaje bez zmian — na wąskim ekranie mapa i tak
        zajmuje 60% wysokości, a lista idzie pod nią.
      */}
      <div className="lg:flex lg:h-[calc(100dvh-6rem)] lg:flex-col">
        <div className="w-full shrink-0 border-b border-kamien-200 bg-kamien-50 px-5 py-3 sm:px-8 lg:px-6">
          <nav aria-label="Okruszki" className="mb-2">
            <ol className="flex items-center gap-1.5 text-sm text-kamien-500">
              <li>
                <Link href="/" className="hover:text-las-700">
                  Start
                </Link>
              </li>
              <li className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5 text-kamien-400" aria-hidden />
                <span aria-current="page" className="text-kamien-700">
                  Mapa
                </span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-heading text-2xl font-semibold text-kamien-900">
              Mapa szlaków Pienin
            </h1>
            <p className="text-sm text-kamien-600">
              {trasy.length} szlaków, razem {kilometry(sumaKm)}. Kliknij ślad na mapie albo
              wybierz trasę z listy — druga strona zaznaczy się sama.
            </p>
          </div>
        </div>

        <div className="w-full px-5 py-6 sm:px-8 lg:min-h-0 lg:flex-1 lg:px-6 lg:py-4">
          <MapaSzlakow wysokosc="pelna" />
        </div>
      </div>

      {/*
        Nota o źródłach zostaje pod mapą, poza obszarem pełnoekranowym.
        Wymaga przewinięcia i to jest w porządku: licencja OpenStreetMap
        wymaga podania autorstwa, a nie pokazywania go bez przerwy — samo
        źródło podkładu jest dodatkowo w przycisku „i" na mapie.
      */}
      <div className="obszar py-10">
        <p className="max-w-[70ch] text-sm leading-relaxed text-kamien-500">
          Podkład mapy: OpenFreeMap na danych OpenStreetMap. Ślady pochodzą
          z zapisów GPS. Mapa nie zastępuje mapy papierowej — w terenie bez
          zasięgu korzystaj z map offline w aplikacji.
          {zeSladem.length < trasy.length && (
            <>
              {' '}
              {trasy.length - zeSladem.length} tras czeka jeszcze na
              zdigitalizowanie śladu; ich opisy są dostępne na liście szlaków.
            </>
          )}
        </p>
      </div>
    </>
  )
}
