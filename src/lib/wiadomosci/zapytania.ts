import { unstable_cache } from 'next/cache'

import { baza } from '@/lib/baza'

/**
 * Odczyt aktualności dla stron publicznych.
 *
 * **Dlaczego z pamięcią podręczną.** Strona główna i lista aktualności to
 * najczęściej odwiedzane adresy portalu, a treść zmienia się wtedy, gdy
 * administrator coś opublikuje — czyli najwyżej raz dziennie. Odpytywanie
 * bazy przy każdym wejściu byłoby płaceniem czasem odpowiedzi za dane, które
 * i tak się nie zmieniły. Wpis unieważnia publikacja, więc opóźnienia nie ma.
 *
 * **Dlaczego strony publiczne NIGDY nie dostają zdjęcia.** Zdjęcie jest
 * w bazie jako `data:` URL. Podane do komponentu trafia w całości do HTML-a —
 * i to dwa razy, bo raz w znaczniku obrazka, a drugi w ładunku, z którego
 * React odtwarza stronę w przeglądarce. Megabajtowa fotografia na trzech
 * kartach zamieniła stronę główną w dokument ważący 3,4 MB, a czas do
 * największego elementu urósł do szesnastu sekund na telefonie.
 *
 * Dlatego odczyty zwracają wyłącznie `maZdjecie`, a strony sięgają po obraz
 * pod adresem `/aktualnosci/<slug>/zdjecie` — czyli tą samą trasą, którą
 * i tak musiały dostać wyszukiwarki i Facebook. Przeglądarka pobiera go
 * osobnym żądaniem, zapamiętuje na rok i wczytuje leniwie.
 */

export const ZNACZNIK_WIADOMOSCI = 'wiadomosci'

/**
 * Ożywienie dat po odczycie z pamięci podręcznej.
 *
 * **To jest naprawa błędu, który ujawnił się dopiero przy pierwszej
 * opublikowanej notce.** `unstable_cache` zapisuje wynik w postaci
 * szeregowanej, a szeregowanie zamienia obiekt `Date` w napis. Przy pierwszym
 * wywołaniu funkcja liczy wynik na świeżo i zwraca prawdziwe daty; przy
 * każdym następnym wynik wraca z pamięci — i `opublikowano` jest już napisem.
 * Strona notki wołała na nim `toISOString()` i cała podstrona kończyła się
 * błędem 500.
 *
 * Dlaczego nie było tego widać wcześniej: dopóki nie było ani jednej
 * opublikowanej notki, żadna data nie przechodziła przez pamięć podręczną.
 * Błąd czekał na pierwszą publikację.
 *
 * Ożywienie musi dziać się POZA funkcją opakowaną w `unstable_cache` —
 * w środku wykonałoby się raz, przed zapisaniem do pamięci, i nic by nie dało.
 */
function data(wartosc: Date | string): Date {
  return wartosc instanceof Date ? wartosc : new Date(wartosc)
}

function dataAlboNull(wartosc: Date | string | null): Date | null {
  return wartosc === null ? null : data(wartosc)
}

/**
 * Odczyt, który nie wywraca wdrożenia.
 *
 * Strona główna i lista aktualności powstają przy budowaniu, więc budowanie
 * łączy się z bazą. Gdyby baza akurat nie odpowiadała, całe wdrożenie portalu
 * kończyłoby się błędem — przez dział, który jest jego najmniejszą częścią.
 * Pusty wynik jest tu właściwą odpowiedzią: sekcja aktualności po prostu się
 * nie pokaże, a pierwsza publikacja unieważni wpis i wszystko wróci.
 */
async function bezpiecznie<T>(zapytanie: () => Promise<T>, zapasowo: T): Promise<T> {
  try {
    return await zapytanie()
  } catch (blad) {
    console.error('Odczyt aktualności nie powiódł się:', blad)
    return zapasowo
  }
}

export type WiadomoscNaLiscie = {
  slug: string
  tytul: string
  lid: string
  /** Czy notka ma zdjęcie. Sam obraz idzie osobną trasą — patrz nagłówek. */
  maZdjecie: boolean
  zdjecieOpis: string | null
  opublikowano: Date
  /** Data istotnej zmiany treści, jeśli notka była poprawiana po publikacji. */
  zaktualizowano: Date | null
}

export type WiadomoscPelna = WiadomoscNaLiscie & {
  tresc: string
  zrodloNazwa: string | null
  zrodloAdres: string | null
}

const pobierzWiadomosciZPamieci = unstable_cache(
  async (ile = 30): Promise<WiadomoscNaLiscie[]> =>
    bezpiecznie(async () => {
      const wiersze = await baza.wiadomosc.findMany({
        where: { stan: 'OPUBLIKOWANA', opublikowano: { not: null } },
        orderBy: { opublikowano: 'desc' },
        take: ile,
        /*
          `zdjecie` NIE jest tu wybierane. Baza zwróciłaby megabajty tekstu
          po to, żeby ustalić, czy obraz istnieje — a to samo mówi warunek
          `not: null` policzony po stronie bazy.
        */
        select: {
          slug: true,
          tytul: true,
          lid: true,
          zdjecieOpis: true,
          opublikowano: true,
          zaktualizowano: true,
        },
      })

      const zeZdjeciem = new Set(
        (
          await baza.wiadomosc.findMany({
            where: { stan: 'OPUBLIKOWANA', zdjecie: { not: null } },
            select: { slug: true },
          })
        ).map((wiersz) => wiersz.slug),
      )

      // `opublikowano` jest w bazie opcjonalne, ale warunek wyżej gwarantuje
      // wartość — zawężenie typu robimy tutaj, żeby strony nie musiały.
      return wiersze.map((wiersz) => ({
        ...wiersz,
        maZdjecie: zeZdjeciem.has(wiersz.slug),
        opublikowano: wiersz.opublikowano as Date,
      }))
    }, []),
  ['wiadomosci-lista'],
  { tags: [ZNACZNIK_WIADOMOSCI] },
)

const pobierzWiadomoscZPamieci = unstable_cache(
  async (slug: string): Promise<WiadomoscPelna | null> =>
    bezpiecznie(async () => {
      const wiersz = await baza.wiadomosc.findFirst({
        where: { slug, stan: 'OPUBLIKOWANA', opublikowano: { not: null } },
        select: {
          slug: true,
          tytul: true,
          lid: true,
          tresc: true,
          zdjecieOpis: true,
          opublikowano: true,
          zaktualizowano: true,
          zrodloNazwa: true,
          zrodloAdres: true,
          // Sama obecność, nie zawartość — Prisma nie umie zwrócić „czy pole
          // nie jest puste", więc bierzemy je osobnym, wąskim zapytaniem.
        },
      })
      if (!wiersz) return null

      const zdjecie = await baza.wiadomosc.findFirst({
        where: { slug, zdjecie: { not: null } },
        select: { slug: true },
      })

      return { ...wiersz, maZdjecie: zdjecie !== null, opublikowano: wiersz.opublikowano as Date }
    }, null),
  ['wiadomosc-jedna'],
  { tags: [ZNACZNIK_WIADOMOSCI] },
)

const pobierzSlugiZPamieci = unstable_cache(
  async (): Promise<{ slug: string; opublikowano: Date; zaktualizowano: Date | null }[]> =>
    bezpiecznie(async () => {
      const wiersze = await baza.wiadomosc.findMany({
        where: { stan: 'OPUBLIKOWANA', opublikowano: { not: null } },
        orderBy: { opublikowano: 'desc' },
        select: { slug: true, opublikowano: true, zaktualizowano: true },
      })
      return wiersze.map((wiersz) => ({ ...wiersz, opublikowano: wiersz.opublikowano as Date }))
    }, []),
  ['wiadomosci-slugi'],
  { tags: [ZNACZNIK_WIADOMOSCI] },
)

/* ── Opakowania ożywiające daty ─────────────────────────────────────────── */

/** Najnowsze opublikowane notki. */
export async function pobierzWiadomosci(ile = 30): Promise<WiadomoscNaLiscie[]> {
  const wiersze = await pobierzWiadomosciZPamieci(ile)
  return wiersze.map((wiersz) => ({
    ...wiersz,
    opublikowano: data(wiersz.opublikowano),
    zaktualizowano: dataAlboNull(wiersz.zaktualizowano),
  }))
}

export async function pobierzWiadomosc(slug: string): Promise<WiadomoscPelna | null> {
  const wiersz = await pobierzWiadomoscZPamieci(slug)
  if (!wiersz) return null

  return {
    ...wiersz,
    opublikowano: data(wiersz.opublikowano),
    zaktualizowano: dataAlboNull(wiersz.zaktualizowano),
  }
}

/** Same adresy — do mapy witryny. */
export async function pobierzSlugiWiadomosci(): Promise<
  { slug: string; opublikowano: Date; zaktualizowano: Date | null }[]
> {
  const wiersze = await pobierzSlugiZPamieci()
  return wiersze.map((wiersz) => ({
    ...wiersz,
    opublikowano: data(wiersz.opublikowano),
    zaktualizowano: dataAlboNull(wiersz.zaktualizowano),
  }))
}

/**
 * Adres, pod którym leży zdjęcie notki.
 *
 * Jedno miejsce dla stron, znaczników Open Graph i kanału RSS — inaczej ta
 * sama ścieżka byłaby wpisana w czterech plikach i przy zmianie trzeba by
 * pamiętać o wszystkich.
 */
export function adresZdjecia(slug: string): string {
  return `/aktualnosci/${slug}/zdjecie`
}

/**
 * Sam obraz notki, wyłącznie dla trasy, która go oddaje.
 *
 * Świadomie poza `pobierzWiadomosc`: tamta funkcja obsługuje strony i jej
 * wynik trafia do HTML-a, więc nie ma prawa nieść megabajtowego napisu.
 */
export async function pobierzZdjecieNotki(slug: string): Promise<string | null> {
  return bezpiecznie(async () => {
    const wiersz = await baza.wiadomosc.findFirst({
      where: { slug, stan: 'OPUBLIKOWANA' },
      select: { zdjecie: true },
    })
    return wiersz?.zdjecie ?? null
  }, null)
}

/** Rozbija treść na akapity. Pusta linia rozdziela, puste wpisy odpadają. */
export function akapity(tresc: string): string[] {
  return tresc
    .split(/\n{2,}/)
    .map((akapit) => akapit.trim())
    .filter(Boolean)
}

/** Data po polsku, w formie używanej na kartach. */
export function dataPolska(data: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Warsaw',
  }).format(data)
}

/**
 * Data z godziną — na stronie pojedynczej notki.
 *
 * Dział informacyjny bez godziny publikacji jest o połowę mniej wiarygodny:
 * przy komunikacie o zamknięciu szlaku różnica między „rano" a „wieczorem"
 * decyduje o tym, czy informacja jest jeszcze aktualna. Czas liczony w strefie
 * warszawskiej, bo o niej myśli czytelnik.
 */
export function dataZGodzina(data: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw',
  }).format(data)
}

/**
 * Data ostatniej istotnej zmiany — do `lastmod` i `dateModified`.
 *
 * Świadomie NIE bierzemy pola `zmieniono`, które baza uaktualnia przy każdym
 * zapisie. Poprawka literówki nie jest zmianą, o której warto powiadamiać
 * wyszukiwarkę; wysyłanie takiego sygnału przy każdym drobiazgu uczy ją, że
 * nasze sygnały zmiany nic nie znaczą.
 */
export function ostatniaZmiana(wiadomosc: {
  opublikowano: Date
  zaktualizowano: Date | null
}): Date {
  return wiadomosc.zaktualizowano ?? wiadomosc.opublikowano
}
