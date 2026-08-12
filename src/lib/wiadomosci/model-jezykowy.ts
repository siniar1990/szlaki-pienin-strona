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

/**
 * Kody, po których warto spróbować jeszcze raz.
 *
 * 429 to przekroczony limit zapytań, 529 przeciążenie usługi, a pięćsetki to
 * awarie po stronie dostawcy. Wszystkie mówią „nie teraz", a nie „to pytanie
 * jest złe" — powtórzone za chwilę zwykle przechodzą.
 *
 * Reszty NIE ponawiamy. Czterysta znaczy, że polecenie jest wadliwe, a 401,
 * że klucz jest zły; powtarzanie takiego żądania to tylko strata czasu
 * z budżetu, który i tak jest krótki.
 */
export const KODY_DO_PONOWIENIA = new Set([429, 500, 502, 503, 529])

/**
 * Ile razy próbujemy, zanim uznamy porażkę.
 *
 * Trzy podejścia, bo czwarte i tak nie zmieściłoby się w budżecie funkcji
 * bezserwerowej, a przeciążenie po dwóch odczekaniach zwykle znaczy, że
 * dostawca ma szerszy problem niż chwilowy skok ruchu.
 */
const ILE_PROB = 3

/** Ile czekamy przed kolejnym podejściem: sekunda, potem trzy. */
export const ODCZEKANIA_MS = [1000, 3000]

const czekaj = (ms: number) => new Promise((gotowe) => setTimeout(gotowe, ms))

/**
 * Ile czekać według odpowiedzi serwera.
 *
 * Przy 429 dostawca podaje w nagłówku `retry-after`, kiedy wolno wrócić —
 * i wtedy to jego liczba obowiązuje, a nie nasza. Ignorowanie jej oznaczałoby
 * pukanie do zamkniętych drzwi i przedłużanie limitu.
 */
export function ileCzekac(odpowiedz: Response, podejscie: number): number {
  const zNaglowka = Number(odpowiedz.headers.get('retry-after'))
  const nasze = ODCZEKANIA_MS[podejscie] ?? ODCZEKANIA_MS[ODCZEKANIA_MS.length - 1]

  // Nagłówek bywa w sekundach; ograniczamy go, bo przy dłuższej przerwie
  // i tak wypadniemy z budżetu, a chcemy zdążyć z komunikatem.
  return Number.isFinite(zNaglowka) && zNaglowka > 0
    ? Math.min(zNaglowka * 1000, 5000)
    : nasze
}

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

  /*
    Cały budżet liczymy od teraz, bo obejmuje także przerwy między próbami.
    Bez tego trzy podejścia po dwadzieścia pięć sekund przekroczyłyby limit
    funkcji i zamiast komunikatu wyszłoby ucięcie w połowie.
  */
  const koniecBudzetu = Date.now() + czasOczekiwania

  for (let podejscie = 0; ; podejscie++) {
    const zostalo = koniecBudzetu - Date.now()
    const wynik = await jednaProba<T>(polecenie, klucz, zostalo)

    if ('dane' in wynik) return wynik.dane

    const ostatnie = podejscie >= ILE_PROB - 1
    const zostanieCzasu = koniecBudzetu - Date.now() - wynik.odczekanie > MINIMUM_NA_PROBE_MS

    if (!wynik.ponowic || ostatnie || !zostanieCzasu) throw wynik.blad

    await czekaj(wynik.odczekanie)
  }
}

/** Poniżej tylu milisekund nie ma po co zaczynać kolejnej próby. */
const MINIMUM_NA_PROBE_MS = 4000

type WynikProby<T> =
  | { dane: T }
  | { blad: BladModelu; ponowic: boolean; odczekanie: number }

/**
 * Jedno podejście do modelu.
 *
 * Zwraca błąd zamiast go rzucać, bo wołający musi wiedzieć nie tylko, że się
 * nie udało, ale też czy warto próbować dalej i ile odczekać.
 */
async function jednaProba<T>(
  polecenie: {
    model: string
    rolaSystemowa: string
    tresc: string
    najwiecejTokenow?: number
  },
  klucz: string,
  czasOczekiwania: number,
): Promise<WynikProby<T>> {
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
    const przekroczonyCzas = blad instanceof Error && blad.name === 'TimeoutError'
    return {
      blad: new BladModelu(
        przekroczonyCzas
          ? `Model nie odpowiedział w ${Math.round(czasOczekiwania / 1000)} s`
          : 'Nie udało się połączyć z modelem',
      ),
      // Zerwane połączenie bywa przypadkiem sieci i mija; przekroczony czas
      // znaczy, że model po prostu nie zdąży, i drugie podejście też nie zdąży.
      ponowic: !przekroczonyCzas,
      odczekanie: ODCZEKANIA_MS[0],
    }
  }

  if (!odpowiedz.ok) {
    const tresc = await odpowiedz.text().catch(() => '')
    const ponowic = KODY_DO_PONOWIENIA.has(odpowiedz.status)

    return {
      blad: new BladModelu(
        ponowic
          ? `Usługa modelu jest chwilowo niedostępna (kod ${odpowiedz.status}). ` +
            'Spróbuj napisać notkę ponownie za kilka minut.'
          : `Model odpowiedział kodem ${odpowiedz.status}. ${tresc.slice(0, 300)}`,
      ),
      ponowic,
      odczekanie: ileCzekac(odpowiedz, 0),
    }
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
    return {
      blad: new BladModelu(
        'Odpowiedź modelu została przycięta limitem długości. Limit liczy całe ' +
          'wyjście modelu, nie samą treść odpowiedzi — podnieś `najwiecejTokenow` ' +
          'przy tym wywołaniu',
      ),
      // Powtórzenie tego samego pytania z tym samym limitem da ten sam wynik.
      ponowic: false,
      odczekanie: 0,
    }
  }

  try {
    return { dane: JSON.parse(wytnijJson(tekst)) as T }
  } catch {
    return {
      blad: new BladModelu(
        // Początek odpowiedzi w komunikacie: bez niego diagnoza wymaga
        // zgadywania, co model właściwie odpisał.
        `Odpowiedź modelu nie jest poprawnym JSON-em. Początek: ${tekst.slice(0, 200)}`,
      ),
      /*
        Zepsuty JSON bywa jednorazowym potknięciem modelu — przy tym samym
        poleceniu druga próba zwykle wychodzi poprawnie. To jedyny błąd
        merytoryczny, który ponawiamy, i tylko dlatego, że kosztuje jedno
        wywołanie, a ratuje całą notkę.
      */
      ponowic: true,
      odczekanie: ODCZEKANIA_MS[0],
    }
  }
}
