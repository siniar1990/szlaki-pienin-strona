'use client'

import { useEffect, useRef } from 'react'

/**
 * Cichy licznik odsłony.
 *
 * Nie renderuje niczego. Po wyświetleniu strony wysyła jedno żądanie do
 * `/api/odslona` i na tym kończy swoją rolę.
 *
 * **Dlaczego `sendBeacon`, a nie `fetch`.** Beacon jest pomyślany dokładnie do
 * tego: przeglądarka bierze żądanie na siebie i dostarcza je nawet wtedy, gdy
 * człowiek zamknie kartę w tej samej sekundzie. Zwykły `fetch` zostałby wtedy
 * przerwany, a odsłony najkrótsze — czyli te, które najwięcej mówią o tym, że
 * strona kogoś nie zainteresowała — znikałyby ze statystyki.
 *
 * **Dlaczego strażnik przed podwójnym wysłaniem.** W trybie ścisłym React
 * uruchamia efekty dwukrotnie przy pracy nad kodem. Bez tej blokady każda
 * odsłona na komputerze programisty liczyłaby się dwa razy — i nikt by tego
 * nie zauważył aż do chwili, gdy liczby zaczęłyby się nie zgadzać.
 */
export function LicznikOdslon({
  rodzaj,
  klucz,
}: {
  rodzaj: 'ATRAKCJA' | 'SZLAK' | 'AKTUALNOSC'
  klucz: string
}) {
  const wyslano = useRef(false)

  useEffect(() => {
    if (wyslano.current) return
    wyslano.current = true

    zglos(rodzaj, klucz)
  }, [rodzaj, klucz])

  return null
}

/**
 * Wysłanie zdarzenia. Wydzielone, bo korzystają z tego także odznaki sklepów.
 *
 * Awaria jest tu bez znaczenia i celowo nie jest obsługiwana głośniej niż
 * przez pominięcie: brak jednej odsłony w statystyce to nic, a komunikat
 * o błędzie w konsoli odwiedzającego to zaśmiecanie cudzej przeglądarki
 * naszym problemem.
 */
export function zglos(rodzaj: string, klucz: string): void {
  try {
    const dane = JSON.stringify({ rodzaj, klucz })

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/odslona', new Blob([dane], { type: 'application/json' }))
      return
    }

    // Starsze przeglądarki: zwykłe żądanie z `keepalive`, które też przeżywa
    // zamknięcie karty, choć z mniejszą pewnością.
    void fetch('/api/odslona', {
      method: 'POST',
      body: dane,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* pomijamy */
  }
}
