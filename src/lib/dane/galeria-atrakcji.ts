import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Galeria zdjęć atrakcji — fotografie zrobione na miejscu.
 *
 * **Czym różni się od zdjęcia głównego.** Zdjęcie główne (`zdjecia-atrakcji.ts`)
 * jest jedno, pochodzi z Wikimedia Commons i wymaga podpisu autora, bo taka
 * jest jego licencja. Galeria to zdjęcia własne portalu: robione podczas wizyty
 * telefonem, bez licencji do pilnowania, za to pokazujące rzeczy, których
 * w Commons nie ma — wnętrza, stroje, zbrojownię.
 *
 * Dlatego galeria jest podpisana „Zdjęcia turystów", a nie „Galeria": mówi
 * wprost, czego się po nich spodziewać. Kto zobaczy amatorskie ujęcie
 * podpisane jak materiał prasowy, uzna portal za niechlujny; kto zobaczy je
 * podpisane uczciwie, uzna za wiarygodny — bo w takim właśnie świetle
 * i z takiego miejsca zobaczy je sam.
 *
 * Pliki przygotowuje `narzedzia/przygotuj-galerie-atrakcji.mjs`. Kolejność
 * wynika z nazw (`01.webp`, `02.webp`…) i jest jedynym miejscem, w którym da
 * się nią sterować.
 */

const KATALOG = path.join(process.cwd(), 'public', 'marka', 'atrakcje', 'galeria')

export function galeriaAtrakcji(slug: string): string[] {
  const katalog = path.join(KATALOG, slug)
  if (!existsSync(katalog)) return []

  return readdirSync(katalog)
    .filter((nazwa) => nazwa.endsWith('.webp'))
    .sort()
    .map((nazwa) => `/marka/atrakcje/galeria/${slug}/${nazwa}`)
}
