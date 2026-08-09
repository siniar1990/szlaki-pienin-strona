'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Download,
  LayoutDashboard,
  Map,
  Newspaper,
  QrCode,
  Rss,
  Signpost,
} from 'lucide-react'

/**
 * Menu panelu administratora.
 *
 * **Dlaczego komponent kliencki.** Żeby podświetlić stronę, na której się
 * jesteś. Panel ma osiem pozycji z trzech systemów i bez tego po dwóch
 * kliknięciach nie wiadomo, gdzie się stoi — a to jest narzędzie do pracy,
 * nie strona do przeglądania.
 *
 * **Dlaczego działy jako pasek nad pozycjami, a nie nadtytuły przy każdej
 * grupie.** Pierwsza wersja pisała nazwę działu drobnym tekstem nad każdą
 * grupą przycisków. Na komputerze wyglądało to znośnie, na telefonie —
 * jak trzy przypadkowe napisy. Teraz dział wybiera się jak zakładkę, a niżej
 * widać wyłącznie jego pozycje. Mniej rzeczy naraz, a droga do każdej z nich
 * jest krótsza.
 */

const DZIALY = [
  {
    klucz: 'tabliczki',
    nazwa: 'Tabliczki szlaków',
    /** Po tym przedrostku poznajemy, że jesteśmy w tym dziale. */
    korzenie: ['/panel/kody', '/panel/mapa'],
    /** Pulpit należy do tego działu i jest jego stroną główną. */
    domyslny: '/panel',
    pozycje: [
      { adres: '/panel', etykieta: 'Pulpit', ikona: LayoutDashboard },
      { adres: '/panel/kody', etykieta: 'Tabliczki', ikona: QrCode },
      { adres: '/panel/mapa', etykieta: 'Mapa', ikona: Map },
    ],
  },
  {
    klucz: 'aktualnosci',
    nazwa: 'Portal aktualności',
    korzenie: ['/panel/aktualnosci'],
    domyslny: '/panel/aktualnosci',
    pozycje: [
      { adres: '/panel/aktualnosci', etykieta: 'Aktualności', ikona: Newspaper },
      { adres: '/panel/aktualnosci/znaleziska', etykieta: 'Znaleziska', ikona: Rss },
      { adres: '/panel/aktualnosci/zrodla', etykieta: 'Źródła', ikona: Signpost },
    ],
  },
  {
    klucz: 'analityka',
    nazwa: 'Portal analityczny',
    korzenie: ['/panel/analityka'],
    domyslny: '/panel/analityka',
    pozycje: [
      { adres: '/panel/analityka', etykieta: 'Odsłony', ikona: BarChart3 },
      { adres: '/panel/analityka/pobrania', etykieta: 'Pobrania', ikona: Download },
    ],
  },
] as const

export function MenuPanelu() {
  const sciezka = usePathname()

  /*
    Dział rozpoznajemy po najdłuższym pasującym korzeniu, nie po pierwszym.
    Inaczej `/panel/aktualnosci/znaleziska` trafiłoby do działu tabliczek,
    bo `/panel` jest przedrostkiem wszystkiego.
  */
  const aktywnyDzial =
    DZIALY.find((dzial) => dzial.korzenie.some((korzen) => sciezka.startsWith(korzen))) ?? DZIALY[0]

  return (
    <>
      {/* ── Działy ─────────────────────────────────────────────────────── */}
      <div className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 border-b border-white/10">
          {DZIALY.map((dzial) => {
            const wybrany = dzial.klucz === aktywnyDzial.klucz
            return (
              <li key={dzial.klucz}>
                <Link
                  href={dzial.domyslny}
                  aria-current={wybrany ? 'true' : undefined}
                  className={
                    'inline-block border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ' +
                    (wybrany
                      ? 'border-white text-white'
                      : 'border-transparent text-white/55 hover:text-white/85')
                  }
                >
                  {dzial.nazwa}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Pozycje wybranego działu ───────────────────────────────────── */}
      <nav aria-label={`Nawigacja: ${aktywnyDzial.nazwa}`} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max items-center gap-1 py-2">
          {aktywnyDzial.pozycje.map(({ adres, etykieta, ikona: Ikona }) => {
            /*
              Dokładne dopasowanie, nie przedrostek. `/panel/aktualnosci` jest
              przedrostkiem `/panel/aktualnosci/zrodla`, więc przy dopasowaniu
              po przedrostku podświetlone byłyby dwie pozycje naraz.
            */
            const wybrana = sciezka === adres
            return (
              <li key={adres}>
                <Link
                  href={adres}
                  aria-current={wybrana ? 'page' : undefined}
                  className={
                    'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ' +
                    (wybrana
                      ? 'bg-white/15 font-medium text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white')
                  }
                >
                  <Ikona className="size-4" aria-hidden />
                  {etykieta}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
