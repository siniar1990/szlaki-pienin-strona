import { existsSync } from 'node:fs'
import path from 'node:path'

import { zdjecieAtrakcji } from './zdjecia-atrakcji'

/**
 * Zdjęcia nagłówkowe miejscowości.
 *
 * Ta sama zasada co przy atrakcjach: wrzucasz plik o nazwie równej slugowi
 * miejscowości do `public/marka/miejscowosci/` i pojawia się przy najbliższym
 * budowaniu. Bez zmiany kodu, bez wpisu w żadnym rejestrze.
 *
 * **Do czasu, aż będą własne zdjęcia**, nagłówek bierze zdjęcie najbardziej
 * rozpoznawalnej atrakcji danej miejscowości — wskazane w `zdjecieZastepcze`.
 * Wgranie własnego pliku wygrywa z zastępczym bez żadnej dodatkowej czynności,
 * bo szukamy najpierw w katalogu miejscowości.
 */

const KATALOG = path.join(process.cwd(), 'public', 'marka', 'miejscowosci')
const ROZSZERZENIA = ['webp', 'jpg', 'jpeg', 'png'] as const

export function zdjecieMiejscowosci(slug: string, zastepcze: string): string | null {
  for (const rozszerzenie of ROZSZERZENIA) {
    if (existsSync(path.join(KATALOG, `${slug}.${rozszerzenie}`))) {
      return `/marka/miejscowosci/${slug}.${rozszerzenie}`
    }
  }
  return zdjecieAtrakcji(zastepcze)
}

/** Czy miejscowość ma już własne zdjęcie, czy pożycza je od atrakcji. */
export function maWlasneZdjecie(slug: string): boolean {
  return ROZSZERZENIA.some((rozszerzenie) =>
    existsSync(path.join(KATALOG, `${slug}.${rozszerzenie}`)),
  )
}
