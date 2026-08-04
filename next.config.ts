import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // GitHub Pages serwuje wyłącznie gotowe pliki — nie ma tam procesu Node,
  // który mógłby cokolwiek policzyć na żądanie. Dlatego cała strona powstaje
  // przy budowaniu: każda trasa, atrakcja i artykuł to plik HTML.
  output: 'export',

  // Bez serwera nie ma kto przeskalować zdjęcia w locie. Ilustracje tras są
  // już w WebP w docelowym rozmiarze, więc optymalizator i tak nie miałby co
  // poprawić — a włączony wysypałby budowanie.
  images: { unoptimized: true },

  // Adresy bez ukośnika na końcu: /szlaki/sokolica, nie /szlaki/sokolica/.
  // Next zapisuje wtedy `szlaki/sokolica.html`, a GitHub Pages sam dokłada
  // rozszerzenie przy wejściu na adres bez niego.
  trailingSlash: false,

  // Błędy typów zatrzymują publikację — to ostatnia bariera przed wypuszczeniem
  // zepsutej strony na produkcję.
  typescript: { ignoreBuildErrors: false },

  // W katalogu domowym leży przypadkowy package-lock.json i Turbopack bierze
  // go za korzeń projektu. Wskazujemy wprost, gdzie jest nasz.
  turbopack: { root: __dirname },
}

export default nextConfig
