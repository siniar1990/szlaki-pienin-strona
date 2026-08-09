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
