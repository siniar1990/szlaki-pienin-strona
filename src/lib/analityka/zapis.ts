import type { RodzajZdarzenia } from '@prisma/client'

import { baza } from '@/lib/baza'

/**
 * Zapis odsłony.
 *
 * **Dlaczego licznik wysyła przeglądarka, a nie serwer.** Strony atrakcji,
 * tras i aktualności powstają przy budowaniu i są podawane z pamięci
 * podręcznej — kod serwerowy nie wykonuje się przy każdym wejściu, więc nie
 * ma gdzie policzyć. Zliczanie po stronie serwera wymagałoby uczynienia
 * wszystkich stron dynamicznymi, czyli zapłacenia czasem odpowiedzi za każdą
 * odsłonę u każdego odwiedzającego. Beacon z przeglądarki kosztuje jedno
 * dodatkowe żądanie, które nie blokuje niczego.
 *
 * Cena tej decyzji: odwiedzający z blokadą skryptów nie zostanie policzony.
 * Przy liczniku, który ma pokazywać, co ludzi interesuje, jest to cena warta
 * zapłacenia — wartości bezwzględne i tak są przybliżeniem, a proporcje
 * między podstronami zostają zachowane.
 */

/** Najdłuższy klucz, jaki przyjmiemy. Najdłuższy prawdziwy ma ~45 znaków. */
const NAJDLUZSZY_KLUCZ = 120

const DOZWOLONE: RodzajZdarzenia[] = ['ATRAKCJA', 'SZLAK', 'AKTUALNOSC', 'POBRANIE']

/**
 * Sprawdza dane z przeglądarki i zwraca je w postaci gotowej do zapisu.
 *
 * Trasa zliczająca jest z konieczności otwarta — musi przyjmować żądania od
 * kogokolwiek, bo od kogokolwiek przychodzą odsłony. Nie da się jej więc
 * ochronić hasłem; da się za to ograniczyć, co można przez nią wpisać do
 * bazy. Nieznany rodzaj i klucz spoza wzorca odpadają tutaj, zanim
 * cokolwiek dotknie tabeli.
 */
export function sprawdzZdarzenie(dane: unknown): { rodzaj: RodzajZdarzenia; klucz: string } | null {
  if (typeof dane !== 'object' || dane === null) return null

  const { rodzaj, klucz } = dane as { rodzaj?: unknown; klucz?: unknown }

  if (typeof rodzaj !== 'string' || !DOZWOLONE.includes(rodzaj as RodzajZdarzenia)) return null
  if (typeof klucz !== 'string') return null

  const oczyszczony = klucz.trim().slice(0, NAJDLUZSZY_KLUCZ)
  // Adresy podstron portalu to slugi: małe litery, cyfry i myślniki.
  if (!/^[a-z0-9-]+$/.test(oczyszczony)) return null

  return { rodzaj: rodzaj as RodzajZdarzenia, klucz: oczyszczony }
}

export async function zapiszZdarzenie(rodzaj: RodzajZdarzenia, klucz: string): Promise<void> {
  await baza.zdarzenie.create({ data: { rodzaj, klucz } })
}
