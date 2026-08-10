import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
    Portal przestał być eksportem statycznym.

    Powód jest jeden: system kodów QR musi wykonać kod przy żądaniu — odczytać
    tabliczkę z bazy, rozpoznać platformę i przekierować. Zbiór plików na
    GitHub Pages nie potrafi żadnej z tych rzeczy.

    Strony treściowe (trasy, atrakcje, kolekcje) nadal powstają przy budowaniu,
    bo mają `generateStaticParams` i nie zależą od żądania. Zmienia się tylko
    to, że obok nich mogą teraz stać trasy dynamiczne.
  */

  // Optymalizacja obrazów wraca — na serwerze jest kto ją wykonać. Zdjęcia ze
  // stocku i zrzuty z aplikacji dostaną warianty dopasowane do ekranu.
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Adresy bez ukośnika na końcu: /szlaki/sokolica, nie /szlaki/sokolica/.
  trailingSlash: false,

  // Błędy typów zatrzymują publikację — to ostatnia bariera przed wypuszczeniem
  // zepsutej strony na produkcję.
  typescript: { ignoreBuildErrors: false },

  // W katalogu domowym leży przypadkowy package-lock.json i Turbopack bierze
  // go za korzeń projektu. Wskazujemy wprost, gdzie jest nasz.
  turbopack: { root: __dirname },

  experimental: {
    serverActions: {
      /*
        Domyślny limit akcji serwerowej to jeden megabajt — i to on wywracał
        zapis notki ze zdjęciem. Zdjęcia panelu jadą jako `data:` URL wewnątrz
        formularza, a zdjęcie gęste w szczegóły potrafiło po zakodowaniu
        przekroczyć megabajt. Next odrzucał wtedy całe żądanie kodem 413,
        zanim wykonał jakikolwiek nasz kod, więc nie było jak pokazać błędu
        przy polu — przeglądarka dostawała biały ekran „This page couldn't
        load".

        Właściwą naprawą jest dociskanie zdjęcia w przeglądarce do 900 kB
        (`src/lib/panel/zdjecie.ts`); ta wartość jest drugą linią, na wypadek
        gdyby kiedyś do formularza doszło duże pole tekstowe. Trzymamy ją
        wyraźnie ponad limitem walidacji, żeby o odrzuceniu decydował nasz
        komunikat, a nie milczący błąd transportu.

        Wyżej niż 4 MB nie ma sensu: funkcje na Vercelu i tak nie przyjmą
        żądania większego niż 4,5 MB.
      */
      bodySizeLimit: '3mb',
    },
  },

  async redirects() {
    return [
      /*
        Adresy z rozszerzeniem `.html` istniały, dopóki portal był eksportem
        statycznym — Next zapisywał wtedy `prywatnosc.html` jako plik na dysku.
        Oba są podane w App Store Connect jako polityka prywatności i wsparcie
        aplikacji, więc muszą działać bez końca. Bez tych dwóch przekierowań
        Apple dostałby 404 przy najbliższym sprawdzeniu.
      */
      { source: '/prywatnosc.html', destination: '/prywatnosc', permanent: true },
      { source: '/wsparcie.html', destination: '/wsparcie', permanent: true },
      /*
        Wpis „Jazda konna i przejażdżki bryczką" rozpadł się na dwa osobne —
        to dwie różne rzeczy, robione przez różne osoby i z różnych powodów.
        Stary adres prowadzi do jazdy konnej, żeby nie zostawiać 404 komuś,
        kto ma go w zakładkach albo w wynikach wyszukiwania.
      */
      {
        source: '/atrakcje/jazda-konna-i-bryczki',
        destination: '/atrakcje/jazda-konna',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
