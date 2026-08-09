import { baza } from '@/lib/baza'

import { odczytajZrodlo } from './kanal'
import { BladPobierania } from './siec'

/**
 * Obchód źródeł.
 *
 * Chodzi po wszystkich włączonych źródłach i zapisuje artykuły, których
 * jeszcze nie widzieliśmy. Nic nie ocenia i nic nie publikuje — to zadanie
 * redakcji. Obchód ma być nudny i odporny: awaria jednego serwisu nie może
 * zatrzymać pozostałych dwudziestu.
 *
 * **Dlaczego nie równolegle.** Kuszące, ale dwadzieścia jednoczesnych żądań
 * z jednego adresu to wzorzec, który część serwisów odczyta jako atak.
 * Sekwencyjnie całość mieści się w czasie funkcji, a dla właścicieli
 * odwiedzanych stron jesteśmy jednym powolnym gościem zamiast nagłego ruchu.
 */

/**
 * Ile dni wstecz przyjmujemy artykuł przy pierwszym poznaniu źródła.
 *
 * Bez tego pierwszy obchód świeżo dodanego serwisu wciągnąłby całe archiwum
 * z kanału i redakcja wybierałaby nazajutrz spośród wiadomości sprzed roku.
 * Wpisy bez daty przechodzą — brak daty w kanale jest częsty i nie znaczy,
 * że artykuł jest stary.
 */
const NAJSTARSZY_ARTYKUL_DNI = 30

export type WynikObchodu = {
  zrodla: number
  nowe: number
  bledy: { zrodlo: string; powod: string }[]
  czasMs: number
}

export async function obejdzZrodla(): Promise<WynikObchodu> {
  const start = Date.now()
  const zrodla = await baza.zrodloWiadomosci.findMany({
    where: { aktywne: true },
    orderBy: { nazwa: 'asc' },
  })

  const granica = new Date(Date.now() - NAJSTARSZY_ARTYKUL_DNI * 24 * 60 * 60 * 1000)
  const bledy: WynikObchodu['bledy'] = []
  let nowe = 0

  for (const zrodlo of zrodla) {
    try {
      const odczyt = await odczytajZrodlo(zrodlo.adres, zrodlo.adresKanalu)

      for (const wpis of odczyt.wpisy) {
        if (wpis.opublikowano && wpis.opublikowano < granica) continue

        /*
          `createMany` z pominięciem duplikatów zamiast sprawdzania „czy już
          jest": adres ma warunek unikalności, więc baza i tak by nas
          poprawiła, a tak robimy to jednym zapytaniem zamiast dwoma na wpis.
        */
        const wynik = await baza.znalezionyArtykul.createMany({
          data: [
            {
              zrodloId: zrodlo.id,
              adres: wpis.adres,
              tytul: wpis.tytul.slice(0, 300),
              opis: wpis.opis,
              opublikowano: wpis.opublikowano,
            },
          ],
          skipDuplicates: true,
        })
        nowe += wynik.count
      }

      await baza.zrodloWiadomosci.update({
        where: { id: zrodlo.id },
        data: {
          ostatniObchod: new Date(),
          ostatniBlad: null,
          // Zapamiętujemy kanał dopiero po udanym odczycie — zapisany na
          // zapas prowadziłby obchód pod adres, który nic nie zwraca.
          adresKanalu: odczyt.adresKanalu,
        },
      })
    } catch (blad) {
      const powod =
        blad instanceof BladPobierania
          ? blad.message
          : blad instanceof Error
            ? blad.message.slice(0, 200)
            : 'Nieznany błąd'

      bledy.push({ zrodlo: zrodlo.nazwa, powod })

      /*
        Błąd zapisujemy przy źródle, ale `ostatniObchod` też uaktualniamy.
        Inaczej panel pokazywałby „nigdy nie obchodzone" przy źródle, po
        którym chodzimy co dwanaście godzin i za każdym razem dostajemy 403 —
        a to dwie różne sytuacje i trzeba je od siebie odróżnić.
      */
      await baza.zrodloWiadomosci.update({
        where: { id: zrodlo.id },
        data: { ostatniObchod: new Date(), ostatniBlad: powod },
      })
    }
  }

  return { zrodla: zrodla.length, nowe, bledy, czasMs: Date.now() - start }
}
