/**
 * Rozmowa z modelem językowym.
 *
 * **Dlaczego zwykły `fetch`, a nie oficjalna biblioteka.** Potrzebujemy
 * jednego wywołania z jednym schematem odpowiedzi. Biblioteka dołożyłaby
 * zależność, którą trzeba aktualizować, w zamian za wygodę, z której
 * skorzystalibyśmy w dwóch miejscach. Adres i format żądania są stabilne.
 *
 * **Dlaczego brak klucza nie jest błędem.** Portal ma działać bez niego:
 * obchód zbiera artykuły, redakcja odkłada najświeższe znalezisko jako szkic
 * do napisania ręcznie, a administrator pisze notkę sam. Klucz włącza
 * automatyczne pisanie, ale nie warunkuje działania aktualności — inaczej
 * wygaśnięcie klucza zatrzymywałoby cały dział.
 */

const ADRES = 'https://api.anthropic.com/v1/messages'
const WERSJA = '2023-06-01'

/**
 * Model do pisania notek.
 *
 * Świadomie nie najszybszy z rodziny: notka powstaje raz dziennie, więc koszt
 * jest znikomy niezależnie od wyboru, a różnica widać w tym, czy tekst brzmi
 * jak napisany przez człowieka, czy jak streszczenie z automatu.
 */
const MODEL = 'claude-sonnet-5'

export class BrakKlucza extends Error {}
export class BladModelu extends Error {}

export function kluczDostepny(): boolean {
  return Boolean(process.env.KLUCZ_ANTHROPIC)
}

/**
 * Zadaje modelowi pytanie i zwraca odpowiedź rozłożoną z JSON-a.
 *
 * Odpowiedź wymuszamy przez wstępne wypełnienie wypowiedzi modelu nawiasem
 * otwierającym. To najprostszy sposób, żeby dostać sam obiekt zamiast obiektu
 * poprzedzonego zdaniem „Oto odpowiedź:" — a takie zdanie wywraca rozkładanie
 * JSON-a i psuje całe zadanie.
 */
export async function zapytajOJson<T>(polecenie: {
  rolaSystemowa: string
  tresc: string
  najwiecejZnakow?: number
}): Promise<T> {
  const klucz = process.env.KLUCZ_ANTHROPIC
  if (!klucz) throw new BrakKlucza('Brak zmiennej KLUCZ_ANTHROPIC')

  let odpowiedz: Response
  try {
    odpowiedz = await fetch(ADRES, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': klucz,
        'anthropic-version': WERSJA,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: polecenie.najwiecejZnakow ?? 2000,
        system: polecenie.rolaSystemowa,
        messages: [
          { role: 'user', content: polecenie.tresc },
          { role: 'assistant', content: '{' },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
      cache: 'no-store',
    })
  } catch (blad) {
    throw new BladModelu(
      blad instanceof Error && blad.name === 'TimeoutError'
        ? 'Model nie odpowiedział w 90 s'
        : 'Nie udało się połączyć z modelem',
    )
  }

  if (!odpowiedz.ok) {
    const tresc = await odpowiedz.text().catch(() => '')
    throw new BladModelu(`Model odpowiedział kodem ${odpowiedz.status}. ${tresc.slice(0, 300)}`)
  }

  const dane = (await odpowiedz.json()) as { content?: { type: string; text?: string }[] }
  const tekst = (dane.content ?? [])
    .filter((czesc) => czesc.type === 'text')
    .map((czesc) => czesc.text ?? '')
    .join('')

  try {
    // Doklejamy nawias, którym zaczęliśmy wypowiedź modelu.
    return JSON.parse(`{${tekst}`) as T
  } catch {
    throw new BladModelu('Odpowiedź modelu nie jest poprawnym JSON-em')
  }
}
