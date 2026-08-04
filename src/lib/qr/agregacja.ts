import { baza } from '@/lib/baza'

/**
 * Przeliczanie statystyk.
 *
 * Zdarzenia skanowania tylko dopisujemy — nigdy nie aktualizujemy licznika
 * w wierszu tabliczki przy okazji skanu. Gdyby tak było, wszystkie zapisy dla
 * popularnego punktu ustawiłyby się w kolejce do jednego wiersza i w szczycie
 * sezonu Trzy Korony byłyby wąskim gardłem całego systemu.
 *
 * Zamiast tego zadanie cykliczne przelicza sumy dzienne i liczniki. Uruchamiane
 * co pięć minut daje statystyki wystarczająco świeże dla pulpitu, a przy okazji
 * jest odporne na awarie: jeśli przebieg przepadnie, następny nadrobi zaległość,
 * bo liczy od zera z surowych zdarzeń, a nie dolicza różnicę.
 */

/** Ile ostatnich dni przeliczać przy każdym przebiegu. */
const OKNO_DNI = 3

export type WynikAgregacji = {
  przeliczoneDni: number
  zaktualizowaneKody: number
}

export async function przeliczStatystyki(): Promise<WynikAgregacji> {
  const od = new Date()
  od.setUTCDate(od.getUTCDate() - OKNO_DNI)
  od.setUTCHours(0, 0, 0, 0)

  /*
    Sumy dzienne liczymy w bazie, a nie w Node'ie.

    Ściągnięcie miliona wierszy tylko po to, żeby je policzyć w pętli, byłoby
    marnotrawstwem pasma i pamięci. `GROUP BY` robi to samo przy danych,
    a wynikiem jest kilkaset wierszy.
  */
  const dzienne = await baza.$queryRaw<
    { kodQrId: string; dzien: Date; liczba: bigint; ios: bigint; android: bigint; desktop: bigint }[]
  >`
    SELECT
      "kodQrId",
      date_trunc('day', "czas")::date AS dzien,
      count(*)                                             AS liczba,
      count(*) FILTER (WHERE "urzadzenie" = 'IOS')         AS ios,
      count(*) FILTER (WHERE "urzadzenie" = 'ANDROID')     AS android,
      count(*) FILTER (WHERE "urzadzenie" = 'DESKTOP')     AS desktop
    FROM "SkanQr"
    WHERE "czas" >= ${od}
    GROUP BY "kodQrId", date_trunc('day', "czas")
  `

  for (const wiersz of dzienne) {
    const wartosci = {
      liczba: Number(wiersz.liczba),
      ios: Number(wiersz.ios),
      android: Number(wiersz.android),
      desktop: Number(wiersz.desktop),
    }

    await baza.skanDzienny.upsert({
      where: { kodQrId_dzien: { kodQrId: wiersz.kodQrId, dzien: wiersz.dzien } },
      create: { kodQrId: wiersz.kodQrId, dzien: wiersz.dzien, ...wartosci },
      // Nadpisujemy, a nie dodajemy — przebieg liczy stan od zera, więc
      // powtórzenie go nie zawyży wyniku.
      update: wartosci,
    })
  }

  /*
    Licznik całkowity bierzemy z sum dziennych, nie z surowych zdarzeń.
    Surowe znikają po 90 dniach; agregaty zostają, więc tylko one znają
    pełną historię tabliczki.
  */
  const zaktualizowane = await baza.$executeRaw`
    UPDATE "KodQr" k
    SET "liczbaSkanow" = COALESCE(s.suma, 0),
        "ostatniSkan"  = s.ostatni
    FROM (
      SELECT d."kodQrId",
             sum(d."liczba")::int AS suma,
             (SELECT max(z."czas") FROM "SkanQr" z WHERE z."kodQrId" = d."kodQrId") AS ostatni
      FROM "SkanDzienny" d
      GROUP BY d."kodQrId"
    ) s
    WHERE k.id = s."kodQrId"
      AND (k."liczbaSkanow" IS DISTINCT FROM s.suma OR k."ostatniSkan" IS DISTINCT FROM s.ostatni)
  `

  return { przeliczoneDni: dzienne.length, zaktualizowaneKody: zaktualizowane }
}

/** Ile dni trzymamy surowe zdarzenia, zanim zostaną usunięte. */
export const RETENCJA_DNI = 90

/**
 * Usuwanie surowych zdarzeń starszych niż okres retencji.
 *
 * To nie jest sprzątanie miejsca na dysku, tylko zasada minimalizacji danych
 * z RODO: trzymamy tylko to, co jest do czegoś potrzebne. Statystyki i wykresy
 * czerpią z sum dziennych, więc surowe zdarzenia sprzed trzech miesięcy nie
 * służą już niczemu.
 */
export async function usunStareZdarzenia(): Promise<number> {
  const granica = new Date()
  granica.setUTCDate(granica.getUTCDate() - RETENCJA_DNI)

  const { count } = await baza.skanQr.deleteMany({ where: { czas: { lt: granica } } })
  return count
}
