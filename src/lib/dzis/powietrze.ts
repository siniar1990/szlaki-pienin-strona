/**
 * Jakość powietrza w Szczawnicy.
 *
 * **Dlaczego to w ogóle jest na portalu górskim.** Bo zimą w Szczawnicy smog
 * jest realny: uzdrowisko leży w kotlinie, w której przy wyżu dym z kominów
 * nie ma dokąd uciec. Ktoś, kto przyjeżdża tu leczyć drogi oddechowe, ma
 * prawo to wiedzieć — a nikt mu tego nie mówi.
 *
 * **Dlaczego Open-Meteo, a nie GIOŚ.** GIOŚ podaje odczyty ze stacji, a
 * najbliższa jest w Nowym Sączu, czterdzieści kilometrów stąd i w zupełnie
 * innej kotlinie — jej liczba nie opisuje powietrza w Szczawnicy. Open-Meteo
 * liczy model dla zadanego punktu i przy okazji jest tym samym dostawcą, co
 * pogoda, więc nie dokładamy drugiego sposobu robienia tej samej rzeczy.
 * (Do tego interfejs GIOŚ w wersji pierwszej zwraca dziś 410, a druga wymaga
 * dopasowywania stacji po współrzędnych.)
 *
 * **Skala jest europejska, nie polska.** Polski indeks ma progi łagodniejsze
 * od europejskiego — to samo powietrze bywa u nas „dobre", a w skali unijnej
 * „umiarkowane". Bierzemy ostrzejszą, bo portal czytają też goście z zagranicy,
 * a przy zdrowiu zaniżanie progu jest gorszym błędem niż zawyżanie.
 */

const ADRES = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/** Szczawnica, centrum — ten sam punkt co pogoda w dolinie. */
const PUNKT = { szerokosc: 49.4239, dlugosc: 20.4869 }

export type Powietrze = {
  /** Europejski indeks jakości powietrza (EAQI). */
  indeks: number
  pm10: number
  pm25: number
}

type OdpowiedzApi = {
  current?: {
    european_aqi?: number
    pm10?: number
    pm2_5?: number
  }
}

export async function pobierzPowietrze(): Promise<Powietrze | null> {
  try {
    const parametry = new URLSearchParams({
      latitude: String(PUNKT.szerokosc),
      longitude: String(PUNKT.dlugosc),
      current: 'european_aqi,pm10,pm2_5',
      timezone: 'Europe/Warsaw',
    })

    const odpowiedz = await fetch(`${ADRES}?${parametry}`, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    if (!odpowiedz.ok) throw new Error(`Open-Meteo (powietrze): ${odpowiedz.status}`)

    const dane = ((await odpowiedz.json()) as OdpowiedzApi).current
    if (dane?.european_aqi === undefined) return null

    return {
      indeks: Math.round(dane.european_aqi),
      pm10: Math.round(dane.pm10 ?? 0),
      pm25: Math.round(dane.pm2_5 ?? 0),
    }
  } catch (blad) {
    console.error('Nie udało się pobrać jakości powietrza:', blad)
    return null
  }
}

/**
 * Próg, powyżej którego warto o powietrzu wspomnieć.
 *
 * Poniżej czterdziestu europejski indeks mówi „dobre" albo „bardzo dobre",
 * co w Pieninach jest stanem normalnym przez większość roku. Kafelek
 * powtarzający codziennie „powietrze czyste" przestaje być czytany, a wtedy
 * nie zadziała także w ten jeden mroźny tydzień, kiedy jest naprawdę zły.
 */
export const PROG_WARTY_UWAGI = 40

/**
 * Europejski indeks na słowa.
 *
 * Progi wprost z definicji EAQI. Zwracamy też klucz barwy, żeby komponent
 * nie musiał znać liczb — inaczej ta sama tabela stałaby w dwóch miejscach
 * i przy pierwszej poprawce rozjechałyby się między sobą.
 */
export function opisPowietrza(indeks: number): { tekst: string; stan: 'dobre' | 'srednie' | 'zle' } {
  if (indeks <= 20) return { tekst: 'bardzo dobre', stan: 'dobre' }
  if (indeks <= 40) return { tekst: 'dobre', stan: 'dobre' }
  if (indeks <= 60) return { tekst: 'umiarkowane', stan: 'srednie' }
  if (indeks <= 80) return { tekst: 'złe', stan: 'zle' }
  if (indeks <= 100) return { tekst: 'bardzo złe', stan: 'zle' }
  return { tekst: 'wyjątkowo złe', stan: 'zle' }
}
