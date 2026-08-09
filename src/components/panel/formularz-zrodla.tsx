'use client'

import { useActionState } from 'react'
import { Plus } from 'lucide-react'

import { dodajZrodlo, type WynikAkcji } from '@/app/panel/aktualnosci/dzialania'

/**
 * Dodawanie źródła.
 *
 * Dwa pola i tyle. Adresu kanału RSS nie pytamy, bo obchód sam go znajduje
 * w nagłówku strony — a wpisywanie go ręcznie wymagałoby od administratora
 * wiedzy, której nie ma powodu mieć.
 */
export function FormularzZrodla() {
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(dodajZrodlo, {})

  return (
    <form action={wyslij} className="rounded-2xl border border-kamien-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <div>
          <label htmlFor="nazwa" className="block text-sm font-medium text-kamien-700">
            Nazwa serwisu
          </label>
          <input
            id="nazwa"
            name="nazwa"
            required
            placeholder="np. Pieniny24"
            className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
          />
        </div>

        <div>
          <label htmlFor="adres" className="block text-sm font-medium text-kamien-700">
            Adres strony z listą artykułów
          </label>
          <input
            id="adres"
            name="adres"
            type="url"
            required
            placeholder="https://pieniny24.pl/aktualnosci"
            className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
          />
        </div>

        <button
          type="submit"
          disabled={wTrakcie}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden />
          {wTrakcie ? 'Dodaję…' : 'Dodaj'}
        </button>
      </div>

      {stan.blad && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {stan.blad}
        </p>
      )}
      {stan.ok && (
        <p role="status" className="mt-3 rounded-lg bg-las-50 px-4 py-2.5 text-sm text-las-900">
          {stan.ok}
        </p>
      )}
    </form>
  )
}
