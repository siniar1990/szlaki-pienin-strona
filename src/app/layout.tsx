import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'

import { Naglowek } from '@/components/uklad/naglowek'
import { Stopka } from '@/components/uklad/stopka'
import { PORTAL } from '@/lib/konfiguracja'

import './globals.css'

/**
 * Dwa kroje, każdy do czego innego.
 *
 * Fraunces — nagłówki. Jest to współczesna antykwa o miękkim rysunku; nadaje
 * stronie ton przewodnika, a nie panelu administracyjnego. Ma oś optyczną,
 * więc wielkie napisy w sekcji powitalnej dostają cieńsze szeryfy niż małe
 * śródtytuły i całość wygląda na złożoną ręcznie.
 *
 * Dwa kroje, nie trzy. Był tu jeszcze Anton do wielkich wersalików —
 * zadeklarowany, wczytywany na KAŻDEJ podstronie i nieużyty ani razu.
 * Czterdzieści osiem kilobajtów pobierane po to, żeby nic nie narysować.
 * Font, którego nie widać, jest najdroższą rzeczą, jaką można mieć w stronie.
 *
 * Inter — wszystko, co się czyta i klika. Nudny w najlepszym sensie: świetnie
 * czytelny w małych stopniach, ma komplet polskich znaków i cyfry o równej
 * szerokości, dzięki czemu tabela z kilometrami nie skacze.
 *
 * `latin-ext` jest tu obowiązkowy — bez niego „ą", „ł" i „ż" wypadłyby
 * z kroju i przeglądarka podstawiłaby je z innego, co widać na kilometr.
 */
const naglowkowy = Fraunces({
  variable: '--font-naglowek',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const tekstowy = Inter({
  variable: '--font-tekst',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})


export const metadata: Metadata = {
  // `metadataBase` sprawia, że względne adresy obrazów w OpenGraph zamieniają
  // się w pełne — bez tego podgląd linku na Facebooku zostaje bez grafiki.
  metadataBase: new URL(PORTAL.adres),

  /*
    Potwierdzenie własności witryny w Google Search Console.

    Znacznik pojawia się tylko wtedy, gdy zmienna jest ustawiona — pusty
    `<meta name="google-site-verification">` byłby gorszy niż jego brak,
    bo Google odrzuciłby potwierdzenie i nie powiedział dlaczego.

    Sam znacznik nie daje Google'owi żadnego dostępu do portalu; mówi
    wyłącznie „ta witryna należy do konta, które zna ten kod".
  */
  verification: process.env.GOOGLE_WERYFIKACJA
    ? { google: process.env.GOOGLE_WERYFIKACJA }
    : undefined,
  title: {
    default: `${PORTAL.nazwa} — przewodnik po Pieninach`,
    // Podstrony podają własny tytuł, a ten szablon dokleja markę.
    template: `%s — ${PORTAL.nazwa}`,
  },
  description: PORTAL.opis,
  applicationName: PORTAL.nazwa,
  authors: [{ name: PORTAL.nazwa, url: PORTAL.adres }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: PORTAL.nazwa,
    url: PORTAL.adres,
    title: `${PORTAL.nazwa} — przewodnik po Pieninach`,
    description: PORTAL.opis,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PORTAL.nazwa} — przewodnik po Pieninach`,
    description: PORTAL.opis,
  },
  icons: {
    // Trzy rozmiary, bo trafiają w trzy różne miejsca: 32 px to karta
    // przeglądarki, 192 px — ikona na ekranie głównym Androida, a SVG
    // przyda się wszędzie tam, gdzie liczy się ostrość przy powiększeniu.
    icon: [
      { url: '/marka/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/marka/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/marka/ikona-app.svg', type: 'image/svg+xml' },
    ],
    apple: '/marka/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

/**
 * Barwa paska przeglądarki na telefonie.
 *
 * Musi mieszkać w `viewport`, a nie w `metadata` — Next.js przeniósł tam to
 * pole i w metadanych jest po prostu ignorowane. Wartość ta sama, co
 * `theme_color` w manifeście: gdyby się rozjechały, pasek migałby przy
 * przejściu ze skrótu na ekranie głównym do zwykłej karty.
 */
export const viewport: Viewport = {
  themeColor: '#14342a',
}

export default function UkladGlowny({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pl"
      className={`${tekstowy.variable} ${naglowkowy.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background">
        {/*
          Skrót dla osób korzystających z klawiatury i czytników ekranu:
          pierwszy Tab na stronie pozwala przeskoczyć całe menu. Widoczny
          dopiero po dojściu do niego fokusem, więc nikomu nie przeszkadza.
          WCAG 2.2, kryterium 2.4.1.
        */}
        <a
          href="#tresc"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-las-700 focus:px-5 focus:py-3 focus:text-white focus:shadow-wysoki"
        >
          Przejdź do treści
        </a>

        <Naglowek />
        <main id="tresc" className="flex-1">
          {children}
        </main>
        <Stopka />
      </body>
    </html>
  )
}
