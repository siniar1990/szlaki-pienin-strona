import type { TypUrzadzenia } from '@prisma/client'

import { baza } from '@/lib/baza'

/**
 * Zapis pojedynczego skanu.
 *
 * Wołany wyłącznie z `after()` — czyli po tym, jak odpowiedź poszła już do
 * przeglądarki. Turysta dostaje przekierowanie, nie czekając na rundę do bazy.
 * Gdyby zapis był przed odpowiedzią, każdy skan kosztowałby dodatkowe
 * kilkadziesiąt milisekund, a przy zimnym starcie funkcji znacznie więcej.
 *
 * Błąd zapisu nie może mieć żadnych skutków dla użytkownika — odpowiedź już
 * poleciała. Łapiemy go i zostawiamy w dzienniku; utrata jednego zdarzenia
 * analitycznego jest bez porównania mniej dotkliwa niż wyjątek w tle.
 */

export type DaneSkanu = {
  kodQrId: string
  urzadzenie: TypUrzadzenia
  przegladarka: string | null
  jezyk: string | null
  kraj: string | null
  miasto: string | null
  zrodlo: string | null
  przekierowanoDoSklepu: boolean
  wariant: string | null
}

export async function zapiszSkan(dane: DaneSkanu): Promise<void> {
  try {
    await baza.skanQr.create({ data: dane })
  } catch (blad) {
    console.error('[qr] nie udało się zapisać skanu', {
      kod: dane.kodQrId,
      blad: blad instanceof Error ? blad.message : String(blad),
    })
  }
}

/**
 * Wyciąga z nagłówków to, co wolno zapisać.
 *
 * Kraj i miasto pochodzą z nagłówków dostawcy hostingu — to wartości wyliczone
 * przez niego z adresu IP, a nie sam adres. Samego IP nie odczytujemy i nie
 * zapisujemy nigdzie, w żadnej postaci: ani jawnie, ani jako skrót. Dzięki temu
 * zbiór nie zawiera danych osobowych i portal nie potrzebuje zgody na pomiar.
 *
 * Język bierzemy tylko jako kod podstawowy („pl" z „pl-PL,pl;q=0.9") — pełny
 * nagłówek `Accept-Language` bywa na tyle nietypowy, że staje się elementem
 * odcisku przeglądarki.
 */
export function daneZNaglowkow(naglowki: Headers): {
  jezyk: string | null
  kraj: string | null
  miasto: string | null
  zrodlo: string | null
} {
  const jezykSurowy = naglowki.get('accept-language')
  const jezyk = jezykSurowy?.split(',')[0]?.split('-')[0]?.slice(0, 8) ?? null

  const miastoSurowe = naglowki.get('x-vercel-ip-city')

  return {
    jezyk,
    kraj: naglowki.get('x-vercel-ip-country'),
    // Nazwy miast przychodzą zakodowane procentowo („Nowy%20Targ").
    miasto: miastoSurowe ? bezpieczneDekodowanie(miastoSurowe) : null,
    zrodlo: naglowki.get('referer'),
  }
}

function bezpieczneDekodowanie(tekst: string): string {
  try {
    return decodeURIComponent(tekst)
  } catch {
    // Uszkodzone kodowanie nie jest powodem, żeby zgubić całe zdarzenie.
    return tekst
  }
}
