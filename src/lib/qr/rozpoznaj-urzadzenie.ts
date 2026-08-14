import type { TypUrzadzenia } from '@prisma/client'

/**
 * Rozpoznanie platformy z nagłówka User-Agent.
 *
 * Świadomie bez biblioteki. Pełne parsery User-Agenta ważą kilkaset kilobajtów
 * i rozpoznają setki urządzeń, a nam potrzebne są trzy odpowiedzi: iOS, Android
 * czy komputer. Każdy kilobajt i każda milisekunda liczą się tu podwójnie, bo
 * ten kod wykonuje się przed przekierowaniem, na oczach turysty stojącego
 * w terenie z jedną kreską zasięgu.
 *
 * Kolejność sprawdzeń nie jest przypadkowa — patrz komentarze niżej.
 *
 * **Dlaczego nadal bez biblioteki, skoro w statystykach królowało „inne".**
 * Bo „inne" nie brało się z ułomności tych regexów, tylko z tego, kto pukał:
 * `facebookexternalhit`, `curl` i skanery bezpieczeństwa nie mają w nazwie
 * ani Androida, ani iPhone'a — i słusznie trafiały do worka „inne". Po
 * odsianiu botów ta kategoria zostaje dla ruchu, którym naprawdę jest:
 * przeglądarek udających coś nietypowego. Biblioteka rozpoznająca setki
 * urządzeń rozwiązywałaby problem, którego nie mieliśmy.
 *
 * Wskazówki klienta (`Sec-CH-UA-Platform`, `Sec-CH-UA-Mobile`) sprawdzamy
 * przed User-Agentem, bo są tym, czym User-Agent miał być: krótką i prawdziwą
 * odpowiedzią na pytanie o system. Wysyła je dziś rodzina Chrome'a; Safari
 * i Firefox nie, więc regexy zostają dla nich, a nie „na wszelki wypadek".
 */

export type RozpoznanieUrzadzenia = {
  typ: TypUrzadzenia
  przegladarka: string | null
}

/** Wskazówki klienta — nagłówki `Sec-CH-UA-*`, jeśli przeglądarka je wysyła. */
export type WskazowkiKlienta = {
  platforma: string | null
  mobilne: string | null
}

export function rozpoznajUrzadzenie(
  userAgent: string | null,
  wskazowki?: WskazowkiKlienta,
): RozpoznanieUrzadzenia {
  if (!userAgent) return { typ: 'INNE', przegladarka: null }

  const ua = userAgent.toLowerCase()

  return {
    typ: zWskazowek(wskazowki) ?? rozpoznajTyp(ua),
    przegladarka: rozpoznajPrzegladarke(ua),
  }
}

/**
 * Typ urządzenia ze wskazówek klienta.
 *
 * Wartości przychodzą w cudzysłowach („\"Android\""), bo to nagłówki
 * strukturalne — samo `=== 'Android'` nigdy by nie trafiło.
 */
function zWskazowek(wskazowki?: WskazowkiKlienta): TypUrzadzenia | null {
  const platforma = wskazowki?.platforma?.replaceAll('"', '').trim().toLowerCase()
  if (!platforma) return null

  if (platforma === 'android') return 'ANDROID'
  if (platforma === 'ios') return 'IOS'
  if (platforma === 'windows' || platforma === 'macos' || platforma === 'linux') {
    // „?1" znaczy telefon. Windows na telefonie już nie istnieje, ale Chrome
    // na Androidzie potrafi podać platformę „Linux" — wtedy to nie komputer.
    return wskazowki?.mobilne?.includes('?1') ? 'ANDROID' : 'DESKTOP'
  }

  return null
}

function rozpoznajTyp(ua: string): TypUrzadzenia {
  /*
    Android przed iOS-em, bo część przeglądarek na Androidzie (dawny Chrome,
    przeglądarki producentów) wpisuje w User-Agenta słowo „Safari" —
    sprawdzanie iOS-a najpierw wysyłałoby te urządzenia do App Store'a.
  */
  if (ua.includes('android')) return 'ANDROID'

  /*
    iPad od iPadOS 13 podaje się za komputer Mac. Odróżnia go obecność obsługi
    dotyku, której w User-Agencie nie widać — ale Safari na iPadzie nadal
    zawiera „mobile" albo „ipad" w części zapytań. Łapiemy oba warianty; iPad
    udający Maca trafi na stronę z wyborem platformy, co jest bezpiecznym
    zachowaniem: użytkownik zobaczy oba przyciski i wybierze sam.
  */
  if (/iphone|ipad|ipod/.test(ua)) return 'IOS'
  if (ua.includes('mac os x') && ua.includes('mobile')) return 'IOS'

  if (/windows|macintosh|linux|cros/.test(ua)) return 'DESKTOP'

  return 'INNE'
}

function rozpoznajPrzegladarke(ua: string): string | null {
  /*
    Kolejność od najbardziej szczegółowej do najogólniejszej. Edge podaje się
    za Chrome'a, Chrome za Safari — sprawdzanie od końca dałoby wszystkim
    etykietę „Safari".
  */
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('samsungbrowser')) return 'Samsung Internet'
  if (ua.includes('firefox') || ua.includes('fxios')) return 'Firefox'
  if (ua.includes('chrome') || ua.includes('crios')) return 'Chrome'
  if (ua.includes('safari')) return 'Safari'
  return null
}
