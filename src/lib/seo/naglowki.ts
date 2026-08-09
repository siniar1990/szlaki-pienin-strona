/**
 * Wspólne nagłówki kanałów XML.
 *
 * **Dlaczego krótka pamięć podręczna, a nie brak.** Mapy witryny i RSS są
 * odpytywane przez roboty, a nie przez ludzi, więc nie ma powodu, żeby każde
 * takie żądanie sięgało do bazy. Dziesięć minut to kompromis: publikacja
 * i tak unieważnia wpis natychmiast przez `revalidateTag`, a ten czas chroni
 * bazę przed robotem pytającym co sekundę.
 */
export const NAGLOWKI_XML = {
  'content-type': 'application/xml; charset=utf-8',
  'cache-control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400',
} as const
