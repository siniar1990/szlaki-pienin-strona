import type { Metadata } from 'next'

import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import { zdjecieMiejscowosci } from '@/lib/dane/zdjecia-miejscowosci'
import { PORTAL } from '@/lib/konfiguracja'
import { znajdzMiejscowosc } from '@/lib/tresc/miejscowosci'

/**
 * Karta linku — Open Graph i Twitter w jednym miejscu.
 *
 * **Dlaczego pomocnik, a nie obiekt wpisywany na każdej stronie.** Bo Next.js
 * nie scala `openGraph` z układu nadrzędnego z tym ze strony: podanie własnego
 * obiektu ZASTĘPUJE tamten w całości. Strony tras, atrakcji i kolekcji gubiły
 * przez to `og:site_name` i `og:locale` — nie dlatego, że ktoś je usunął,
 * tylko dlatego, że je nadpisał. Tego rodzaju braku nie widać w kodzie strony;
 * widać go dopiero w gotowym HTML-u.
 *
 * **Dlaczego obraz jest tu obowiązkowy w praktyce.** Bo strona bez `og:image`
 * wrzucona na Messengera czy do grupy na Facebooku wygląda jak goły odnośnik,
 * a portal turystyczny żyje z tego, że ktoś podaje go dalej. Dlatego obraz
 * dostaje KAŻDA strona: własne zdjęcie miejsca, a gdy go nie ma — panorama
 * portalu.
 */

/**
 * Domyślny obraz karty linku — panorama Pienin z logo.
 *
 * Powstaje skryptem `narzedzia/generuj-obraz-og.mjs`. Wskazujemy go jawnie,
 * a nie przez plik `src/app/opengraph-image.jpg`, którego Next.js NIE
 * dziedziczy na stronach podających własny obiekt `openGraph` — a robi to
 * u nas większość podstron.
 */
export const OBRAZ_PORTALU = `${PORTAL.adres}/marka/og/portal.jpg`

/** Rodzaje stron, które mają własne zdjęcie do karty linku. */
export type RodzajObrazu = 'trasa' | 'atrakcja' | 'miejscowosc'

/**
 * Adres obrazu OG dla strony — albo `null`, gdy zdjęcia nie ma.
 *
 * Sprawdzamy dostępność zdjęcia TUTAJ, a nie zdajemy się na to, że trasa
 * `/og` odda 404. Wskazanie w `og:image` adresu, który nie działa, jest gorsze
 * niż niewskazanie żadnego: robot nie wraca po domyślny obraz portalu, tylko
 * pokazuje kartę bez grafiki.
 */
export function obrazOG(rodzaj: RodzajObrazu, slug: string): string | null {
  return maZdjecie(rodzaj, slug) ? `${PORTAL.adres}/og/${rodzaj}/${slug}` : null
}

function maZdjecie(rodzaj: RodzajObrazu, slug: string): boolean {
  switch (rodzaj) {
    case 'atrakcja':
      return Boolean(zdjecieAtrakcji(slug))
    case 'miejscowosc': {
      const miejscowosc = znajdzMiejscowosc(slug)
      return Boolean(
        miejscowosc && zdjecieMiejscowosci(miejscowosc.slug, miejscowosc.zdjecieZastepcze),
      )
    }
    case 'trasa':
      /*
        Trasy sprawdza wywołujący — ma już wczytaną trasę i jej `ilustracja`,
        więc pytanie o nią drugi raz oznaczałoby ponowne czytanie całych danych
        tras tylko po to, żeby dowiedzieć się czegoś, co dzwoniący wie.
      */
      return true
  }
}

export type KartaLinku = {
  tytul: string
  opis: string
  /** Ścieżka kanoniczna, np. `/atrakcje/wawoz-homole`. */
  sciezka: string
  /** Gotowy adres obrazu z `obrazOG`; brak podstawia domyślny obraz portalu. */
  obraz?: string | null
  /** `article` dla treści z autorem i datą, `website` dla reszty. */
  typ?: 'website' | 'article'
}

/**
 * Komplet metadanych strony: tytuł, opis, adres kanoniczny i karta linku.
 *
 * Zwraca fragment `Metadata` do rozłożenia w `generateMetadata`, żeby strona
 * mogła dołożyć swoje pola (np. `other` albo `robots`) bez powtarzania tych.
 */
export function metadaneStrony({
  tytul,
  opis,
  sciezka,
  obraz,
  typ = 'website',
}: KartaLinku): Metadata {
  /*
    Każda strona dostaje obraz — własny albo portalu. Zostawienie strony bez
    `og:image` znaczy, że wklejona na Messengera wygląda jak goły odnośnik,
    a portal turystyczny żyje z tego, że ktoś podaje go dalej.
  */
  const adresObrazu = obraz ?? OBRAZ_PORTALU

  return {
    title: tytul,
    description: opis,
    alternates: { canonical: sciezka },
    openGraph: {
      type: typ,
      locale: 'pl_PL',
      siteName: PORTAL.nazwa,
      url: `${PORTAL.adres}${sciezka}`,
      title: tytul,
      description: opis,
      // Wymiary podane wprost: bez nich serwisy społecznościowe muszą najpierw
      // pobrać obraz, żeby poznać proporcje, i przy pierwszym udostępnieniu
      // pokazują kartę bez grafiki.
      images: [{ url: adresObrazu, width: 1200, height: 630, alt: tytul }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tytul,
      description: opis,
      images: [adresObrazu],
    },
  }
}
