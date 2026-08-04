'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'

import type { MarkerMapy, WarstwaSladu } from './mapa'
import { cn } from '@/lib/utils'

const Mapa = dynamic(() => import('./mapa').then((m) => m.Mapa), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center bg-kamien-100 text-sm text-kamien-500">
      Wczytywanie mapy…
    </div>
  ),
})

/**
 * Pełnoekranowa mapa portalu z filtrowaniem warstw.
 *
 * Filtry pokazujemy tylko dla kategorii, które faktycznie mają dane. Brief
 * wymieniał też parkingi, toalety, wodospady i miejsca odpoczynku — takich
 * punktów w aplikacji nie ma, więc nie ma tu ich przełączników. Pusty filtr,
 * który nigdy nic nie pokazuje, jest gorszy niż jego brak: wygląda jak awaria.
 */

export type Kategoria = {
  klucz: string
  etykieta: string
  kolor: string
  markery: MarkerMapy[]
  /** Czy warstwa jest zapalona przy wejściu na stronę. */
  domyslnie: boolean
}

export function MapaPortalu({
  slady,
  kategorie,
}: {
  slady: WarstwaSladu[]
  kategorie: Kategoria[]
}) {
  const [wlaczone, ustawWlaczone] = useState<Set<string>>(
    () => new Set(kategorie.filter((k) => k.domyslnie).map((k) => k.klucz)),
  )
  const [pokazSlady, ustawPokazSlady] = useState(true)

  const widoczneMarkery = useMemo(
    () => kategorie.filter((k) => wlaczone.has(k.klucz)).flatMap((k) => k.markery),
    [kategorie, wlaczone],
  )

  const widoczneSlady = useMemo(() => (pokazSlady ? slady : []), [pokazSlady, slady])

  const przelacz = (klucz: string) => {
    ustawWlaczone((poprzednie) => {
      const nowe = new Set(poprzednie)
      if (nowe.has(klucz)) nowe.delete(klucz)
      else nowe.add(klucz)
      return nowe
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <fieldset className="rounded-2xl border border-kamien-200 bg-white p-5">
          <legend className="px-1 font-heading text-base font-semibold text-kamien-900">
            Co pokazać na mapie
          </legend>

          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-kamien-50">
            <input
              type="checkbox"
              checked={pokazSlady}
              onChange={() => ustawPokazSlady((wartosc) => !wartosc)}
              className="size-4 accent-las-600"
            />
            <span className="flex-1 text-sm font-medium text-kamien-800">Ślady tras</span>
            <span className="text-xs text-kamien-500">{slady.length}</span>
          </label>

          <hr className="my-3 border-kamien-200" />

          <div className="space-y-0.5">
            {kategorie.map((kategoria) => (
              <label
                key={kategoria.klucz}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-kamien-50"
              >
                <input
                  type="checkbox"
                  checked={wlaczone.has(kategoria.klucz)}
                  onChange={() => przelacz(kategoria.klucz)}
                  className="size-4 accent-las-600"
                />
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: kategoria.kolor }}
                />
                <span className="flex-1 text-sm text-kamien-800">{kategoria.etykieta}</span>
                <span className="text-xs text-kamien-500">{kategoria.markery.length}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 px-1 text-xs leading-relaxed text-kamien-500">
          Przybliżanie kółkiem działa z wciśniętym Ctrl — inaczej mapa
          przechwytywałaby przewijanie strony.
        </p>
      </div>

      <div
        className={cn(
          'h-[70vh] min-h-[30rem] overflow-hidden rounded-2xl border border-kamien-200',
        )}
      >
        <Mapa
          slady={widoczneSlady}
          markery={widoczneMarkery}
          dopasujDoSladow={false}
          klasa="size-full rounded-none border-0"
        />
      </div>
    </div>
  )
}
