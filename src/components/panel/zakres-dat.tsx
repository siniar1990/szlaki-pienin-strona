import Link from 'next/link'

import { ZAKRESY, type Zakres } from '@/lib/qr/zakres'

/**
 * Przełącznik zakresu czasu.
 *
 * Zwykłe odnośniki, nie przyciski z obsługą zdarzeń. Przełącznik nie potrzebuje
 * niczego, czego nie umie sam adres, a przy odnośnikach działa też środkowy
 * przycisk myszy, otwieranie w nowej karcie i przycisk wstecz. Komponent
 * zostaje przez to po stronie serwera i nie dokłada ani bajta JavaScriptu.
 */
export function ZakresDat({ sciezka, aktywny }: { sciezka: string; aktywny: Zakres }) {
  return (
    <nav
      aria-label="Zakres czasu"
      className="inline-flex flex-wrap gap-1 rounded-full border border-kamien-200 bg-white p-1"
    >
      {ZAKRESY.map((zakres) => {
        const wybrany = zakres.klucz === aktywny.klucz
        return (
          <Link
            key={zakres.klucz}
            href={`${sciezka}?zakres=${zakres.klucz}`}
            aria-current={wybrany ? 'true' : undefined}
            className={
              wybrany
                ? 'rounded-full bg-las-700 px-3.5 py-1.5 text-sm font-medium text-white'
                : 'rounded-full px-3.5 py-1.5 text-sm text-kamien-600 transition-colors hover:bg-kamien-100 hover:text-kamien-900'
            }
          >
            {zakres.etykieta}
          </Link>
        )
      })}
    </nav>
  )
}
