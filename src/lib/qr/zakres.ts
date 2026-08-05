/**
 * Zakres czasu, za jaki panel pokazuje liczby.
 *
 * Zakres jest zapisany w adresie (`?zakres=90`), a nie w stanie komponentu ani
 * w ciasteczku. To celowe: dzięki temu widok „ostatni rok na mapie" da się
 * wysłać komuś odnośnikiem, a wejście wstecz wraca do poprzedniego zakresu
 * zamiast go gubić.
 *
 * **Skąd biorą się liczby przy dłuższych zakresach.** Surowe zdarzenia
 * czyścimy po 90 dniach, więc gdyby zapytania sięgały do nich, „rok" byłby
 * cichym kłamstwem — pokazywałby kwartał. Wszystkie zapytania zakresowe czytają
 * dlatego z sum dziennych, które trzymamy bezterminowo. Jedynym wyjątkiem jest
 * kafelek „dzisiaj", liczony wprost ze zdarzeń, bo ma być bieżący co do minuty.
 */

export type Zakres = {
  /** Wartość w adresie. */
  klucz: string
  /** Ile dni wstecz; `null` znaczy „od początku". */
  dni: number | null
  etykieta: string
  /** Dopełnienie zdania „Skany …". */
  opis: string
}

export const ZAKRESY: readonly Zakres[] = [
  { klucz: '7', dni: 7, etykieta: '7 dni', opis: 'w ostatnich 7 dniach' },
  { klucz: '30', dni: 30, etykieta: '30 dni', opis: 'w ostatnich 30 dniach' },
  { klucz: '90', dni: 90, etykieta: '90 dni', opis: 'w ostatnich 90 dniach' },
  { klucz: '365', dni: 365, etykieta: 'rok', opis: 'w ostatnim roku' },
  { klucz: 'wszystko', dni: null, etykieta: 'od początku', opis: 'od początku' },
]

export const ZAKRES_DOMYSLNY = ZAKRESY[1]

/**
 * Zakres z parametru adresu. Nieznana wartość nie jest błędem — ktoś mógł
 * zapisać stary odnośnik albo poprawić adres ręcznie. Wtedy po prostu wracamy
 * do domyślnych trzydziestu dni.
 */
export function odczytajZakres(wartosc: string | string[] | undefined): Zakres {
  const klucz = Array.isArray(wartosc) ? wartosc[0] : wartosc
  return ZAKRESY.find((z) => z.klucz === klucz) ?? ZAKRES_DOMYSLNY
}

/**
 * Pierwszy dzień zakresu — północ czasu UTC.
 *
 * Doba liczona w UTC, bo kolumna `dzien` w sumach dziennych jest datą bez
 * strefy i powstaje z tego samego przeliczenia. Mieszanie stref dałoby dzień
 * przesunięcia na granicy zakresu, czyli błąd widoczny dopiero wtedy, gdy ktoś
 * zacznie porównywać liczby z dwóch ekranów.
 */
export function poczatekZakresu(dni: number): Date {
  const od = new Date()
  od.setUTCHours(0, 0, 0, 0)
  od.setUTCDate(od.getUTCDate() - (dni - 1))
  return od
}
