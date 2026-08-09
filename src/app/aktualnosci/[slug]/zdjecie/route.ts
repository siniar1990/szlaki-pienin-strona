import { NextResponse } from 'next/server'

import { pobierzWiadomosc } from '@/lib/wiadomosci/zapytania'

/**
 * Zdjęcie główne notki jako zwykły obrazek pod własnym adresem.
 *
 * **Po co to istnieje.** Zdjęcia notek są zapisane w bazie jako `data:` URL —
 * decyzja świadoma i dobra dla panelu, ale nie do pogodzenia z wymaganiami
 * wyszukiwarek i serwisów społecznościowych. `og:image` i `NewsArticle.image`
 * muszą wskazywać adres, spod którego da się obrazek POBRAĆ; ciąg
 * `data:image/jpeg;base64,...` nie jest takim adresem. Bez tej trasy notka
 * wklejona na Facebooka pokazywałaby się jako goły tytuł, a Google nie miałby
 * czego wziąć do wyników z obrazkiem.
 *
 * **Dlaczego nie przeniesienie zdjęć do magazynu plików.** Bo to ta sama
 * decyzja co przy tabliczkach: kolejna usługa do skonfigurowania, kolejny
 * klucz i kolejne miejsce, z którego dane mogą zniknąć niezależnie od bazy.
 * Ta trasa daje adres pobierania bez żadnego z tych kosztów, a gdyby kiedyś
 * zdjęć zrobiło się dużo, przeniesienie ich będzie jedną migracją i podmianą
 * treści tej funkcji.
 */
export const dynamic = 'force-dynamic'

/** Rok w pamięci podręcznej — zdjęcie notki nie zmienia się po publikacji. */
const PAMIEC_PODRECZNA = 'public, max-age=31536000, immutable'

export async function GET(
  _zadanie: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const wiadomosc = await pobierzWiadomosc(slug)

  if (!wiadomosc?.zdjecie) {
    return new NextResponse('Brak zdjęcia', { status: 404 })
  }

  /*
    Rozkładamy `data:` URL na typ i zawartość. Format jest ustalony przez nas
    przy zapisie (płótno w przeglądarce zawsze daje `data:image/jpeg;base64,`),
    więc wzorzec jest tu wystarczający — a niepasujące dane traktujemy jak brak
    zdjęcia zamiast odsyłać uszkodzony plik.
  */
  const dopasowanie = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(wiadomosc.zdjecie)
  if (!dopasowanie) {
    return new NextResponse('Nieprawidłowy format zdjęcia', { status: 404 })
  }

  const [, typ, zawartosc] = dopasowanie
  const bajty = Buffer.from(zawartosc, 'base64')

  return new NextResponse(new Uint8Array(bajty), {
    headers: {
      'content-type': typ,
      'content-length': String(bajty.length),
      'cache-control': PAMIEC_PODRECZNA,
    },
  })
}
