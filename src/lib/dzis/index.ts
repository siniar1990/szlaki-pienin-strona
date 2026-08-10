import { unstable_cache } from 'next/cache'

import { chwilaWPolsce } from './czas'
import { coCzynne, type StanObiektu } from './czynne'
import { pobierzStanDunajca, type StanDunajca } from './dunajec'
import { pobierzPogode, type Pogoda } from './pogoda'
import { pobierzPowietrze, type Powietrze } from './powietrze'

/**
 * „Dziś w Pieninach" — wszystko, co zmienia się z dnia na dzień.
 *
 * **Po co ta strona w ogóle istnieje.** Reszta portalu odpowiada na pytanie
 * „co tu jest", a to jest wiedza, którą czyta się raz. Ta sekcja odpowiada
 * na pytanie „jak jest teraz" — i po nią wraca się codziennie przez tydzień
 * przed wyjazdem, a potem każdego ranka na miejscu. Żaden inny serwis
 * o Pieninach tego nie zbiera w jednym miejscu.
 *
 * **Dlaczego kwadrans pamięci podręcznej.** Pogoda i wodowskaz odświeżają się
 * u źródła co godzinę, więc częstsze pytanie nic nie wnosi, a przy każdym
 * wejściu na stronę główną oznaczałoby dwa żądania do cudzych serwerów.
 * Kwadrans jest wyraźnie krótszy niż tempo zmian i wyraźnie dłuższy niż
 * odstęp między odwiedzinami.
 *
 * **Każda część stoi na własnych nogach.** Awaria pogody nie zabiera stanu
 * wody, a awaria IMGW nie zabiera godzin otwarcia, które i tak liczą się
 * lokalnie. Sekcja z jedną brakującą kaflą jest użyteczna; sekcja, która
 * znika w całości przez cudzy serwer, nie jest.
 */

export type DaneDnia = {
  pogoda: Pogoda | null
  dunajec: StanDunajca | null
  powietrze: Powietrze | null
  obiekty: StanObiektu[]
  /** Chwila, dla której policzono te dane — do podpisu „stan na". */
  odczyt: Date
}

const pobierzZewnetrzne = unstable_cache(
  async () => {
    /*
      Trzy żądania równolegle, a nie jedno po drugim. Każde ma własny limit
      ośmiu sekund, więc szeregowo najgorszy przypadek to prawie pół minuty
      — czyli tyle, ile trwa cierpliwość kogoś patrzącego na pustą stronę.
    */
    const [pogoda, dunajec, powietrze] = await Promise.all([
      pobierzPogode(),
      pobierzStanDunajca(),
      pobierzPowietrze(),
    ])
    return { pogoda, dunajec, powietrze }
  },
  ['dzis-w-pieninach'],
  { revalidate: 900 },
)

/**
 * Ożywienie daty po przejściu przez pamięć podręczną.
 *
 * `unstable_cache` zapisuje wynik jako JSON, więc `Date` wraca stamtąd jako
 * napis — a `.getTime()` na napisie wywraca stronę. Pierwszy odczyt działa
 * (wartość jest jeszcze prawdziwym obiektem), psuje się dopiero drugi, przez
 * co błąd potrafi przejść lokalne sprawdzanie i wyjść dopiero u ludzi.
 * Dokładnie to zdarzyło się już raz przy notkach — dlatego każdą datę
 * przywracamy tu, poza funkcją zapamiętywaną.
 */
function data(wartosc: Date | string): Date {
  return wartosc instanceof Date ? wartosc : new Date(wartosc)
}

export async function pobierzDaneDnia(): Promise<DaneDnia> {
  const { pogoda, dunajec, powietrze } = await pobierzZewnetrzne()
  const teraz = new Date()

  /*
    Godziny otwarcia liczymy poza pamięcią podręczną. Są darmowe, bo nie
    wymagają żadnego żądania — a zapamiętane na kwadrans potrafiłyby pokazać
    „otwarte" dziesięć minut po zamknięciu muzeum.
  */
  return {
    pogoda: pogoda && {
      ...pogoda,
      wschod: data(pogoda.wschod),
      zachod: data(pogoda.zachod),
      wschodJutro: data(pogoda.wschodJutro),
    },
    dunajec: dunajec && { ...dunajec, pomiar: data(dunajec.pomiar) },
    powietrze,
    obiekty: coCzynne(chwilaWPolsce(teraz)),
    odczyt: teraz,
  }
}

/**
 * Ile zostało do zachodu słońca.
 *
 * Najbardziej praktyczna liczba na całej stronie: mówi wprost, czy zdąży się
 * jeszcze wejść na Sokolicę. Zwraca `null` po zachodzie — „minus dwie
 * godziny" nie jest odpowiedzią na żadne pytanie.
 */
export function doZachodu(zachod: Date, teraz = new Date()): { godziny: number; minuty: number } | null {
  const zostalo = zachod.getTime() - teraz.getTime()
  if (zostalo <= 0) return null

  const minutyRazem = Math.floor(zostalo / 60_000)
  return { godziny: Math.floor(minutyRazem / 60), minuty: minutyRazem % 60 }
}

export { opisPogody } from './pogoda'
export type { Pogoda, PogodaPunktu } from './pogoda'
export { opisPowietrza, PROG_WARTY_UWAGI } from './powietrze'
export type { Powietrze } from './powietrze'
export type { StanDunajca } from './dunajec'
export type { StanObiektu } from './czynne'
export { chwilaWPolsce, zPolskiegoCzasu } from './czas'
export type { ChwilaWPolsce } from './czas'
