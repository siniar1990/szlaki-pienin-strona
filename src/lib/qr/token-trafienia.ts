/**
 * Jednorazowy token potwierdzający, że stronę otworzyła przeglądarka.
 *
 * **Dlaczego to działa.** Crawlery pobierają HTML, ale nie wykonują
 * JavaScriptu — to prawda o `facebookexternalhit`, o Twitterbocie i o całej
 * reszcie budującej podglądy odnośników. Skoro tak, to niech skan liczy się
 * dopiero wtedy, gdy z przeglądarki wróci sygnał. Żadna reguła oparta na
 * User-Agencie nie jest równie odporna: nazwę można podrobić jednym
 * nagłówkiem, wykonania JavaScriptu podrobić się nie da.
 *
 * **Dlaczego token, a nie samo „POST na /api/qr/trafienie".** Bez tokena
 * ktokolwiek mógłby w pętli wysyłać potwierdzenia i napompować licznik
 * dowolnej tabliczki. Token jest podpisany naszym sekretem, wygasa po pięciu
 * minutach i wskazuje **jeden konkretny wiersz** zdarzenia.
 *
 * **Dlaczego nie trzeba pilnować zużycia w Redisie.** Bo potwierdzenie
 * przestawia ten jeden wiersz z „niepewny" na „człowiek". Powtórzenie tego
 * samego żądania przestawia go drugi raz na to samo — nie powstaje nowy skan,
 * więc nie ma czego pompować. Jednorazowość wynika tu z kształtu danych,
 * a nie z dodatkowej usługi do utrzymania.
 */

const WAZNOSC_MINUT = 5

/** Losowa część tokena — to ona trafia do bazy jako `tokenTrafienia`. */
export function nowyIdentyfikator(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Sekret podpisujący.
 *
 * Osobna zmienna byłaby kolejną rzeczą do ustawienia na Vercelu i kolejną,
 * o której można zapomnieć — a zapomnienie kończyłoby się cichym zerem
 * w statystykach. Bierzemy więc sekret zadań, który w tym projekcie już jest
 * i już pilnuje rzeczy ważniejszych.
 */
function sekret(): string | null {
  return process.env.SEKRET_TRAFIEN || process.env.SEKRET_ZADAN || process.env.CRON_SECRET || null
}

async function podpisz(tresc: string, klucz: string): Promise<string> {
  const kluczHmac = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(klucz),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const podpis = await crypto.subtle.sign('HMAC', kluczHmac, new TextEncoder().encode(tresc))
  return [...new Uint8Array(podpis)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Token do wstrzyknięcia w stronę: `identyfikator.wygasa.podpis`.
 *
 * Zwraca `null`, gdy w środowisku nie ma żadnego sekretu — wtedy strona
 * po prostu nie prosi o potwierdzenie, a skany zostają „niepewne". Lepiej to
 * niż podpis stałą wartością, którą zna każdy, kto widział repozytorium.
 */
export async function wystawToken(identyfikator: string): Promise<string | null> {
  const klucz = sekret()
  if (!klucz) return null

  const wygasa = Date.now() + WAZNOSC_MINUT * 60_000
  const tresc = `${identyfikator}.${wygasa}`
  return `${tresc}.${await podpisz(tresc, klucz)}`
}

/**
 * Sprawdzenie tokena z przeglądarki.
 *
 * Zwraca identyfikator zdarzenia albo `null`. Powodu odmowy nie rozróżniamy
 * na zewnątrz — odpowiedź jest zawsze ta sama, żeby nie podpowiadać, czy
 * pomyłką był podpis, czy czas.
 */
export async function sprawdzToken(token: string | null): Promise<string | null> {
  const klucz = sekret()
  if (!klucz || !token) return null

  const [identyfikator, wygasaTekst, podpis] = token.split('.')
  if (!identyfikator || !wygasaTekst || !podpis) return null

  const wygasa = Number(wygasaTekst)
  if (!Number.isFinite(wygasa) || wygasa < Date.now()) return null

  const oczekiwany = await podpisz(`${identyfikator}.${wygasaTekst}`, klucz)
  if (!rowneWStalymCzasie(oczekiwany, podpis)) return null

  return identyfikator
}

/** Patrz `sesja.ts` — ten sam powód: czas porównania nie może zdradzać treści. */
function rowneWStalymCzasie(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let roznica = 0
  for (let i = 0; i < a.length; i += 1) roznica |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return roznica === 0
}
