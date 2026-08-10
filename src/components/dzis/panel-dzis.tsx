import Link from 'next/link'
import {
  ArrowRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  DoorOpen,
  Factory,
  Mountain,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Waves,
  Wind,
} from 'lucide-react'

import { opisPogody, type DaneDnia, type StanObiektu } from '@/lib/dzis'
import { godzina, kafelkiDnia, podpisZrodel, type Kafelek } from '@/lib/dzis/kafelki'

/**
 * „Dziś w Pieninach" — panel warunków na dziś.
 *
 * **Dwa warianty, jeden komponent.** Pasek trafia pod sekcję powitalną na
 * stronie głównej i ma jedno zadanie: pokazać, że portal wie, co się dzieje
 * teraz. Pełny stoi na `/dzis` i dokłada kontekst, po który ktoś przyszedł
 * już świadomie. Rozdzielenie na dwa komponenty rozjechałoby progi i podpisy
 * źródeł przy pierwszej poprawce.
 *
 * **Stan czytelny bez rozróżniania barw.** Zieleń–szarość–obrys przy obiektach
 * zawsze stoi obok słowa („otwarte do 19:00"), a kafelek z ostrzeżeniem ma
 * inną ramkę, nie tylko inny odcień. Kolor jest tu podpowiedzią, nigdy jedynym
 * nośnikiem informacji.
 */

/**
 * Ikony kafelków.
 *
 * Klucz pochodzi z `kafelkiDnia()`, a nie z pogody wprost — dzięki temu reguła
 * „co pokazać" i decyzja „jak to narysować" nie muszą o sobie wiedzieć.
 */
const IKONY: Record<string, typeof Sun> = {
  gran: Mountain,
  dunajec: Waves,
  czynne: DoorOpen,
  zachod: Sunset,
  snieg: Snowflake,
  porywy: Wind,
  uv: Sun,
  powietrze: Factory,
}

/** Ikona pogodowa dla doliny — jedyny kafelek, który zmienia rysunek z pogodą. */
const IKONY_POGODY: Record<string, typeof Sun> = {
  slonce: Sun,
  czesciowo: CloudSun,
  chmury: Cloud,
  mgla: CloudFog,
  deszcz: CloudRain,
  snieg: CloudSnow,
  burza: CloudLightning,
}

function ikonaKafelka(kafelek: Kafelek, dane: DaneDnia): typeof Sun {
  if (kafelek.klucz === 'dolina' && dane.pogoda) {
    return IKONY_POGODY[opisPogody(dane.pogoda.dolina.kod).ikona] ?? Cloud
  }
  // Po zachodzie kafelek mówi o wschodzie — rysunek musi mówić to samo.
  if (kafelek.klucz === 'zachod' && kafelek.etykieta === 'wschód słońca') return Sunrise

  return IKONY[kafelek.klucz] ?? Cloud
}

export function PanelDzis({
  dane,
  wariant,
}: {
  dane: DaneDnia
  wariant: 'pasek' | 'pelny'
}) {
  const kafelki = kafelkiDnia(dane, dane.odczyt)

  /*
    Gdy padną wszystkie trzy źródła naraz, nie pokazujemy pustej ramki
    z napisem „brak danych". Sekcja po prostu znika — strona bez niej jest
    kompletna, a pusty pas pod powitaniem wygląda jak zepsuta strona.
  */
  if (kafelki.length === 0) return null

  return wariant === 'pasek' ? (
    <PasekDzis dane={dane} kafelki={kafelki} />
  ) : (
    <PelnyDzis dane={dane} kafelki={kafelki} />
  )
}

/* ── Wariant na stronę główną ───────────────────────────────────────────── */

function PasekDzis({ dane, kafelki }: { dane: DaneDnia; kafelki: Kafelek[] }) {
  return (
    <section aria-labelledby="dzis-naglowek" className="border-y border-las-800 bg-las-900 text-white">
      <div className="obszar py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2
            id="dzis-naglowek"
            className="text-sm font-semibold uppercase tracking-[0.16em] text-las-300"
          >
            Dziś w Pieninach
          </h2>
          <Link
            href="/dzis"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Pełne warunki
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        {/*
          Przewijanie w poziomie zamiast zawijania do drugiego rzędu. Kafelków
          bywa od czterech do dziewięciu — zawinięte robiłyby z paska pod
          powitaniem drugą sekcję, a to ma być jeden rzut oka, nie kolejny
          ekran do przewinięcia.
        */}
        <ul className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {kafelki.map((kafelek) => {
            const Ikona = ikonaKafelka(kafelek, dane)
            return (
              <li
                key={kafelek.klucz}
                className={`min-w-[10.5rem] shrink-0 snap-start rounded-xl border px-4 py-3 ${
                  kafelek.uwaga
                    ? 'border-amber-400/50 bg-amber-400/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-las-200">
                  <Ikona className="size-3.5" aria-hidden />
                  {kafelek.etykieta}
                </p>
                <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums">
                  {kafelek.wartosc}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-white/60">{kafelek.dopisek}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ── Wariant na stronę /dzis ────────────────────────────────────────────── */

function PelnyDzis({ dane, kafelki }: { dane: DaneDnia; kafelki: Kafelek[] }) {
  return (
    <div className="space-y-10">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kafelki.map((kafelek) => {
          const Ikona = ikonaKafelka(kafelek, dane)
          return (
            <li
              key={kafelek.klucz}
              className={`rounded-2xl border p-5 ${
                kafelek.uwaga ? 'border-amber-300 bg-amber-50' : 'border-kamien-200 bg-white'
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-medium text-kamien-600">
                <span
                  className={`grid size-8 place-items-center rounded-lg ${
                    kafelek.uwaga ? 'bg-amber-100 text-amber-800' : 'bg-las-50 text-las-700'
                  }`}
                >
                  <Ikona className="size-4" aria-hidden />
                </span>
                {kafelek.etykieta}
              </p>
              <p className="mt-3 font-heading text-3xl font-semibold tabular-nums text-kamien-900">
                {kafelek.wartosc}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-kamien-600">{kafelek.dopisek}</p>
            </li>
          )
        })}
      </ul>

      {dane.obiekty.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-semibold text-kamien-900">Co jest dziś czynne</h2>
          <p className="mt-2 max-w-[65ch] text-kamien-600">
            Godziny pochodzą ze stron operatorów. Przed dalszą drogą warto je
            potwierdzić — zwłaszcza poza sezonem, gdy bywają skracane z dnia na dzień.
          </p>
          <ul className="mt-6 divide-y divide-kamien-200 overflow-hidden rounded-2xl border border-kamien-200 bg-white">
            {dane.obiekty.map((stan) => (
              <WierszObiektu key={stan.obiekt.slug} stan={stan} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm leading-relaxed text-kamien-500">
        {podpisZrodel(dane)}. Dane odświeżają się co kwadrans; ostatni odczyt
        o {godzina(dane.odczyt)}.
      </p>
    </div>
  )
}

/**
 * Wygląd stanu.
 *
 * `przed-otwarciem` dostaje bursztyn, a nie szarość: obiekt, który za godzinę
 * się otworzy, to zupełnie inna wiadomość niż taki, który dziś nie pracuje —
 * a szara kropka przy obu kazałaby czytać drobny druk, żeby je odróżnić.
 */
const STANY: Record<StanObiektu['stan'], { kropka: string; napis: string }> = {
  otwarte: { kropka: 'bg-las-600', napis: 'text-las-800' },
  'przed-otwarciem': { kropka: 'bg-amber-500', napis: 'text-amber-800' },
  'po-zamknieciu': { kropka: 'bg-kamien-400', napis: 'text-kamien-600' },
  nieczynne: { kropka: 'bg-kamien-400', napis: 'text-kamien-600' },
  'poza-sezonem': { kropka: 'border border-kamien-400', napis: 'text-kamien-500' },
}

/**
 * Stan w jednym zdaniu.
 *
 * Mówimy, co z tym zrobić, a nie w jakim stanie jest obiekt: „otwarte do
 * 19:00" i „otwiera się o 9:00" prowadzą do decyzji, a „zamknięte" zostawia
 * czytelnika z pytaniem, po które tu przyszedł.
 */
function opisStanu(stan: StanObiektu): string {
  const godziny = stan.dzisiaj

  switch (stan.stan) {
    case 'otwarte':
      return `otwarte do ${godziny!.zamkniecie}:00`
    case 'przed-otwarciem':
      return `otwiera się o ${godziny!.otwarcie}:00`
    case 'po-zamknieciu':
      return `zamknięte, dziś było do ${godziny!.zamkniecie}:00`
    case 'nieczynne':
      return 'dziś nieczynne'
    case 'poza-sezonem':
      return 'poza sezonem'
  }
}

function WierszObiektu({ stan }: { stan: StanObiektu }) {
  const wyglad = STANY[stan.stan]

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5">
      <div className="min-w-0">
        <Link
          href={`/atrakcje/${stan.obiekt.slug}`}
          className="font-medium text-kamien-900 hover:text-las-700"
        >
          {stan.obiekt.nazwa}
        </Link>
        <span className="ml-2 text-sm text-kamien-500">{stan.obiekt.miejscowosc}</span>
        {stan.obiekt.uwaga && (
          <p className="mt-0.5 text-sm leading-snug text-kamien-500">{stan.obiekt.uwaga}</p>
        )}
      </div>

      <p className={`flex shrink-0 items-center gap-2 text-sm ${wyglad.napis}`}>
        {/* Kropka jest ozdobą — stan mówi napis obok, więc czytnik ekranu
            nie ma czego z niej odczytać. */}
        <span className={`size-2 rounded-full ${wyglad.kropka}`} aria-hidden />
        {opisStanu(stan)}
      </p>
    </li>
  )
}
