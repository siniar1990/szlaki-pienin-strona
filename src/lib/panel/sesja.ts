/**
 * Uwierzytelnienie panelu administracyjnego.
 *
 * Bez biblioteki i bez bazy użytkowników — administrator jest jeden, a hasło
 * leży w zmiennej środowiskowej jako skrót PBKDF2. Dodawanie pełnego systemu
 * kont dla jednej osoby byłoby budowaniem magazynu na jedno pudełko.
 *
 * Wszystko opiera się na Web Crypto, dostępnym i w funkcjach serwerowych,
 * i w warstwie pośredniczącej (middleware) działającej na brzegu sieci —
 * gdzie modułów Node'a nie ma. Dzięki temu ten sam kod strzeże obu miejsc.
 *
 * Ciasteczko sesji zawiera wyłącznie czas wygaśnięcia i podpis. Nie ma w nim
 * nazwy użytkownika ani uprawnień: jest jedna rola i albo się ją ma, albo nie.
 * Podpis HMAC sprawia, że wartości nie da się podrobić bez znajomości sekretu.
 */

const NAZWA_CIASTECZKA = 'sesja_panelu'
const WAZNOSC_GODZIN = 12

/** Zamienia bajty na tekst szesnastkowy — do porównań i do ciasteczka. */
function naHex(bufor: ArrayBuffer): string {
  return [...new Uint8Array(bufor)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function zHex(hex: string): ArrayBuffer {
  const bajty = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bajty.length; i += 1) bajty[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  // Zwracamy bufor, nie widok: Web Crypto przyjmuje `BufferSource`, a typy
  // widoków w nowszym TypeScripcie są parametryzowane rodzajem bufora
  // i przestają do niego pasować.
  return bajty.buffer as ArrayBuffer
}

/**
 * Porównanie odporne na pomiar czasu.
 *
 * Zwykłe `===` przerywa przy pierwszym różniącym się znaku, więc czas
 * odpowiedzi zdradza, ile początkowych znaków zgadującego było trafnych.
 * Przy haśle administratora to realna droga ataku.
 */
function rowneWStalymCzasie(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let roznica = 0
  for (let i = 0; i < a.length; i += 1) roznica |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return roznica === 0
}

/* ── Hasło ──────────────────────────────────────────────────────────────── */

const ITERACJE = 210_000

/**
 * Skrót hasła w formacie `sól:skrót`, oba szesnastkowo.
 *
 * PBKDF2 z dwustoma tysiącami iteracji — tyle zaleca OWASP dla SHA-256.
 * Chodzi o to, żeby sprawdzenie jednego hasła kosztowało zauważalnie dużo
 * czasu procesora: dla administratora logującego się raz dziennie to niecała
 * dziesiąta sekundy, dla zgadującego miliony haseł — bariera nie do przejścia.
 */
export async function utworzSkrotHasla(haslo: string, solHex?: string): Promise<string> {
  const sol = solHex
    ? zHex(solHex)
    : (crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer)

  const klucz = await crypto.subtle.importKey('raw', new TextEncoder().encode(haslo), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bity = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: sol, iterations: ITERACJE, hash: 'SHA-256' },
    klucz,
    256,
  )

  return `${naHex(sol)}:${naHex(bity)}`
}

export async function hasloPoprawne(haslo: string, zapisanySkrot: string): Promise<boolean> {
  const [solHex] = zapisanySkrot.split(':')
  if (!solHex) return false
  const policzony = await utworzSkrotHasla(haslo, solHex)
  return rowneWStalymCzasie(policzony, zapisanySkrot)
}

/* ── Ciasteczko sesji ───────────────────────────────────────────────────── */

async function kluczPodpisu(sekret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sekret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function utworzSesje(sekret: string): Promise<{ nazwa: string; wartosc: string; maxAge: number }> {
  const wygasa = Date.now() + WAZNOSC_GODZIN * 3600 * 1000
  const tresc = String(wygasa)
  const podpis = await crypto.subtle.sign('HMAC', await kluczPodpisu(sekret), new TextEncoder().encode(tresc))

  return {
    nazwa: NAZWA_CIASTECZKA,
    wartosc: `${tresc}.${naHex(podpis)}`,
    maxAge: WAZNOSC_GODZIN * 3600,
  }
}

export async function sesjaWazna(wartosc: string | undefined, sekret: string): Promise<boolean> {
  if (!wartosc) return false

  const [tresc, podpisHex] = wartosc.split('.')
  if (!tresc || !podpisHex) return false

  const poprawny = await crypto.subtle.verify(
    'HMAC',
    await kluczPodpisu(sekret),
    zHex(podpisHex),
    new TextEncoder().encode(tresc),
  )
  if (!poprawny) return false

  return Number(tresc) > Date.now()
}

export const NAZWA_SESJI = NAZWA_CIASTECZKA
