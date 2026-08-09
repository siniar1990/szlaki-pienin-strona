import { BladSearchConsole, pobierzToken, witryna } from './dostep'

/**
 * Odczyt danych z Search Console.
 *
 * Dwa zapytania i nic więcej: co ludzie wpisują, żeby trafić na portal, i które
 * podstrony faktycznie dostają ruch z wyszukiwarki. Reszta możliwości tego
 * interfejsu to rzeczy, których przy jednoosobowym portalu i tak nikt nie
 * przeczyta.
 *
 * **Czego tu świadomie nie ma: zgłaszania adresów do zaindeksowania.** Google
 * ma taki interfejs, ale jego regulamin dopuszcza wyłącznie dwa rodzaje treści
 * — ogłoszenia o pracę i transmisje na żywo. Użycie go do wiadomości byłoby
 * obejściem zasad i realnym ryzykiem dla całej witryny. Odkrywanie notek
 * zapewniają mapa witryny, mapa Google News, RSS i odnośniki wewnętrzne,
 * czyli dokładnie te drogi, które Google sam wskazuje.
 *
 * Dawne „pingowanie" mapy witryny również pomijamy — Google wyłączył ten
 * punkt końcowy i dziś nie robi on nic poza generowaniem ruchu.
 */

const ADRES = 'https://searchconsole.googleapis.com/webmasters/v3/sites'

export type WierszWyszukiwania = {
  klucz: string
  klikniecia: number
  wyswietlenia: number
  /** Udział kliknięć w wyświetleniach, w procentach. */
  skutecznosc: number
  /** Średnia pozycja w wynikach. */
  pozycja: number
}

type OdpowiedzApi = {
  rows?: { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }[]
}

async function zapytaj(
  wymiar: 'query' | 'page',
  odDni: number,
  ile: number,
): Promise<WierszWyszukiwania[]> {
  const token = await pobierzToken()

  const koniec = new Date()
  const poczatek = new Date(koniec.getTime() - odDni * 24 * 60 * 60 * 1000)
  const dzien = (data: Date) => data.toISOString().slice(0, 10)

  const odpowiedz = await fetch(
    `${ADRES}/${encodeURIComponent(witryna())}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: dzien(poczatek),
        endDate: dzien(koniec),
        dimensions: [wymiar],
        rowLimit: ile,
      }),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    },
  )

  if (!odpowiedz.ok) {
    const tekst = await odpowiedz.text().catch(() => '')

    /*
      Najczęstszy błąd przy pierwszym podłączeniu i wart osobnego komunikatu:
      konto usługi istnieje, klucz działa, ale nikt nie nadał mu dostępu do
      witryny w Search Console. Surowa odpowiedź Google mówi wtedy tylko
      „User does not have sufficient permission", co niczego nie podpowiada.
    */
    if (odpowiedz.status === 403) {
      throw new BladSearchConsole(
        'Konto usługi nie ma dostępu do tej witryny. Dodaj jego adres e-mail ' +
          'jako użytkownika w Search Console (Ustawienia → Użytkownicy i uprawnienia).',
      )
    }
    if (odpowiedz.status === 404) {
      throw new BladSearchConsole(
        `Search Console nie zna witryny „${witryna()}". Sprawdź, czy to własność domeny ` +
          '(sc-domain:…), czy przedrostek adresu (https://…/) — to dwie różne rzeczy.',
      )
    }

    throw new BladSearchConsole(`Google odpowiedział kodem ${odpowiedz.status}. ${tekst.slice(0, 200)}`)
  }

  const dane = (await odpowiedz.json()) as OdpowiedzApi

  return (dane.rows ?? []).map((wiersz) => ({
    klucz: wiersz.keys?.[0] ?? '—',
    klikniecia: Math.round(wiersz.clicks ?? 0),
    wyswietlenia: Math.round(wiersz.impressions ?? 0),
    skutecznosc: Math.round((wiersz.ctr ?? 0) * 1000) / 10,
    pozycja: Math.round((wiersz.position ?? 0) * 10) / 10,
  }))
}

/** Czego ludzie szukali, zanim trafili na portal. */
export function frazy(odDni = 28, ile = 20): Promise<WierszWyszukiwania[]> {
  return zapytaj('query', odDni, ile)
}

/** Które podstrony dostają ruch z wyszukiwarki. */
export function podstrony(odDni = 28, ile = 20): Promise<WierszWyszukiwania[]> {
  return zapytaj('page', odDni, ile)
}

export type PodsumowanieWyszukiwarki = {
  klikniecia: number
  wyswietlenia: number
  skutecznosc: number
  pozycja: number
}

/**
 * Suma z całego okresu.
 *
 * Liczona z listy podstron, a nie osobnym zapytaniem bez wymiarów — jedno
 * żądanie mniej, a różnica dotyczy wyłącznie ruchu spoza pierwszych stu
 * podstron, którego przy tym portalu nie ma.
 */
export function podsumowanie(wiersze: WierszWyszukiwania[]): PodsumowanieWyszukiwarki {
  const klikniecia = wiersze.reduce((suma, wiersz) => suma + wiersz.klikniecia, 0)
  const wyswietlenia = wiersze.reduce((suma, wiersz) => suma + wiersz.wyswietlenia, 0)

  return {
    klikniecia,
    wyswietlenia,
    skutecznosc: wyswietlenia > 0 ? Math.round((klikniecia / wyswietlenia) * 1000) / 10 : 0,
    pozycja:
      wiersze.length > 0
        ? Math.round((wiersze.reduce((s, w) => s + w.pozycja, 0) / wiersze.length) * 10) / 10
        : 0,
  }
}
