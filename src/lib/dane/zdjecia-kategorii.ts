import { existsSync } from 'node:fs'
import path from 'node:path'

import type { DefinicjaKategorii } from './kategorie'

/**
 * Zdjęcia kafelków kategorii.
 *
 * Docelowo każda kategoria ma mieć prawdziwą fotografię. Dopóki jej nie ma,
 * kafelek pokazuje malowaną ilustrację trasy z aplikacji — brzydka dziura po
 * obrazku byłaby gorsza niż rysunek.
 *
 * Podmiana nie wymaga zmiany w kodzie: wystarczy wrzucić plik o nazwie
 * zgodnej ze slugiem kategorii do `public/marka/kategorie/` i przebudować
 * stronę. Sprawdzenie dzieje się przy budowaniu, więc do przeglądarki trafia
 * już gotowy adres — żadnego zgadywania po stronie klienta.
 *
 * Obsługiwane rozszerzenia w kolejności pierwszeństwa: WebP (najlżejszy),
 * potem JPG. Zdjęcia ze stocku przychodzą zwykle jako JPG i to w porządku,
 * ale gdy kiedyś przepuścisz je przez konwersję, WebP wygra automatycznie.
 */

const KATALOG = path.join(process.cwd(), 'public', 'marka', 'kategorie')
const ROZSZERZENIA = ['webp', 'jpg', 'jpeg', 'png'] as const

/** Zwraca adres zdjęcia kategorii albo null, gdy jeszcze go nie wgrano. */
export function zdjecieKategorii(slug: string): string | null {
  for (const rozszerzenie of ROZSZERZENIA) {
    if (existsSync(path.join(KATALOG, `${slug}.${rozszerzenie}`))) {
      return `/marka/kategorie/${slug}.${rozszerzenie}`
    }
  }
  return null
}

/** Zdjęcie, a gdy go nie ma — ilustracja zapasowa z aplikacji. */
export function obrazekKategorii(kategoria: DefinicjaKategorii): string | null {
  return zdjecieKategorii(kategoria.slug) ?? kategoria.ilustracja ?? null
}

/**
 * Czy kafelek pokazuje prawdziwe zdjęcie.
 *
 * Przydaje się do doboru gradientu: nad fotografią potrzeba mocniejszego
 * przyciemnienia niż nad rysunkiem, bo zdjęcia bywają jasne w dolnej części
 * kadru i biały napis się na nich gubi.
 */
export function maZdjecie(kategoria: DefinicjaKategorii): boolean {
  return zdjecieKategorii(kategoria.slug) !== null
}
