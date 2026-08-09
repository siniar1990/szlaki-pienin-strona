import Link from 'next/link'
import {
  BarChart3,
  Download,
  LayoutDashboard,
  LogOut,
  Map,
  Newspaper,
  QrCode,
  Rss,
  Signpost,
} from 'lucide-react'

import { wyloguj } from '@/app/panel/dzialania'

/**
 * Rama panelu administratora.
 *
 * Celowo skromna i wyraźnie odmienna od portalu: ciemny pasek zamiast logo
 * na bieli. Administrator ma w każdej chwili wiedzieć, że patrzy na narzędzie,
 * a nie na stronę dla turystów — zwłaszcza że oba żyją pod tą samą domeną
 * i łatwo o pomyłkę przy pokazywaniu ekranu komuś z zewnątrz.
 *
 * **Dlaczego menu jest podzielone na działy.** Przy pięciu pozycjach płaska
 * lista wystarczała. Przy ośmiu, pochodzących z trzech niezależnych systemów,
 * przestała: „Mapa" znaczy co innego przy tabliczkach niż przy analityce,
 * a „Statystyki" bez wskazania czego są bezużyteczną etykietą. Dział mówi,
 * w którym systemie się jest, zanim padnie nazwa strony.
 */

const DZIALY = [
  {
    nazwa: 'Tabliczki szlaków',
    pozycje: [
      { adres: '/panel', etykieta: 'Pulpit', ikona: LayoutDashboard },
      { adres: '/panel/kody', etykieta: 'Tabliczki', ikona: QrCode },
      { adres: '/panel/mapa', etykieta: 'Mapa', ikona: Map },
    ],
  },
  {
    nazwa: 'Portal aktualności',
    pozycje: [
      { adres: '/panel/aktualnosci', etykieta: 'Aktualności', ikona: Newspaper },
      { adres: '/panel/aktualnosci/znaleziska', etykieta: 'Znaleziska', ikona: Rss },
      { adres: '/panel/aktualnosci/zrodla', etykieta: 'Źródła', ikona: Signpost },
    ],
  },
  {
    nazwa: 'Portal analityczny',
    pozycje: [
      { adres: '/panel/analityka', etykieta: 'Odsłony', ikona: BarChart3 },
      { adres: '/panel/analityka/pobrania', etykieta: 'Pobrania', ikona: Download },
    ],
  },
] as const

export default function UkladPanelu({ children }: LayoutProps<'/panel'>) {
  return (
    <div className="min-h-full bg-kamien-50">
      <header className="border-b border-las-800 bg-las-900 text-white">
        {/*
          Pierwszy rząd: nazwa i wylogowanie. Stały, niezależnie od szerokości
          ekranu — to jedyne dwie rzeczy, które muszą być widoczne zawsze.
        */}
        <div className="obszar flex h-14 items-center justify-between gap-6">
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

        {/*
          Drugi rząd: działy z pozycjami. Ujemny margines z dopełnieniem tej
          samej wielkości pozwala pasowi przewijać się od krawędzi do krawędzi
          telefonu, zachowując odstęp od brzegu w spoczynku. Bez tego cały
          panel dawał się przesuwać w bok — pasek był szerszy niż ekran.
        */}
        <nav
          aria-label="Nawigacja panelu"
          className="obszar -mx-0 overflow-x-auto border-t border-white/10"
        >
          <div className="flex min-w-max gap-8 py-2.5">
            {DZIALY.map((dzial) => (
              <div key={dzial.nazwa}>
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  {dzial.nazwa}
                </p>
                <ul className="mt-1 flex items-center gap-1">
                  {dzial.pozycje.map(({ adres, etykieta, ikona: Ikona }) => (
                    <li key={adres} className="shrink-0">
                      <Link
                        href={adres}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Ikona className="size-4" aria-hidden />
                        {etykieta}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </header>

      <main className="obszar py-8 sm:py-10">{children}</main>
    </div>
  )
}
