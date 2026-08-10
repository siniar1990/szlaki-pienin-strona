/**
 * Pogoda w dolinie i w górach.
 *
 * **Dlaczego dwa punkty, a nie jeden.** Bo to jest cała informacja. W lipcu
 * w Szczawnicy bywa 26 stopni, a na grani Trzech Koron 17 i wiatr — i to jest
 * różnica między wyjściem w koszulce a wyjściem w kurtce. Jedna liczba dla
 * „Pienin" nie mówi nic komuś, kto stoi na dole i zastanawia się, co spakować.
 *
 * **Dlaczego Open-Meteo.** Darmowe, bez klucza, bez limitu rejestracji i bez
 * obowiązku umieszczania logo. Model liczy na siatce z uwzględnieniem
 * wysokości nad poziomem morza, więc różnica dolina–grań nie jest zgadywana.
 */

const ADRES = 'https://api.open-meteo.com/v1/forecast'

/** Szczawnica, centrum — 484 m n.p.m. */
const DOLINA = { szerokosc: 49.4239, dlugosc: 20.4869 }

/**
 * Trzy Korony — 982 m n.p.m.
 *
 * Wysokość podajemy modelowi wprost, bo siatka pogodowa wygładza rzeźbę
 * terenu i sama z siebie dałaby dla tego punktu wartości bliższe dolinie.
 */
const GRAN = { szerokosc: 49.4183, dlugosc: 20.4128, wysokosc: 982 }

export type PogodaPunktu = {
  temperatura: number
  odczuwalna: number
  opad: number
  wiatr: number
  /** Kod pogody WMO — tłumaczony na słowa i ikonę w komponencie. */
  kod: number
  /** Pokrywa śnieżna w centymetrach. Model podaje w metrach. */
  snieg: number
}

export type Pogoda = {
  dolina: PogodaPunktu
  gran: PogodaPunktu
  /** Prognoza na dziś dla doliny. */
  najwyzsza: number
  najnizsza: number
  opadDzis: number
  /** Największe dzisiejsze porywy wiatru w dolinie, w km/h. */
  porywy: number
  /** Szczytowy indeks UV — liczba, przy której zaczyna się parzyć skóra. */
  uv: number
  wschod: Date
  zachod: Date
  /**
   * Wschód następnego dnia.
   *
   * Potrzebny wieczorem: po zachodzie jedyne sensowne pytanie brzmi „o której
   * się rozjaśni", a dzisiejszy wschód jest wtedy godziną, która już minęła.
   * Różnica bywa mała, ale podanie dzisiejszej z podpisem „jutro" to podanie
   * liczby, której nikt nie sprawdzał.
   */
  wschodJutro: Date
}

type OdpowiedzApi = {
  current?: {
    temperature_2m?: number
    apparent_temperature?: number
    precipitation?: number
    weather_code?: number
    wind_speed_10m?: number
    snow_depth?: number
  }
  daily?: {
    sunrise?: string[]
    sunset?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_sum?: number[]
    uv_index_max?: number[]
    wind_gusts_10m_max?: number[]
  }
}

async function zapytaj(
  punkt: { szerokosc: number; dlugosc: number; wysokosc?: number },
  zDobowa: boolean,
): Promise<OdpowiedzApi> {
  const parametry = new URLSearchParams({
    latitude: String(punkt.szerokosc),
    longitude: String(punkt.dlugosc),
    current:
      'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,snow_depth',
    timezone: 'Europe/Warsaw',
    // Dwa dni tylko tam, gdzie pytamy o wschody i zachody — wieczorem
    // potrzebny jest jutrzejszy wschód. Reszta i tak bierze bieżący odczyt.
    forecast_days: zDobowa ? '2' : '1',
  })
  if (punkt.wysokosc) parametry.set('elevation', String(punkt.wysokosc))
  if (zDobowa) {
    parametry.set(
      'daily',
      'sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_sum,' +
        'uv_index_max,wind_gusts_10m_max',
    )
  }

  const odpowiedz = await fetch(`${ADRES}?${parametry}`, {
    signal: AbortSignal.timeout(8000),
    // Pogoda jest odświeżana przez warstwę wyżej; tutaj chcemy zawsze świeży
    // odczyt, żeby pamięć podręczna Next.js nie nakładała się na własną.
    cache: 'no-store',
  })
  if (!odpowiedz.ok) throw new Error(`Open-Meteo: ${odpowiedz.status}`)

  return (await odpowiedz.json()) as OdpowiedzApi
}

function punkt(dane: OdpowiedzApi): PogodaPunktu {
  const teraz = dane.current ?? {}
  return {
    temperatura: Math.round(teraz.temperature_2m ?? 0),
    odczuwalna: Math.round(teraz.apparent_temperature ?? teraz.temperature_2m ?? 0),
    opad: teraz.precipitation ?? 0,
    wiatr: Math.round(teraz.wind_speed_10m ?? 0),
    kod: teraz.weather_code ?? 0,
    // Model podaje pokrywę śnieżną w metrach, a nikt nie mówi „0,35 metra
    // śniegu" — na tabliczkach przy wyciągach i w komunikatach są centymetry.
    snieg: Math.round((teraz.snow_depth ?? 0) * 100),
  }
}

export async function pobierzPogode(): Promise<Pogoda | null> {
  try {
    const [wDolinie, naGrani] = await Promise.all([zapytaj(DOLINA, true), zapytaj(GRAN, false)])
    const dobowa = wDolinie.daily

    return {
      dolina: punkt(wDolinie),
      gran: punkt(naGrani),
      najwyzsza: Math.round(dobowa?.temperature_2m_max?.[0] ?? 0),
      najnizsza: Math.round(dobowa?.temperature_2m_min?.[0] ?? 0),
      opadDzis: dobowa?.precipitation_sum?.[0] ?? 0,
      porywy: Math.round(dobowa?.wind_gusts_10m_max?.[0] ?? 0),
      uv: Math.round(dobowa?.uv_index_max?.[0] ?? 0),
      wschod: new Date(dobowa?.sunrise?.[0] ?? Date.now()),
      zachod: new Date(dobowa?.sunset?.[0] ?? Date.now()),
      // Gdyby drugi dzień z jakiegoś powodu nie przyszedł, wracamy do
      // dzisiejszego wschodu — różni się o minutę, więc lepszy niż pusty kafelek.
      wschodJutro: new Date(dobowa?.sunrise?.[1] ?? dobowa?.sunrise?.[0] ?? Date.now()),
    }
  } catch (blad) {
    /*
      Awaria źródła pogody nie może zabrać reszty strony. Kafelek pokaże
      wtedy „brak danych", a stan wody i godziny otwarcia zostaną — każda
      informacja stoi tu na własnych nogach.
    */
    console.error('Nie udało się pobrać pogody:', blad)
    return null
  }
}

/**
 * Kody pogodowe WMO na słowa.
 *
 * Pełna tablica ma sto pozycji, z których większość nigdy nie wystąpi
 * w Pieninach. Grupujemy je w dziewięć stanów, bo tyle wystarczy, żeby
 * odpowiedzieć na pytanie „brać kurtkę".
 */
export function opisPogody(kod: number): { tekst: string; ikona: string } {
  if (kod === 0) return { tekst: 'bezchmurnie', ikona: 'slonce' }
  if (kod <= 2) return { tekst: 'częściowe zachmurzenie', ikona: 'czesciowo' }
  if (kod === 3) return { tekst: 'pochmurno', ikona: 'chmury' }
  if (kod <= 48) return { tekst: 'mgła', ikona: 'mgla' }
  if (kod <= 57) return { tekst: 'mżawka', ikona: 'deszcz' }
  if (kod <= 67) return { tekst: 'deszcz', ikona: 'deszcz' }
  if (kod <= 77) return { tekst: 'śnieg', ikona: 'snieg' }
  if (kod <= 82) return { tekst: 'przelotny deszcz', ikona: 'deszcz' }
  if (kod <= 86) return { tekst: 'przelotny śnieg', ikona: 'snieg' }
  return { tekst: 'burza', ikona: 'burza' }
}
