'use client'

import { useActionState, useState } from 'react'
import { Package } from 'lucide-react'

import { utworzPaczke, type WynikAkcji } from '@/app/panel/dzialania'

/**
 * Generowanie paczki tabliczek.
 *
 * Kody powstają ze statusem „zapas" — wydrukowane, ale jeszcze niezamontowane.
 * Dlatego przy przycisku jest jawne potwierdzenie liczby: utworzenie dwustu
 * wierszy przez pomyłkę byłoby uciążliwe do cofnięcia, a pole liczbowe bez
 * potwierdzenia zbyt łatwo przyjmuje przypadkową wartość.
 */
export function FormularzPaczki() {
  const [otwarty, ustawOtwarty] = useState(false)
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(utworzPaczke, {})

  if (!otwarty) {
    return (
      <button
        type="button"
        onClick={() => ustawOtwarty(true)}
        className="inline-flex items-center gap-2 rounded-full border border-kamien-300 bg-white px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
      >
        <Package className="size-4" aria-hidden />
        Wygeneruj paczkę
      </button>
    )
  }

  return (
    <form action={wyslij} className="flex flex-wrap items-center gap-2">
      <label htmlFor="ile" className="text-sm text-kamien-600">
        Ile kodów
      </label>
      <input
        id="ile"
        name="ile"
        type="number"
        min={1}
        max={500}
        defaultValue={50}
        required
        className="w-24 rounded-lg border border-kamien-300 px-3 py-2 text-sm tabular-nums"
      />
      <button
        type="submit"
        disabled={wTrakcie}
        className="rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {wTrakcie ? 'Tworzę…' : 'Utwórz'}
      </button>
      <button
        type="button"
        onClick={() => ustawOtwarty(false)}
        className="text-sm text-kamien-500 hover:text-kamien-800"
      >
        Anuluj
      </button>

      {stan.blad && <p className="w-full text-sm text-red-700">{stan.blad}</p>}
      {stan.ok && <p className="w-full text-sm text-las-700">{stan.ok}</p>}
    </form>
  )
}
