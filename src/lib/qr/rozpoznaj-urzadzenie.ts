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
 */

export type RozpoznanieUrzadzenia = {
  typ: TypUrzadzenia
  przegladarka: string | null
}

export function rozpoznajUrzadzenie(userAgent: string | null): RozpoznanieUrzadzenia {
  if (!userAgent) return { typ: 'INNE', przegladarka: null }

  const ua = userAgent.toLowerCase()

  return {
    typ: rozpoznajTyp(ua),
    przegladarka: rozpoznajPrzegladarke(ua),
  }
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
