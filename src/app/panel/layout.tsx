import { LogOut } from 'lucide-react'

import { wyloguj } from '@/app/panel/dzialania'
import { MenuPanelu } from '@/components/panel/menu-panelu'

/**
 * Rama panelu administratora.
 *
 * Celowo skromna i wyraźnie odmienna od portalu: ciemny pasek zamiast logo
 * na bieli. Administrator ma w każdej chwili wiedzieć, że patrzy na narzędzie,
 * a nie na stronę dla turystów — zwłaszcza że oba żyją pod tą samą domeną
 * i łatwo o pomyłkę przy pokazywaniu ekranu komuś z zewnątrz.
 *
 * Samo menu mieszka w osobnym komponencie klienckim, bo musi wiedzieć, na
 * której stronie jesteśmy. Tutaj zostaje wyłącznie to, co statyczne: nazwa
 * i wylogowanie.
 */
export default function UkladPanelu({ children }: LayoutProps<'/panel'>) {
  return (
    <div className="min-h-full bg-kamien-50">
      <header className="border-b border-las-800 bg-las-900 text-white">
        <div className="obszar">
          {/* Pierwszy rząd: nazwa i wylogowanie — widoczne zawsze. */}
          <div className="flex h-14 items-center justify-between gap-6">
            <span className="font-heading text-lg font-semibold">Panel administratora</span>

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

          <MenuPanelu />
        </div>
      </header>

      <main className="obszar py-8 sm:py-10">{children}</main>
    </div>
  )
}
