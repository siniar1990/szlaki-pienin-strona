'use client'

import { useActionState } from 'react'

import { zaloguj, type WynikAkcji } from '@/app/panel/dzialania'

/**
 * Formularz logowania.
 *
 * `useActionState` daje stan błędu bez pisania obsługi wysyłki — a formularz
 * pozostaje zwykłym formularzem HTML, więc działa także wtedy, gdy JavaScript
 * się nie wczyta. Dla panelu, do którego ktoś może zaglądać z telefonu na
 * szlaku, to nie jest teoretyczna zaleta.
 */
export function FormularzLogowania({ wroc }: { wroc: string }) {
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(zaloguj, {})

  return (
    <form action={wyslij} className="mt-8 space-y-4">
      <input type="hidden" name="wroc" value={wroc} />

      <div>
        <label htmlFor="haslo" className="block text-sm font-medium text-kamien-700">
          Hasło
        </label>
        <input
          id="haslo"
          name="haslo"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-3 text-kamien-900"
        />
      </div>

      {stan.blad && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {stan.blad}
        </p>
      )}

      <button
        type="submit"
        disabled={wTrakcie}
        className="w-full rounded-full bg-las-700 px-6 py-3 font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
      >
        {wTrakcie ? 'Sprawdzam…' : 'Zaloguj'}
      </button>
    </form>
  )
}
