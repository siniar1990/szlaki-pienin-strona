/**
 * Pobieranie cudzych stron.
 *
 * Wydzielone do osobnego modułu, bo obchód sięga po zasoby, nad którymi nie
 * mamy żadnej kontroli: strona może odpowiadać wiecznie, zwrócić dwadzieścia
 * megabajtów albo przekierować w kółko. Każde z tych zachowań na środowisku
 * bezserwerowym kończy się wyczerpaniem czasu funkcji, więc ograniczenia
 * muszą siedzieć w jednym miejscu, a nie przy każdym wywołaniu `fetch`.
 */

/** Ile czekamy na odpowiedź, zanim uznamy stronę za niedostępną. */
const CZAS_OCZEKIWANIA_MS = 12_000

/**
 * Ile znaków treści przyjmujemy.
 *
 * Kanał RSS z pięćdziesięcioma wpisami mieści się w kilkuset kilobajtach,
 * strona artykułu w kilkudziesięciu. Dwa megabajty to sufit, po którym widać,
 * że coś poszło nie tak — a nie limit, o który ktokolwiek zahaczy w normalnej
 * pracy.
 */
const NAJWIECEJ_ZNAKOW = 2_000_000

/**
 * Kim się przedstawiamy.
 *
 * Uczciwie i z adresem portalu. Administrator cudzej strony ma prawo wiedzieć,
 * kto po niej chodzi, i mieć jak nas zablokować — podszywanie się pod
 * przeglądarkę byłoby zaproszeniem do kłopotów, których nie chcemy.
 */
const PRZEDSTAWIENIE = 'SzlakiPieninBot/1.0 (+https://szlakipienin.pl/aktualnosci)'

export class BladPobierania extends Error {}

/**
 * Pobiera adres i zwraca treść jako tekst.
 *
 * Rzuca `BladPobierania` z czytelnym komunikatem — obchód zapisuje go przy
 * źródle, żeby w panelu było widać, które źródło przestało odpowiadać
 * i dlaczego.
 */
export async function pobierzTekst(adres: string): Promise<{ tresc: string; typ: string }> {
  let odpowiedz: Response

  try {
    odpowiedz = await fetch(adres, {
      headers: {
        'user-agent': PRZEDSTAWIENIE,
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/html;q=0.9',
        'accept-language': 'pl,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(CZAS_OCZEKIWANIA_MS),
      // Zasoby zewnętrzne nie mają prawa wylądować w pamięci podręcznej
      // Next.js: obchód ma widzieć stan na teraz, a nie sprzed doby.
      cache: 'no-store',
    })
  } catch (blad) {
    const powod = blad instanceof Error ? blad.name : 'nieznany'
    throw new BladPobierania(
      powod === 'TimeoutError'
        ? `Strona nie odpowiedziała w ${CZAS_OCZEKIWANIA_MS / 1000} s`
        : `Nie udało się połączyć (${powod})`,
    )
  }

  if (!odpowiedz.ok) {
    throw new BladPobierania(`Serwer odpowiedział kodem ${odpowiedz.status}`)
  }

  const tresc = await odpowiedz.text()
  if (tresc.length > NAJWIECEJ_ZNAKOW) {
    throw new BladPobierania('Odpowiedź jest podejrzanie duża — pomijamy')
  }

  return {
    tresc,
    typ: odpowiedz.headers.get('content-type') ?? '',
  }
}

/**
 * Zamienia adres względny na bezwzględny wobec strony, na której go znaleziono.
 *
 * Zwraca `null`, gdy adres nie daje się rozłożyć albo nie jest adresem
 * sieciowym — `javascript:` i `mailto:` trafiają się w odnośnikach częściej,
 * niż mogłoby się wydawać.
 */
export function pelnyAdres(adres: string, wzgledem: string): string | null {
  try {
    const wynik = new URL(adres, wzgledem)
    return wynik.protocol === 'http:' || wynik.protocol === 'https:' ? wynik.toString() : null
  } catch {
    return null
  }
}
