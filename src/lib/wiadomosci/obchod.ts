import { baza } from '@/lib/baza'

import { odczytajZrodlo } from './kanal'
import { ocenNieocenione, type WynikOceniania } from './ocenianie'
import { BladPobierania } from './siec'

/**
 * Obchód źródeł.
 *
 * Chodzi po włączonych źródłach i zapisuje artykuły, których jeszcze nie
 * widzieliśmy. Nic nie ocenia i nic nie publikuje — to zadanie redakcji.
 * Obchód ma być nudny i odporny: awaria jednego serwisu nie może zatrzymać
 * pozostałych dwudziestu.
 *
 * **Dlaczego po kilka źródeł naraz, a nie wszystkie i nie jedno po drugim.**
 * Pierwsza wersja chodziła sekwencyjnie i cały przebieg zajmował około stu
 * sekund. To działa na komputerze, ale funkcja bezserwerowa ma limit czasu
 * wykonania zależny od planu hostingu — i sto sekund jest niebezpiecznie
 * blisko granicy, na której obchód zaczyna być ucinany w połowie, zawsze na
 * tych samych ostatnich alfabetycznie źródłach. Z drugiej strony puszczenie
 * wszystkich dwudziestu trzech naraz to nagły ruch, który część serwisów
 * odczyta jako atak.
 *
 * Wyjściem jest kilka **różnych** serwisów jednocześnie. Każdy gospodarz
 * dostaje w danej chwili najwyżej jedno nasze żądanie — dokładnie tak jak
 * przy chodzeniu po kolei — a całość mieści się w kilkunastu sekundach
 * zamiast w stu.
 *
 * **Dlaczego kolejność według ostatniego obchodu.** Gdyby mimo wszystko
 * zabrakło czasu, ucięte zostaną te źródła, które odwiedzaliśmy najświeżej,
 * a nie te same co zawsze. Przy alfabetycznej kolejności serwis na „w" mógłby
 * nie zostać odczytany ani razu i nikt by tego nie zauważył.
 */

/**
 * Ile dni wstecz przyjmujemy artykuł.
 *
 * Bez tego pierwszy obchód świeżo dodanego serwisu wciągnąłby całe archiwum
 * z kanału i redakcja wybierałaby nazajutrz spośród wiadomości sprzed roku.
 * Wpisy bez daty przechodzą — brak daty w kanale jest częsty i nie znaczy,
 * że artykuł jest stary.
 */
const NAJSTARSZY_ARTYKUL_DNI = 30

/** Ile różnych serwisów odwiedzamy jednocześnie. */
const NARAZ = 4

/**
 * Po tylu milisekundach przerywamy obchód i zostawiamy resztę na następny raz.
 *
 * Czterdzieści pięć sekund mieści się z zapasem nawet w najciaśniejszym
 * limicie, jaki hosting może narzucić, a przy czterech źródłach naraz starcza
 * na dwa razy więcej serwisów, niż mamy. Ogranicznik jest więc siatką
 * bezpieczeństwa, a nie mechanizmem, o który zahaczamy w normalnej pracy.
 */
const BUDZET_MS = 30_000

/**
 * Ile czasu zostaje na ocenianie znalezisk po zakończeniu obchodu.
 *
 * Sam obchód mieści się w kilkunastu sekundach, więc reszta deklarowanego
 * limitu funkcji stoi bezczynnie. Ocenianie wchodzi w to miejsce i kończy na
 * granicy paczki — zaległość rozkłada się wtedy na kilka przebiegów zamiast
 * ryzykować ucięcie funkcji dla czegoś, co nie jest pilne.
 */
const BUDZET_OCENIANIA_MS = 22_000

export type WynikObchodu = {
  zrodla: number
  /** Ile źródeł faktycznie zdążyliśmy odwiedzić. */
  odwiedzone: number
  nowe: number
  /** Ile artykułów wypadło z puli, bo się zestarzały. */
  zdezaktualizowane: number
  bledy: { zrodlo: string; powod: string }[]
  /** Czy zabrakło czasu — wtedy reszta czeka na następny przebieg. */
  przerwane: boolean
  ocenianie: WynikOceniania
  czasMs: number
}

/**
 * Wypycha z puli artykuły, które się zestarzały.
 *
 * Redakcja ogląda przy wyborze czterdzieści najnowszych znalezisk. Wszystko
 * starsze nie ma szans zostać wybrane nigdy — a mimo to leży w wykazie
 * i puchnie: przy dwudziestu nowych artykułach dziennie po roku byłoby ich
 * kilka tysięcy, wykaz stałby się nieczytelny, a jego pierwsza strona
 * przestałaby cokolwiek znaczyć.
 *
 * Granica jest ta sama, co przy przyjmowaniu. Skoro nie wciągamy artykułów
 * starszych niż trzydzieści dni, to nie ma powodu trzymać w puli tych, które
 * przez trzydzieści dni nie zostały wybrane. Wiadomość sprzed miesiąca nie
 * jest już wiadomością.
 *
 * Nie kasujemy ich — zmieniają stan na odrzucone z czytelnym powodem. Dzięki
 * temu ich adresy zostają w bazie i obchód nie przyniesie ich ponownie przy
 * następnym przejściu po tym samym kanale.
 */
async function odlozZestarzale(granica: Date): Promise<number> {
  const [zData, bezDaty] = await Promise.all([
    baza.znalezionyArtykul.updateMany({
      where: { stan: 'NOWY', opublikowano: { not: null, lt: granica } },
      data: { stan: 'ODRZUCONE', uzasadnienie: 'Zdezaktualizowane — starsze niż 30 dni' },
    }),
    // Bez daty publikacji liczymy od dnia, w którym artykuł znaleźliśmy.
    baza.znalezionyArtykul.updateMany({
      where: { stan: 'NOWY', opublikowano: null, znaleziono: { lt: granica } },
      data: { stan: 'ODRZUCONE', uzasadnienie: 'Zdezaktualizowane — leży w puli ponad 30 dni' },
    }),
  ])

  return zData.count + bezDaty.count
}

type Zrodlo = { id: string; nazwa: string; adres: string; adresKanalu: string | null }

export async function obejdzZrodla(): Promise<WynikObchodu> {
  const start = Date.now()

  const zrodla = await baza.zrodloWiadomosci.findMany({
    where: { aktywne: true },
    // Najdawniej odwiedzone idą pierwsze; nigdy nieodwiedzone przed nimi.
    orderBy: [{ ostatniObchod: { sort: 'asc', nulls: 'first' } }],
    select: { id: true, nazwa: true, adres: true, adresKanalu: true },
  })

  const granica = new Date(Date.now() - NAJSTARSZY_ARTYKUL_DNI * 24 * 60 * 60 * 1000)
  const bledy: WynikObchodu['bledy'] = []
  let nowe = 0
  let odwiedzone = 0
  let przerwane = false

  for (let i = 0; i < zrodla.length; i += NARAZ) {
    if (Date.now() - start > BUDZET_MS) {
      przerwane = true
      break
    }

    const paczka = zrodla.slice(i, i + NARAZ)
    const wyniki = await Promise.all(paczka.map((zrodlo) => odwiedz(zrodlo, granica)))

    for (const wynik of wyniki) {
      odwiedzone += 1
      nowe += wynik.nowe
      if (wynik.blad) bledy.push(wynik.blad)
    }
  }

  // Sprzątanie po zebraniu, nie przed: artykuł przyniesiony przed chwilą
  // z datą sprzed miesiąca ma wypaść w tym samym przebiegu, a nie leżeć
  // w wykazie do jutra.
  const zdezaktualizowane = await odlozZestarzale(granica)

  /*
    Ocenianie na końcu, na resztkach budżetu. Jest dodatkiem: gdyby się nie
    udało, obchód i tak przyniósł artykuły, a wykaz i tak je pokaże — tyle że
    bez liczby obok.
  */
  const ocenianie = await ocenNieocenione(BUDZET_OCENIANIA_MS)

  return {
    zrodla: zrodla.length,
    odwiedzone,
    nowe,
    zdezaktualizowane,
    bledy,
    przerwane,
    ocenianie,
    czasMs: Date.now() - start,
  }
}

async function odwiedz(
  zrodlo: Zrodlo,
  granica: Date,
): Promise<{ nowe: number; blad?: { zrodlo: string; powod: string } }> {
  try {
    const odczyt = await odczytajZrodlo(zrodlo.adres, zrodlo.adresKanalu)

    const doZapisu = odczyt.wpisy
      .filter((wpis) => !wpis.opublikowano || wpis.opublikowano >= granica)
      .map((wpis) => ({
        zrodloId: zrodlo.id,
        adres: wpis.adres,
        tytul: wpis.tytul.slice(0, 300),
        opis: wpis.opis,
        opublikowano: wpis.opublikowano,
      }))

    /*
      Jeden zapis na całe źródło zamiast jednego na artykuł. Adres ma warunek
      unikalności, więc powtórki odsiewa baza — poprzednia wersja robiła
      czterdzieści osobnych zapytań na serwis i to ona, a nie sieć, była
      drugim co do wielkości kosztem obchodu.
    */
    const wynik =
      doZapisu.length > 0
        ? await baza.znalezionyArtykul.createMany({ data: doZapisu, skipDuplicates: true })
        : { count: 0 }

    await baza.zrodloWiadomosci.update({
      where: { id: zrodlo.id },
      data: {
        ostatniObchod: new Date(),
        ostatniBlad: null,
        // Kanał zapamiętujemy dopiero po udanym odczycie — zapisany na zapas
        // prowadziłby obchód pod adres, który nic nie zwraca.
        adresKanalu: odczyt.adresKanalu,
      },
    })

    return { nowe: wynik.count }
  } catch (blad) {
    const powod =
      blad instanceof BladPobierania
        ? blad.message
        : blad instanceof Error
          ? blad.message.slice(0, 200)
          : 'Nieznany błąd'

    /*
      Błąd zapisujemy przy źródle, ale `ostatniObchod` też uaktualniamy.
      Inaczej panel pokazywałby „nigdy nie obchodzone" przy źródle, po którym
      chodzimy co dwanaście godzin i za każdym razem dostajemy 403 — a to dwie
      różne sytuacje i trzeba je od siebie odróżnić.
    */
    await baza.zrodloWiadomosci.update({
      where: { id: zrodlo.id },
      data: { ostatniObchod: new Date(), ostatniBlad: powod },
    })

    return { nowe: 0, blad: { zrodlo: zrodlo.nazwa, powod } }
  }
}
