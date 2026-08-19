import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Zdjęcia główne tras.
 *
 * Ta sama zasada co przy kategoriach i atrakcjach: plik o nazwie równej
 * **identyfikatorowi trasy** w `public/marka/trasy/` wygrywa z malowaną
 * ilustracją z aplikacji. Bez pliku zostaje ilustracja — a gdy i jej nie ma,
 * kafelek pokazuje pole w barwach marki.
 *
 * **Dlaczego identyfikator, a nie slug.** Ilustracje z aplikacji nazywają się
 * `1A.webp`, `KP07.webp` — tak samo. Zdjęcie i rysunek tej samej trasy leżą
 * więc pod tą samą nazwą w dwóch katalogach i widać na pierwszy rzut oka,
 * czego jeszcze brakuje. Slug zmienia się przy zmianie nazwy trasy,
 * identyfikator nie.
 *
 * **Dlaczego nie podmieniamy plików w `public/dane/ilustracje/`.** Ten katalog
 * przynosi `synchronizuj-dane.sh` przez `rsync --delete` z repozytorium
 * aplikacji. Zdjęcie wrzucone tam zniknęłoby przy najbliższej synchronizacji.
 *
 * Pliki przygotowuje `narzedzia/przygotuj-zdjecia-tras.mjs`.
 */

const KATALOG = path.join(process.cwd(), 'public', 'marka', 'trasy')
const ADRES = '/marka/trasy'
const ROZSZERZENIA = ['webp', 'jpg', 'jpeg', 'png'] as const

/** Adres zdjęcia trasy albo null, gdy jeszcze go nie wgrano. */
export function zdjecieTrasy(id: string): string | null {
  for (const rozszerzenie of ROZSZERZENIA) {
    if (existsSync(path.join(KATALOG, `${id}.${rozszerzenie}`))) {
      return `${ADRES}/${id}.${rozszerzenie}`
    }
  }
  return null
}

/**
 * Czy pod tym adresem jest fotografia, czy malowany rysunek z aplikacji.
 *
 * Rozróżnienie nie jest kosmetyczne. Karta Open Graph przycina rysunki
 * symetrycznie, bo są komponowane wokół horyzontu na środku kadru, a zdjęcia
 * po najbardziej treściwym miejscu — bo w fotografii ważne bywa gdziekolwiek.
 * Zmienia się też tekst alternatywny: „Ilustracja trasy" przy zdjęciu z gór
 * byłoby zwyczajnie nieprawdą dla kogoś, kto słucha strony czytnikiem.
 */
export function toFotografia(adres: string | null): boolean {
  return Boolean(adres?.startsWith(`${ADRES}/`))
}
