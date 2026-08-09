import type { MetadataRoute } from 'next'

import { PORTAL } from '@/lib/konfiguracja'

/**
 * Manifest witryny.
 *
 * **Co to daje.** Telefon dodany do ekranu głównego dostaje wtedy właściwą
 * ikonę i nazwę zamiast zrzutu strony z adresem pod spodem, a przeglądarka
 * barwi pasek stanu kolorem marki. Bez manifestu ikona 512 px, która leży
 * w zasobach od początku, nie była w ogóle używana.
 *
 * **Dlaczego to nie jest aplikacja.** `display: browser`, nie `standalone` —
 * i to jest decyzja, nie przeoczenie. Portal ma **prawdziwą** aplikację
 * w App Store i udawanie drugiej byłoby myleniem ludzi: ktoś, kto doda stronę
 * do ekranu głównego, dostałby coś wyglądającego jak aplikacja, ale bez map
 * offline, nawigacji i nagrywania trasy. Manifest ma tu jedno zadanie —
 * porządną ikonę skrótu — a nie podszywanie się pod to, co portal reklamuje.
 *
 * Next.js serwuje ten plik pod adresem `/manifest.webmanifest` i sam dokłada
 * odnośnik w nagłówku każdej strony.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PORTAL.nazwa} — przewodnik po Pieninach`,
    short_name: PORTAL.nazwa,
    description: PORTAL.opis,
    lang: 'pl',
    start_url: '/',
    scope: '/',
    display: 'browser',

    /*
      Barwy z palety marki, przeliczone na zapis szesnastkowy — manifest nie
      rozumie zapisu oklch, którego używa arkusz stylów. Tło jest kremowe jak
      `kamien-50`, a barwa motywu to ciemna zieleń `las-900` z nagłówka panelu
      i stopki.
    */
    background_color: '#fbfaf8',
    theme_color: '#14342a',

    icons: [
      { src: '/marka/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/marka/favicon-512.png', sizes: '512x512', type: 'image/png' },
      /*
        Wariant „maskable" pozwala Androidowi przyciąć ikonę do kształtu
        obowiązującego w danym systemie — okrągłego, zaokrąglonego kwadratu
        albo kropli. Nasz znak jest kaflem z monogramem pośrodku, więc znosi
        przycięcie bez utraty czytelności.
      */
      { src: '/marka/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
