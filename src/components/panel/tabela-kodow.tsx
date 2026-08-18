'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

import { liczba } from '@/lib/format'

/**
 * Tabela tabliczek z sortowaniem po kliknięciu w nagłówek.
 *
 * Sortujemy w przeglądarce, nie parametrem w adresie: wszystkie wiersze i tak
 * są już na stronie (lista nie ma stronicowania), a klikanie po kolumnach to
 * przeglądanie, nie nawigacja — przeładowanie strony i ponowne liczenie
 * statystyk przy każdym kliknięciu byłoby czekaniem za darmo.
 *
 * Wiersze przychodzą z serwera z gotową etykietą „ile temu": policzona tam,
 * ma jedną chwilę odniesienia dla całej tabeli i nie rozjeżdża się przy
 * uzgadnianiu znaczników po stronie przeglądarki.
 */

export type WierszKodu = {
  kod: string
  nazwa: string
  nazwaLokalizacji: string | null
  status: string
  liczbaSkanow: number
  /** Chwila ostatniego skanu w milisekundach — do sortowania; `null` = nigdy. */
  ostatniSkanMs: number | null
  /** Etykieta „10 min temu" policzona na serwerze. */
  ostatniSkanEtykieta: string
}

const ETYKIETY_STATUSU: Record<string, { tekst: string; klasa: string }> = {
  AKTYWNY: { tekst: 'aktywna', klasa: 'bg-las-50 text-las-800 border-las-200' },
  NIEAKTYWNY: { tekst: 'nieaktywna', klasa: 'bg-kamien-100 text-kamien-600 border-kamien-300' },
  ZAPAS: { tekst: 'zapas', klasa: 'bg-amber-50 text-amber-900 border-amber-200' },
}

/*
  Status porządkujemy po cyklu życia tabliczki, nie alfabetycznie: najpierw
  wiszące w terenie, potem wydrukowany zapas, na końcu wyłączone. Alfabet
  dałby „aktywna, nieaktywna, zapas" — kolejność bez żadnej treści.
*/
const PORZADEK_STATUSU: Record<string, number> = { AKTYWNY: 0, ZAPAS: 1, NIEAKTYWNY: 2 }

type Kolumna = 'kod' | 'nazwa' | 'skany' | 'ostatniSkan' | 'status'

/*
  Pierwsze kliknięcie daje kierunek, po który się do kolumny przychodzi:
  skany i świeżość — od największych, teksty i status — od początku porządku.
  Drugie kliknięcie odwraca.
*/
const DOMYSLNIE_MALEJACO: Record<Kolumna, boolean> = {
  kod: false,
  nazwa: false,
  skany: true,
  ostatniSkan: true,
  status: false,
}

function porownaj(kolumna: Kolumna, a: WierszKodu, b: WierszKodu): number {
  switch (kolumna) {
    case 'kod':
      // `numeric`, żeby P002 stało przed P010 także wtedy, gdy numery
      // przestaną mieć równą liczbę cyfr.
      return a.kod.localeCompare(b.kod, 'pl', { numeric: true })
    case 'nazwa':
      return a.nazwa.localeCompare(b.nazwa, 'pl')
    case 'skany':
      return a.liczbaSkanow - b.liczbaSkanow
    case 'ostatniSkan':
      return (a.ostatniSkanMs ?? 0) - (b.ostatniSkanMs ?? 0)
    case 'status':
      return (PORZADEK_STATUSU[a.status] ?? 9) - (PORZADEK_STATUSU[b.status] ?? 9)
  }
}

type StanSortowania = { kolumna: Kolumna; malejaco: boolean }

function Naglowek({
  kolumna,
  etykieta,
  sortowanie,
  przestaw,
  wyrownanie = 'text-left',
  podtytul,
}: {
  kolumna: Kolumna
  etykieta: string
  sortowanie: StanSortowania
  przestaw: (kolumna: Kolumna) => void
  wyrownanie?: string
  podtytul?: string
}) {
  const aktywna = sortowanie.kolumna === kolumna
  const Znak = aktywna ? (sortowanie.malejaco ? ChevronDown : ChevronUp) : ChevronsUpDown
  return (
    <th
      scope="col"
      aria-sort={aktywna ? (sortowanie.malejaco ? 'descending' : 'ascending') : undefined}
      className={`px-5 py-3 font-semibold ${wyrownanie}`}
    >
      <button
        type="button"
        onClick={() => przestaw(kolumna)}
        className={`group inline-flex items-center gap-1 uppercase tracking-wider hover:text-kamien-800 ${
          aktywna ? 'text-kamien-800' : ''
        }`}
      >
        {etykieta}
        <Znak
          className={`size-3.5 shrink-0 ${aktywna ? '' : 'text-kamien-300 group-hover:text-kamien-500'}`}
          aria-hidden
        />
      </button>
      {podtytul && (
        <span className="block text-[11px] font-normal normal-case tracking-normal text-kamien-400">
          {podtytul}
        </span>
      )}
    </th>
  )
}

export function TabelaKodow({ wiersze, opisZakresu }: { wiersze: WierszKodu[]; opisZakresu: string }) {
  // Stan początkowy odpowiada kolejności, w której serwer oddaje listę —
  // dzięki temu strzałka od wejścia pokazuje prawdę, a nie „brak sortowania".
  const [sortowanie, ustawSortowanie] = useState<StanSortowania>({
    kolumna: 'skany',
    malejaco: true,
  })

  const przestaw = (kolumna: Kolumna) =>
    ustawSortowanie((stare) => ({
      kolumna,
      malejaco: stare.kolumna === kolumna ? !stare.malejaco : DOMYSLNIE_MALEJACO[kolumna],
    }))

  const posortowane = [...wiersze].sort((a, b) => {
    /*
      „Nigdy nie skanowana" ląduje na końcu przy obu kierunkach. Kierunek ma
      odwracać porządek wśród tabliczek, które żyją — a nie na zmianę chować
      i wywlekać na wierzch te, o których nie wiadomo nic.
    */
    if (sortowanie.kolumna === 'ostatniSkan' && (a.ostatniSkanMs === null) !== (b.ostatniSkanMs === null)) {
      return a.ostatniSkanMs === null ? 1 : -1
    }
    const roznica = porownaj(sortowanie.kolumna, a, b)
    return (
      (sortowanie.malejaco ? -roznica : roznica) ||
      // Stały dogrywkowy porządek po kodzie — równe wartości nie mogą się
      // tasować między kliknięciami.
      a.kod.localeCompare(b.kod, 'pl', { numeric: true })
    )
  })

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-kamien-200 bg-white">
      <table className="w-full min-w-[46rem] text-left">
        <thead className="border-b border-kamien-200 text-xs uppercase tracking-wider text-kamien-500">
          <tr>
            <Naglowek kolumna="kod" etykieta="Kod" sortowanie={sortowanie} przestaw={przestaw} />
            <Naglowek kolumna="nazwa" etykieta="Nazwa" sortowanie={sortowanie} przestaw={przestaw} />
            <Naglowek
              kolumna="skany"
              etykieta="Skany"
              sortowanie={sortowanie}
              przestaw={przestaw}
              wyrownanie="text-right"
              podtytul={opisZakresu}
            />
            <Naglowek
              kolumna="ostatniSkan"
              etykieta="Ostatni skan"
              sortowanie={sortowanie}
              przestaw={przestaw}
            />
            <Naglowek kolumna="status" etykieta="Status" sortowanie={sortowanie} przestaw={przestaw} />
          </tr>
        </thead>
        <tbody className="divide-y divide-kamien-100">
          {posortowane.map((k) => {
            const status = ETYKIETY_STATUSU[k.status]
            return (
              <tr key={k.kod} className="transition-colors hover:bg-kamien-50">
                <td className="px-5 py-4 font-mono text-sm font-semibold text-kamien-900">
                  <Link href={`/panel/kody/${k.kod}`} className="hover:text-las-700">
                    {k.kod}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/panel/kody/${k.kod}`}
                    className="font-medium text-kamien-900 hover:text-las-700"
                  >
                    {k.nazwa}
                  </Link>
                  {k.nazwaLokalizacji && (
                    <span className="block text-sm text-kamien-500">{k.nazwaLokalizacji}</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-kamien-900">
                  {k.liczbaSkanow > 0 ? liczba(k.liczbaSkanow) : '—'}
                </td>
                <td className="px-5 py-4 text-sm text-kamien-600">{k.ostatniSkanEtykieta}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.klasa}`}>
                    {status.tekst}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
