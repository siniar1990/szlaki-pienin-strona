'use client'

import { useActionState, useEffect, useState } from 'react'

import type { WynikAkcji } from '@/app/panel/dzialania'

/**
 * Formularz tabliczki — ten sam przy tworzeniu i przy edycji.
 *
 * Jedno pole wymaga wyjaśnienia: „powiązana strona". Administrator nie wpisuje
 * tam adresu z palca, tylko wybiera z listy stron, które w portalu naprawdę
 * istnieją. Lista powstaje przy budowaniu (`public/dane/strony.json`), więc
 * jest zawsze zgodna z tym, co opublikowane. Ręczne wpisywanie prowadziłoby
 * do literówek, a literówka na wydrukowanej tabliczce oznacza dwieście
 * odnośników do strony błędu.
 */

type Strona = { adres: string; nazwa: string; rodzaj: string }

export type WartosciKodu = {
  nazwa?: string
  opis?: string | null
  kategoria?: string
  nazwaLokalizacji?: string | null
  powiazanaStrona?: string | null
  szerokosc?: number | null
  dlugosc?: number | null
  status?: string
  dataMontazu?: string | null
}

const KATEGORIE = [
  ['ATRAKCJA', 'Atrakcja'],
  ['SZLAK', 'Początek szlaku'],
  ['PUNKT_WIDOKOWY', 'Punkt widokowy'],
  ['MIASTO', 'Miasto'],
  ['PARKING', 'Parking'],
  ['ODPOCZYNEK', 'Miejsce odpoczynku'],
  ['INNE', 'Inne'],
] as const

export function FormularzKodu({
  akcja,
  wartosci = {},
  etykietaPrzycisku,
}: {
  akcja: (stan: WynikAkcji, dane: FormData) => Promise<WynikAkcji>
  wartosci?: WartosciKodu
  etykietaPrzycisku: string
}) {
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(akcja, {})
  const [strony, ustawStrony] = useState<Strona[]>([])

  useEffect(() => {
    // Spis stron to zwykły plik statyczny — nie wymaga trasy API ani bazy.
    fetch('/dane/strony.json')
      .then((o) => (o.ok ? o.json() : []))
      .then(ustawStrony)
      .catch(() => ustawStrony([]))
  }, [])

  return (
    <form action={wyslij} className="max-w-2xl space-y-5">
      <Pole etykieta="Nazwa" nazwa="nazwa" wymagane domyslna={wartosci.nazwa} />

      <div>
        <label htmlFor="kategoria" className="block text-sm font-medium text-kamien-700">
          Kategoria
        </label>
        <select
          id="kategoria"
          name="kategoria"
          defaultValue={wartosci.kategoria ?? 'ATRAKCJA'}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
        >
          {KATEGORIE.map(([wartosc, etykieta]) => (
            <option key={wartosc} value={wartosc}>
              {etykieta}
            </option>
          ))}
        </select>
      </div>

      <Pole
        etykieta="Nazwa miejsca"
        nazwa="nazwaLokalizacji"
        domyslna={wartosci.nazwaLokalizacji ?? ''}
        // Cudzysłów drukarski zamyka atrybut w JSX, więc tekst musi przyjść
        // jako wyrażenie, a nie jako wartość w cudzysłowach prostych.
        podpowiedz={'Jak opisać położenie tabliczki, np. „przy dolnej stacji kolei".'}
      />

      <div>
        <label htmlFor="powiazanaStrona" className="block text-sm font-medium text-kamien-700">
          Powiązana strona
        </label>
        <input
          id="powiazanaStrona"
          name="powiazanaStrona"
          list="spis-stron"
          defaultValue={wartosci.powiazanaStrona ?? ''}
          placeholder="/atrakcje/sokolica"
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
        />
        <datalist id="spis-stron">
          {strony.map((s) => (
            <option key={s.adres} value={s.adres}>
              {s.nazwa} ({s.rodzaj})
            </option>
          ))}
        </datalist>
        <p className="mt-1 text-sm text-kamien-500">
          Dokąd prowadzi kod na komputerze i zanim aplikacja trafi do sklepów.
          {strony.length > 0 && ` Do wyboru ${strony.length} stron portalu.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Pole
          etykieta="Szerokość geograficzna"
          nazwa="szerokosc"
          typ="number"
          krok="0.00001"
          domyslna={wartosci.szerokosc ?? ''}
          podpowiedz="np. 49.41847"
        />
        <Pole
          etykieta="Długość geograficzna"
          nazwa="dlugosc"
          typ="number"
          krok="0.00001"
          domyslna={wartosci.dlugosc ?? ''}
          podpowiedz="np. 20.42122"
        />
      </div>

      <div>
        <label htmlFor="opis" className="block text-sm font-medium text-kamien-700">
          Opis
        </label>
        <textarea
          id="opis"
          name="opis"
          rows={3}
          defaultValue={wartosci.opis ?? ''}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-kamien-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={wartosci.status ?? 'ZAPAS'}
            className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
          >
            <option value="ZAPAS">Zapas — wydrukowana, niezamontowana</option>
            <option value="AKTYWNY">Aktywna — wisi w terenie</option>
            <option value="NIEAKTYWNY">Nieaktywna — zdjęta lub uszkodzona</option>
          </select>
        </div>

        <Pole
          etykieta="Data montażu"
          nazwa="dataMontazu"
          typ="date"
          domyslna={wartosci.dataMontazu ?? ''}
        />
      </div>

      {stan.blad && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {stan.blad}
        </p>
      )}
      {stan.ok && (
        <p role="status" className="rounded-lg bg-las-50 px-4 py-2.5 text-sm text-las-800">
          {stan.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={wTrakcie}
        className="rounded-full bg-las-700 px-6 py-3 font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
      >
        {wTrakcie ? 'Zapisuję…' : etykietaPrzycisku}
      </button>
    </form>
  )
}

function Pole({
  etykieta,
  nazwa,
  typ = 'text',
  krok,
  domyslna,
  wymagane,
  podpowiedz,
}: {
  etykieta: string
  nazwa: string
  typ?: string
  krok?: string
  domyslna?: string | number
  wymagane?: boolean
  podpowiedz?: string
}) {
  return (
    <div>
      <label htmlFor={nazwa} className="block text-sm font-medium text-kamien-700">
        {etykieta}
      </label>
      <input
        id={nazwa}
        name={nazwa}
        type={typ}
        step={krok}
        required={wymagane}
        defaultValue={domyslna}
        className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
      />
      {podpowiedz && <p className="mt-1 text-sm text-kamien-500">{podpowiedz}</p>}
    </div>
  )
}
