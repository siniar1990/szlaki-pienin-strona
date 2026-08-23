'use client'

import { useActionState, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

import type { WynikAkcji } from '@/app/panel/dzialania'
import { liczba, odmien } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Usunięcie tabliczki — zwinięte, dopóki nikt o nie nie poprosi.
 *
 * **Dlaczego nie zwykły przycisk obok „Zapisz zmiany".** Bo sąsiadowałby
 * z akcją wykonywaną codziennie, a sam jest nieodwracalny. Trzy kliknięcia
 * dzielące od skasowania nie są utrudnieniem dla kogoś, kto naprawdę chce
 * usunąć tabliczkę — robi się to raz na kwartał.
 *
 * **Panel mówi wprost, co zniknie**, zanim cokolwiek zniknie: ile skanów
 * przepadnie i czy tabliczka wisi w terenie. To są dwie różne straty i tylko
 * właściciel portalu wie, czy na nie stać — kod nie ma prawa zdecydować za
 * niego, ale ma obowiązek mu je pokazać.
 */
export function UsunTabliczke({
  kod,
  akcja,
  liczbaSkanow,
  aktywna,
}: {
  kod: string
  akcja: (stan: WynikAkcji, dane: FormData) => Promise<WynikAkcji>
  liczbaSkanow: number
  /** Czy tabliczka ma status AKTYWNY — czyli prawdopodobnie wisi w terenie. */
  aktywna: boolean
}) {
  const [otwarte, ustawOtwarte] = useState(false)
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(akcja, {})

  if (!otwarte) {
    return (
      <button
        type="button"
        onClick={() => ustawOtwarte(true)}
        className="inline-flex items-center gap-2 text-sm font-medium text-kamien-500 transition-colors hover:text-red-700"
      >
        <Trash2 className="size-4" aria-hidden />
        Usuń tabliczkę
      </button>
    )
  }

  return (
    <form action={wyslij} className="rounded-2xl border border-red-200 bg-white p-5">
      <h3 className="flex items-center gap-2 font-heading text-base font-semibold text-red-800">
        <AlertTriangle className="size-4" aria-hidden />
        Usunąć tabliczkę {kod}?
      </h3>

      <ul className="mt-3 space-y-1.5 text-sm text-kamien-700">
        <li>
          Znika wpis tabliczki
          {liczbaSkanow > 0 ? (
            <>
              {' '}
              razem z historią <strong>{liczba(liczbaSkanow)}</strong>{' '}
              {odmien(liczbaSkanow, ['skanu', 'skanów', 'skanów'])} — także
              z podsumowań dobowych, więc
              statystyki portalu zmniejszą się wstecz.
            </>
          ) : (
            '. Ta tabliczka nie ma jeszcze żadnego skanu.'
          )}
        </li>

        {aktywna && (
          <li className="text-red-800">
            Tabliczka ma status <strong>aktywna</strong>. Jeśli wisi w terenie,
            po skasowaniu jej zeskanowanie skończy się stroną{' '}
            {'„nie ma takiej tabliczki"'}. Rozważ zamiast tego status{' '}
            <strong>nieaktywna</strong>.
          </li>
        )}

        <li>
          Numer <strong>{kod}</strong> zostaje zajęty na zawsze — żadna kolejna
          tabliczka go nie dostanie, nawet gdyby wydrukowany egzemplarz gdzieś
          jeszcze leżał.
        </li>

        <li>Tego nie da się cofnąć.</li>
      </ul>

      <label className="mt-4 block text-sm font-medium text-kamien-800">
        Przepisz identyfikator, żeby potwierdzić
        <input
          name="potwierdzenie"
          autoComplete="off"
          placeholder={kod}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-3 py-2 font-mono text-sm text-kamien-900 outline-none focus:border-red-500"
        />
      </label>

      {stan.blad && <p className="mt-3 text-sm text-red-700">{stan.blad}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={wTrakcie}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition-colors',
            wTrakcie ? 'opacity-60' : 'hover:bg-red-800',
          )}
        >
          <Trash2 className="size-4" aria-hidden />
          {wTrakcie ? 'Usuwam…' : 'Usuń bezpowrotnie'}
        </button>

        <button
          type="button"
          onClick={() => ustawOtwarte(false)}
          className="rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:bg-kamien-100"
        >
          Zostaw
        </button>
      </div>
    </form>
  )
}
