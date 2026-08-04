import Link from 'next/link'

import { Logo } from '@/components/marka/logo'
import { PORTAL, RATUNEK, ZRODLA } from '@/lib/konfiguracja'

const KOLUMNY = [
  {
    tytul: 'Odkrywaj',
    odnosniki: [
      { adres: '/szlaki', etykieta: 'Wszystkie szlaki' },
      { adres: '/szlaki/kategorie/rodzinne', etykieta: 'Trasy z dziećmi' },
      { adres: '/szlaki/kategorie/rowerowe', etykieta: 'Trasy rowerowe' },
      { adres: '/atrakcje', etykieta: 'Atrakcje' },
      { adres: '/mapa', etykieta: 'Mapa interaktywna' },
    ],
  },
  {
    tytul: 'Pieniny',
    odnosniki: [
      { adres: '/atrakcje', etykieta: 'Szczyty i punkty widokowe' },
      { adres: '/wyzwania', etykieta: 'Pienińskie odznaki' },
      { adres: '/szukaj', etykieta: 'Szukaj' },
    ],
  },
  {
    tytul: 'Aplikacja',
    odnosniki: [
      { adres: '/aplikacja', etykieta: 'O aplikacji' },
      { adres: '/wsparcie', etykieta: 'Wsparcie i kontakt' },
      { adres: '/prywatnosc', etykieta: 'Prywatność' },
    ],
  },
] as const

export function Stopka() {
  const rok = new Date().getFullYear()

  return (
    <footer className="border-t border-kamien-200 bg-kamien-50">
      <div className="obszar py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo wysokosc={48} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-kamien-600">
              Przewodnik po Pieninach — szlaki, atrakcje i mapy. Opisy tras
              pochodzą z przewodnika „{ZRODLA.przewodnik.tytul}"
              {' '}({ZRODLA.przewodnik.autor}, {ZRODLA.przewodnik.wydawca},{' '}
              {ZRODLA.przewodnik.wydanie}).
            </p>

            {/*
              Numery ratunkowe w stopce każdej strony. Ktoś, kto szuka ich
              w pośpiechu na szlaku, nie powinien musieć nawigować po menu —
              a `tel:` otwiera je jednym stuknięciem.
            */}
            <div className="mt-6 rounded-xl border border-kamien-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-kamien-500">
                W razie wypadku
              </p>
              <p className="mt-2 text-sm text-kamien-700">
                GOPR{' '}
                <a className="font-semibold text-las-700 hover:underline" href={`tel:${RATUNEK.gopr.replace(/\s/g, '')}`}>
                  {RATUNEK.gopr}
                </a>{' '}
                lub{' '}
                <a className="font-semibold text-las-700 hover:underline" href={`tel:${RATUNEK.goprSkrocony}`}>
                  {RATUNEK.goprSkrocony}
                </a>
                {' · '}
                numer alarmowy{' '}
                <a className="font-semibold text-las-700 hover:underline" href={`tel:${RATUNEK.alarmowy}`}>
                  {RATUNEK.alarmowy}
                </a>
              </p>
            </div>
          </div>

          {KOLUMNY.map((kolumna) => (
            <nav key={kolumna.tytul} aria-label={kolumna.tytul}>
              <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-kamien-800">
                {kolumna.tytul}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {kolumna.odnosniki.map((odnosnik) => (
                  <li key={odnosnik.adres}>
                    <Link
                      href={odnosnik.adres}
                      className="text-sm text-kamien-600 transition-colors hover:text-las-700"
                    >
                      {odnosnik.etykieta}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-kamien-200 pt-8 text-sm text-kamien-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {rok} {PORTAL.nazwa}</p>
          <p>
            Kontakt:{' '}
            <a className="text-las-700 hover:underline" href={`mailto:${PORTAL.kontakt}`}>
              {PORTAL.kontakt}
            </a>
          </p>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-kamien-500">
          Portal nie zastępuje mapy papierowej ani rozsądku. Przed wyjściem
          sprawdź pogodę i warunki na szlaku; zawracaj, gdy warunki się psują.
        </p>
      </div>
    </footer>
  )
}
