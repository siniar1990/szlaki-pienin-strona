'use client'

import { useActionState, useState } from 'react'

import { zapiszUstawienia, type WynikAkcji } from '@/app/panel/aktualnosci/dzialania'
import {
  godzinyPublikacji,
  NAJMNIEJ_NOTEK,
  NAJWIECEJ_NOTEK,
  type Ustawienia,
} from '@/lib/wiadomosci/ustawienia'

/**
 * Formularz ustawień redakcji.
 *
 * **Dlaczego suwak, a nie pole liczbowe.** Zakres jest mały i zamknięty —
 * od jednej do dziesięciu notek. Suwak pokazuje ten zakres bez czytania,
 * nie da się w nim wpisać wartości spoza i przy przesuwaniu od razu widać,
 * jak zmieniają się godziny publikacji. Pole tekstowe wymagałoby sprawdzania
 * i tłumaczenia, dlaczego dwadzieścia to za dużo.
 *
 * Godziny liczymy tą samą funkcją, co serwer — podgląd nie może pokazywać
 * czegoś innego niż to, co się wydarzy.
 */
export function FormularzUstawien({ wartosci }: { wartosci: Ustawienia }) {
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(zapiszUstawienia, {})
  const [ile, ustawIle] = useState(wartosci.notekDziennie)

  const godziny = godzinyPublikacji(ile)

  return (
    <form action={wyslij} className="space-y-6">
      {/* ── Liczba notek ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-kamien-200 bg-white p-6">
        <label htmlFor="notekDziennie" className="block font-medium text-kamien-900">
          Notek dziennie
        </label>
        <p className="mt-1 text-sm text-kamien-500">
          Ile razy dziennie redakcja ma wybrać artykuł i napisać o nim notkę.
        </p>

        <div className="mt-5 flex items-center gap-5">
          <input
            id="notekDziennie"
            name="notekDziennie"
            type="range"
            min={NAJMNIEJ_NOTEK}
            max={NAJWIECEJ_NOTEK}
            step={1}
            value={ile}
            onChange={(zdarzenie) => ustawIle(Number(zdarzenie.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-kamien-200 accent-las-700"
          />
          <output
            htmlFor="notekDziennie"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-las-200 bg-las-50 font-heading text-xl font-semibold tabular-nums text-las-800"
          >
            {ile}
          </output>
        </div>

        <p className="mt-4 text-sm text-kamien-600">
          Pory publikacji:{' '}
          <span className="font-medium tabular-nums text-kamien-900">
            {godziny.map((godzina) => `${String(godzina).padStart(2, '0')}:00`).join(', ')}
          </span>
        </p>

        {ile >= 5 && (
          /*
            Ostrzeżenie przy większych wartościach. Portal zbiera kilkadziesiąt
            artykułów dziennie ze wszystkich źródeł, ale próg oceny przepuszcza
            garstkę — przy dziesięciu notkach dziennie redakcja albo nie znajdzie
            tylu wartych napisania, albo zacznie brać słabsze.
          */
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            Przy {ile} notkach dziennie redakcja może nie znaleźć tylu artykułów powyżej progu
            oceny. Dzień z mniejszą liczbą notek nie jest wtedy awarią — to znaczy, że nie było
            o czym pisać.
          </p>
        )}
      </div>

      {/* ── Publikowanie ───────────────────────────────────────────────── */}
      <fieldset className="rounded-2xl border border-kamien-200 bg-white p-6">
        <legend className="px-1 font-medium text-kamien-900">Publikowanie</legend>

        <div className="mt-3 space-y-3">
          <Wybor
            nazwa="publikowanieAutomatyczne"
            wartosc="nie"
            domyslnie={!wartosci.publikowanieAutomatyczne}
            tytul="Przez zatwierdzenie"
            opis="Każda notka czeka w panelu, aż ją przeczytasz i klikniesz „Opublikuj”. Nic nie trafia na portal bez Twojej decyzji."
          />
          <Wybor
            nazwa="publikowanieAutomatyczne"
            wartosc="tak"
            domyslnie={wartosci.publikowanieAutomatyczne}
            tytul="Automatycznie"
            opis="Redakcja publikuje sama, wedle najlepszej wiedzy. Notka z wykrytymi zapożyczeniami mimo to zaczeka na Ciebie — tego wyjątku nie da się wyłączyć."
          />
        </div>
      </fieldset>

      {stan.blad && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {stan.blad}
        </p>
      )}
      {stan.ok && (
        <p role="status" className="rounded-lg bg-las-50 px-4 py-2.5 text-sm text-las-900">
          {stan.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={wTrakcie}
        className="rounded-full bg-las-700 px-6 py-3 font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
      >
        {wTrakcie ? 'Zapisuję…' : 'Zapisz ustawienia'}
      </button>
    </form>
  )
}

function Wybor({
  nazwa,
  wartosc,
  domyslnie,
  tytul,
  opis,
}: {
  nazwa: string
  wartosc: string
  domyslnie: boolean
  tytul: string
  opis: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-kamien-200 p-4 transition-colors has-[:checked]:border-las-400 has-[:checked]:bg-las-50">
      <input
        type="radio"
        name={nazwa}
        value={wartosc}
        defaultChecked={domyslnie}
        className="mt-0.5 size-4 shrink-0 accent-las-700"
      />
      <span>
        <span className="block font-medium text-kamien-900">{tytul}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-kamien-600">{opis}</span>
      </span>
    </label>
  )
}
