'use client'

import { useActionState } from 'react'
import { Send } from 'lucide-react'

import { wyslijWiadomosc, type WynikWiadomosci } from '@/app/kontakt/dzialania'

/**
 * Formularz kontaktowy.
 *
 * Cztery pola i nic więcej. Każde dodatkowe pytanie to kolejny powód, żeby
 * zamknąć kartę — a wszystkiego, czego brakuje, można się dopytać w odpowiedzi.
 *
 * Temat bywa wypełniony z góry, gdy ktoś przychodzi z konkretnego miejsca
 * (np. z zaproszenia dla partnerów kategorii). Zostaje edytowalny, bo domysł
 * portalu nie musi być tym, o czym człowiek chce napisać.
 */
export function FormularzKontaktowy({ temat }: { temat?: string }) {
  const [stan, wyslij, wTrakcie] = useActionState<WynikWiadomosci, FormData>(wyslijWiadomosc, {})

  if (stan.ok) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-las-200 bg-las-50 px-6 py-5 text-las-900"
      >
        {stan.ok}
      </p>
    )
  }

  return (
    <form action={wyslij} className="space-y-4">
      {/*
        Pułapka na boty. `sr-only` zamiast `display: none`, bo część botów
        pomija pola całkowicie ukryte, a to ma zostać wypełnione. `tabIndex`
        i `autoComplete` trzymają je z dala od człowieka używającego
        klawiatury i autouzupełniania.
      */}
      <div className="sr-only" aria-hidden>
        <label htmlFor="strona_www">Nie wypełniaj tego pola</label>
        <input id="strona_www" name="strona_www" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Pole etykieta="Imię" nazwa="imie" wymagane autoUzupelnianie="given-name" />
        <Pole
          etykieta="Adres e-mail"
          nazwa="email"
          typ="email"
          wymagane
          autoUzupelnianie="email"
        />
      </div>

      <Pole etykieta="Temat" nazwa="temat" domyslna={temat} />

      <div>
        <label htmlFor="wiadomosc" className="block text-sm font-medium text-kamien-700">
          Wiadomość
        </label>
        <textarea
          id="wiadomosc"
          name="wiadomosc"
          rows={6}
          required
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
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
        className="inline-flex items-center gap-2 rounded-full bg-las-700 px-6 py-3 font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {wTrakcie ? 'Wysyłam…' : 'Wyślij wiadomość'}
      </button>
    </form>
  )
}

function Pole({
  etykieta,
  nazwa,
  typ = 'text',
  domyslna,
  wymagane,
  autoUzupelnianie,
}: {
  etykieta: string
  nazwa: string
  typ?: string
  domyslna?: string
  wymagane?: boolean
  autoUzupelnianie?: string
}) {
  return (
    <div>
      <label htmlFor={nazwa} className="block text-sm font-medium text-kamien-700">
        {etykieta}
        {!wymagane && <span className="ml-1.5 text-kamien-400">(opcjonalnie)</span>}
      </label>
      <input
        id={nazwa}
        name={nazwa}
        type={typ}
        required={wymagane}
        defaultValue={domyslna}
        autoComplete={autoUzupelnianie}
        className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
      />
    </div>
  )
}
