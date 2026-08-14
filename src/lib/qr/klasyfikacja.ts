import { siecCentrumDanych } from '@/lib/qr/sieci-centrow'

/**
 * Czy za tym żądaniem stoi człowiek.
 *
 * Powód powstania: 14 sierpnia 2026, kilka minut po opublikowaniu odnośnika
 * na Facebooku, licznik tabliczki P009 skoczył o 22 „skany" z Altoony,
 * Eagle Mountain, Boardman i Social Circle. Nikt tam nie stał pod tabliczką
 * w Pieninach — to centra danych Meta i AWS-a, a ruch to crawlery budujące
 * podgląd odnośnika.
 *
 * **Botów nie blokujemy.** Dostają normalną odpowiedź 200 i tę samą treść co
 * ludzie. Gdyby `facebookexternalhit` dostał 403, z posta na Facebooku
 * zniknąłby podgląd — tytuł, opis i obrazek — a razem z nim połowa powodu,
 * dla którego ktokolwiek w ten odnośnik kliknie. Filtr dotyczy statystyk,
 * nie dostępu.
 *
 * **Ta funkcja nigdy nie orzeka, że ktoś jest człowiekiem.** Umie tylko
 * powiedzieć „to bot" albo „nie wiem". Człowieka potwierdza dopiero sygnał
 * z przeglądarki, która wykonała JavaScript — patrz `token-trafienia.ts`.
 * Odwrotna kolejność (domyślnie człowiek, chyba że wpadnie w regułę) to
 * dokładnie ten błąd, przez który te 22 trafienia trafiły do licznika.
 */

export type SygnalyZadania = {
  metoda: string | null
  userAgent: string | null
  jezyki: string | null
  /** Nagłówki zapowiadające pobranie na zapas, a nie odwiedziny. */
  cel: string | null
  /** Adres klienta — używany tylko tutaj i nigdzie nie zapisywany. */
  ip: string | null
}

export type Werdykt = {
  klasyfikacja: 'BOT' | 'NIEPEWNY'
  powodBota: string | null
  asn: number | null
}

/**
 * Ruch, który sam się przedstawia.
 *
 * Crawlery serwisów społecznościowych, wyszukiwarek i modeli językowych piszą
 * w User-Agencie, kim są — nie ukrywają się, bo nie mają po co. Ta lista łapie
 * ich po nazwie własnej i dlatego jest pewna: dopasowanie tutaj to nie
 * poszlaka, tylko podpis.
 */
const NAZWANE_BOTY =
  /facebookexternalhit|meta-externalagent|facebookcatalog|FBAV\/.*\[FBAN|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|redditbot|Pinterest|Applebot|Googlebot|bingbot|YandexBot|DuckDuckBot|Bytespider|GPTBot|ClaudeBot|PerplexityBot|CCBot|AhrefsBot|SemrushBot|MJ12bot|DotBot|BLEXBot|curl|wget|python-requests|httpx|axios|Go-http-client|Java\/|okhttp|libwww|HeadlessChrome|PhantomJS|Puppeteer|Playwright/i

/**
 * Sito na resztę — i celowo osobna reguła.
 *
 * Te słowa łapią wszystko, co ma w nazwie „bot" czy „crawler", ale mogą też
 * złapać przeglądarkę o niefortunnej nazwie. Osobny powód w bazie pozwala
 * sprawdzić w panelu, ile trafień odsiało to sito i czy nie odsiewa ludzi —
 * gdyby lista była jedna, nikt by się nie dowiedział.
 */
const OGOLNE_SLOWA = /bot|crawler|spider|scraper|preview|monitor|uptime|scan/i

/** Nagłówki, którymi przeglądarka mówi „pobieram na zapas, nikt tego nie ogląda". */
const ZAPOWIEDZ_POBRANIA = /prefetch|preview|prerender/i

export function sklasyfikuj(sygnaly: SygnalyZadania): Werdykt {
  const asn = siecCentrumDanych(sygnaly.ip)
  const werdykt = (powodBota: string | null): Werdykt =>
    powodBota ? { klasyfikacja: 'BOT', powodBota, asn } : { klasyfikacja: 'NIEPEWNY', powodBota: null, asn }

  /*
    Kolejność jest od najtańszego i najpewniejszego do najdroższego. Pierwsza
    pasująca reguła kończy sprawę — dzięki temu w bazie widać nie „że bot",
    tylko „przez co", a regułę, która okaże się za szeroka, da się wycofać bez
    ruszania pozostałych.
  */

  // Nikt nie ogląda strony metodą HEAD. Tak sprawdza się, czy adres żyje.
  const metoda = sygnaly.metoda?.toUpperCase()
  if (metoda === 'HEAD' || metoda === 'OPTIONS') return werdykt('metoda_http')

  if (sygnaly.cel && ZAPOWIEDZ_POBRANIA.test(sygnaly.cel)) return werdykt('prefetch')

  /*
    Przeglądarki wysyłają `Accept-Language` zawsze — to na jego podstawie
    dostajesz stronę po polsku. Crawlery rzadko, bo nie mają języka.
    Reguła jest ostrożna: brak nagłówka oznacza bota, ale nie odwrotnie.
  */
  if (!sygnaly.jezyki) return werdykt('bez_accept_language')

  const ua = sygnaly.userAgent
  if (!ua) return werdykt('bez_user_agenta')
  if (NAZWANE_BOTY.test(ua)) return werdykt('ua_blocklist')
  if (OGOLNE_SLOWA.test(ua)) return werdykt('ua_generic')

  if (asn !== null) return werdykt('asn_centrum')

  return werdykt(null)
}

/**
 * Sygnały wyjęte z nagłówków żądania.
 *
 * `Sec-Fetch-Mode: navigate` świadomie nie jest tu regułą, choć plan filtra
 * go wymieniał. Mówi „to nawigacja w przeglądarce", ale przeglądarka
 * bezgłowa też go wysyła — jako dowód na człowieka nie wystarcza, a jako
 * poszlaka niczego nie dokłada do potwierdzenia z JavaScriptu.
 */
export function sygnalyZNaglowkow(naglowki: Headers): SygnalyZadania {
  return {
    metoda: naglowki.get('x-metoda-zadania'),
    userAgent: naglowki.get('user-agent'),
    jezyki: naglowki.get('accept-language'),
    cel:
      naglowki.get('sec-purpose') ?? naglowki.get('purpose') ?? naglowki.get('x-purpose'),
    ip: adresKlienta(naglowki),
  }
}

/**
 * Adres klienta zza serwera pośredniczącego.
 *
 * Bez tego każde żądanie wyglądałoby jak ruch z centrum danych — bo z niego
 * przychodzi: `REMOTE_ADDR` to adres serwera Vercela, nie turysty. Pierwszy
 * wpis w `X-Forwarded-For` to klient, kolejne to kolejne przeskoki.
 *
 * Zwrócona wartość żyje długość jednego żądania: służy do wyliczenia numeru
 * sieci i ginie razem z nim. Do bazy nie trafia ani jawnie, ani jako skrót.
 */
export function adresKlienta(naglowki: Headers): string | null {
  const przekazany = naglowki.get('x-forwarded-for')
  const pierwszy = przekazany?.split(',')[0]?.trim()
  if (pierwszy) return pierwszy

  return naglowki.get('x-real-ip')
}

/** Pełny User-Agent bywa długi; do bazy idzie tyle, ile potrzeba do audytu. */
export const DLUGOSC_USER_AGENTA = 512

export function przytnijUserAgenta(ua: string | null): string | null {
  return ua ? ua.slice(0, DLUGOSC_USER_AGENTA) : null
}
