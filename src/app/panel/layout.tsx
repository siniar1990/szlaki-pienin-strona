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
      <header className="border-b border-las-800 bg-las-900 text-white">
        <div className="obszar flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <span className="font-heading text-lg font-semibold">Panel tabliczek</span>
            <nav aria-label="Nawigacja panelu">
              <ul className="flex items-center gap-1">
                {MENU_PANELU.map(({ adres, etykieta, ikona: Ikona }) => (
                  <li key={adres}>
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

          <form action={wyloguj}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
              Wyloguj
            </button>
          </form>
        </div>
      </header>

      <main className="obszar py-10">{children}</main>
    </div>
  )
}
