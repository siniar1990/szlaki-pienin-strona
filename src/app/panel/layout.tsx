import Link from 'next/link'
import { LayoutDashboard, LogOut, Map, QrCode } from 'lucide-react'

import { wyloguj } from '@/app/panel/dzialania'

/**
 * Rama panelu administracyjnego.
 *
 * Celowo skromna i wyraźnie odmienna od portalu: ciemny pasek zamiast logo
 * na bieli. Administrator ma w każdej chwili wiedzieć, że patrzy na narzędzie,
 * a nie na stronę dla turystów — zwłaszcza że oba żyją pod tą samą domeną
 * i łatwo o pomyłkę przy pokazywaniu ekranu komuś z zewnątrz.
 */

const MENU_PANELU = [
  { adres: '/panel', etykieta: 'Pulpit', ikona: LayoutDashboard },
  { adres: '/panel/kody', etykieta: 'Tabliczki', ikona: QrCode },
  { adres: '/panel/mapa', etykieta: 'Mapa', ikona: Map },
] as const

export default function UkladPanelu({ children }: LayoutProps<'/panel'>) {
  return (
    <div className="min-h-full bg-kamien-50">
      {/*
        Pasek panelu łamie się na telefonie na dwa rzędy.

        Poprzednia wersja trzymała tytuł, trzy pozycje menu i „Wyloguj"
        w jednym rzędzie o stałej wysokości i bez zawijania. Na komputerze
        wyglądało to dobrze, ale te elementy potrzebują około 640 px, a telefon
        ma 390 — więc pasek wypychał stronę i **cały panel dawał się przesuwać
        w bok**. Widać to było na każdej podstronie, bo winowajcą był układ
        wspólny dla wszystkich.

        Teraz na wąskim ekranie tytuł i wylogowanie dzielą pierwszy rząd,
        a menu schodzi do drugiego i przewija się w poziomie, gdyby kiedyś
        przybyło pozycji. Od `sm` w górę wraca jeden rząd, tak jak było.
      */}
      <header className="border-b border-las-800 bg-las-900 text-white">
        <div className="obszar flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
          <span className="font-heading text-lg font-semibold">Panel tabliczek</span>

          <form action={wyloguj} className="order-2 sm:order-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Wyloguj
            </button>
          </form>

          {/*
            Ujemny margines z dopełnieniem tej samej wielkości pozwala menu
            przewijać się od krawędzi do krawędzi ekranu, a jednocześnie
            zachować odstęp od brzegu w spoczynku.
          */}
          <nav
            aria-label="Nawigacja panelu"
            className="order-3 -mx-4 w-full overflow-x-auto px-4 sm:order-2 sm:mx-0 sm:mr-auto sm:w-auto sm:overflow-visible sm:px-0"
          >
            <ul className="flex items-center gap-1">
              {MENU_PANELU.map(({ adres, etykieta, ikona: Ikona }) => (
                <li key={adres} className="shrink-0">
                  <Link
                    href={adres}
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Ikona className="size-4" aria-hidden />
                    {etykieta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="obszar py-8 sm:py-10">{children}</main>
    </div>
  )
}
