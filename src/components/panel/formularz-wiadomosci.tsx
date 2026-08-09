'use client'

import { useActionState, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'

import type { WynikAkcji } from '@/app/panel/aktualnosci/dzialania'

/**
 * Formularz notki.
 *
 * **Dlaczego zdjęcie jest zmniejszane w przeglądarce.** Tak samo jak przy
 * tabliczkach: obraz trafia do bazy jako `data:` URL, więc wysłanie pliku
 * prosto z aparatu wpisałoby tam kilkanaście megabajtów tekstu. Zdjęcie
 * główne artykułu ma jednak inne zadanie niż zdjęcie słupka, dlatego dłuższy
 * bok to 1600 px, a nie 1200 — obraz idzie na całą szerokość kolumny tekstu.
 *
 * **Dlaczego treść to zwykłe pole tekstowe, a nie edytor.** Notka ma trzy
 * akapity. Edytor z paskiem narzędzi kusiłby pogrubieniami i nagłówkami,
 * a portal ich w tym miejscu nie renderuje — więc kończyłoby się to
 * gwiazdkami widocznymi na stronie. Pusta linia rozdziela akapity i to
 * wszystko, co trzeba wiedzieć.
 */

const USUN_ZDJECIE = 'usun'
const DLUZSZY_BOK = 1600
const JAKOSC = 0.82

export type WartosciWiadomosci = {
  /** Czy notka jest już na portalu — decyduje o pokazaniu znacznika zmiany. */
  opublikowana?: boolean
  tytul: string
  lid: string
  tresc: string
  zdjecie?: string | null
  zdjecieOpis?: string | null
  zrodloNazwa?: string | null
  zrodloAdres?: string | null
}

export function FormularzWiadomosci({
  akcja,
  wartosci,
}: {
  akcja: (stan: WynikAkcji, dane: FormData) => Promise<WynikAkcji>
  wartosci: WartosciWiadomosci
}) {
  const [stan, wyslij, wTrakcie] = useActionState<WynikAkcji, FormData>(akcja, {})

  const [zdjecie, ustawZdjecie] = useState<string | null>(wartosci.zdjecie ?? null)
  const [zmienioneZdjecie, ustawZmienioneZdjecie] = useState<string>('')
  const wybor = useRef<HTMLInputElement>(null)

  const wczytajZdjecie = async (plik: File) => {
    const obraz = await createImageBitmap(plik)
    const skala = Math.min(1, DLUZSZY_BOK / Math.max(obraz.width, obraz.height))
    const plotno = document.createElement('canvas')
    plotno.width = Math.round(obraz.width * skala)
    plotno.height = Math.round(obraz.height * skala)
    plotno.getContext('2d')?.drawImage(obraz, 0, 0, plotno.width, plotno.height)
    obraz.close()

    const dane = plotno.toDataURL('image/jpeg', JAKOSC)
    ustawZdjecie(dane)
    ustawZmienioneZdjecie(dane)
  }

  return (
    <form action={wyslij} className="space-y-5">
      <div>
        <label htmlFor="tytul" className="block text-sm font-medium text-kamien-700">
          Tytuł
        </label>
        <input
          id="tytul"
          name="tytul"
          required
          defaultValue={wartosci.tytul}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 font-heading text-lg text-kamien-900"
        />
      </div>

      <div>
        <label htmlFor="lid" className="block text-sm font-medium text-kamien-700">
          Lid
          <span className="ml-1.5 font-normal text-kamien-400">
            jedno zdanie — widoczne na kartach i w wyszukiwarce
          </span>
        </label>
        <textarea
          id="lid"
          name="lid"
          rows={2}
          required
          defaultValue={wartosci.lid}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
        />
      </div>

      <div>
        <label htmlFor="tresc" className="block text-sm font-medium text-kamien-700">
          Treść
          <span className="ml-1.5 font-normal text-kamien-400">
            akapity rozdziela pusta linia
          </span>
        </label>
        <textarea
          id="tresc"
          name="tresc"
          rows={14}
          required
          defaultValue={wartosci.tresc}
          className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-3 leading-relaxed text-kamien-900"
        />
      </div>

      {/* ── Zdjęcie główne ─────────────────────────────────────────────── */}
      <fieldset className="rounded-2xl border border-kamien-200 p-4">
        <legend className="px-2 text-sm font-medium text-kamien-700">Zdjęcie główne</legend>

        {zdjecie ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zdjecie}
              alt="Podgląd zdjęcia głównego"
              className="aspect-[16/9] w-full rounded-xl border border-kamien-200 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                ustawZdjecie(null)
                ustawZmienioneZdjecie(USUN_ZDJECIE)
                if (wybor.current) wybor.current.value = ''
              }}
              className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-4 py-2 text-sm text-kamien-700 transition-colors hover:border-red-300 hover:text-red-700"
            >
              <Trash2 className="size-4" aria-hidden />
              Usuń zdjęcie
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => wybor.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-700 transition-colors hover:border-las-400 hover:text-las-800"
          >
            <ImagePlus className="size-4" aria-hidden />
            Wybierz zdjęcie
          </button>
        )}

        <input
          ref={wybor}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(zdarzenie) => {
            const plik = zdarzenie.target.files?.[0]
            if (plik) void wczytajZdjecie(plik)
          }}
        />
        {/* Wartość niesie sam obraz albo znacznik skasowania. Pusto znaczy
            „nie ruszaj tego, co jest w bazie". */}
        <input type="hidden" name="zdjecie" value={zmienioneZdjecie} />

        <div className="mt-4">
          <label htmlFor="zdjecieOpis" className="block text-sm font-medium text-kamien-700">
            Podpis pod zdjęciem
            <span className="ml-1.5 font-normal text-kamien-400">
              autor albo źródło, jeśli zdjęcie nie jest nasze
            </span>
          </label>
          <input
            id="zdjecieOpis"
            name="zdjecieOpis"
            defaultValue={wartosci.zdjecieOpis ?? ''}
            className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
          />
        </div>
      </fieldset>

      {/* ── Źródło ─────────────────────────────────────────────────────── */}
      <fieldset className="rounded-2xl border border-kamien-200 p-4">
        <legend className="px-2 text-sm font-medium text-kamien-700">Źródło informacji</legend>
        <p className="px-2 text-sm text-kamien-500">
          Jeśli notka powstała na podstawie cudzego artykułu, te dwa pola muszą być
          wypełnione — portal pokaże je pod treścią razem z odnośnikiem.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="zrodloNazwa" className="block text-sm font-medium text-kamien-700">
              Nazwa serwisu
            </label>
            <input
              id="zrodloNazwa"
              name="zrodloNazwa"
              defaultValue={wartosci.zrodloNazwa ?? ''}
              className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
            />
          </div>
          <div>
            <label htmlFor="zrodloAdres" className="block text-sm font-medium text-kamien-700">
              Adres artykułu
            </label>
            <input
              id="zrodloAdres"
              name="zrodloAdres"
              type="url"
              defaultValue={wartosci.zrodloAdres ?? ''}
              className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5 text-kamien-900"
            />
          </div>
        </div>
      </fieldset>

      {/*
        Znacznik istotnej zmiany ma sens dopiero przy notce, która jest już na
        portalu. Przy szkicu każda zmiana jest oczywista i nie ma komu jej
        ogłaszać, więc pole tylko zaśmiecałoby formularz.
      */}
      {wartosci.opublikowana && (
        <label className="flex items-start gap-3 rounded-2xl border border-kamien-200 bg-kamien-50 p-4">
          <input
            type="checkbox"
            name="istotnaZmiana"
            value="tak"
            className="mt-0.5 size-4 shrink-0 accent-las-700"
          />
          <span className="text-sm leading-relaxed text-kamien-700">
            <span className="font-medium">To istotna zmiana treści</span>
            <span className="mt-0.5 block text-kamien-500">
              Zaznacz, gdy poprawka zmienia sens notki — na stronie pojawi się „Zaktualizowano",
              a nowa data trafi do mapy witryny i danych strukturalnych. Przy poprawie
              literówki zostaw puste.
            </span>
          </span>
        </label>
      )}

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
        {wTrakcie ? 'Zapisuję…' : 'Zapisz zmiany'}
      </button>
    </form>
  )
}
