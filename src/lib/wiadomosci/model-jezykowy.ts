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
 * Dwa modele, bo redakcja robi dwie różne rzeczy.
 *
 * **Wybór artykułu to klasyfikacja.** „Czy ten tytuł dotyczy Pienin i czy
 * warto o tym napisać" to pytanie, na które mniejszy model odpowiada tak samo
 * dobrze jak większy, a kosztuje kilka razy mniej. Przy czterdziestu
 * kandydatach dziennie to najdroższa część zadania pod względem liczby
 * tokenów wejścia — i najmniej wymagająca pod względem myślenia.
 *
 * **Pisanie notki to redakcja tekstu.** Tu różnica widać od razu: czy tekst
 * brzmi jak napisany przez człowieka, czy jak streszczenie z automatu. Notka
 * powstaje raz dziennie i ma trzysta słów, więc oszczędzanie na tym kroku
 * dałoby grosze, a kosztowałoby jakość jedynej rzeczy, którą czyta czytelnik.
 */
const MODEL_WYBIERAJACY = 'claude-haiku-4-5-20251001'
const MODEL_PISZACY = 'claude-sonnet-5'

export const MODELE = { wybor: MODEL_WYBIERAJACY, pisanie: MODEL_PISZACY } as const

/**
 * Domyślny czas oczekiwania na odpowiedź.
 *
 * Wołający zwykle podaje własny, bo cała redakcja — wybór, pobranie artykułu
 * i napisanie notki — musi zmieścić się w jednym wywołaniu funkcji
 * bezserwerowej. Kto ma limit do podziału, ten musi go dzielić świadomie,
 * a nie liczyć na to, że każdy krok zdąży.
 */
const CZAS_OCZEKIWANIA_MS = 25_000

/**
 * Ile tokenów wolno modelowi wygenerować, gdy wołający nie powie inaczej.
 *
 * **To limit na całe wyjście modelu, a nie na długość tekstu, który dostaniemy.**
 * Wchodzi w niego wszystko, co model wygeneruje po drodze — również
 * rozumowanie, jeśli model je prowadzi. Po przekroczeniu odpowiedź urywa się
 * w połowie zdania, JSON przestaje być poprawny i całe zadanie kończy się
 * błędem, mimo że model działał prawidłowo.
 *
 * Limity były tu liczone „na styk" pod długość samej notki i redakcja padała
 * na tym w nocnym przebiegu. Polszczyzna dodatkowo tokenizuje się gorzej niż
 * angielski — bywa i trzy tokeny na słowo — więc szacunek z liczby słów łatwo
 * zaniża wynik o połowę.
 *
 * Płacimy za tokeny faktycznie wygenerowane, nie za limit, więc zapas nic nie
 * kosztuje. Ciasny limit kosztuje nieopublikowaną notkę.
 *
 * Poprzednia nazwa tego parametru brzmiała `najwiecejZnakow`, co podpowiadało
 * liczenie znaków notki — stąd wartości w rodzaju 400 przy odpowiedzi, która
 * „ma przecież tylko listę liczb".
 */
const DOMYSLNIE_TOKENOW = 4000

export class BrakKlucza extends Error {}
export class BladModelu extends Error {}

export function kluczDostepny(): boolean {
  return Boolean(process.env.KLUCZ_ANTHROPIC)
}

/**
 * Wycina obiekt JSON z odpowiedzi modelu.
 *
 * **Dlaczego to jest potrzebne.** Pierwsza wersja wymuszała czysty JSON,
 * zaczynając wypowiedź modelu nawiasem otwierającym. Sztuczka jest znana
 * i skuteczna, ale nie wszystkie modele ją przyjmują — ten odpowiedział
 * kodem 400 z komunikatem, że rozmowa musi kończyć się wypowiedzią człowieka.
 *
 * Zamiast tego prosimy o sam JSON w poleceniu i sprzątamy po odpowiedzi:
 * zdejmujemy ewentualne ogrodzenie ```json, a potem bierzemy fragment od
 * pierwszej klamry otwierającej do ostatniej zamykającej. Dzięki temu zdanie
 * „Oto odpowiedź:" przed obiektem albo komentarz po nim niczego nie psują.
 */
function wytnijJson(tekst: string): string {
  const bezOgrodzenia = tekst.replace(/```(?:json)?/gi, '').trim()
  const poczatek = bezOgrodzenia.indexOf('{')
  const koniec = bezOgrodzenia.lastIndexOf('}')

  if (poczatek === -1 || koniec <= poczatek) {
    throw new BladModelu('W odpowiedzi modelu nie ma obiektu JSON')
  }

  return bezOgrodzenia.slice(poczatek, koniec + 1)
}

/**
 * Zadaje modelowi pytanie i zwraca odpowiedź rozłożoną z JSON-a.
 */
export async function zapytajOJson<T>(polecenie: {
  model: string
  rolaSystemowa: string
  tresc: string
  najwiecejTokenow?: number
  /** Ile czekamy na tę konkretną odpowiedź. */
  czasMs?: number
}): Promise<T> {
  const czasOczekiwania = polecenie.czasMs ?? CZAS_OCZEKIWANIA_MS
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
        model: polecenie.model,
        max_tokens: polecenie.najwiecejTokenow ?? DOMYSLNIE_TOKENOW,
        system: polecenie.rolaSystemowa,
        messages: [
          {
            role: 'user',
            content:
              polecenie.tresc +
              '\n\nOdpowiedz wyłącznie obiektem JSON, bez żadnego tekstu przed nim ani po nim.',
          },
        ],
      }),
      signal: AbortSignal.timeout(czasOczekiwania),
      cache: 'no-store',
    })
  } catch (blad) {
    throw new BladModelu(
      blad instanceof Error && blad.name === 'TimeoutError'
        ? `Model nie odpowiedział w ${Math.round(czasOczekiwania / 1000)} s`
        : 'Nie udało się połączyć z modelem',
    )
  }

  if (!odpowiedz.ok) {
    const tresc = await odpowiedz.text().catch(() => '')
    throw new BladModelu(`Model odpowiedział kodem ${odpowiedz.status}. ${tresc.slice(0, 300)}`)
  }

  const dane = (await odpowiedz.json()) as {
    content?: { type: string; text?: string }[]
    stop_reason?: string
  }
  const tekst = (dane.content ?? [])
    .filter((czesc) => czesc.type === 'text')
    .map((czesc) => czesc.text ?? '')
    .join('')

  /*
    Przycięcie odpowiedzi rozpoznajemy osobno i nazywamy po imieniu. Bez tego
    urwany w połowie JSON zgłaszał się jako „odpowiedź nie jest poprawnym
    JSON-em" — komunikat prawdziwy, ale kierujący diagnozę w złą stronę:
    winowajcą nie jest format, tylko za mały limit długości.
  */
  if (dane.stop_reason === 'max_tokens') {
    throw new BladModelu(
      'Odpowiedź modelu została przycięta limitem długości. Limit liczy całe ' +
        'wyjście modelu, nie samą treść odpowiedzi — podnieś `najwiecejTokenow` ' +
        'przy tym wywołaniu',
    )
  }

  try {
    return JSON.parse(wytnijJson(tekst)) as T
  } catch (blad) {
    if (blad instanceof BladModelu) throw blad
    // Początek odpowiedzi w komunikacie: bez niego diagnoza wymaga zgadywania,
    // co model właściwie odpisał.
    throw new BladModelu(
      `Odpowiedź modelu nie jest poprawnym JSON-em. Początek: ${tekst.slice(0, 200)}`,
    )
  }
}
