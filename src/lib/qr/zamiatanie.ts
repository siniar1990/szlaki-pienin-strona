import { baza } from '@/lib/baza'

/**
 * Sprzątanie po skanach, które nie doczekały się potwierdzenia.
 *
 * Skan zapisuje się jako „niepewny" i czeka na sygnał z przeglądarki. Jeśli
 * sygnał nie przyjdzie, po kwadransie już nie przyjdzie nigdy — token żyje
 * pięć minut, a przeglądarka wysyła go w pierwszej sekundzie. Takie wiersze
 * dostają tu nazwisko, żeby w panelu było widać, ile ruchu odpada i przez co.
 *
 * **To jest tylko etykietowanie.** Do statystyk i tak nie wchodziły, bo
 * `liczone` zostaje fałszem aż do potwierdzenia. Gdyby to zamiatanie nigdy się
 * nie uruchomiło, liczby byłyby te same — zmieniłby się wyłącznie opis
 * w rozbiciu na powody.
 *
 * **Ruszamy wyłącznie wiersze bez powodu.** Skrypt migracyjny nadaje własne
 * etykiety (`stare_bez_danych`, `nawal_fb_20260814`) i one mają zostać: bez
 * tego warunku pierwszy przebieg zamiatania przemianowałby całą oznaczoną
 * historię na „brak_beacona" i ślad po tym, skąd wiemy, że to były crawlery
 * Facebooka, zniknąłby po cichu.
 */

/** Po ilu minutach uznajemy, że potwierdzenie już nie przyjdzie. */
const CIERPLIWOSC_MINUT = 15

/**
 * Ile trafień w minucie na jedną tabliczkę uznajemy za nawał.
 *
 * Sygnatura crawlerów Meta: kilkanaście żądań w kilka sekund, z różnych
 * centrów danych, zaraz po opublikowaniu odnośnika. Człowiek pod tabliczką
 * tego nie zrobi — chyba że odświeża stronę jak opętany, a wtedy i tak
 * wszystkie te trafienia są niepotwierdzone.
 */
const PROG_NAWALU = 5

export type WynikZamiatania = {
  nawal: number
  brakBeacona: number
}

export async function zamiecNiepotwierdzone(): Promise<WynikZamiatania> {
  const granica = new Date(Date.now() - CIERPLIWOSC_MINUT * 60_000)

  /*
    Najpierw nawał, potem reszta — kolejność decyduje o tym, co zobaczy
    właściciel. „Kilkanaście trafień w minutę na jedną tabliczkę" to zupełnie
    inna historia niż „ktoś wszedł i nie wykonał JavaScriptu", a gdyby
    zamiatanie szło odwrotnie, wszystko wyglądałoby jak to drugie.

    Okno liczymy kubełkami po sześćdziesiąt sekund, a nie ruchomym oknem.
    Kubełek bywa o kilka sekund przesunięty względem prawdziwego nawału,
    ale to etykieta do przeglądu, nie dowód w sprawie — a zapytanie jest
    dzięki temu jednym przejściem po indeksie zamiast łączenia tabeli ze sobą.
  */
  const nawal = await baza.$executeRaw`
    UPDATE "SkanQr"
    SET "klasyfikacja" = 'BOT', "powodBota" = 'nawal'
    WHERE "id" IN (
      SELECT s."id"
      FROM "SkanQr" s
      JOIN (
        SELECT "kodQrId", to_timestamp(floor(extract(epoch FROM "czas") / 60) * 60) AS kubelek
        FROM "SkanQr"
        WHERE "klasyfikacja" = 'NIEPEWNY' AND "powodBota" IS NULL AND "czas" < ${granica}
        GROUP BY "kodQrId", kubelek
        HAVING count(*) > ${PROG_NAWALU}
      ) g
        ON g."kodQrId" = s."kodQrId"
       AND s."czas" >= g.kubelek
       AND s."czas" <  g.kubelek + interval '60 seconds'
      WHERE s."klasyfikacja" = 'NIEPEWNY' AND s."powodBota" IS NULL AND s."czas" < ${granica}
    )
  `

  const brakBeacona = await baza.skanQr.updateMany({
    where: { klasyfikacja: 'NIEPEWNY', powodBota: null, czas: { lt: granica } },
    data: { klasyfikacja: 'BOT', powodBota: 'brak_beacona' },
  })

  return { nawal, brakBeacona: brakBeacona.count }
}
