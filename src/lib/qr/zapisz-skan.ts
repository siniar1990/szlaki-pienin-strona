import type { TypUrzadzenia } from '@prisma/client'

import { baza } from '@/lib/baza'

/**
 * Zapis pojedynczego skanu.
 *
 * Wołany wyłącznie z `after()` — czyli po tym, jak odpowiedź poszła już do
 * przeglądarki. Turysta dostaje przekierowanie, nie czekając na rundę do bazy.
 * Gdyby zapis był przed odpowiedzią, każdy skan kosztowałby dodatkowe
 * kilkadziesiąt milisekund, a przy zimnym starcie funkcji znacznie więcej.
 *
 * Błąd zapisu nie może mieć żadnych skutków dla użytkownika — odpowiedź już
 * poleciała. Łapiemy go i zostawiamy w dzienniku; utrata jednego zdarzenia
 * analitycznego jest bez porównania mniej dotkliwa niż wyjątek w tle.
 *
 * **Każdy skan zapisujemy — także botów.** Nie kasujemy ruchu, tylko go
 * oznaczamy. Surowy zapis jest jedynym sposobem, żeby sprawdzić, czy reguła
 * odsiewająca crawlery nie odsiewa przy okazji ludzi.
 */

export type DaneSkanu = {
  kodQrId: string
  urzadzenie: TypUrzadzenia
  przegladarka: string | null
  jezyk: string | null
  kraj: string | null
  miasto: string | null
  zrodlo: string | null
  przekierowanoDoSklepu: boolean
  wariant: string | null
  userAgent: string | null
  asn: number | null
  klasyfikacja: 'BOT' | 'NIEPEWNY'
  powodBota: string | null
  tokenTrafienia: string | null
}

export async function zapiszSkan(dane: DaneSkanu): Promise<void> {
  try {
    await baza.skanQr.create({
      data: {
        ...dane,
        /*
          `liczone` zostaje fałszem przy każdym zapisie, także dla ruchu, który
          nie wpadł w żadną regułę. Zgoda na policzenie przychodzi wyłącznie
          z przeglądarki, która wykonała JavaScript — patrz `potwierdzTrafienie`.
          Odwrotnie (licz, chyba że reguła zaprotestuje) byłoby wygodniej
          i dokładnie tak powstały te 22 „skany" z centrów danych Meta.
        */
        liczone: false,
      },
    })
  } catch (blad) {
    console.error('[qr] nie udało się zapisać skanu', {
      kod: dane.kodQrId,
      blad: blad instanceof Error ? blad.message : String(blad),
    })
  }
}

/**
 * Ile sekund po policzonym skanie ten sam telefon liczymy jako powtórzenie.
 *
 * Plan filtra mówił o godzinie i o parze (adres IP, User-Agent). Adresu nie
 * zapisujemy, więc odciskiem jest tu para (User-Agent, miejscowość) — a to
 * znacznie grubsze sito: pod Trzema Koronami w sierpniu dwóch turystów z tym
 * samym modelem iPhone'a w tej samej miejscowości to nie hipoteza, tylko
 * kwadrans. Godzinne okno sklejałoby ich w jeden skan i zaniżało to, co ten
 * portal ma mierzyć.
 *
 * Półtorej minuty łapie to, o co naprawdę chodzi — odświeżanie strony przez
 * jedną osobę — i prawie nie ryzykuje sklejenia dwóch różnych ludzi.
 */
export const OKNO_DUPLIKATU_SEKUND = 90

/** Ile razy potwierdzenie czeka na zapis skanu, zanim uzna, że go nie ma. */
const PROB_POTWIERDZENIA = 4
const PRZERWA_MS = 250

export type WynikPotwierdzenia = 'policzony' | 'duplikat' | 'nieznany'

/**
 * Potwierdzenie z przeglądarki: ten skan zrobił człowiek.
 *
 * **Dlaczego to czeka w pętli.** Skan zapisuje się w `after()`, czyli po
 * odesłaniu strony, a potwierdzenie leci z przeglądarki ułamek sekundy
 * później. Zwykle wiersz już jest, ale przy zimnym starcie funkcji bywa
 * odwrotnie — bez kilku podejść gubilibyśmy prawdziwe skany akurat wtedy, gdy
 * baza się budzi. Pętla kręci się po odesłaniu odpowiedzi, więc nikt na nią
 * nie czeka.
 */
export async function potwierdzTrafienie(identyfikator: string): Promise<WynikPotwierdzenia> {
  for (let proba = 0; proba < PROB_POTWIERDZENIA; proba += 1) {
    const skan = await baza.skanQr.findUnique({
      where: { tokenTrafienia: identyfikator },
      select: {
        id: true,
        kodQrId: true,
        czas: true,
        userAgent: true,
        miasto: true,
        liczone: true,
        potwierdzonyJs: true,
      },
    })

    if (!skan) {
      await odczekaj(PRZERWA_MS)
      continue
    }

    // Powtórzone potwierdzenie tego samego wiersza nie robi nic nowego —
    // i to jest cała ochrona przed pompowaniem licznika.
    if (skan.potwierdzonyJs) return skan.liczone ? 'policzony' : 'duplikat'

    const odkad = new Date(skan.czas.getTime() - OKNO_DUPLIKATU_SEKUND * 1000)
    const wczesniejszy = await baza.skanQr.findFirst({
      where: {
        kodQrId: skan.kodQrId,
        liczone: true,
        czas: { gte: odkad, lt: skan.czas },
        userAgent: skan.userAgent,
        miasto: skan.miasto,
      },
      select: { id: true },
    })

    const duplikat = wczesniejszy !== null

    await baza.skanQr.update({
      where: { id: skan.id },
      data: {
        potwierdzonyJs: true,
        // Duplikat to nadal człowiek — po prostu ten sam. Klasyfikacja mówi,
        // kto to był, `liczone` mówi, czy go dodajemy, a `powodBota` mówi,
        // dlaczego nie.
        klasyfikacja: 'CZLOWIEK',
        liczone: !duplikat,
        powodBota: duplikat ? 'duplikat' : null,
      },
    })

    return duplikat ? 'duplikat' : 'policzony'
  }

  return 'nieznany'
}

function odczekaj(ms: number): Promise<void> {
  return new Promise((gotowe) => setTimeout(gotowe, ms))
}

/**
 * Wyciąga z nagłówków to, co wolno zapisać.
 *
 * Kraj i miasto pochodzą z nagłówków dostawcy hostingu — to wartości wyliczone
 * przez niego z adresu IP, a nie sam adres. Samego IP nie zapisujemy nigdzie,
 * w żadnej postaci: ani jawnie, ani jako skrót. Odczytujemy je wyłącznie
 * w pamięci żądania, żeby ustalić numer sieci (patrz `klasyfikacja.ts`).
 * Dzięki temu zbiór nie zawiera danych osobowych i portal nie potrzebuje zgody
 * na pomiar.
 *
 * Język bierzemy tylko jako kod podstawowy („pl" z „pl-PL,pl;q=0.9") — pełny
 * nagłówek `Accept-Language` bywa na tyle nietypowy, że staje się elementem
 * odcisku przeglądarki.
 */
export function daneZNaglowkow(naglowki: Headers): {
  jezyk: string | null
  kraj: string | null
  miasto: string | null
  zrodlo: string | null
} {
  const jezykSurowy = naglowki.get('accept-language')
  const jezyk = jezykSurowy?.split(',')[0]?.split('-')[0]?.slice(0, 8) ?? null

  const miastoSurowe = naglowki.get('x-vercel-ip-city')

  return {
    jezyk,
    kraj: naglowki.get('x-vercel-ip-country'),
    // Nazwy miast przychodzą zakodowane procentowo („Nowy%20Targ").
    miasto: miastoSurowe ? bezpieczneDekodowanie(miastoSurowe) : null,
    zrodlo: naglowki.get('referer'),
  }
}

function bezpieczneDekodowanie(tekst: string): string {
  try {
    return decodeURIComponent(tekst)
  } catch {
    // Uszkodzone kodowanie nie jest powodem, żeby zgubić całe zdarzenie.
    return tekst
  }
}
