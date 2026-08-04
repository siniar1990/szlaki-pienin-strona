'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { naSlug } from '@/lib/dane/slug'

/**
 * Wyszukiwarka portalu.
 *
 * Indeks jest wbudowany w stronę przy budowaniu i przeszukiwany w przeglądarce.
 * Przy kilkuset wpisach to działa natychmiast, a portal zostaje statyczny —
 * żadnego serwera wyszukiwania, żadnego zapytania sieciowego przy pisaniu.
 *
 * Porównujemy teksty przepuszczone przez `naSlug`, więc „Wąwóz Homole" znajdzie
 * się po wpisaniu „wawoz homole" — turysta z telefonem rzadko sięga po ogonki.
 */

export type WpisIndeksu = {
  nazwa: string
  adres: string
  rodzaj: string
  opis?: string
}

const RODZAJE_ETYKIETY: Record<string, string> = {
  trasa: 'Trasa',
  atrakcja: 'Atrakcja',
  kategoria: 'Kategoria',
  strona: 'Strona',
}

export function Wyszukiwarka({ indeks }: { indeks: WpisIndeksu[] }) {
  const [fraza, ustawFraze] = useState('')

  // Slug każdego wpisu liczymy raz, a nie przy każdym naciśnięciu klawisza.
  const przygotowany = useMemo(
    () => indeks.map((wpis) => ({ wpis, klucz: naSlug(`${wpis.nazwa} ${wpis.opis ?? ''}`) })),
    [indeks],
  )

  const wyniki = useMemo(() => {
    const szukane = naSlug(fraza)
    if (szukane.length < 2) return []

    return przygotowany
      .filter(({ klucz }) => klucz.includes(szukane))
      .sort((a, b) => {
        // Trafienia od początku nazwy przed trafieniami w środku opisu —
        // kto wpisuje „soko", szuka Sokolicy, a nie trasy, która ją wspomina.
        const aOdPoczatku = naSlug(a.wpis.nazwa).startsWith(szukane) ? 0 : 1
        const bOdPoczatku = naSlug(b.wpis.nazwa).startsWith(szukane) ? 0 : 1
        return aOdPoczatku - bOdPoczatku || a.wpis.nazwa.localeCompare(b.wpis.nazwa, 'pl')
      })
      .slice(0, 30)
      .map(({ wpis }) => wpis)
  }, [fraza, przygotowany])

  const zaKrotka = naSlug(fraza).length > 0 && naSlug(fraza).length < 2

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-kamien-400"
          aria-hidden
        />
        <input
          type="search"
          value={fraza}
          onChange={(zdarzenie) => ustawFraze(zdarzenie.target.value)}
          placeholder="Szukaj trasy, szczytu, schroniska…"
          aria-label="Szukaj w portalu"
          // Pole samo przejmuje uwagę po wejściu na stronę wyszukiwania —
          // to jedyny powód, dla którego ktoś tu trafia.
          autoFocus
          className="w-full rounded-2xl border border-kamien-300 bg-white py-4 pl-14 pr-5 text-lg text-kamien-900 shadow-miekki placeholder:text-kamien-400"
        />
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-kamien-500">
        {zaKrotka
          ? 'Wpisz co najmniej dwa znaki.'
          : wyniki.length > 0
            ? `Znaleziono ${wyniki.length}${wyniki.length === 30 ? '+' : ''}`
            : naSlug(fraza).length >= 2
              ? 'Nic nie pasuje. Spróbuj krótszego słowa.'
              : `Przeszukujemy ${indeks.length} tras, atrakcji i stron.`}
      </p>

      {wyniki.length > 0 && (
        <ul className="mt-6 divide-y divide-kamien-200 overflow-hidden rounded-2xl border border-kamien-200 bg-white">
          {wyniki.map((wynik) => (
            <li key={wynik.adres}>
              <Link
                href={wynik.adres}
                className="flex items-baseline justify-between gap-4 px-5 py-4 transition-colors hover:bg-kamien-50"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-kamien-900">{wynik.nazwa}</span>
                  {wynik.opis && (
                    <span className="mt-0.5 block truncate text-sm text-kamien-500">
                      {wynik.opis}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-kamien-100 px-2.5 py-1 text-xs text-kamien-600">
                  {RODZAJE_ETYKIETY[wynik.rodzaj] ?? wynik.rodzaj}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
