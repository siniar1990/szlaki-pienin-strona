'use client'

import { useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'

import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import type { TrasaNaLiscie, Trudnosc } from '@/lib/dane/typy'
import { TRUDNOSC_ETYKIETY, kilometry } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Lista tras z filtrowaniem i sortowaniem.
 *
 * Filtruje po stronie przeglądarki na gotowej tablicy — przy 53 trasach to
 * ułamek milisekundy, a strona zostaje statyczna i indeksowalna. Serwer
 * wysyła komplet tras w HTML-u, więc wyszukiwarka i osoba z wyłączonym
 * JavaScriptem widzą wszystko; filtry są udogodnieniem, nie warunkiem
 * dostępu do treści.
 */

type Sortowanie = 'nazwa' | 'dlugosc-rosnaco' | 'dlugosc-malejaco' | 'czas-rosnaco'

const SORTOWANIA: { wartosc: Sortowanie; etykieta: string }[] = [
  { wartosc: 'nazwa', etykieta: 'Alfabetycznie' },
  { wartosc: 'dlugosc-rosnaco', etykieta: 'Od najkrótszej' },
  { wartosc: 'dlugosc-malejaco', etykieta: 'Od najdłuższej' },
  { wartosc: 'czas-rosnaco', etykieta: 'Od najszybszej' },
]

const TRUDNOSCI: Trudnosc[] = ['latwa', 'srednia', 'trudna']

export function ListaTras({ trasy }: { trasy: TrasaNaLiscie[] }) {
  const [trudnosci, ustawTrudnosci] = useState<Set<Trudnosc>>(new Set())
  const [tylkoPetle, ustawTylkoPetle] = useState(false)
  const [sortowanie, ustawSortowanie] = useState<Sortowanie>('nazwa')

  const widoczne = useMemo(() => {
    const wybrane = trasy.filter(
      (trasa) =>
        (trudnosci.size === 0 || trudnosci.has(trasa.trudnosc)) &&
        (!tylkoPetle || trasa.petla),
    )

    const porownaj: Record<Sortowanie, (a: TrasaNaLiscie, b: TrasaNaLiscie) => number> = {
      nazwa: (a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'),
      'dlugosc-rosnaco': (a, b) => a.dlugoscKm - b.dlugoscKm,
      'dlugosc-malejaco': (a, b) => b.dlugoscKm - a.dlugoscKm,
      'czas-rosnaco': (a, b) => a.czasMin.tam - b.czasMin.tam,
    }

    return [...wybrane].sort(porownaj[sortowanie])
  }, [trasy, trudnosci, tylkoPetle, sortowanie])

  const przelaczTrudnosc = (trudnosc: Trudnosc) => {
    ustawTrudnosci((poprzednie) => {
      const nowe = new Set(poprzednie)
      if (nowe.has(trudnosc)) nowe.delete(trudnosc)
      else nowe.add(trudnosc)
      return nowe
    })
  }

  const sumaKm = widoczne.reduce((suma, trasa) => suma + trasa.dlugoscKm, 0)

  return (
    <>
      <div className="flex flex-col gap-5 rounded-2xl border border-kamien-200 bg-kamien-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Filtruj trasy</legend>
          <span className="mr-1 flex items-center gap-2 text-sm font-medium text-kamien-600">
            <SlidersHorizontal className="size-4" aria-hidden />
            Trudność
          </span>

          {TRUDNOSCI.map((trudnosc) => {
            const wybrana = trudnosci.has(trudnosc)
            return (
              <button
                key={trudnosc}
                type="button"
                // `aria-pressed` zamiast samego koloru — czytnik ekranu musi
                // wiedzieć, że przycisk jest wciśnięty, a nie tylko inny.
                aria-pressed={wybrana}
                onClick={() => przelaczTrudnosc(trudnosc)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  wybrana
                    ? 'border-las-600 bg-las-600 text-white'
                    : 'border-kamien-300 bg-white text-kamien-700 hover:border-las-400',
                )}
              >
                {TRUDNOSC_ETYKIETY[trudnosc]}
              </button>
            )
          })}

          <button
            type="button"
            aria-pressed={tylkoPetle}
            onClick={() => ustawTylkoPetle((wartosc) => !wartosc)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              tylkoPetle
                ? 'border-las-600 bg-las-600 text-white'
                : 'border-kamien-300 bg-white text-kamien-700 hover:border-las-400',
            )}
          >
            Tylko pętle
          </button>
        </fieldset>

        <div className="flex items-center gap-2">
          <label htmlFor="sortowanie" className="text-sm font-medium text-kamien-600">
            Sortuj
          </label>
          <select
            id="sortowanie"
            value={sortowanie}
            onChange={(zdarzenie) => ustawSortowanie(zdarzenie.target.value as Sortowanie)}
            className="rounded-lg border border-kamien-300 bg-white px-3 py-2 text-sm text-kamien-800"
          >
            {SORTOWANIA.map((opcja) => (
              <option key={opcja.wartosc} value={opcja.wartosc}>
                {opcja.etykieta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/*
        Komunikat o liczbie wyników w obszarze „live": po kliknięciu filtra
        czytnik ekranu sam przeczyta, ile tras zostało. Bez tego zmiana listy
        jest dla niewidzącego użytkownika niewidoczna w sensie dosłownym.
      */}
      <p aria-live="polite" className="mt-5 text-sm text-kamien-600">
        {widoczne.length === trasy.length
          ? `${trasy.length} tras · razem ${kilometry(sumaKm)}`
          : `${widoczne.length} z ${trasy.length} tras · razem ${kilometry(sumaKm)}`}
      </p>

      {widoczne.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {widoczne.map((trasa, indeks) => (
            <KafelekTrasy key={trasa.id} trasa={trasa} priorytet={indeks < 3} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-kamien-300 p-12 text-center text-kamien-500">
          Żadna trasa nie pasuje do wybranych filtrów. Spróbuj odznaczyć któryś.
        </p>
      )}
    </>
  )
}
