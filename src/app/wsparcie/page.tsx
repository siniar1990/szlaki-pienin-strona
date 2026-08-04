import type { Metadata } from 'next'

import { Proza, Uwaga } from '@/components/tresc/proza'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { PORTAL, RATUNEK } from '@/lib/konfiguracja'

/**
 * Wsparcie i kontakt.
 *
 * Podobnie jak polityka prywatności — adres jest podany w App Store Connect,
 * więc `/wsparcie` musi działać bez końca. Częste pytania opisujemy znacznikami
 * `<details>`, żeby czytelnik nie musiał przewijać całej listy; dokładamy do
 * nich opis strukturalny FAQ, który Google potrafi pokazać wprost w wynikach.
 */

export const metadata: Metadata = {
  title: 'Wsparcie i kontakt',
  description:
    'Pomoc w sprawie aplikacji Szlaki Pienin: częste pytania, zgłaszanie błędów ' +
    'w trasach, kontakt i numery ratunkowe w górach.',
  alternates: { canonical: '/wsparcie' },
}

const PYTANIA = [
  {
    pytanie: 'Mapa jest szara i nic nie widać',
    odpowiedz:
      'Prawdopodobnie nie pobrała się mapa offline. Wejdź w Ustawienia → Mapa offline ' +
      'i stuknij „Pobierz" — najlepiej przez Wi-Fi, przed wyjściem w góry. Tryby „Teren" ' +
      'i „Satelita" zawsze wymagają zasięgu; bez internetu działa tryb zwykły.',
  },
  {
    pytanie: 'Aplikacja nie widzi mojej pozycji',
    odpowiedz:
      'Sprawdź w Ustawieniach systemu, czy „Szlaki Pienin" mają dostęp do lokalizacji. ' +
      'W wąwozach i pod ścianami skalnymi GPS bywa niedokładny — to normalne i mija ' +
      'po wyjściu na otwartą przestrzeń.',
  },
  {
    pytanie: 'Nagrana trasa pokazuje dziwne przewyższenie',
    odpowiedz:
      'Wysokość z GPS-u potrafi się mylić o kilkadziesiąt metrów, dlatego aplikacja ' +
      'odrzuca najgorsze odczyty i wygładza resztę. Przy słabym sygnale wynik i tak ' +
      'może być zawyżony. Jeśli różnica jest duża — napisz, najlepiej z wyeksportowanym ' +
      'plikiem GPX.',
  },
  {
    pytanie: 'Jak przenieść trasę do Stravy albo Garmina',
    odpowiedz:
      'Otwórz nagranie w „Moje przebyte trasy" i stuknij GPX. Plik możesz zapisać ' +
      'w Plikach albo wysłać wprost do innej aplikacji.',
  },
  {
    pytanie: 'Czy aplikacja jest płatna',
    odpowiedz: 'Nie. Nie ma wersji premium, opłat ani reklam firm.',
  },
]

export default function StronaWsparcie() {
  /*
    Opis strukturalny FAQ. Wstrzykujemy go przez `dangerouslySetInnerHTML`,
    bo tak właśnie osadza się JSON-LD — to nie jest treść od użytkownika,
    tylko nasz własny obiekt zamieniony na tekst, więc nie ma tu czego
    wstrzyknąć z zewnątrz.
  */
  const daneFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PYTANIA.map((p) => ({
      '@type': 'Question',
      name: p.pytanie,
      acceptedAnswer: { '@type': 'Answer', text: p.odpowiedz },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(daneFaq) }}
      />

      <NaglowekStrony
        okruszki={[{ nazwa: 'Wsparcie', adres: '/wsparcie' }]}
        tytul="Wsparcie"
        lead="Coś nie działa? Trasa nie zgadza się z terenem? Napisz."
      />

      <div className="obszar py-16 lg:py-20">
        <Proza>
          <h2>Kontakt</h2>
          <p>
            <a href={`mailto:${PORTAL.kontakt}`}>{PORTAL.kontakt}</a>
          </p>
          <p>
            Aplikację robi jedna osoba po godzinach, więc odpowiedź może chwilę zająć —
            ale każde zgłoszenie czytam.
          </p>

          <Uwaga>
            <p>
              <strong>Zgłaszasz błąd w trasie?</strong> Napisz, której trasy dotyczy
              i w którym miejscu — najlepiej ze współrzędnymi z aplikacji albo opisem
              w rodzaju „przy rozwidleniu nad Wąwozem Homole". To skraca poprawkę
              z tygodnia do kwadransa.
            </p>
          </Uwaga>

          <h2>Częste pytania</h2>
        </Proza>

        <div className="mt-6 max-w-[68ch] divide-y divide-kamien-200 border-y border-kamien-200">
          {PYTANIA.map((pozycja) => (
            <details key={pozycja.pytanie} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-semibold text-kamien-900 hover:text-las-700">
                {pozycja.pytanie}
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-kamien-300 text-kamien-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-kamien-700">{pozycja.odpowiedz}</p>
            </details>
          ))}
        </div>

        <Proza className="mt-14">
          <h2>W górach</h2>
          <p>
            Aplikacja nie zastępuje mapy papierowej ani rozsądku. Sprawdzaj pogodę przed
            wyjściem i zawracaj, gdy warunki się psują.
          </p>
          <p>
            Ratunek górski (GOPR): <strong>{RATUNEK.gopr}</strong> lub{' '}
            <strong>{RATUNEK.goprSkrocony}</strong>. Numer alarmowy:{' '}
            <strong>{RATUNEK.alarmowy}</strong>.
          </p>
        </Proza>
      </div>
    </>
  )
}
