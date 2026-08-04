'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Mountain, Search, X } from 'lucide-react'

import { MENU } from '@/lib/konfiguracja'
import { cn } from '@/lib/utils'

/**
 * Górny pasek nawigacji.
 *
 * Nad fotografią tytułową jest przezroczysty, żeby zdjęcie zajmowało cały
 * ekran bez przykrywki. Po przewinięciu kilkudziesięciu pikseli nabiera bieli
 * i cienia — inaczej białe napisy menu ginęłyby na jasnym niebie następnych
 * sekcji. Próg jest niski (24 px), bo przy wyższym pasek zmienia się dopiero
 * w połowie ruchu i wygląda to na usterkę.
 */
export function Naglowek() {
  const sciezka = usePathname()
  const [przewiniete, ustawPrzewiniete] = useState(false)
  const [menuOtwarte, ustawMenuOtwarte] = useState(false)

  // Strona główna to jedyne miejsce z pełnoekranowym zdjęciem pod paskiem;
  // wszędzie indziej treść zaczyna się od razu i pasek musi być kryjący.
  const nadZdjeciem = sciezka === '/' && !przewiniete

  useEffect(() => {
    const przySkrolu = () => ustawPrzewiniete(window.scrollY > 24)
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
        'sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        nadZdjeciem
          ? 'bg-transparent'
          : 'bg-white/85 shadow-miekki backdrop-blur-xl supports-[backdrop-filter]:bg-white/70',
      )}
    >
      <div className="obszar flex h-16 items-center justify-between gap-6 sm:h-20">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight transition-colors',
            nadZdjeciem ? 'text-white' : 'text-las-800',
          )}
        >
          <Mountain className="size-6 shrink-0" aria-hidden />
          <span>Szlaki Pienin</span>
        </Link>

        <nav aria-label="Nawigacja główna" className="hidden lg:block">
          <ul className="flex items-center gap-1">
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
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      nadZdjeciem
                        ? 'text-white/90 hover:bg-white/15 hover:text-white'
                        : 'text-kamien-700 hover:bg-las-50 hover:text-las-800',
                      aktywna && (nadZdjeciem ? 'bg-white/20 text-white' : 'bg-las-50 text-las-800'),
                    )}
                  >
                    {pozycja.etykieta}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/szukaj"
            aria-label="Szukaj w portalu"
            className={cn(
              'grid size-10 place-items-center rounded-full transition-colors',
              nadZdjeciem
                ? 'text-white hover:bg-white/15'
                : 'text-kamien-700 hover:bg-kamien-100',
            )}
          >
            <Search className="size-5" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => ustawMenuOtwarte((otwarte) => !otwarte)}
            aria-expanded={menuOtwarte}
            aria-controls="menu-mobilne"
            aria-label={menuOtwarte ? 'Zamknij menu' : 'Otwórz menu'}
            className={cn(
              'grid size-10 place-items-center rounded-full transition-colors lg:hidden',
              nadZdjeciem
                ? 'text-white hover:bg-white/15'
                : 'text-kamien-700 hover:bg-kamien-100',
            )}
          >
            {menuOtwarte ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOtwarte && (
        <nav
          id="menu-mobilne"
          aria-label="Nawigacja główna"
          className="border-t border-kamien-200 bg-white lg:hidden"
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
