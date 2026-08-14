import { baza } from '../src/lib/baza'
import { przeliczStatystyki } from '../src/lib/qr/agregacja'
import { sklasyfikuj } from '../src/lib/qr/klasyfikacja'

/**
 * Wsteczne oznaczenie botów w zapisanych skanach.
 *
 * Filtr działa od chwili wdrożenia, ale w tabeli leży historia sprzed niego —
 * między innymi 22 trafienia w tabliczkę P009 z 14 sierpnia 2026, które
 * wyglądają jak nagły sukces, a są crawlerami Facebooka pobierającymi podgląd
 * odnośnika kilka minut po opublikowaniu posta.
 *
 *     npx tsx narzedzia/przeklasyfikuj-skany.ts            # sam raport
 *     npx tsx narzedzia/przeklasyfikuj-skany.ts --zapisz   # raport i zapis
 *
 * Trzy zasady, których ten skrypt się trzyma:
 *
 *  1. **Nic nie kasuje.** Zmienia wyłącznie oznaczenia; surowe zdarzenia
 *     zostają, bo bez nich nie da się sprawdzić, czy reguła nie przesadziła.
 *  2. **Zgaduje tylko tam, gdzie właściciel na to pozwolił.** Wiersz bez
 *     User-Agenta zwykle zostaje „niepewny" z powodem `stare_bez_danych`
 *     i nie wchodzi do statystyk. Wyjątkiem są skany z Polski z rozpoznaną
 *     przeglądarką i znanym systemem — patrz `wygladaNaTurystę`. To jest
 *     świadome odstępstwo od zasady „nie zgaduj", podjęte po to, żeby
 *     historia sprzed filtra nie wyparowała; dlatego takie wiersze mają
 *     własny powód `stare_heurystyka` i da się je odróżnić od pewnych.
 *  3. **Można go uruchomić dwa razy.** Werdykt zależy od danych w wierszu,
 *     a nie od tego, co skrypt zrobił poprzednio. Wierszy potwierdzonych
 *     przez przeglądarkę nie dotyka w ogóle — to jedyni pewni ludzie, jakich
 *     mamy.
 */

/**
 * Nawał crawlerów po publikacji na Facebooku.
 *
 * **Uwaga na strefę.** Zgłoszenie mówiło „18:49–18:50" i to są godziny UTC —
 * w bazie te wiersze mają znacznik 18:49, a w panelu, po przeliczeniu na czas
 * miejscowy, widać przy nich 20:49. Pierwsza wersja tego skryptu potraktowała
 * je jako miejscowe, spudłowała o dwie godziny i nie oznaczyła ani jednego
 * wiersza — dlatego godziny stoją tu jawnie w UTC.
 *
 * Zakres pokrywa 16 trafień z 20:49:29 do 20:50:08 czasu miejscowego:
 * Altoona, West Jordan, Eagle Mountain, Social Circle, Boardman, Springfield,
 * Huntsville i Fort Worth — centra danych Meta i AWS-a.
 */
const NAWAL_FACEBOOKA = {
  kod: 'P009',
  od: new Date('2026-08-14T18:49:00Z'),
  do: new Date('2026-08-14T18:51:00Z'),
  powod: 'nawal_fb_20260814',
}

const ZAPISAC = process.argv.includes('--zapisz')

type Werdykt = {
  klasyfikacja: 'BOT' | 'NIEPEWNY' | 'CZLOWIEK'
  powodBota: string | null
  liczone: boolean
}

async function main() {
  const tabliczkaNawalu = await baza.kodQr.findUnique({
    where: { kod: NAWAL_FACEBOOKA.kod },
    select: { id: true },
  })

  /*
    Bierzemy wyłącznie wiersze niepotwierdzone przez przeglądarkę. Skan
    z potwierdzeniem to jedyny przypadek, w którym wiemy na pewno, że po
    drugiej stronie był człowiek — żadna reguła nie ma prawa go przekreślić.
  */
  const skany = await baza.skanQr.findMany({
    where: { potwierdzonyJs: false },
    select: {
      id: true,
      kodQrId: true,
      czas: true,
      userAgent: true,
      jezyk: true,
      kraj: true,
      urzadzenie: true,
      przegladarka: true,
      klasyfikacja: true,
      powodBota: true,
      liczone: true,
    },
    orderBy: { czas: 'asc' },
  })

  const doZmiany = new Map<string, bigint[]>()
  let bezZmian = 0

  for (const skan of skany) {
    const werdykt = oceń(skan, tabliczkaNawalu?.id ?? null)

    const bezRuchu =
      skan.klasyfikacja === werdykt.klasyfikacja &&
      skan.powodBota === werdykt.powodBota &&
      skan.liczone === werdykt.liczone

    if (bezRuchu) {
      bezZmian += 1
      continue
    }

    const klucz = `${werdykt.klasyfikacja}|${werdykt.powodBota ?? '—'}|${werdykt.liczone ? 'liczony' : 'odsiany'}`
    const lista = doZmiany.get(klucz) ?? []
    lista.push(skan.id)
    doZmiany.set(klucz, lista)
  }

  console.log(`\nZdarzeń do przejrzenia: ${skany.length}`)
  console.log(`Bez zmian: ${bezZmian}\n`)

  if (doZmiany.size === 0) {
    console.log('Nie ma czego zmieniać.')
    return
  }

  console.log('Zmiany w rozbiciu na powód:')
  for (const [klucz, lista] of [...doZmiany].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${klucz.padEnd(28)} ${lista.length}`)
  }

  if (!ZAPISAC) {
    console.log('\nTo był tylko raport. Zapis: --zapisz')
    return
  }

  for (const [klucz, lista] of doZmiany) {
    const [klasyfikacja, powod, liczenie] = klucz.split('|')
    await baza.skanQr.updateMany({
      where: { id: { in: lista } },
      data: {
        klasyfikacja: klasyfikacja as 'BOT' | 'NIEPEWNY' | 'CZLOWIEK',
        powodBota: powod === '—' ? null : powod,
        liczone: liczenie === 'liczony',
      },
    })
  }

  /*
    Przeliczenie CAŁEJ historii, nie ostatnich trzech dni.

    Zwykły przebieg agregacji patrzy na trzy doby wstecz — po zmianie
    przeszłości sumy dzienne sprzed tygodnia zostałyby takie, jakie były,
    a licznik tabliczki dalej pokazywałby crawlery Meta. To najczęstszy sposób,
    w jaki taka migracja „przechodzi", nie zmieniając niczego, co widać.
  */
  const wynik = await przeliczStatystyki(true)
  console.log(`\nZapisano. Przeliczono ${wynik.przeliczoneDni} sum dziennych, `
    + `zaktualizowano ${wynik.zaktualizowaneKody} tabliczek.`)
}

function oceń(
  skan: {
    kodQrId: string
    czas: Date
    userAgent: string | null
    jezyk: string | null
    kraj: string | null
    urzadzenie: string
    przegladarka: string | null
  },
  idTabliczkiNawalu: string | null,
): Werdykt {
  const wNawale =
    idTabliczkiNawalu !== null &&
    skan.kodQrId === idTabliczkiNawalu &&
    skan.czas >= NAWAL_FACEBOOKA.od &&
    skan.czas < NAWAL_FACEBOOKA.do

  if (wNawale) {
    return { klasyfikacja: 'BOT', powodBota: NAWAL_FACEBOOKA.powod, liczone: false }
  }

  /*
    Bez User-Agenta nie ma czego oceniać regułami — kolumna powstała razem
    z filtrem, więc cała historia sprzed niego jest pusta. Zostaje jedno
    pytanie: czy ten wiersz wygląda na turystę.
  */
  if (!skan.userAgent) {
    return wygladaNaTuryste(skan)
      ? { klasyfikacja: 'CZLOWIEK', powodBota: 'stare_heurystyka', liczone: true }
      : { klasyfikacja: 'NIEPEWNY', powodBota: 'stare_bez_danych', liczone: false }
  }

  const werdykt = sklasyfikuj({
    metoda: null,
    userAgent: skan.userAgent,
    // Zapisany kod języka („pl") wystarcza za obecność nagłówka.
    jezyki: skan.jezyk,
    cel: null,
    // Adresu nie zapisujemy, więc reguła sieci centrów danych wstecz nie
    // działa — i nie da się tego nadrobić. Zostaje User-Agent.
    ip: null,
  })

  return { klasyfikacja: werdykt.klasyfikacja, powodBota: werdykt.powodBota, liczone: false }
}

/**
 * Czy stary wiersz bez User-Agenta wygląda na turystę.
 *
 * Trzy warunki naraz, bo pojedynczo każdy z nich pęka. Rozpoznany system
 * (iOS, Android, komputer) odsiewa crawlery, które lądowały w worku „inne".
 * Nazwa przeglądarki odsiewa to, co w ogóle się nie przedstawiło. Kraj `PL`
 * odsiewa nawał z Iowa i Utah — bo turysta pod Sokolicą przychodzi z polskiej
 * sieci, a crawler Meta z centrum danych w Stanach.
 *
 * To nadal jest domysł i tak jest oznaczony. Wpadną w niego także własne testy
 * właściciela z 5 sierpnia — trudno je odróżnić od prawdziwych skanów, skoro
 * jedyne, co po nich zostało, to godzina i miasto.
 */
function wygladaNaTuryste(skan: {
  kraj: string | null
  urzadzenie: string
  przegladarka: string | null
}): boolean {
  return skan.kraj === 'PL' && skan.urzadzenie !== 'INNE' && skan.przegladarka !== null
}

void main()
  .catch((blad) => {
    console.error(blad)
    process.exitCode = 1
  })
  .finally(() => baza.$disconnect())
