'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

import { KafelekTrasy } from '@/components/trasy/kafelek-trasy'
import { naSlug } from '@/lib/dane/slug'
import type { TrasaNaLiscie } from '@/lib/dane/typy'
import { czas, kilometry } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Przeglądarka tras: szukanie, filtry, sortowanie, wyniki.
 *
 * Wszystko dzieje się w przeglądarce, na tablicy przekazanej z serwera.
 * Przy pięćdziesięciu trzech trasach to ułamek milisekundy, a strona zostaje
 * statyczna i w pełni indeksowalna: wyszukiwarka i osoba z wyłączonym
 * JavaScriptem widzą komplet tras w HTML-u. Filtry są udogodnieniem,
 * nie warunkiem dostępu do treści.
 *
 * Filtrów jest sporo, więc porządkuje je jedna zasada: każdy pokazuje przy
 * sobie, ile tras spełni warunek. Dzięki temu widać z góry, że „ponad 20 km"
 * da trzy wyniki, i nikt nie klika w ślepy zaułek.
 */

export type TrasaDoPrzegladania = TrasaNaLiscie & {
  /** Nazwy punktów na trasie — po nich też szukamy. */
  punkty: string[]
}

type Zakres = { klucz: string; etykieta: string; od: number; do: number }

const CZAS: Zakres[] = [
  { klucz: 'czas-1', etykieta: 'do 2 h', od: 0, do: 120 },
  { klucz: 'czas-2', etykieta: '2–4 h', od: 120, do: 240 },
  { klucz: 'czas-3', etykieta: '4–6 h', od: 240, do: 360 },
  { klucz: 'czas-4', etykieta: 'ponad 6 h', od: 360, do: Infinity },
]

const DLUGOSC: Zakres[] = [
  { klucz: 'dl-1', etykieta: 'do 5 km', od: 0, do: 5 },
  { klucz: 'dl-2', etykieta: '5–10 km', od: 5, do: 10 },
  { klucz: 'dl-3', etykieta: '10–20 km', od: 10, do: 20 },
  { klucz: 'dl-4', etykieta: 'ponad 20 km', od: 20, do: Infinity },
]

const PODEJSCIE: Zakres[] = [
  { klucz: 'pod-1', etykieta: 'do 300 m', od: 0, do: 300 },
  { klucz: 'pod-2', etykieta: '300–600 m', od: 300, do: 600 },
  { klucz: 'pod-3', etykieta: '600–1000 m', od: 600, do: 1000 },
  { klucz: 'pod-4', etykieta: 'ponad 1000 m', od: 1000, do: Infinity },
]

const SZCZYT: Zakres[] = [
  { klucz: 'szc-1', etykieta: 'do 700 m n.p.m.', od: 0, do: 700 },
  { klucz: 'szc-2', etykieta: '700–1000 m n.p.m.', od: 700, do: 1000 },
  { klucz: 'szc-3', etykieta: 'ponad 1000 m n.p.m.', od: 1000, do: Infinity },
]

type Sortowanie = 'trafnosc' | 'dlugosc-rosnaco' | 'dlugosc-malejaco' | 'czas-rosnaco' | 'nazwa'

const SORTOWANIA: { wartosc: Sortowanie; etykieta: string }[] = [
  { wartosc: 'trafnosc', etykieta: 'Domyślnie' },
  { wartosc: 'nazwa', etykieta: 'Alfabetycznie' },
  { wartosc: 'dlugosc-rosnaco', etykieta: 'Od najkrótszej' },
  { wartosc: 'dlugosc-malejaco', etykieta: 'Od najdłuższej' },
  { wartosc: 'czas-rosnaco', etykieta: 'Od najszybszej' },
]

type Stan = {
  rodzaj: Set<string>
  trudnosc: Set<string>
  czas: Set<string>
  dlugosc: Set<string>
  podejscie: Set<string>
  szczyt: Set<string>
  miejscowosc: Set<string>
  ksztalt: Set<string>
  cechy: Set<string>
}

const PUSTY: Stan = {
  rodzaj: new Set(),
  trudnosc: new Set(),
  czas: new Set(),
  dlugosc: new Set(),
  podejscie: new Set(),
  szczyt: new Set(),
  miejscowosc: new Set(),
  ksztalt: new Set(),
  cechy: new Set(),
}

function wZakresie(zakresy: Zakres[], wybrane: Set<string>, wartosc: number): boolean {
  if (wybrane.size === 0) return true
  return zakresy.some((z) => wybrane.has(z.klucz) && wartosc >= z.od && wartosc < z.do)
}

export function PrzegladarkaTras({ trasy }: { trasy: TrasaDoPrzegladania[] }) {
  const [fraza, ustawFraze] = useState('')
  const [stan, ustawStan] = useState<Stan>(PUSTY)
  const [sortowanie, ustawSortowanie] = useState<Sortowanie>('trafnosc')
  const [filtryOtwarte, ustawFiltryOtwarte] = useState(false)
  const [podpowiedziWidoczne, ustawPodpowiedziWidoczne] = useState(false)
  const polePola = useRef<HTMLDivElement>(null)

  // Klucz wyszukiwania liczony raz na trasę, nie przy każdym naciśnięciu.
  const zIndeksem = useMemo(
    () =>
      trasy.map((trasa) => ({
        trasa,
        klucz: naSlug(
          [trasa.nazwa, trasa.miejscowoscStartu, trasa.podsumowanie ?? '', ...trasa.punkty].join(' '),
        ),
      })),
    [trasy],
  )

  const miejscowosci = useMemo(() => {
    const liczby = new Map<string, number>()
    for (const trasa of trasy) {
      liczby.set(trasa.miejscowoscStartu, (liczby.get(trasa.miejscowoscStartu) ?? 0) + 1)
    }
    return [...liczby.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl'))
      .map(([nazwa, ile]) => ({ nazwa, ile }))
  }, [trasy])

  /** Czy trasa przechodzi przez komplet filtrów (bez frazy). */
  const przezFiltry = useMemo(
    () => (trasa: TrasaDoPrzegladania) => {
      const rowerowa = trasa.kategoria === 'rowerowa'
      if (stan.rodzaj.size > 0 && !stan.rodzaj.has(rowerowa ? 'rowerowe' : 'piesze')) return false
      if (stan.trudnosc.size > 0 && !stan.trudnosc.has(trasa.trudnosc)) return false
      if (!wZakresie(CZAS, stan.czas, trasa.czasMin.tam)) return false
      if (!wZakresie(DLUGOSC, stan.dlugosc, trasa.dlugoscKm)) return false
      if (!wZakresie(PODEJSCIE, stan.podejscie, trasa.sumaPodejscM.tam)) return false
      if (!wZakresie(SZCZYT, stan.szczyt, trasa.najwyzszyPunktM ?? 0)) return false
      if (stan.miejscowosc.size > 0 && !stan.miejscowosc.has(trasa.miejscowoscStartu)) return false
      if (stan.ksztalt.size > 0 && !stan.ksztalt.has(trasa.petla ? 'petla' : 'w-jedna-strone'))
        return false
      if (stan.cechy.has('granica') && !trasa.granica) return false
      if (stan.cechy.has('dzieci') && !trasa.kategorieDodatkowe.includes('dzieci') && trasa.kategoria !== 'dzieci')
        return false
      return true
    },
    [stan],
  )

  const szukane = naSlug(fraza)

  const wyniki = useMemo(() => {
    const dopasowane = zIndeksem
      .filter(({ trasa, klucz }) => przezFiltry(trasa) && (szukane.length < 2 || klucz.includes(szukane)))
      .map(({ trasa }) => trasa)

    const porownaj: Record<Sortowanie, (a: TrasaDoPrzegladania, b: TrasaDoPrzegladania) => number> = {
      // „Domyślnie" to nie brak porządku: najpierw trasy z opisem i śladem,
      // bo one dają najwięcej temu, kto dopiero wybiera.
      trafnosc: (a, b) =>
        Number(Boolean(b.podsumowanie)) - Number(Boolean(a.podsumowanie)) ||
        a.nazwa.localeCompare(b.nazwa, 'pl'),
      nazwa: (a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'),
      'dlugosc-rosnaco': (a, b) => a.dlugoscKm - b.dlugoscKm,
      'dlugosc-malejaco': (a, b) => b.dlugoscKm - a.dlugoscKm,
      'czas-rosnaco': (a, b) => a.czasMin.tam - b.czasMin.tam,
    }

    return [...dopasowane].sort(porownaj[sortowanie])
  }, [zIndeksem, przezFiltry, szukane, sortowanie])

  /** Podpowiedzi pod polem szukania — nazwy tras i szczytów. */
  const podpowiedzi = useMemo(() => {
    if (szukane.length < 2) return []
    const nazwy = new Set<string>()
    const wynik: { etykieta: string; opis: string; slug: string }[] = []

    for (const { trasa, klucz } of zIndeksem) {
      if (!klucz.includes(szukane) || nazwy.has(trasa.slug)) continue
      const trafionyPunkt = trasa.punkty.find((p) => naSlug(p).includes(szukane))
      nazwy.add(trasa.slug)
      wynik.push({
        etykieta: trasa.nazwa,
        opis:
          trafionyPunkt && !naSlug(trasa.nazwa).includes(szukane)
            ? `przez ${trafionyPunkt} · ${kilometry(trasa.dlugoscKm)}`
            : `${trasa.miejscowoscStartu} · ${kilometry(trasa.dlugoscKm)} · ${czas(trasa.czasMin.tam)}`,
        slug: trasa.slug,
      })
      if (wynik.length >= 6) break
    }
    return wynik
  }, [zIndeksem, szukane])

  // Kliknięcie poza polem chowa podpowiedzi.
  useEffect(() => {
    const poza = (zdarzenie: MouseEvent) => {
      if (!polePola.current?.contains(zdarzenie.target as Node)) ustawPodpowiedziWidoczne(false)
    }
    document.addEventListener('mousedown', poza)
    return () => document.removeEventListener('mousedown', poza)
  }, [])

  const przelacz = (grupa: keyof Stan, klucz: string) => {
    ustawStan((poprzedni) => {
      const nowy = { ...poprzedni, [grupa]: new Set(poprzedni[grupa]) }
      if (nowy[grupa].has(klucz)) nowy[grupa].delete(klucz)
      else nowy[grupa].add(klucz)
      return nowy
    })
  }

  const ileWybranych = Object.values(stan).reduce((suma, zbior) => suma + zbior.size, 0)
  const wyczysc = () => {
    ustawStan(PUSTY)
    ustawFraze('')
  }

  /** Ile tras spełniłoby dany warunek przy obecnych pozostałych filtrach. */
  const policz = (warunek: (t: TrasaDoPrzegladania) => boolean) =>
    trasy.filter((t) => warunek(t) && (szukane.length < 2 || naSlug(t.nazwa).includes(szukane)))
      .length

  return (
    <div>
      {/* ── Szukanie ──────────────────────────────────────────────────── */}
      <div ref={polePola} className="relative mx-auto max-w-2xl">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-kamien-400"
          aria-hidden
        />
        <input
          type="search"
          value={fraza}
          onChange={(z) => {
            ustawFraze(z.target.value)
            ustawPodpowiedziWidoczne(true)
          }}
          onFocus={() => ustawPodpowiedziWidoczne(true)}
          placeholder="Szukaj trasy, szczytu, miejscowości…"
          aria-label="Szukaj wśród tras"
          className="w-full rounded-2xl border border-kamien-300 bg-white py-4 pl-14 pr-5 text-lg text-kamien-900 shadow-miekki transition-shadow placeholder:text-kamien-400 focus:shadow-uniesiony"
        />

        {podpowiedziWidoczne && podpowiedzi.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-kamien-200 bg-white shadow-wysoki">
            {podpowiedzi.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/szlaki/${p.slug}`}
                  className="flex flex-col px-5 py-3 transition-colors hover:bg-kamien-50"
                >
                  <span className="font-medium text-kamien-900">{p.etykieta}</span>
                  <span className="text-sm text-kamien-500">{p.opis}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Pasek sterowania ──────────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => ustawFiltryOtwarte((o) => !o)}
            aria-expanded={filtryOtwarte}
            aria-controls="panel-filtrow"
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors lg:hidden',
              ileWybranych > 0
                ? 'border-las-600 bg-las-600 text-white'
                : 'border-kamien-300 bg-white text-kamien-800',
            )}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtry
            {ileWybranych > 0 && <span>({ileWybranych})</span>}
          </button>

          <p aria-live="polite" className="text-sm text-kamien-600">
            <strong className="font-semibold text-kamien-900">{wyniki.length}</strong>
            {wyniki.length === 1 ? ' trasa' : wyniki.length < 5 ? ' trasy' : ' tras'}
            {wyniki.length !== trasy.length && ` z ${trasy.length}`}
          </p>

          {ileWybranych > 0 && (
            <button
              type="button"
              onClick={wyczysc}
              className="inline-flex items-center gap-1 text-sm font-medium text-las-700 hover:underline"
            >
              <X className="size-3.5" aria-hidden />
              Wyczyść
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sortowanie" className="text-sm text-kamien-600">
            Sortuj
          </label>
          <select
            id="sortowanie"
            value={sortowanie}
            onChange={(z) => ustawSortowanie(z.target.value as Sortowanie)}
            className="rounded-lg border border-kamien-300 bg-white px-3 py-2 text-sm text-kamien-800"
          >
            {SORTOWANIA.map((o) => (
              <option key={o.wartosc} value={o.wartosc}>
                {o.etykieta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Filtry + wyniki ───────────────────────────────────────────── */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div
          id="panel-filtrow"
          className={cn(
            'lg:sticky lg:top-28 lg:block lg:self-start',
            filtryOtwarte ? 'block' : 'hidden',
          )}
        >
          <div className="space-y-6 rounded-2xl border border-kamien-200 bg-white p-5">
            <Grupa nazwa="Rodzaj">
              <Przelacznik
                etykieta="Piesze"
                ile={policz((t) => t.kategoria !== 'rowerowa')}
                wybrany={stan.rodzaj.has('piesze')}
                onClick={() => przelacz('rodzaj', 'piesze')}
              />
              <Przelacznik
                etykieta="Rowerowe"
                ile={policz((t) => t.kategoria === 'rowerowa')}
                wybrany={stan.rodzaj.has('rowerowe')}
                onClick={() => przelacz('rodzaj', 'rowerowe')}
              />
            </Grupa>

            <Grupa nazwa="Trudność">
              {(['latwa', 'srednia', 'trudna'] as const).map((t) => (
                <Przelacznik
                  key={t}
                  etykieta={{ latwa: 'Łatwe', srednia: 'Średnie', trudna: 'Trudne' }[t]}
                  ile={policz((trasa) => trasa.trudnosc === t)}
                  wybrany={stan.trudnosc.has(t)}
                  onClick={() => przelacz('trudnosc', t)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Czas przejścia">
              {CZAS.map((z) => (
                <Przelacznik
                  key={z.klucz}
                  etykieta={z.etykieta}
                  ile={policz((t) => t.czasMin.tam >= z.od && t.czasMin.tam < z.do)}
                  wybrany={stan.czas.has(z.klucz)}
                  onClick={() => przelacz('czas', z.klucz)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Długość">
              {DLUGOSC.map((z) => (
                <Przelacznik
                  key={z.klucz}
                  etykieta={z.etykieta}
                  ile={policz((t) => t.dlugoscKm >= z.od && t.dlugoscKm < z.do)}
                  wybrany={stan.dlugosc.has(z.klucz)}
                  onClick={() => przelacz('dlugosc', z.klucz)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Suma podejść">
              {PODEJSCIE.map((z) => (
                <Przelacznik
                  key={z.klucz}
                  etykieta={z.etykieta}
                  ile={policz((t) => t.sumaPodejscM.tam >= z.od && t.sumaPodejscM.tam < z.do)}
                  wybrany={stan.podejscie.has(z.klucz)}
                  onClick={() => przelacz('podejscie', z.klucz)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Najwyższy punkt">
              {SZCZYT.map((z) => (
                <Przelacznik
                  key={z.klucz}
                  etykieta={z.etykieta}
                  ile={policz((t) => (t.najwyzszyPunktM ?? 0) >= z.od && (t.najwyzszyPunktM ?? 0) < z.do)}
                  wybrany={stan.szczyt.has(z.klucz)}
                  onClick={() => przelacz('szczyt', z.klucz)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Start">
              {miejscowosci.map((m) => (
                <Przelacznik
                  key={m.nazwa}
                  etykieta={m.nazwa}
                  ile={m.ile}
                  wybrany={stan.miejscowosc.has(m.nazwa)}
                  onClick={() => przelacz('miejscowosc', m.nazwa)}
                />
              ))}
            </Grupa>

            <Grupa nazwa="Przebieg">
              <Przelacznik
                etykieta="Pętla"
                ile={policz((t) => t.petla)}
                wybrany={stan.ksztalt.has('petla')}
                onClick={() => przelacz('ksztalt', 'petla')}
              />
              <Przelacznik
                etykieta="W jedną stronę"
                ile={policz((t) => !t.petla)}
                wybrany={stan.ksztalt.has('w-jedna-strone')}
                onClick={() => przelacz('ksztalt', 'w-jedna-strone')}
              />
              <Przelacznik
                etykieta="Z dziećmi"
                ile={policz((t) => t.kategoria === 'dzieci' || t.kategorieDodatkowe.includes('dzieci'))}
                wybrany={stan.cechy.has('dzieci')}
                onClick={() => przelacz('cechy', 'dzieci')}
              />
              <Przelacznik
                etykieta="Przez granicę"
                ile={policz((t) => t.granica)}
                wybrany={stan.cechy.has('granica')}
                onClick={() => przelacz('cechy', 'granica')}
              />
            </Grupa>
          </div>
        </div>

        <div className="min-w-0">
          {wyniki.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {wyniki.map((trasa, indeks) => (
                <KafelekTrasy key={trasa.id} trasa={trasa} priorytet={indeks < 3} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-kamien-300 p-16 text-center">
              <p className="font-heading text-xl font-semibold text-kamien-900">
                Żadna trasa nie pasuje
              </p>
              <p className="mt-2 text-kamien-600">
                Spróbuj odznaczyć któryś z filtrów albo poszukać krótszego słowa.
              </p>
              <button
                type="button"
                onClick={wyczysc}
                className="mt-6 rounded-full bg-las-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
              >
                Wyczyść wszystko
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Grupa({ nazwa, children }: { nazwa: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-kamien-500">
        {nazwa}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

function Przelacznik({
  etykieta,
  ile,
  wybrany,
  onClick,
}: {
  etykieta: string
  ile: number
  wybrany: boolean
  onClick: () => void
}) {
  // Warunek bez ani jednej trasy zostaje widoczny, ale wygaszony — znika
  // pokusa klikania w ślepy zaułek, a jednocześnie widać pełną skalę filtra.
  const pusty = ile === 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pusty && !wybrany}
      // `aria-pressed` zamiast samego koloru — czytnik ekranu musi wiedzieć,
      // że przycisk jest wciśnięty, a nie tylko inny.
      aria-pressed={wybrany}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        wybrany
          ? 'border-las-600 bg-las-600 font-medium text-white'
          : pusty
            ? 'cursor-default border-kamien-200 text-kamien-300'
            : 'border-kamien-300 bg-white text-kamien-700 hover:border-las-400 hover:bg-las-50',
      )}
    >
      {etykieta}
      <span className={cn('text-xs', wybrany ? 'text-white/70' : 'text-kamien-400')}>{ile}</span>
    </button>
  )
}
