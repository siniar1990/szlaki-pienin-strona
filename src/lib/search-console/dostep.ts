import { createSign } from 'node:crypto'

/**
 * Dostęp do Google Search Console przez konto usługi.
 *
 * **Dlaczego konto usługi, a nie logowanie właściciela.** Panel ma pokazywać
 * dane bez niczyjej obecności, także wtedy, gdy nikt nie zaglądał od miesiąca.
 * Logowanie przez przeglądarkę wymagałoby odświeżania zgody i przechowywania
 * cudzych tokenów — konto usługi ma stały klucz i dokładnie jedno uprawnienie,
 * które nadaje mu właściciel witryny w Search Console.
 *
 * **Dlaczego podpisujemy token sami, bez biblioteki Google.** Oficjalny pakiet
 * ciągnie kilkanaście zależności po to, żeby wykonać dwa żądania HTTP.
 * Podpisanie tokena to jedno wywołanie wbudowanego modułu kryptograficznego,
 * a format jest ustalony od lat i nie zmienia się. To ta sama decyzja, co przy
 * rozmowie z modelem językowym.
 *
 * **Bez klucza portal działa dalej.** Brak konfiguracji nie jest błędem, tylko
 * stanem „jeszcze nie podłączono" — panel mówi wtedy, czego brakuje, zamiast
 * pokazywać pusty wykres albo się wywracać.
 */

const ZAKRES = 'https://www.googleapis.com/auth/webmasters.readonly'
const ADRES_TOKENU = 'https://oauth2.googleapis.com/token'

export class BrakKonfiguracji extends Error {}
export class BladSearchConsole extends Error {}

export type KontoUslugi = { email: string; kluczPrywatny: string }

/**
 * Odczyt konfiguracji ze zmiennych środowiskowych.
 *
 * Klucz prywatny w zmiennej środowiskowej ma znaki nowej linii zapisane jako
 * `\n` — Vercel i większość powłok nie przenosi prawdziwych łamań wiersza
 * w wartości zmiennej. Zamiana z powrotem musi się więc odbyć tutaj, bo bez
 * niej podpis nie powstanie, a komunikat błędu nie powie dlaczego.
 */
export function konto(): KontoUslugi | null {
  const email = process.env.GOOGLE_KONTO_USLUGI_EMAIL
  const klucz = process.env.GOOGLE_KONTO_USLUGI_KLUCZ

  if (!email || !klucz) return null
  return { email, kluczPrywatny: klucz.replace(/\\n/g, '\n') }
}

export function czyPodlaczone(): boolean {
  return konto() !== null
}

/**
 * Adres witryny w Search Console.
 *
 * Search Console rozróżnia własność domeny (`sc-domain:przyklad.pl`) od
 * własności przedrostka adresu (`https://przyklad.pl/`). To dwie różne rzeczy
 * i podanie złej kończy się odpowiedzią „nie ma takiej witryny", więc wartość
 * jest w zmiennej, a nie zgadywana z adresu portalu.
 */
export function witryna(): string {
  return process.env.GOOGLE_WITRYNA ?? 'sc-domain:szlakipienin.pl'
}

/** Zakodowanie w postaci base64url, której wymaga token. */
function base64url(dane: string | Buffer): string {
  return Buffer.from(dane)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Wymiana klucza konta usługi na token dostępu.
 *
 * Token żyje godzinę, a my prosimy o nowy przy każdym wejściu do panelu.
 * Trzymanie go w pamięci między wywołaniami funkcji bezserwerowej i tak nic by
 * nie dało — każde zimne uruchomienie zaczyna od pustej pamięci.
 */
export async function pobierzToken(): Promise<string> {
  const dane = konto()
  if (!dane) throw new BrakKonfiguracji('Brak konfiguracji konta usługi Google')

  const teraz = Math.floor(Date.now() / 1000)
  const naglowek = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const tresc = base64url(
    JSON.stringify({
      iss: dane.email,
      scope: ZAKRES,
      aud: ADRES_TOKENU,
      iat: teraz,
      exp: teraz + 3600,
    }),
  )

  let podpis: string
  try {
    const podpisujacy = createSign('RSA-SHA256')
    podpisujacy.update(`${naglowek}.${tresc}`)
    podpis = base64url(podpisujacy.sign(dane.kluczPrywatny))
  } catch {
    throw new BladSearchConsole(
      'Nie udało się podpisać żądania — sprawdź, czy klucz prywatny został wklejony w całości',
    )
  }

  const odpowiedz = await fetch(ADRES_TOKENU, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${naglowek}.${tresc}.${podpis}`,
    }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  if (!odpowiedz.ok) {
    const tekst = await odpowiedz.text().catch(() => '')
    throw new BladSearchConsole(`Google odmówił tokenu (${odpowiedz.status}). ${tekst.slice(0, 200)}`)
  }

  const wynik = (await odpowiedz.json()) as { access_token?: string }
  if (!wynik.access_token) throw new BladSearchConsole('Google nie zwrócił tokenu dostępu')

  return wynik.access_token
}
