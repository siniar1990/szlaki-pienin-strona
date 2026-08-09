import type { RodzajZdarzenia } from '@prisma/client'

import { baza } from '@/lib/baza'

/**
 * Przeliczanie i odczyt statystyk odsłon.
 *
 * Zbudowane tak samo jak statystyki tabliczek i z tych samych powodów: surowe
 * zdarzenia wyłącznie dopisujemy, a sumy dzienne liczy osobny przebieg,
 * w bazie, poleceniem `GROUP BY`. Ściąganie stu tysięcy wierszy po to, żeby je
 * policzyć w pętli, byłoby marnotrawstwem pasma przy wyniku liczącym kilkaset
 * pozycji.
 */

/** Ile ostatnich dni przeliczamy przy każdym przebiegu. */
const OKNO_DNI = 3

/** Tyle samo, co przy skanach — jedna zasada retencji dla całego portalu. */
export const RETENCJA_DNI = 90

export async function przeliczOdslony(): Promise<number> {
  const od = new Date()
  od.setUTCDate(od.getUTCDate() - OKNO_DNI)
  od.setUTCHours(0, 0, 0, 0)

  const dzienne = await baza.$queryRaw<
    { rodzaj: RodzajZdarzenia; klucz: string; dzien: Date; liczba: bigint }[]
  >`
    SELECT "rodzaj", "klucz", date_trunc('day', "czas")::date AS dzien, count(*) AS liczba
    FROM "Zdarzenie"
    WHERE "czas" >= ${od}
    GROUP BY "rodzaj", "klucz", date_trunc('day', "czas")
  `

  for (const wiersz of dzienne) {
    const liczba = Number(wiersz.liczba)
    await baza.zdarzenieDzienne.upsert({
      where: {
        rodzaj_klucz_dzien: { rodzaj: wiersz.rodzaj, klucz: wiersz.klucz, dzien: wiersz.dzien },
      },
      create: { rodzaj: wiersz.rodzaj, klucz: wiersz.klucz, dzien: wiersz.dzien, liczba },
      // Nadpisujemy, nie dodajemy: przebieg liczy od zera z surowych zdarzeń,
      // więc powtórzenie go nie podwaja wyniku.
      update: { liczba },
    })
  }

  return dzienne.length
}

export async function usunStareOdslony(): Promise<number> {
  const granica = new Date()
  granica.setUTCDate(granica.getUTCDate() - RETENCJA_DNI)

  const wynik = await baza.zdarzenie.deleteMany({ where: { czas: { lt: granica } } })
  return wynik.count
}

/* ── Odczyt dla panelu ──────────────────────────────────────────────────── */

export type PozycjaStatystyk = { klucz: string; liczba: number }

/**
 * Najczęściej oglądane pozycje danego rodzaju w zadanym okresie.
 *
 * **Dlaczego z sum dziennych, a nie z surowych zdarzeń.** Sumy dzienne są
 * trzymane bezterminowo, a surowe zdarzenia znikają po dziewięćdziesięciu
 * dniach. Czytanie z agregatu daje więc porównania sezonów i jest przy okazji
 * kilkadziesiąt razy szybsze.
 *
 * **Dlaczego dzisiejsze odsłony też się liczą.** Agregacja chodzi raz na dobę,
 * więc bez doliczenia bieżącego dnia panel pokazywałby stan sprzed nocy —
 * a pierwsze pytanie po opublikowaniu notki brzmi „czy ktoś to czyta".
 */
export async function najczestsze(
  rodzaj: RodzajZdarzenia,
  odDni: number,
  ile = 20,
): Promise<PozycjaStatystyk[]> {
  const od = new Date()
  od.setUTCDate(od.getUTCDate() - odDni)
  od.setUTCHours(0, 0, 0, 0)

  const wiersze = await baza.$queryRaw<{ klucz: string; liczba: bigint }[]>`
    SELECT klucz, sum(liczba)::bigint AS liczba FROM (
      SELECT "klucz", "liczba"
      FROM "ZdarzenieDzienne"
      WHERE "rodzaj" = ${rodzaj}::"RodzajZdarzenia" AND "dzien" >= ${od}
        AND "dzien" < date_trunc('day', now())
      UNION ALL
      SELECT "klucz", 1 AS liczba
      FROM "Zdarzenie"
      WHERE "rodzaj" = ${rodzaj}::"RodzajZdarzenia" AND "czas" >= date_trunc('day', now())
    ) AS razem
    GROUP BY klucz
    ORDER BY liczba DESC
    LIMIT ${ile}
  `

  return wiersze.map((wiersz) => ({ klucz: wiersz.klucz, liczba: Number(wiersz.liczba) }))
}

/** Suma zdarzeń danego rodzaju w okresie. */
export async function suma(rodzaj: RodzajZdarzenia, odDni: number): Promise<number> {
  const pozycje = await najczestsze(rodzaj, odDni, 100_000)
  return pozycje.reduce((razem, pozycja) => razem + pozycja.liczba, 0)
}

/** Odsłony pojedynczej podstrony — do pokazania przy notce w panelu. */
export async function odslonyPozycji(
  rodzaj: RodzajZdarzenia,
  klucze: string[],
): Promise<Map<string, number>> {
  if (klucze.length === 0) return new Map()

  const wiersze = await baza.$queryRaw<{ klucz: string; liczba: bigint }[]>`
    SELECT klucz, sum(liczba)::bigint AS liczba FROM (
      SELECT "klucz", "liczba" FROM "ZdarzenieDzienne"
      WHERE "rodzaj" = ${rodzaj}::"RodzajZdarzenia" AND "klucz" = ANY(${klucze})
        AND "dzien" < date_trunc('day', now())
      UNION ALL
      SELECT "klucz", 1 AS liczba FROM "Zdarzenie"
      WHERE "rodzaj" = ${rodzaj}::"RodzajZdarzenia" AND "klucz" = ANY(${klucze})
        AND "czas" >= date_trunc('day', now())
    ) AS razem
    GROUP BY klucz
  `

  return new Map(wiersze.map((wiersz) => [wiersz.klucz, Number(wiersz.liczba)]))
}
