import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Konfiguracja testów.
 *
 * Projekt nie miał dotąd żadnego frameworka testowego — treść pochodzi
 * z plików, a strony są komponentami serwerowymi, więc przez długi czas
 * budowanie i przeglądarka wystarczały za sprawdzenie. Kanały XML to pierwsza
 * rzecz w tym portalu, której nie da się sprawdzić okiem: różnica między
 * poprawną a niepoprawną mapą witryny bywa jednym nieuciekniętym znakiem,
 * a skutek widać dopiero wtedy, gdy Google przestaje ją czytać.
 *
 * Testujemy czyste funkcje budujące dokumenty, a nie trasy — bo to w nich
 * siedzi cała logika, a uruchamianie serwera i bazy dokładałoby powolność
 * i zawodność bez zysku dla tego, co naprawdę chcemy sprawdzić.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
