import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Obszary z zakazem wprowadzania psów — odczyt z danych aplikacji.
 *
 * Nazwy i powody czytamy z pliku, zamiast przepisywać je do kodu. Gdy w
 * aplikacji dojdzie kolejny rezerwat albo zmieni się uzasadnienie, portal
 * powie to samo co telefon bez niczyjej pamięci. Źródło każdej granicy też
 * jest w danych i pokazujemy je na stronie — to OpenStreetMap na licencji
 * ODbL, która wymaga wskazania pochodzenia.
 */

export type ObszarBezPsow = {
  nazwa: string
  powod: string
  zrodlo: string | null
}

const PLIK = path.join(process.cwd(), 'public', 'dane', 'obszary', 'bez_psow.geojson')

export function obszaryBezPsow(): ObszarBezPsow[] {
  const dane = JSON.parse(readFileSync(PLIK, 'utf8')) as {
    features?: { properties?: Record<string, unknown> }[]
  }

  return (dane.features ?? []).map((cecha) => ({
    nazwa: String(cecha.properties?.nazwa ?? 'Obszar chroniony'),
    powod: String(cecha.properties?.powod ?? 'zakaz wprowadzania psów'),
    zrodlo: typeof cecha.properties?.zrodlo === 'string' ? cecha.properties.zrodlo : null,
  }))
}
