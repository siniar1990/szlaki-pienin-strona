import type { Metadata } from 'next'

import { MapaPortalu, type Kategoria } from '@/components/mapa/mapa-portalu'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import {
  pobierzAtrakcje,
  pobierzKapliczki,
  pobierzMiejsca,
  pobierzTrasy,
} from '@/lib/dane/zrodlo'
import { KOLORY_SZLAKOW, etykietaTypu, kolorTypu, metry } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Mapa Pienin',
  description:
    'Interaktywna mapa Pienin: ślady wszystkich tras, szczyty, punkty widokowe, ' +
    'schroniska, kapliczki oraz noclegi i restauracje w okolicy.',
  alternates: { canonical: '/mapa' },
}

export default function StronaMapy() {
  const trasy = pobierzTrasy()
  const atrakcje = pobierzAtrakcje()
  const miejsca = pobierzMiejsca()
  const kapliczki = pobierzKapliczki()

  const slady = trasy
    .filter((trasa) => trasa.slad !== null)
    .map((trasa) => ({
      id: `slad-${trasa.id}`,
      adres: trasa.slad!,
      kolor: KOLORY_SZLAKOW[trasa.szlaki[0]]?.tlo ?? '#2f5d43',
    }))

  /** Buduje warstwę z atrakcji jednego typu. */
  const zAtrakcji = (typ: string, domyslnie: boolean): Kategoria => {
    const wybrane = atrakcje.filter((atrakcja) => atrakcja.typ === typ)
    return {
      klucz: typ,
      etykieta: etykietaTypu(typ),
      kolor: kolorTypu(typ),
      domyslnie,
      markery: wybrane.map((atrakcja) => ({
        id: `${typ}-${atrakcja.slug}`,
        nazwa: atrakcja.nazwa,
        wspolrzedne: atrakcja.wspolrzedne,
        typ,
        kolor: kolorTypu(typ),
        adres: `/atrakcje/${atrakcja.slug}`,
        opis: [
          etykietaTypu(typ),
          atrakcja.wysokoscM !== null ? `${metry(atrakcja.wysokoscM)} n.p.m.` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    }
  }

  /** Buduje warstwę z punktów użytkowych (nocleg, sklep, restauracja). */
  const zMiejsc = (typ: string, domyslnie: boolean): Kategoria => ({
    klucz: `miejsce-${typ}`,
    etykieta: etykietaTypu(typ),
    kolor: kolorTypu(typ),
    domyslnie,
    markery: miejsca
      .filter((miejsce) => miejsce.typ === typ)
      .map((miejsce, indeks) => ({
        id: `${typ}-${indeks}`,
        nazwa: miejsce.nazwa,
        wspolrzedne: miejsce.wspolrzedne,
        typ,
        kolor: kolorTypu(typ),
        opis: etykietaTypu(typ),
      })),
  })

  const kategorie: Kategoria[] = [
    zAtrakcji('szczyt', true),
    zAtrakcji('punkt_widokowy', true),
    zAtrakcji('schronisko', true),
    zAtrakcji('zamek', true),
    zAtrakcji('przelecz', false),
    zAtrakcji('muzeum', false),
    zAtrakcji('kolej_linowa', false),
    zAtrakcji('zrodlo', false),
    {
      klucz: 'kapliczki',
      etykieta: 'Kapliczki i figury',
      kolor: kolorTypu('kapliczka'),
      domyslnie: false,
      markery: kapliczki.map((kapliczka, indeks) => ({
        id: `kapliczka-${indeks}`,
        nazwa: kapliczka.nazwa,
        wspolrzedne: kapliczka.wspolrzedne,
        typ: 'kapliczka',
        kolor: kolorTypu('kapliczka'),
        // Opisy kapliczek bywają długie — na mapie wystarczy początek.
        opis: kapliczka.opis ? `${kapliczka.opis.slice(0, 160)}…` : 'Kapliczka przydrożna',
      })),
    },
    zMiejsc('hotel', false),
    zMiejsc('restauracja', false),
    zMiejsc('sklep', false),
  ].filter((kategoria) => kategoria.markery.length > 0)

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Mapa', adres: '/mapa' }]}
        tytul="Mapa Pienin"
        lead={`Ślady ${slady.length} tras oraz ${atrakcje.length} atrakcji, ${kapliczki.length} kapliczek i ${miejsca.length} miejsc w okolicy. Włączaj warstwy po lewej.`}
      />

      <div className="obszar py-10 lg:py-14">
        <MapaPortalu slady={slady} kategorie={kategorie} />

        <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-kamien-500">
          Podkład mapy: OpenFreeMap na danych OpenStreetMap. Ślady tras pochodzą
          z zapisów GPS uzupełnionych o wysokości z modelu terenu EU-DEM (25 m).
          Mapa nie zastępuje mapy papierowej — w terenie bez zasięgu korzystaj
          z map offline w aplikacji.
        </p>
      </div>
    </>
  )
}
