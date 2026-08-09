import { after, NextResponse, type NextRequest } from 'next/server'

import { sprawdzZdarzenie, zapiszZdarzenie } from '@/lib/analityka/zapis'

/**
 * Zliczanie odsłon i kliknięć w pobranie aplikacji.
 *
 * **Dlaczego zapis po odesłaniu odpowiedzi.** Ta sama zasada, co przy skanach
 * tabliczek: `after()` wykonuje kod po wysłaniu odpowiedzi, więc przeglądarka
 * dostaje 204 natychmiast, a wpis do bazy dzieje się w tle. Licznik nie ma
 * prawa spowalniać strony, którą liczy.
 *
 * **Dlaczego 204, a nie 200 z treścią.** Nadawca i tak nie czyta odpowiedzi —
 * `sendBeacon` jej nie udostępnia. Pusta odpowiedź to o kilkadziesiąt bajtów
 * mniej razy każda odsłona portalu.
 *
 * **Dlaczego trasa jest otwarta.** Bo musi być: odsłony przychodzą od
 * anonimowych odwiedzających. Ochroną nie jest tu hasło, tylko wąskie
 * sprawdzenie danych — nieznany rodzaj i klucz spoza wzorca odpadają, zanim
 * cokolwiek trafi do bazy. Ktoś uparty może podbić licznik, ale nie może
 * wpisać do niego czegokolwiek.
 */
export const dynamic = 'force-dynamic'

export async function POST(zadanie: NextRequest) {
  const dane = await zadanie.json().catch(() => null)
  const zdarzenie = sprawdzZdarzenie(dane)

  // Złe dane kwitujemy tą samą pustą odpowiedzią co dobre. Odsyłanie
  // komunikatu o błędzie podpowiadałoby, jak trafić poprawnie.
  if (zdarzenie) {
    after(async () => {
      try {
        await zapiszZdarzenie(zdarzenie.rodzaj, zdarzenie.klucz)
      } catch (blad) {
        // Nieudany zapis licznika nie może niczego przewrócić — to statystyka,
        // nie treść portalu.
        console.error('Nie zapisano odsłony:', blad)
      }
    })
  }

  return new NextResponse(null, { status: 204 })
}
