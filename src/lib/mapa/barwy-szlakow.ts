/**
 * Barwy znakowania szlaków — na mapie.
 *
 * Pochodzą wprost z aplikacji (`lib/data/models/trasa.dart`, `KolorSzlaku`)
 * i są jedynym źródłem prawdy dla warstw MapLibre. Ta sama barwa ma być na
 * mapie w telefonie, na mapie na stronie i na znaku na drzewie — turysta
 * porównuje je wzrokiem na rozdrożu i rozjazd o pół tonu jest tu błędem,
 * nie niuansem.
 *
 * **Dlaczego to nie jest `KOLORY_SZLAKOW` z `format.ts`.** Tamte barwy służą
 * pastylkom w tekście („szlak żółty") i są przyciemnione, bo napis w kolorze
 * `#FFDD00` na bieli jest nieczytelny i nie przechodzi WCAG. Na mapie jest
 * odwrotnie: żółty ma być żółty jak farba na buku, a o czytelność dba biała
 * obwódka pod linią. Dwie palety, dwa różne zadania — i to jest powód, dla
 * którego nie należy ich scalać.
 */

/** Nazwy barw tak, jak zapisują je dane aplikacji. */
export const NAZWY_BARW = ['zolty', 'niebieski', 'czerwony', 'zielony', 'czarny'] as const

export type NazwaBarwy = (typeof NAZWY_BARW)[number]

export const BARWY_SZLAKOW: Record<NazwaBarwy, string> = {
  zolty: '#FFDD00',
  niebieski: '#1565C0',
  czerwony: '#D32F2F',
  zielony: '#2E7D32',
  czarny: '#212121',
}

/**
 * Barwa odcinka bez znakowania — asfalt, droga leśna, deptak nad Grajcarkiem.
 *
 * To nie jest brak danych, tylko informacja: nie ma czego wypatrywać na
 * drzewach. Malowanie takiego odcinka na kolor byłoby wymyślaniem znaków,
 * których w terenie nie ma. Średnio 14% długości tras, a `R2` (Velo Czorsztyn)
 * ma tak całą trasę, bo to przejazd asfaltem.
 */
export const KOLOR_BEZ_ZNAKOWANIA = '#8A949B'

/**
 * Ciemny obrys pod wstęgą trasy.
 *
 * Nie biały — i to jest wynik prób w terenie, nie gust. Pod żółtą, i tak już
 * jasną wstęgą biała obwódka nie dawała żadnego kontrastu i trasa znikała na
 * jasnej mapie. Ciemny działa pod każdą z pięciu barw naraz, na zdjęciu
 * satelitarnym i w cieniu lasu.
 */
export const KOLOR_OBRYSU_WSTEGI = '#14251F'

/** Nieznaną nazwę zamieniamy na szarość „bez znakowania", nigdy nie zgadujemy. */
export function hexBarwy(nazwa: string | null | undefined): string {
  return nazwa && nazwa in BARWY_SZLAKOW ? BARWY_SZLAKOW[nazwa as NazwaBarwy] : KOLOR_BEZ_ZNAKOWANIA
}
