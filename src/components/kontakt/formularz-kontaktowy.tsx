'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

import { KLUCZ_WEB3FORMS, PORTAL } from '@/lib/konfiguracja'

/**
 * Formularz kontaktowy.
 *
 * Cztery pola i nic więcej. Każde dodatkowe pytanie to kolejny powód, żeby
 * zamknąć kartę — a wszystkiego, czego brakuje, można się dopytać w odpowiedzi.
 *
 * **Dlaczego wysyłka idzie z przeglądarki, a nie z serwera.** Pierwsza wersja
 * wysyłała formularz akcją serwerową: klucz dostępu zostawał wtedy poza
 * przeglądarką, a dane były sprawdzane, zanim cokolwiek wyszło na zewnątrz.
 * Rozwiązanie było lepsze pod każdym względem poza jednym — **nie działało**.
 * Web3Forms w planie darmowym odrzuca żądania z serwerów kodem 403
 * z komunikatem „use our API in client side"; blokada dotyczy adresu IP
 * nadawcy, więc nie da się jej obejść nagłówkami. Wysyłka z przeglądarki to
 * jedyny sposób, w jaki ta usługa działa bez planu płatnego.
 *
 * **Co to znaczy dla klucza.** Jest widoczny w kodzie strony — i tak jest
 * pomyślana ta usługa: w ich dokumentacji stoi wprost w polu ukrytym
 * formularza. Klucz pozwala wyłącznie wysłać wiadomość na jeden zdefiniowany
 * adres; nie daje dostępu do niczego. Przed botami broni pułapka niżej,
 * a gdyby spam się pojawił, Web3Forms pozwala włączyć captchę bez zmian
 * w tym kodzie.
 */

const ADRES = 'https://api.web3forms.com/submit'

type Stan =
  | { rodzaj: 'gotowy' }
  | { rodzaj: 'wysylam' }
  | { rodzaj: 'wyslano' }
  | { rodzaj: 'blad'; tresc: string }

export function FormularzKontaktowy({ temat }: { temat?: string }) {
  const [stan, ustawStan] = useState<Stan>({ rodzaj: 'gotowy' })

  async function wyslij(zdarzenie: React.FormEvent<HTMLFormElement>) {
    zdarzenie.preventDefault()

    const dane = new FormData(zdarzenie.currentTarget)
    const wartosc = (nazwa: string) => String(dane.get(nazwa) ?? '').trim()

    /*
      Pułapka na boty. Nazwa `botcheck` jest tą, której oczekuje Web3Forms —
      wypełnione pole odrzuca po ich stronie, więc filtr działa nawet wtedy,
      gdy bot pominie nasz kod i wyśle żądanie wprost do usługi.
    */
    if (String(dane.get('botcheck') ?? '').length > 0) {
      ustawStan({ rodzaj: 'wyslano' })
      return
    }

    const wiadomosc = wartosc('wiadomosc')
    if (wiadomosc.length < 10) {
      ustawStan({
        rodzaj: 'blad',
        tresc: 'Napisz choć kilka zdań — łatwiej będzie odpowiedzieć.',
      })
      return
    }

    ustawStan({ rodzaj: 'wysylam' })

    const podanyTemat = wartosc('temat')

    try {
      const odpowiedz = await fetch(ADRES, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          access_key: KLUCZ_WEB3FORMS,
          subject: podanyTemat
            ? `${PORTAL.adresSkrocony} — ${podanyTemat}`
            : `${PORTAL.adresSkrocony} — wiadomość ze strony`,
          from_name: PORTAL.nazwa,
          // Odpowiedź z klienta poczty idzie wtedy do nadawcy, a nie do usługi.
          replyto: wartosc('email'),
          Imię: wartosc('imie'),
          'Adres e-mail': wartosc('email'),
          Temat: podanyTemat || '(nie podano)',
          Wiadomość: wiadomosc,
        }),
      })

      /*
        Sprawdzamy pole `success` z treści, a nie sam kod odpowiedzi.
        Web3Forms potrafi zwrócić kod 200 z `success: false` — poprzednia
        wersja uznałaby to za wysłaną wiadomość i pokazała podziękowanie za
        coś, co nigdy nie doszło.
      */
      const wynik = (await odpowiedz.json().catch(() => null)) as {
        success?: boolean
        message?: string
      } | null

      if (!wynik?.success) {
        ustawStan({
          rodzaj: 'blad',
          tresc: `Nie udało się wysłać wiadomości. Napisz na adres ${PORTAL.kontakt}.`,
        })
        // Powód od usługi trafia do konsoli — na stronie byłby po angielsku
        // i nic by piszącemu nie powiedział.
        console.error('Web3Forms:', wynik?.message ?? odpowiedz.status)
        return
      }

      ustawStan({ rodzaj: 'wyslano' })
    } catch {
      ustawStan({
        rodzaj: 'blad',
        tresc: `Nie udało się połączyć. Sprawdź internet albo napisz na ${PORTAL.kontakt}.`,
      })
    }
  }

  if (stan.rodzaj === 'wyslano') {
    return (
      <p role="status" className="rounded-2xl border border-las-200 bg-las-50 px-6 py-5 text-las-900">
        Wiadomość wysłana. Odpowiemy najszybciej, jak się da.
      </p>
    )
  }

  const wTrakcie = stan.rodzaj === 'wysylam'

  return (
    <form onSubmit={wyslij} className="space-y-4">
      {/*
        `sr-only` zamiast `display: none`, bo część botów pomija pola
        całkowicie ukryte, a to ma zostać wypełnione. `tabIndex`
        i `autoComplete` trzymają je z dala od człowieka używającego
        klawiatury i autouzupełniania.
      */}
      <div className="sr-only" aria-hidden>
        <label htmlFor="botcheck">Nie wypełniaj tego pola</label>
        <input id="botcheck" name="botcheck" type="text" tabIndex={-1} autoComplete="off" />
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
          minLength={10}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
        />
      </div>

      {stan.rodzaj === 'blad' && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {stan.tresc}
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
