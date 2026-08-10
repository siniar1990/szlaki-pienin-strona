import { pobierzTrasy } from '@/lib/dane/zrodlo'
import type { TrasaNaLiscie } from '@/lib/dane/typy'
import type { StanObiektu } from '@/lib/dzis'

import {
  ATRAKCJE_TURYSTYCZNE,
  maTresc,
  znajdzAtrakcjeTurystyczna,
  type AtrakcjaTurystyczna,
} from './atrakcje-turystyczne'
import { trasaZMiejscowosci, type Miejscowosc } from './miejscowosci'

/**
 * Co należy do miejscowości.
 *
 * Osobny moduł od samego rejestru, bo rejestr jest listą faktów, a to jest
 * kilka zapytań do danych — i czyta je zarówno strona miejscowości, jak i lista
 * z licznikami na rozdrożu. Bez tego obie liczyłyby to samo, każda po swojemu,
 * i wcześniej czy później doszłyby do różnych liczb.
 */

/** Trasy zaczynające się w tej miejscowości, od najkrótszej. */
export function trasyMiejscowosci(miejscowosc: Miejscowosc): TrasaNaLiscie[] {
  return pobierzTrasy()
    .filter((trasa) => trasaZMiejscowosci(miejscowosc, trasa.miejscowoscStartu))
    .sort((a, b) => a.dlugoscKm - b.dlugoscKm)
}

/**
 * Atrakcje w tej miejscowości.
 *
 * Bez pozycji bez treści: karta z samą nazwą i pustym miejscem po opisie
 * wygląda jak niedokończona strona, a nie jak uczciwe „nie mamy jeszcze
 * opisu". Te bez treści i tak są widoczne w katalogu atrakcji.
 */
export function atrakcjeMiejscowosci(miejscowosc: Miejscowosc): AtrakcjaTurystyczna[] {
  return ATRAKCJE_TURYSTYCZNE.filter(
    (atrakcja) => miejscowosc.lokalizacje.includes(atrakcja.lokalizacja) && maTresc(atrakcja),
  ).sort((a, b) => Number(b.wyrozniona ?? false) - Number(a.wyrozniona ?? false))
}

/**
 * Obiekty z godzinami otwarcia leżące w tej miejscowości.
 *
 * Przynależność bierzemy z katalogu atrakcji po slugu, a nie z napisu
 * `miejscowosc` przy obiekcie sezonowym. Ten napis jest podpisem dla
 * czytelnika („Słowacja”, „Szlachtowa”), a nie kluczem — dopasowywanie po nim
 * działałoby do pierwszej zmiany w tekście.
 */
export function czynneWMiejscowosci(
  miejscowosc: Miejscowosc,
  obiekty: StanObiektu[],
): StanObiektu[] {
  return obiekty.filter((stan) => {
    const atrakcja = znajdzAtrakcjeTurystyczna(stan.obiekt.slug)
    return atrakcja ? miejscowosc.lokalizacje.includes(atrakcja.lokalizacja) : false
  })
}

/**
 * Czy notka dotyczy tej miejscowości.
 *
 * Szukamy nazwy w tytule i lidzie, bo tam trafia to, o czym notka naprawdę
 * jest. Przeszukiwanie całej treści dawałoby trafienia na wzmiankach w rodzaju
 * „droga z Krościenka”, przez które przy każdej miejscowości wisiałaby ta sama
 * lista wiadomości.
 *
 * Rdzeń nazwy zamiast całej, bo polski odmienia: „w Szczawnicy”, „do
 * Krościenka”, „pod Niedzicą”. Ucięcie końcówki jest przybliżeniem, ale
 * przybliżeniem w dobrą stronę — pominięta notka jest gorsza niż jedna za dużo.
 */
export function notkaOMiejscowosci(
  miejscowosc: Miejscowosc,
  notka: { tytul: string; lid: string },
): boolean {
  const tekst = `${notka.tytul} ${notka.lid}`.toLowerCase()
  const nazwy = [miejscowosc.nazwa, ...(miejscowosc.obejmuje ?? [])]

  return nazwy.some((nazwa) => {
    const rdzen = nazwa.toLowerCase().split(' ')[0].slice(0, -1)
    return rdzen.length >= 4 && tekst.includes(rdzen)
  })
}
