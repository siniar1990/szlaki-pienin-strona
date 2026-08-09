import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, Newspaper } from 'lucide-react'

import { PrzyciskiSklepow } from '@/components/aplikacja/przyciski-sklepow'
import type { StatystykiPortalu } from '@/lib/dane/typy'
import { liczba } from '@/lib/format'

/**
 * Sekcja powitalna — pierwszy ekran portalu.
 *
 * Zajmuje pełną wysokość okna, ale mierzoną w `dvh`, a nie `vh`. Na telefonach
 * `100vh` to wysokość okna z *ukrytym* paskiem adresu, więc przy wejściu na
 * stronę dolne 60–70 px sekcji chowa się pod paskiem i przycisk pobrania
 * ląduje poza ekranem. `dvh` nadąża za paskiem i przycisk zostaje widoczny.
 *
 * Liczby pod przyciskami są policzone z danych aplikacji przy budowaniu —
 * żadna nie jest wpisana ręcznie. Nie ma wśród nich oceny w sklepie ani liczby
 * pobrań, bo aplikacja nie jest jeszcze opublikowana i takie dane po prostu
 * nie istnieją.
 */
export function Powitanie({ statystyki }: { statystyki: StatystykiPortalu }) {
  const liczby = [
    { wartosc: liczba(statystyki.liczbaTras), etykieta: 'tras w przewodniku' },
    { wartosc: `${liczba(statystyki.sumaKm)} km`, etykieta: 'opisanych szlaków' },
    { wartosc: liczba(statystyki.liczbaSzczytow), etykieta: 'szczytów' },
    { wartosc: liczba(statystyki.liczbaPunktowWidokowych), etykieta: 'punktów widokowych' },
    { wartosc: liczba(statystyki.liczbaCiekawostek), etykieta: 'ciekawostek z przewodnika' },
  ]

  return (
    // Pasek nawigacji jest kryjący i zajmuje miejsce w układzie strony,
    // więc od pełnej wysokości okna odejmujemy jego wysokość — inaczej
    // pierwszy ekran byłby o te 5 rem za wysoki i statystyki uciekałyby
    // pod krawędź.
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col justify-end overflow-hidden sm:min-h-[calc(100dvh-5rem)]">
      <Image
        // WebP zamiast oryginalnego JPEG-a z zasobów aplikacji: ten sam kadr
        // waży 380 zamiast 556 kB. Przy eksporcie statycznym Next niczego nie
        // przelicza w locie, więc plik musi przyjść gotowy — leży w `marka/`,
        // bo `dane/` nadpisuje synchronizacja z aplikacji.
        src="/marka/tlo/pieniny-hero.webp"
        alt=""
        fill
        // Jedyny obraz nad linią zgięcia — ładujemy go bez zwłoki, bo to on
        // decyduje o wyniku LCP w Core Web Vitals.
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/*
        Dwie nakładki zamiast jednej. Pionowy gradient rozjaśnia górę (żeby
        menu było czytelne) i przyciemnia dół pod tekstem, a druga warstwa
        dokłada równomierne przyciemnienie — bez niej biały napis wpadał
        w jasne niebo nad graniami.
      */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-las-950/55 via-las-950/20 to-las-950/85"
      />
      <div aria-hidden className="absolute inset-0 bg-las-950/15" />

      <div className="obszar relative z-10 pb-24 pt-20 sm:pb-28">
        {/*
          Nagłówek mówi, co tu jest, zamiast ogłaszać, że jesteśmy najlepsi.
          „Wszystkie szlaki Pienin" to obietnica, którą da się sprawdzić —
          i sprawdza się, bo trasy pochodzą z przewodnika PTTK, a liczby pod
          spodem są policzone z danych.
        */}
        {/*
          Nadtytuł mówi, czym portal jest, zanim padnie obietnica. Bez niego
          strona wyglądała wyłącznie na wizytówkę aplikacji, a dział aktualności
          był niespodzianką ukrytą w menu.
        */}
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Przewodnik i portal informacyjny Pienin
        </p>

        <h1 className="mt-4 max-w-[19ch] text-wyswietl font-semibold text-white">
          Wszystkie szlaki Pienin w jednym miejscu
        </h1>

        <p className="mt-6 max-w-[56ch] text-prowadzacy text-white/90">
          Szlaki piesze, rowerowe i narciarskie, atrakcje okolicy, mapy offline
          i nawigacja GPS — a do tego aktualności z regionu: zmiany na szlakach,
          wydarzenia i warunki w górach.
        </p>

        {/*
          Odnośnik do aktualności obok odznak sklepów, a nie zamiast nich.
          Portal robi dwie rzeczy i obie mają być widoczne z pierwszego ekranu:
          prowadzi do aplikacji i codziennie mówi, co się w Pieninach dzieje.
          Ktoś, kto przyszedł po wiadomość, nie powinien musieć szukać jej
          w menu — a ktoś, kto przyszedł po aplikację, i tak patrzy na odznaki.
        */}
        <div className="mt-10 flex flex-col gap-6">
          <PrzyciskiSklepow wariant="jasny" />

          <Link
            href="/aktualnosci"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
          >
            <Newspaper className="size-4" aria-hidden />
            Aktualności z Pienin
          </Link>
        </div>

        <dl className="mt-14 grid max-w-4xl grid-cols-2 gap-x-8 gap-y-6 border-t border-white/25 pt-8 sm:grid-cols-3 lg:grid-cols-5">
          {liczby.map((pozycja) => (
            <div key={pozycja.etykieta}>
              <dt className="sr-only">{pozycja.etykieta}</dt>
              <dd>
                <span className="block font-heading text-3xl font-semibold text-white sm:text-4xl">
                  {pozycja.wartosc}
                </span>
                <span className="mt-1 block text-sm text-white/75">{pozycja.etykieta}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <a
        href="#odkrywaj"
        aria-label="Przewiń do treści"
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 rounded-full p-2 text-white/70 transition-colors hover:text-white lg:block"
      >
        <ChevronDown className="size-6 motion-safe:animate-bounce" aria-hidden />
      </a>
    </section>
  )
}
