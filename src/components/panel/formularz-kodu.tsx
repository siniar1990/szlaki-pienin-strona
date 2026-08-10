'use client'

import Image from 'next/image'
import { useActionState, useRef, useState } from 'react'
import { Crosshair, ImagePlus, Trash2 } from 'lucide-react'

import type { WynikAkcji } from '@/app/panel/dzialania'
import { ZdjecieZaDuze, zdjecieZPliku } from '@/lib/panel/zdjecie'

/**
 * Formularz tabliczki — ten sam przy tworzeniu i przy edycji.
 *
 * Formularz jest projektowany pod użycie **w terenie, na telefonie, jedną
 * ręką**: montujesz tabliczkę, robisz zdjęcie, pobierasz pozycję i zapisujesz.
 * Stąd przycisk odczytu z GPS zamiast przepisywania współrzędnych z innej
 * aplikacji i stąd zdjęcie robione aparatem, a nie wybierane z galerii.
 */

export type WartosciKodu = {
  nazwa?: string
  opis?: string | null
  nazwaLokalizacji?: string | null
  szerokosc?: number | null
  dlugosc?: number | null
  wysokosc?: number | null
  status?: string
  dataMontazu?: string | null
  zdjecie?: string | null
}

/** Ta sama wartość co po stronie akcji serwerowej — „skasuj zdjęcie". */
const USUN_ZDJECIE = 'usun'

/**
 * Dłuższy bok zdjęcia po zmniejszeniu.
 *
 * Zdjęcie ma służyć rozpoznaniu tabliczki na słupku, a nie oglądaniu detali —
 * 1200 px w zupełności wystarczy, żeby odczytać kod i rozpoznać otoczenie.
 * Prosto z aparatu telefonu przyszłoby kilkanaście razy więcej, a każdy taki
 * plik trafiłby do bazy.
 */
const DLUZSZY_BOK = 1200
const JAKOSC = 0.72

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

  /*
    Współrzędne trzymane w stanie, bo wpisuje je i człowiek, i przycisk GPS.
    Przy polach niekontrolowanych trzeba by sięgać do DOM-u i ustawiać wartość
    ręcznie — działa, ale rozjeżdża się z Reactem przy pierwszym ponownym
    renderowaniu.
  */
  const [pozycja, ustawPozycje] = useState({
    szerokosc: wartosci.szerokosc?.toString() ?? '',
    dlugosc: wartosci.dlugosc?.toString() ?? '',
    wysokosc: wartosci.wysokosc?.toString() ?? '',
  })
  const [gps, ustawGps] = useState<{ stan: 'bezczynny' | 'czeka' | 'blad'; tekst?: string }>({
    stan: 'bezczynny',
  })

  const [zdjecie, ustawZdjecie] = useState<string | null>(wartosci.zdjecie ?? null)
  const [zmienioneZdjecie, ustawZmienioneZdjecie] = useState<string>('')
  const [bladZdjecia, ustawBladZdjecia] = useState<string | null>(null)
  const wybor = useRef<HTMLInputElement>(null)

  /**
   * Odczyt pozycji z urządzenia.
   *
   * `enableHighAccuracy` włącza GPS zamiast szacowania po sieci — w terenie to
   * różnica między kilkoma metrami a kilkoma kilometrami. Kosztuje baterię
   * i chwilę czekania, ale tabliczkę ustawia się raz.
   *
   * Wysokość bywa pusta: podaje ją tylko odbiornik GPS, więc na laptopie jej
   * nie będzie, a na telefonie w budynku bywa nieprawdziwa. Zapisujemy ją,
   * gdy jest, i nie udajemy, gdy jej nie ma.
   */
  const pobierzPozycje = () => {
    if (!navigator.geolocation) {
      ustawGps({ stan: 'blad', tekst: 'Ta przeglądarka nie podaje położenia.' })
      return
    }

    ustawGps({ stan: 'czeka' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        ustawPozycje({
          // Pięć miejsc po przecinku to około metra — dokładniej niż potrafi
          // odbiornik w telefonie, więc dalsze cyfry byłyby udawaniem precyzji.
          szerokosc: coords.latitude.toFixed(5),
          dlugosc: coords.longitude.toFixed(5),
          wysokosc: coords.altitude === null ? '' : Math.round(coords.altitude).toString(),
        })
        ustawGps({
          stan: 'bezczynny',
          tekst:
            `Odczytano z dokładnością do ${Math.round(coords.accuracy)} m` +
            (coords.altitude === null ? '. Urządzenie nie podało wysokości.' : '.'),
        })
      },
      (blad) => {
        ustawGps({
          stan: 'blad',
          tekst:
            blad.code === blad.PERMISSION_DENIED
              ? 'Brak zgody na dostęp do położenia. Włącz ją w ustawieniach przeglądarki.'
              : 'Nie udało się odczytać położenia. Spróbuj na otwartej przestrzeni.',
        })
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  }

  /**
   * Zmniejszenie zdjęcia w przeglądarce, przed wysłaniem.
   *
   * Zdjęcie z telefonu ma dziś kilka megabajtów i 4000 px szerokości. Wysyłanie
   * go w tej postaci oznaczałoby długie czekanie na słabym zasięgu — czyli
   * dokładnie w tych warunkach, w których się pracuje w terenie — i wpisanie
   * do bazy kilkunastu megabajtów tekstu. Skalujemy więc na miejscu.
   *
   * Jakość dobiera się sama, aż wynik zmieści się w limicie akcji serwerowej
   * — ten sam mechanizm co przy notkach, gdzie stała jakość potrafiła ten
   * limit przekroczyć i zapis kończył się białym ekranem.
   */
  const wczytajZdjecie = async (plik: File) => {
    ustawBladZdjecia(null)
    try {
      const dane = await zdjecieZPliku(plik, DLUZSZY_BOK, JAKOSC)
      ustawZdjecie(dane)
      ustawZmienioneZdjecie(dane)
    } catch (blad) {
      ustawBladZdjecia(
        blad instanceof ZdjecieZaDuze
          ? 'Tego zdjęcia nie da się zapisać — spróbuj zrobić je jeszcze raz.'
          : 'Nie udało się odczytać pliku. Czy na pewno to zdjęcie?',
      )
    }
  }

  return (
    <form action={wyslij} className="max-w-2xl space-y-5">
      <Pole etykieta="Nazwa" nazwa="nazwa" wymagane domyslna={wartosci.nazwa} />

      <Pole
        etykieta="Nazwa miejsca"
        nazwa="nazwaLokalizacji"
        domyslna={wartosci.nazwaLokalizacji ?? ''}
        // Cudzysłów drukarski zamyka atrybut w JSX, więc tekst musi przyjść
        // jako wyrażenie, a nie jako wartość w cudzysłowach prostych.
        podpowiedz={'Jak opisać położenie tabliczki, np. „przy dolnej stacji kolei".'}
      />

      {/* ── Położenie ──────────────────────────────────────────────────── */}
      <fieldset className="rounded-2xl border border-kamien-200 p-4">
        <legend className="px-2 text-sm font-medium text-kamien-700">Położenie</legend>

        <button
          type="button"
          onClick={pobierzPozycje}
          disabled={gps.stan === 'czeka'}
          className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800 disabled:opacity-60"
        >
          <Crosshair className="size-4" aria-hidden />
          {gps.stan === 'czeka' ? 'Szukam sygnału…' : 'Pobierz moje położenie'}
        </button>

        {gps.tekst && (
          <p
            role={gps.stan === 'blad' ? 'alert' : 'status'}
            className={`mt-2 text-sm ${gps.stan === 'blad' ? 'text-red-700' : 'text-kamien-500'}`}
          >
            {gps.tekst}
          </p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Pole
            etykieta="Szerokość"
            nazwa="szerokosc"
            typ="number"
            krok="0.00001"
            wartosc={pozycja.szerokosc}
            zmien={(v) => ustawPozycje((p) => ({ ...p, szerokosc: v }))}
            podpowiedz="np. 49.41847"
          />
          <Pole
            etykieta="Długość"
            nazwa="dlugosc"
            typ="number"
            krok="0.00001"
            wartosc={pozycja.dlugosc}
            zmien={(v) => ustawPozycje((p) => ({ ...p, dlugosc: v }))}
            podpowiedz="np. 20.42122"
          />
          <Pole
            etykieta="Wysokość"
            nazwa="wysokosc"
            typ="number"
            krok="1"
            wartosc={pozycja.wysokosc}
            zmien={(v) => ustawPozycje((p) => ({ ...p, wysokosc: v }))}
            podpowiedz="m n.p.m."
          />
        </div>
      </fieldset>

      {/* ── Zdjęcie ────────────────────────────────────────────────────── */}
      <fieldset className="rounded-2xl border border-kamien-200 p-4">
        <legend className="px-2 text-sm font-medium text-kamien-700">
          Zdjęcie po montażu
        </legend>

        {/* Wartość jedzie w ukrytym polu, bo zdjęcie jest już przetworzone —
            pole plikowe wysłałoby oryginał, którego właśnie unikamy. */}
        <input type="hidden" name="zdjecie" value={zmienioneZdjecie} />

        {zdjecie ? (
          <div className="flex flex-wrap items-start gap-4">
            <Image
              src={zdjecie}
              alt="Zamontowana tabliczka"
              width={160}
              height={160}
              unoptimized
              className="size-40 rounded-xl border border-kamien-200 object-cover"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => wybor.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-4 py-2 text-sm font-medium text-kamien-800 hover:border-las-500 hover:bg-las-50"
              >
                <ImagePlus className="size-4" aria-hidden />
                Zrób nowe
              </button>
              <button
                type="button"
                onClick={() => {
                  ustawZdjecie(null)
                  ustawZmienioneZdjecie(USUN_ZDJECIE)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-4 py-2 text-sm text-kamien-600 hover:border-red-400 hover:text-red-700"
              >
                <Trash2 className="size-4" aria-hidden />
                Usuń zdjęcie
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => wybor.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-500 hover:bg-las-50"
          >
            <ImagePlus className="size-4" aria-hidden />
            Dodaj zdjęcie
          </button>
        )}

        {/*
          `capture="environment"` otwiera na telefonie od razu tylny aparat,
          zamiast pytać o źródło. W terenie to jedno stuknięcie mniej;
          na komputerze atrybut jest ignorowany i otwiera się wybór pliku.
        */}
        <input
          ref={wybor}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(zdarzenie) => {
            const plik = zdarzenie.target.files?.[0]
            if (plik) void wczytajZdjecie(plik)
            // Czyścimy pole, żeby dało się wybrać ten sam plik drugi raz.
            zdarzenie.target.value = ''
          }}
        />

        {bladZdjecia && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {bladZdjecia}
          </p>
        )}

        <p className="mt-3 text-sm text-kamien-500">
          Jedno zdjęcie do rozpoznania tabliczki w terenie. Zmniejszamy je
          w przeglądarce, więc wysyłka działa też przy słabym zasięgu.
        </p>
      </fieldset>

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
  wartosc,
  zmien,
  wymagane,
  podpowiedz,
}: {
  etykieta: string
  nazwa: string
  typ?: string
  krok?: string
  domyslna?: string | number
  /** Podane razem z `zmien` robi z pola pole kontrolowane. */
  wartosc?: string
  zmien?: (wartosc: string) => void
  wymagane?: boolean
  podpowiedz?: string
}) {
  const kontrolowane = wartosc !== undefined && zmien !== undefined

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
        {...(kontrolowane
          ? { value: wartosc, onChange: (z) => zmien(z.target.value) }
          : { defaultValue: domyslna })}
        className="mt-1.5 w-full rounded-xl border border-kamien-300 px-4 py-2.5"
      />
      {podpowiedz && <p className="mt-1 text-sm text-kamien-500">{podpowiedz}</p>}
    </div>
  )
}
