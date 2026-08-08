'use client'

import { useState } from 'react'

import {
  KATEGORIE_ATRAKCJI,
  LOKALIZACJE_ATRAKCJI,
  type KategoriaAtrakcji,
  type LokalizacjaAtrakcji,
} from '@/lib/tresc/kategorie-atrakcji'
import { odmien } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Filtry katalogu atrakcji.
 *
 * **Filtrowanie przez ukrywanie, nie przez przebudowę listy.** Wszystkie karty
 * i wszystkie nagłówki sekcji są renderowane na serwerze i siedzą w gotowym
 * HTML-u. Ten komponent dokłada tylko jedną regułę stylu, która chowa to,
 * co odpadło. Wygląda na obejście, a jest decyzją:
 *
 *  - wyszukiwarka dostaje komplet pięćdziesięciu siedmiu atrakcji z opisami,
 *    a nie pustą stronę czekającą na JavaScript,
 *  - przełączanie filtra jest natychmiastowe, bo nic się nie dociąga,
 *  - strona działa z wyłączonym JavaScriptem — filtry przestają wtedy działać,
 *    ale katalog pozostaje w całości czytelny.
 *
 * Dopasowanie robi CSS po atrybutach `data-kategorie` i `data-lokalizacja`,
 * więc React nie musi w ogóle znać kart, które filtruje.
 */

const WSZYSTKIE = 'wszystkie'

/** Do policzenia trafień i do komunikatu, gdy nic nie pasuje. */
export type PozycjaKatalogu = { kategorie: string[]; lokalizacja: string }

export function FiltryAtrakcji({ pozycje }: { pozycje: PozycjaKatalogu[] }) {
  const [kategoria, ustawKategorie] = useState<KategoriaAtrakcji | typeof WSZYSTKIE>(WSZYSTKIE)
  const [lokalizacja, ustawLokalizacje] = useState<LokalizacjaAtrakcji | typeof WSZYSTKIE>(
    WSZYSTKIE,
  )

  const pasujace = pozycje.filter(
    (p) =>
      (kategoria === WSZYSTKIE || p.kategorie.includes(kategoria)) &&
      (lokalizacja === WSZYSTKIE || p.lokalizacja === lokalizacja),
  ).length

  /*
    Reguła CSS budowana w locie. Alternatywą byłoby przejście po wszystkich
    kartach i ustawianie im stylu pojedynczo — przy pięćdziesięciu siedmiu
    kartach i dwóch filtrach to kilkaset operacji na DOM przy każdym
    kliknięciu. Jedna reguła załatwia to samo bez dotykania elementów.
  */
  const wybor =
    (kategoria === WSZYSTKIE ? '' : `[data-kategorie~="${kategoria}"]`) +
    (lokalizacja === WSZYSTKIE ? '' : `[data-lokalizacja="${lokalizacja}"]`)

  const regula = !wybor
    ? ''
    : [
        `#katalog-atrakcji [data-kategorie]:not(${wybor}) { display: none }`,
        /*
          Sekcja, w której nie została ani jedna karta, chowa się razem
          z nagłówkiem — inaczej zostawałby nagłówek nad pustym miejscem.
          Warunek sprawdza kartę pasującą do OBU filtrów naraz; osobne reguły
          na kategorię i miejsce zostawiłyby sekcję, w której jedna karta ma
          właściwą kategorię, a druga właściwe miejsce, ale żadna obu.
        */
        `#katalog-atrakcji section:not(:has(${wybor})) { display: none }`,
      ].join('\n')

  return (
    <>
      {regula && <style>{regula}</style>}

      <div className="border-y border-kamien-200 bg-white/80 backdrop-blur-sm">
        <div className="obszar space-y-3 py-4">
          <PasekFiltrow
            etykieta="Kategoria"
            pozycje={[
              { klucz: WSZYSTKIE, nazwa: `Wszystkie (${pozycje.length})` },
              ...KATEGORIE_ATRAKCJI.map((k) => ({ klucz: k.klucz, nazwa: k.nazwa })),
            ]}
            wybrany={kategoria}
            wybierz={(k) => ustawKategorie(k as KategoriaAtrakcji | typeof WSZYSTKIE)}
          />
          <PasekFiltrow
            etykieta="Miejsce"
            pozycje={[
              { klucz: WSZYSTKIE, nazwa: 'Wszystkie miejsca' },
              ...LOKALIZACJE_ATRAKCJI.map((l) => ({ klucz: l.klucz, nazwa: l.nazwa })),
            ]}
            wybrany={lokalizacja}
            wybierz={(l) => ustawLokalizacje(l as LokalizacjaAtrakcji | typeof WSZYSTKIE)}
            drugorzedny
          />

          {/* Liczba trafień pod paskiem — bez niej po zawężeniu filtrów nie
              wiadomo, czy strona jest krótka, bo tyle jest atrakcji, czy dlatego,
              że coś się zepsuło. */}
          <p aria-live="polite" className="text-xs text-kamien-500">
            {pasujace === 0
              ? 'Żadna atrakcja nie pasuje do tych filtrów.'
              : `${pasujace} ${odmien(pasujace, ['atrakcja', 'atrakcje', 'atrakcji'])}`}
          </p>
        </div>
      </div>
    </>
  )
}

/**
 * Jeden poziom filtrów.
 *
 * Na telefonie pasek przewija się w poziomie — chipy w kilku rzędach zjadłyby
 * pół ekranu, zanim zaczęłyby się atrakcje. `snap-x` sprawia, że przewijanie
 * zatrzymuje się na całych chipach, a nie w połowie napisu.
 */
function PasekFiltrow({
  etykieta,
  pozycje,
  wybrany,
  wybierz,
  drugorzedny = false,
}: {
  etykieta: string
  pozycje: { klucz: string; nazwa: string }[]
  wybrany: string
  wybierz: (klucz: string) => void
  drugorzedny?: boolean
}) {
  return (
    <div
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
      role="group"
      aria-label={etykieta}
    >
      {pozycje.map((pozycja) => {
        const aktywny = pozycja.klucz === wybrany
        return (
          <button
            key={pozycja.klucz}
            type="button"
            onClick={() => wybierz(pozycja.klucz)}
            aria-pressed={aktywny}
            className={cn(
              'shrink-0 snap-start whitespace-nowrap rounded-full border px-3.5 transition-colors',
              drugorzedny ? 'py-1 text-xs' : 'py-1.5 text-sm font-medium',
              aktywny
                ? 'border-las-700 bg-las-700 text-white'
                : 'border-kamien-300 bg-white text-kamien-700 hover:border-las-400 hover:bg-las-50',
            )}
          >
            {pozycja.nazwa}
          </button>
        )
      })}
    </div>
  )
}
