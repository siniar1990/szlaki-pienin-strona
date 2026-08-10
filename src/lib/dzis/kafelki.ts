import { odmien } from '@/lib/format'

import type { DaneDnia } from './index'
import { doZachodu } from './index'
import { opisPogody } from './pogoda'
import { opisPowietrza, PROG_WARTY_UWAGI } from './powietrze'

/**
 * Zawartość kafelków „Dziś w Pieninach" — sama treść, bez wyglądu.
 *
 * **Dlaczego to nie siedzi w komponencie.** Bo decyzja, że kafelek ze śniegiem
 * pojawia się dopiero przy pięciu centymetrach, jest regułą, a nie układem
 * strony — i jako reguła daje się przetestować. Komponent dokłada do klucza
 * ikonę i barwę; co pokazać i kiedy, rozstrzyga się tutaj.
 *
 * **Skąd bierze się kolejność.** Od tego, co najczęściej zmienia plan: pogoda
 * w dolinie, potem na grani (bo różnica bywa większa niż między dniami), potem
 * woda, potem co czynne, na końcu ile zostało światła. Kafelki warunkowe
 * dochodzą na końcu — są rzadkie, a rzadkie na początku listy odbiera się jako
 * ważniejsze, niż są.
 */

export type KluczKafelka =
  | 'dolina'
  | 'gran'
  | 'dunajec'
  | 'czynne'
  | 'zachod'
  | 'snieg'
  | 'porywy'
  | 'uv'
  | 'powietrze'

export type Kafelek = {
  klucz: KluczKafelka
  /** Duża liczba z jednostką — to, co widać z drugiego końca pokoju. */
  wartosc: string
  /** Podpis pod liczbą: czego dotyczy. */
  etykieta: string
  /** Dopowiedzenie drobnym drukiem. Puste, gdy nie ma czego dopowiedzieć. */
  dopisek: string
  /** Czy kafelek niesie ostrzeżenie — komponent wyróżnia go barwą. */
  uwaga?: boolean
}

/** Od tylu centymetrów na grani leży śnieg, a nie jego resztki w cieniu. */
export const SNIEG_WARTY_UWAGI_CM = 5

/** Powyżej tylu km/h porywy przewracają człowieka na odsłoniętej grani. */
export const PORYWY_WARTE_UWAGI_KMH = 45

/** Od tej wartości indeksu UV skóra zaczyna się parzyć w kilkanaście minut. */
export const UV_WARTY_UWAGI = 6

/** 15.5 → „15,5". Przecinek, bo to polska strona. */
function przecinek(liczba: number): string {
  return liczba.toString().replace('.', ',')
}

export function kafelkiDnia(dane: DaneDnia, teraz = new Date()): Kafelek[] {
  const kafelki: Kafelek[] = []
  const { pogoda, dunajec, powietrze, obiekty } = dane

  if (pogoda) {
    const wDolinie = opisPogody(pogoda.dolina.kod)
    kafelki.push({
      klucz: 'dolina',
      wartosc: `${pogoda.dolina.temperatura}°`,
      etykieta: 'Szczawnica',
      dopisek: `${wDolinie.tekst} · odczuwalna ${pogoda.dolina.odczuwalna}°`,
    })

    kafelki.push({
      klucz: 'gran',
      wartosc: `${pogoda.gran.temperatura}°`,
      etykieta: 'Trzy Korony',
      /*
        Wiatr podajemy przy grani, a nie w dolinie, bo tam jest różnicą
        między spacerem a walką — a przy okazji to jedyna liczba, która
        tłumaczy, czemu w kurtce na dole gorąco, a na górze zimno.
      */
      dopisek: `wiatr ${pogoda.gran.wiatr} km/h · 982 m n.p.m.`,
    })
  }

  if (dunajec) {
    kafelki.push({
      klucz: 'dunajec',
      wartosc: `${dunajec.poziom} cm`,
      etykieta: 'Dunajec',
      dopisek:
        dunajec.temperaturaWody !== null
          ? `${dunajec.stacja} · woda ${przecinek(dunajec.temperaturaWody)}°`
          : dunajec.stacja,
    })
  }

  const otwarte = obiekty.filter((o) => o.stan === 'otwarte').length
  const wSezonie = obiekty.filter((o) => o.stan !== 'poza-sezonem').length
  if (wSezonie > 0) {
    /*
      Gdy jeszcze nic nie jest otwarte, podajemy godzinę pierwszego otwarcia.
      Samo „0 z 6" o siódmej rano brzmi jak zła wiadomość, a jest zwykłym
      „jeszcze za dwie godziny" — i to jest odpowiedź, po którą ktoś zajrzał.
    */
    const najblizsze = obiekty
      .filter((o) => o.stan === 'przed-otwarciem' && o.dzisiaj)
      .map((o) => o.dzisiaj!.otwarcie)
      .sort((a, b) => a - b)[0]

    kafelki.push({
      klucz: 'czynne',
      wartosc: `${otwarte} z ${wSezonie}`,
      etykieta: odmien(wSezonie, ['obiekt otwarty', 'obiekty otwarte', 'obiektów otwartych']),
      dopisek:
        otwarte === 0 && najblizsze !== undefined
          ? `pierwszy otwiera się o ${najblizsze}:00`
          : 'zamki, muzea i atrakcje',
    })
  }

  if (pogoda) {
    /*
      Odliczanie do zachodu ma sens tylko za dnia i tylko wtedy odpowiada na
      pytanie, po które tu ktoś zajrzał: „zdążę jeszcze na Sokolicę?".

      Przed wschodem i po zachodzie pytanie brzmi inaczej — „o której się
      rozjaśni" — więc kafelek zmienia treść zamiast pokazywać „za 17 godzin",
      co o drugiej w nocy jest liczbą prawdziwą i zupełnie bezużyteczną.
      Przed świtem to nie jest przypadek marginalny: latem w Pieninach ludzie
      wychodzą na wschód słońca na Trzy Korony przed czwartą.
    */
    const przedWschodem = teraz < pogoda.wschod
    const zostalo = przedWschodem ? null : doZachodu(pogoda.zachod, teraz)

    kafelki.push({
      klucz: 'zachod',
      wartosc: zostalo
        ? `${zostalo.godziny} h ${zostalo.minuty} min`
        : godzina(przedWschodem ? pogoda.wschod : pogoda.wschodJutro),
      etykieta: zostalo ? 'do zachodu' : 'wschód słońca',
      dopisek: zostalo
        ? `zachód o ${godzina(pogoda.zachod)}`
        : przedWschodem
          ? 'jeszcze przed świtem'
          : `jutro rano · zachód był o ${godzina(pogoda.zachod)}`,
    })
  }

  /* ── Kafelki, które pojawiają się tylko wtedy, gdy coś znaczą ─────────── */

  if (pogoda && pogoda.gran.snieg >= SNIEG_WARTY_UWAGI_CM) {
    kafelki.push({
      klucz: 'snieg',
      wartosc: `${pogoda.gran.snieg} cm`,
      etykieta: 'śniegu na grani',
      dopisek: 'na stromiznach przydadzą się raczki',
    })
  }

  if (pogoda && pogoda.porywy >= PORYWY_WARTE_UWAGI_KMH) {
    kafelki.push({
      klucz: 'porywy',
      wartosc: `${pogoda.porywy} km/h`,
      etykieta: 'porywy wiatru',
      dopisek: 'na odsłoniętych graniach mocno wieje',
      uwaga: true,
    })
  }

  if (pogoda && pogoda.uv >= UV_WARTY_UWAGI) {
    kafelki.push({
      klucz: 'uv',
      wartosc: `UV ${pogoda.uv}`,
      etykieta: 'silne słońce',
      dopisek: 'krem i nakrycie głowy',
      uwaga: true,
    })
  }

  if (powietrze && powietrze.indeks > PROG_WARTY_UWAGI) {
    const opis = opisPowietrza(powietrze.indeks)
    kafelki.push({
      klucz: 'powietrze',
      wartosc: opis.tekst,
      etykieta: 'powietrze',
      dopisek: `PM10 ${powietrze.pm10} µg/m³ · PM2,5 ${powietrze.pm25} µg/m³`,
      uwaga: opis.stan === 'zle',
    })
  }

  return kafelki
}

/** Godzina w strefie warszawskiej, np. „20:14". */
export function godzina(chwila: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  }).format(chwila)
}

/**
 * Podpis pod panelem: skąd te liczby.
 *
 * Ta sama zasada, którą trzymamy przy trasach i notkach — czytelnik ma
 * wiedzieć, czyje to dane. Przy pogodzie to nie formalność: gdy prognoza się
 * nie sprawdzi, powinien wiedzieć, do kogo mieć pretensje, a nie do nas.
 */
export function podpisZrodel(dane: DaneDnia): string {
  const czesci: string[] = []
  if (dane.pogoda) czesci.push('Pogoda i powietrze: Open-Meteo')
  else if (dane.powietrze) czesci.push('Powietrze: Open-Meteo')
  if (dane.dunajec) czesci.push(`Woda: IMGW, pomiar ${godzina(dane.dunajec.pomiar)}`)
  czesci.push('Godziny otwarcia: strony operatorów')

  return czesci.join(' · ')
}
