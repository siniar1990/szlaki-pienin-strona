import { baza } from '@/lib/baza'
import { zamiecNiepotwierdzone } from '@/lib/qr/zamiatanie'

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
 *
 * **Wszystko poniżej liczy wyłącznie zdarzenia z `liczone = true`.** Boty
 * zostają w tabeli zdarzeń — do audytu reguł — ale nie wchodzą do żadnej sumy.
 * Gdyby ten warunek gdzieś wypadł, statystyki zaczęłyby po cichu pokazywać
 * ruch crawlerów i nikt by tego nie zauważył, bo liczba wyglądałaby zdrowo.
 */

/** Ile ostatnich dni przeliczać przy każdym przebiegu. */
const OKNO_DNI = 3

export type WynikAgregacji = {
  przeliczoneDni: number
  zaktualizowaneKody: number
}

/**
 * @param calaHistoria przelicza wszystkie dni, nie tylko ostatnie trzy.
 *
 * Potrzebne po zmianie reguł klasyfikacji: wsteczne oznaczenie botów zmienia
 * przeszłość, a zwykły przebieg jej nie dotyka i sumy dzienne sprzed tygodnia
 * dalej zawierałyby crawlery. Wołane z `narzedzia/przeklasyfikuj-skany.ts`.
 */
export async function przeliczStatystyki(calaHistoria = false): Promise<WynikAgregacji> {
  const od = new Date(0)
  if (!calaHistoria) {
    od.setTime(Date.now())
    od.setUTCDate(od.getUTCDate() - OKNO_DNI)
    od.setUTCHours(0, 0, 0, 0)
  }

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
      AND "liczone" = true
    GROUP BY "kodQrId", date_trunc('day', "czas")
  `

  /*
    Najpierw kasujemy sumy z przeliczanego okresu, potem wpisujemy nowe.

    Samo nadpisywanie nie wystarczy, odkąd skany bywają odliczane. Dzień,
    w którym wszystkie trafienia okazały się crawlerami, nie pojawi się
    w wyniku `GROUP BY` w ogóle — a jego stara, zawyżona suma zostałaby
    w tabeli nietknięta i dalej wchodziłaby do licznika tabliczki.

    Granicą kasowania jest najstarsze surowe zdarzenie, jakie mamy. Sum
    dziennych sprzed retencji nie ruszamy, bo nie ma ich z czego odtworzyć —
    zostają takie, jakie zapisała epoka sprzed filtra botów.
  */
  const najstarsze = await baza.skanQr.aggregate({ _min: { czas: true } })
  const granica = najstarsze._min.czas && najstarsze._min.czas > od ? najstarsze._min.czas : od

  await baza.$transaction([
    baza.skanDzienny.deleteMany({ where: { dzien: { gte: poczatekDnia(granica) } } }),
    baza.skanDzienny.createMany({
      data: dzienne.map((wiersz) => ({
        kodQrId: wiersz.kodQrId,
        dzien: wiersz.dzien,
        liczba: Number(wiersz.liczba),
        ios: Number(wiersz.ios),
        android: Number(wiersz.android),
        desktop: Number(wiersz.desktop),
      })),
    }),
  ])

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
             (SELECT max(z."czas") FROM "SkanQr" z
               WHERE z."kodQrId" = d."kodQrId" AND z."liczone" = true) AS ostatni
      FROM "SkanDzienny" d
      GROUP BY d."kodQrId"
    ) s
    WHERE k.id = s."kodQrId"
      AND (k."liczbaSkanow" IS DISTINCT FROM s.suma OR k."ostatniSkan" IS DISTINCT FROM s.ostatni)
  `

  return { przeliczoneDni: dzienne.length, zaktualizowaneKody: zaktualizowane }
}

/**
 * Przelicza statystyki, ale tylko wtedy, gdy jest co przeliczać.
 *
 * Darmowy plan Vercela pozwala uruchamiać zadania cykliczne raz na dobę —
 * za rzadko, żeby pulpit pokazywał świeże liczby. Zamiast kazać właścicielowi
 * płacić za sam harmonogram, panel sam sprawdza przy wejściu, czy pojawiły się
 * skany nowsze niż ostatnie przeliczenie, i jeśli tak, przelicza je od razu.
 *
 * Sprawdzenie kosztuje dwa zapytania po indeksowanych kolumnach i kończy się,
 * zanim zdąży cokolwiek obciążyć. Pełne przeliczenie uruchamia się wyłącznie
 * po nowych skanach, więc odświeżanie pulpitu w kółko niczego nie liczy
 * drugi raz.
 */
export async function przeliczJesliTrzeba(): Promise<boolean> {
  // Zamiatanie idzie przy każdym wejściu, nie tylko wtedy, gdy jest co
  // przeliczać: skany niepotwierdzone nie zmieniają żadnej sumy, więc bez
  // tego czekałyby na nazwisko do nocnego zadania i rozbicie na powody
  // w panelu byłoby zawsze o dobę do tyłu.
  await zamiecNiepotwierdzone()

  const [najnowszySkan, najnowszyLicznik] = await Promise.all([
    // Tylko policzone — inaczej ruch botów, którego i tak nie sumujemy,
    // kazałby przeliczać wszystko przy każdym wejściu do panelu.
    baza.skanQr.aggregate({ _max: { czas: true }, where: { liczone: true } }),
    baza.kodQr.aggregate({ _max: { ostatniSkan: true } }),
  ])

  const skan = najnowszySkan._max.czas
  if (!skan) return false

  const licznik = najnowszyLicznik._max.ostatniSkan
  if (licznik && licznik >= skan) return false

  await przeliczStatystyki()
  return true
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

/** Północ UTC danego dnia — kolumna `dzien` jest datą, nie chwilą. */
function poczatekDnia(chwila: Date): Date {
  const dzien = new Date(chwila)
  dzien.setUTCHours(0, 0, 0, 0)
  return dzien
}
