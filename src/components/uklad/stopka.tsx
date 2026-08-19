import Link from 'next/link'

import { Logo } from '@/components/marka/logo'
import { PORTAL, RATUNEK, ZRODLA } from '@/lib/konfiguracja'

const KOLUMNY = [
  {
    tytul: 'Odkrywaj',
    odnosniki: [
      { adres: '/szlaki', etykieta: 'Wszystkie szlaki' },
      { adres: '/szlaki/kategorie/z-dziecmi', etykieta: 'Trasy z dziećmi' },
      { adres: '/szlaki/kategorie/rowerowe', etykieta: 'Trasy rowerowe' },
      { adres: '/atrakcje', etykieta: 'Atrakcje' },
      { adres: '/miejscowosci', etykieta: 'Miejscowości' },
      { adres: '/mapa', etykieta: 'Mapa interaktywna' },
    ],
  },
  {
    tytul: 'Pieniny',
    odnosniki: [
      { adres: '/dzis', etykieta: 'Dziś w Pieninach' },
      { adres: '/atrakcje', etykieta: 'Szczyty i punkty widokowe' },
      { adres: '/wyzwania', etykieta: 'Pienińskie odznaki' },
      { adres: '/szukaj', etykieta: 'Szukaj' },
    ],
  },
  {
    tytul: 'Aplikacja',
    odnosniki: [
      { adres: '/aplikacja', etykieta: 'O aplikacji' },
      { adres: '/o-nas', etykieta: 'O nas' },
      { adres: '/wsparcie', etykieta: 'Wsparcie i pomoc' },
      { adres: '/kontakt', etykieta: 'Napisz do nas' },
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
            {/*
              Poprzednia wersja brzmiała tak, jakby cały portal był przepisany
              z jednej publikacji. Nie jest: część tras to oficjalne szlaki
              PTTK, część powstała na podstawie przewodnika, a atrakcje,
              opisy miejsc i mapy są nasze. Rozdzielenie tych trzech rzeczy
              to nie formalność — to uczciwość wobec autora przewodnika
              i wobec czytelnika.
            */}
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-kamien-600">
              Przewodnik po Pieninach — szlaki, atrakcje i mapy. Część tras to
              oficjalne szlaki PTTK, część opracowaliśmy na podstawie przewodnika
              „{ZRODLA.przewodnik.tytul}”. Pozostałe trasy, opisy atrakcji
              i materiały powstały specjalnie na potrzeby tego portalu
              i aplikacji.
            </p>
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

        {/*
          Numery ratunkowe w stopce każdej strony. Ktoś, kto szuka ich
          w pośpiechu na szlaku, nie powinien musieć nawigować po menu —
          a `tel:` otwiera je jednym stuknięciem.
        */}
        <div className="mt-14 rounded-xl border border-kamien-200 bg-white px-5 py-4 sm:flex sm:items-center sm:gap-5">
          <p className="shrink-0 text-xs font-semibold uppercase tracking-wider text-kamien-500">
            W razie wypadku
          </p>
          <p className="mt-2 text-sm text-kamien-700 sm:mt-0">
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

        <div className="mt-6 flex flex-col gap-4 border-t border-kamien-200 pt-8 text-sm text-kamien-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {rok} {PORTAL.nazwa}</p>
          <div className="flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:items-center">
            <p>
              Kontakt:{' '}
              <a className="text-las-700 hover:underline" href={`mailto:${PORTAL.kontakt}`}>
                {PORTAL.kontakt}
              </a>
            </p>
            {/*
              Wejście do panelu administratora — jedno, bo panel też jest jeden.
              `nofollow` mówi robotom, żeby za nim
              nie szły; sam panel jest i tak zamknięty hasłem oraz oznaczony
              jako niedostępny dla wyszukiwarek, ale odnośnik w stopce każdej
              podstrony to zaproszenie, którego nie ma powodu wysyłać.
            */}
            <Link
              href="/panel"
              rel="nofollow"
              className="text-kamien-400 transition-colors hover:text-las-700"
            >
              Panel administratora
            </Link>
          </div>
        </div>

        {/*
          Podpis twórców. Serce jest znakiem graficznym, nie treścią, więc
          `aria-hidden` — czytnik ekranu przeczyta „Stworzone przez…", zamiast
          wymawiać nazwę emoji w środku zdania.
        */}
        <p className="mt-8 text-center text-sm text-kamien-500">
          Stworzone z <span aria-hidden>❤️</span>
          <span className="sr-only">miłością</span> przez{' '}
          <a
            href="https://frankowedomki.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-kamien-700 underline decoration-kamien-300 underline-offset-4 transition-colors hover:text-las-700 hover:decoration-las-400"
          >
            Frankowe Domki
          </a>{' '}
          i{' '}
          <a
            href="https://helenowka.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-kamien-700 underline decoration-kamien-300 underline-offset-4 transition-colors hover:text-las-700 hover:decoration-las-400"
          >
            Helenówkę
          </a>
        </p>

        <p className="mt-6 text-xs leading-relaxed text-kamien-500">
          Portal nie zastępuje mapy papierowej ani rozsądku. Przed wyjściem
          sprawdź pogodę i warunki na szlaku; zawracaj, gdy warunki się psują.
        </p>
      </div>
    </footer>
  )
}
