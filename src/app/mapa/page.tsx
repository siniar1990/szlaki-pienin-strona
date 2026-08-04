import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { pobierzTrasy } from '@/lib/dane/zrodlo'
import { kilometry } from '@/lib/format'

/**
 * Mapa szlaków.
 *
 * Sama mapa doładowuje się w przeglądarce — MapLibre sięga do `window` już
 * przy imporcie, więc przy budowaniu statycznym nie ma prawa się wykonać,
 * a przy okazji nie obciąża stron, na których mapy nie ma.
 */
const MapaSzlakow = dynamic(
  () => import('@/components/mapa/mapa-szlakow').then((m) => m.MapaSzlakow),
  {
    loading: () => (
      <div className="grid h-[70vh] place-items-center rounded-2xl bg-kamien-100 text-sm text-kamien-500">
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
  const sumaKm = zeSladem.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Mapa', adres: '/mapa' }]}
        tytul="Mapa szlaków Pienin"
        lead={`${zeSladem.length} szlaków, razem ${kilometry(sumaKm)}. Kliknij ślad na mapie albo wybierz trasę z listy — druga strona zaznaczy się sama.`}
      />

      <div className="obszar py-10 lg:py-14">
        <MapaSzlakow />

        <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-kamien-500">
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
