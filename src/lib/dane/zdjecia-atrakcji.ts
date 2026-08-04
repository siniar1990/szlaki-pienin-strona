import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Zdjęcia atrakcji.
 *
 * Ta sama zasada co przy kategoriach: wrzucasz plik o nazwie równej slugowi
 * atrakcji do `public/marka/atrakcje/` i przy najbliższym budowaniu pojawia
 * się na kafelku. Bez pliku kafelek dostaje spokojne pole w barwach marki —
 * nie szary prostokąt z ikoną „brak obrazka".
 */

const KATALOG = path.join(process.cwd(), 'public', 'marka', 'atrakcje')
const ROZSZERZENIA = ['webp', 'jpg', 'jpeg', 'png'] as const

/**
 * Zdjęcia, które już mamy — z zasobów aplikacji, więc bez licencji do
 * kupowania. Klucz to slug atrakcji, wartość to adres w katalogu publicznym.
 */
const ZDJECIA_Z_APLIKACJI: Record<string, string> = {
  'przystan-flisacka-szczawnica': '/dane/zdjecia/dp_przystan.jpg',
}

export function zdjecieAtrakcji(slug: string): string | null {
  for (const rozszerzenie of ROZSZERZENIA) {
    if (existsSync(path.join(KATALOG, `${slug}.${rozszerzenie}`))) {
      return `/marka/atrakcje/${slug}.${rozszerzenie}`
    }
  }
  return ZDJECIA_Z_APLIKACJI[slug] ?? null
}
