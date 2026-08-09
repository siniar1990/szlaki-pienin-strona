import { baza } from '@/lib/baza'

/**
 * Ustawienia redakcji i harmonogram publikacji.
 *
 * **Skąd biorą się godziny.** Właściciel podaje jedną liczbę — ile notek
 * dziennie — a godziny wynikają z niej przez równy podział przedziału od 5:00
 * do 23:00. Przy trzech notkach wypada 5:00, 11:00 i 17:00. Nie zapisujemy
 * tych godzin w bazie, bo byłyby wtedy dwa źródła prawdy: zmiana liczby
 * zostawiłaby stare godziny i po tygodniu nikt by nie wiedział, które
 * obowiązują.
 *
 * **Dlaczego przedział, a nie doba.** Notka opublikowana o trzeciej w nocy
 * przepada — do rana zsunie się w kanałach pod następną, a nikt jej wtedy nie
 * czyta. Piąta rano to godzina, o której zaczyna się ruch w górach; dwudziesta
 * trzecia to ostatni moment, w którym ktoś jeszcze zagląda na telefon.
 */

/** Pierwsza i ostatnia godzina, o której może powstać notka. */
export const PIERWSZA_GODZINA = 5
export const OSTATNIA_GODZINA = 23

export const NAJMNIEJ_NOTEK = 1
export const NAJWIECEJ_NOTEK = 10

export type Ustawienia = {
  notekDziennie: number
  publikowanieAutomatyczne: boolean
}

const DOMYSLNE: Ustawienia = { notekDziennie: 1, publikowanieAutomatyczne: false }

/**
 * Odczyt ustawień.
 *
 * Brak wiersza nie jest błędem, tylko stanem sprzed pierwszego zapisu —
 * zwracamy wtedy wartości domyślne. Redakcja ma działać także wtedy, gdy nikt
 * nigdy nie wszedł w ustawienia.
 */
export async function pobierzUstawienia(): Promise<Ustawienia> {
  try {
    const wiersz = await baza.ustawieniaRedakcji.findUnique({ where: { klucz: 'jedyne' } })
    if (!wiersz) return DOMYSLNE

    return {
      notekDziennie: ograniczLiczbe(wiersz.notekDziennie),
      publikowanieAutomatyczne: wiersz.publikowanieAutomatyczne,
    }
  } catch (blad) {
    console.error('Nie udało się odczytać ustawień redakcji:', blad)
    return DOMYSLNE
  }
}

export function ograniczLiczbe(ile: number): number {
  if (!Number.isFinite(ile)) return DOMYSLNE.notekDziennie
  return Math.min(NAJWIECEJ_NOTEK, Math.max(NAJMNIEJ_NOTEK, Math.round(ile)))
}

/**
 * Godziny publikacji dla zadanej liczby notek.
 *
 * Przedział dzielimy na tyle równych okien, ile ma być notek, i bierzemy
 * początek każdego okna. Przy jednej notce daje to 5:00, przy dwóch 5:00
 * i 14:00, przy trzech 5:00, 11:00 i 17:00.
 *
 * Wynik jest zawsze rosnący i mieści się w przedziale — to jedyne dwie rzeczy,
 * na których polega redakcja przy sprawdzaniu, czy pora już minęła.
 */
export function godzinyPublikacji(notekDziennie: number): number[] {
  const ile = ograniczLiczbe(notekDziennie)
  const szerokosc = (OSTATNIA_GODZINA - PIERWSZA_GODZINA) / ile

  return Array.from({ length: ile }, (_, numer) =>
    Math.round(PIERWSZA_GODZINA + szerokosc * numer),
  )
}

/**
 * Ile notek powinno już dziś istnieć o podanej godzinie.
 *
 * Redakcja porównuje tę liczbę z tym, ile faktycznie powstało, i pisze
 * najwyżej jedną na wywołanie. Dzięki temu przerwa w działaniu harmonogramu
 * nadrabia się sama przy kolejnych przebiegach, zamiast zostawiać dziurę
 * w dniu — ale nadrabia po jednej, a nie pięć naraz w jednym wywołaniu
 * funkcji, na co i tak nie starczyłoby czasu.
 */
export function ileNotekDoTejPory(notekDziennie: number, godzinaTeraz: number): number {
  return godzinyPublikacji(notekDziennie).filter((godzina) => godzina <= godzinaTeraz).length
}

/**
 * Rozbicie chwili na części w strefie warszawskiej.
 *
 * Wszystko w tym module liczy się w czasie, o którym myśli właściciel
 * i czytelnik — a serwer stoi w strefie uniwersalnej. Zamiast zaszywać
 * przesunięcie na sztywno (co psuje się dwa razy w roku przy zmianie czasu)
 * pytamy o nie mechanizm formatowania dat.
 */
function czesciWPolsce(teraz: Date) {
  const czesci = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Warsaw',
  }).formatToParts(teraz)

  const liczba = (typ: string) => Number(czesci.find((czesc) => czesc.type === typ)?.value ?? 0)
  return { godzina: liczba('hour'), minuta: liczba('minute'), sekunda: liczba('second') }
}

/** Bieżąca godzina w strefie warszawskiej. */
export function godzinaWPolsce(teraz = new Date()): number {
  return czesciWPolsce(teraz).godzina
}

/**
 * Początek dzisiejszego dnia w strefie warszawskiej.
 *
 * Liczony przez odjęcie tego, ile lokalnego czasu już dziś minęło — dzięki
 * temu działa tak samo w czasie letnim i zimowym, bez ani jednej stałej.
 */
export function poczatekDnia(teraz = new Date()): Date {
  const { godzina, minuta, sekunda } = czesciWPolsce(teraz)
  const odPolnocyMs = ((godzina * 60 + minuta) * 60 + sekunda) * 1000

  return new Date(teraz.getTime() - odPolnocyMs - teraz.getMilliseconds())
}
