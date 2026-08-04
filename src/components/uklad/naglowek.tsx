'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'

import { Logo } from '@/components/marka/logo'
import { MENU } from '@/lib/konfiguracja'
import { cn } from '@/lib/utils'

/**
 * Górny pasek nawigacji.
 *
 * Wcześniej nad zdjęciem tytułowym był przezroczysty, a napisy białe — i po
 * prostu ginęły w jasnym niebie nad graniami. Menu stawało się widoczne
 * dopiero po przewinięciu, kiedy pasek nabierał bieli. Teraz pasek jest
 * kryjący od pierwszej klatki: efektowne wejście nie jest wart tego, żeby
 * nawigacja bywała niewidzialna.
 *
 * Po przewinięciu dochodzi tylko cień i obramowanie — subtelny sygnał, że
 * treść przesuwa się pod paskiem.
 */
export function Naglowek() {
  const sciezka = usePathname()
  const [przewiniete, ustawPrzewiniete] = useState(false)
  const [menuOtwarte, ustawMenuOtwarte] = useState(false)

  useEffect(() => {
    const przySkrolu = () => ustawPrzewiniete(window.scrollY > 8)
    przySkrolu()
    // `passive` mówi przeglądarce, że nie zablokujemy przewijania — bez tego
    // każdy ruch palcem czeka na naszą funkcję i przewijanie się szarpie.
    window.addEventListener('scroll', przySkrolu, { passive: true })
    return () => window.removeEventListener('scroll', przySkrolu)
  }, [])

  // Zmiana podstrony zamyka menu. Bez tego po kliknięciu odnośnika panel
  // zostaje otwarty nad nową stroną i zasłania jej początek.
  useEffect(() => {
    ustawMenuOtwarte(false)
  }, [sciezka])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white/90 backdrop-blur-xl transition-shadow duration-300',
        'supports-[backdrop-filter]:bg-white/80',
        przewiniete ? 'border-b border-kamien-200 shadow-miekki' : 'border-b border-transparent',
      )}
    >
      {/*
        Pasek urósł razem z logo — inaczej znak dotykałby krawędzi. Księga
        znaku wymaga wokół niego wolnej przestrzeni wielkości litery „S"
        z monogramu, a przy 56 px logo to około 12 px z każdej strony.
      */}
      <div className="obszar flex h-[4.5rem] items-center justify-between gap-6 sm:h-24">
        <Link href="/" aria-label="Szlaki Pienin — strona główna" className="shrink-0">
          <Logo wysokosc={46} className="sm:hidden" />
          <Logo wysokosc={56} className="hidden sm:block" />
        </Link>

        {/*
          Menu pokazujemy już od szerokości tabletu (768 px), a nie dopiero od
          1024 px. Pięć krótkich pozycji mieści się tam bez ścisku, a najwięcej
          osób wchodzi na portal z kodu QR na szlaku — czyli z telefonu
          trzymanego poziomo albo z tabletu.
        */}
        <nav aria-label="Nawigacja główna" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {MENU.map((pozycja) => {
              const aktywna =
                sciezka === pozycja.adres || sciezka.startsWith(`${pozycja.adres}/`)
              return (
                <li key={pozycja.adres}>
                  <Link
                    href={pozycja.adres}
                    // `aria-current` mówi czytnikowi ekranu, na której stronie
                    // jesteśmy — samo pogrubienie jest widoczne tylko okiem.
                    aria-current={aktywna ? 'page' : undefined}
                    className={cn(
                      'rounded-full px-3.5 py-2 text-sm font-medium transition-colors lg:px-4',
                      aktywna
                        ? 'bg-las-50 text-las-800'
                        : 'text-kamien-700 hover:bg-las-50 hover:text-las-800',
                    )}
                  >
                    {pozycja.etykieta}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/szukaj"
            aria-label="Szukaj w portalu"
            className="grid size-10 place-items-center rounded-full text-kamien-700 transition-colors hover:bg-kamien-100"
          >
            <Search className="size-5" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => ustawMenuOtwarte((otwarte) => !otwarte)}
            aria-expanded={menuOtwarte}
            aria-controls="menu-mobilne"
            aria-label={menuOtwarte ? 'Zamknij menu' : 'Otwórz menu'}
            className="grid size-10 place-items-center rounded-full text-kamien-700 transition-colors hover:bg-kamien-100 md:hidden"
          >
            {menuOtwarte ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOtwarte && (
        <nav
          id="menu-mobilne"
          aria-label="Nawigacja główna"
          className="border-t border-kamien-200 bg-white md:hidden"
        >
          <ul className="obszar flex flex-col py-3">
            {MENU.map((pozycja) => (
              <li key={pozycja.adres}>
                <Link
                  href={pozycja.adres}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-kamien-800 hover:bg-las-50 hover:text-las-800"
                >
                  {pozycja.etykieta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
