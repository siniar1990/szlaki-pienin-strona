import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import sharp from 'sharp'

import { zdjecieAtrakcji } from '@/lib/dane/zdjecia-atrakcji'
import { toFotografia } from '@/lib/dane/zdjecia-tras'
import { zdjecieMiejscowosci } from '@/lib/dane/zdjecia-miejscowosci'
import { pobierzTrasy } from '@/lib/dane/zrodlo'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'
import { MIEJSCOWOSCI, znajdzMiejscowosc } from '@/lib/tresc/miejscowosci'

/**
 * Zdjęcia do kart Open Graph.
 *
 * **Po co osobna trasa, skoro zdjęcia już leżą w `public/`.** Bo leżą w WebP,
 * a to jest format dla przeglądarki, nie dla cudzych robotów. Facebook
 * i WhatsApp radzą sobie z nim dziś dobrze, ale LinkedIn bywa na niego ślepy —
 * a przy karcie bez grafiki nie ma jak się zorientować, że coś nie działa.
 * Tutaj wychodzi zawsze JPEG 1200 × 630, czyli to, czego oczekują wszyscy.
 *
 * **Dlaczego nie skopiowane pliki w repozytorium.** Sto pięć zdjęć razy sto
 * kilkadziesiąt kilobajtów to trzynaście megabajtów duplikatów, które trzeba
 * pamiętać, żeby przegenerować po każdej podmianie zdjęcia. Ta trasa liczy je
 * przy budowaniu z tych samych plików, z których żyje reszta portalu, więc
 * wgranie nowego zdjęcia atrakcji wystarcza — tak jak wszędzie indziej.
 *
 * **Dlaczego kadr 1,91:1 zamiast pełnego zdjęcia.** Bo taką proporcję pokazują
 * Facebook, LinkedIn i X. Obraz w innej zostaje przez nie przycięty i nigdy
 * nie wiadomo gdzie; lepiej przyciąć samemu, po najbardziej kontrastowym
 * miejscu kadru.
 */

export const dynamic = 'force-static'

const SZEROKOSC = 1200
const WYSOKOSC = 630

/** Rok w pamięci podręcznej — zdjęcie pod danym adresem się nie zmienia. */
const PAMIEC_PODRECZNA = 'public, max-age=31536000, immutable'

/**
 * Skąd wziąć zdjęcie źródłowe dla danego rodzaju strony.
 *
 * Zamknięty zbiór trzech rodzajów, a nie dowolna ścieżka w adresie. Trasa
 * przyjmująca ścieżkę pozwalałaby przeczytać dowolny plik z dysku serwera —
 * a lista trzech przypadków i tak pokrywa wszystko, co ma własne zdjęcie.
 */
function zrodloZdjecia(rodzaj: string, slug: string): string | null {
  if (rodzaj === 'atrakcja') return zdjecieAtrakcji(slug)

  if (rodzaj === 'trasa') {
    return pobierzTrasy().find((trasa) => trasa.slug === slug)?.ilustracja ?? null
  }

  if (rodzaj === 'miejscowosc') {
    const miejscowosc = znajdzMiejscowosc(slug)
    return miejscowosc
      ? zdjecieMiejscowosci(miejscowosc.slug, miejscowosc.zdjecieZastepcze)
      : null
  }

  return null
}

export function generateStaticParams() {
  const trasy = pobierzTrasy()
    .filter((trasa) => trasa.ilustracja)
    .map((trasa) => ({ rodzaj: 'trasa', slug: trasa.slug }))

  const atrakcje = ATRAKCJE_TURYSTYCZNE.filter((a) => zdjecieAtrakcji(a.slug)).map((a) => ({
    rodzaj: 'atrakcja',
    slug: a.slug,
  }))

  const miejscowosci = MIEJSCOWOSCI.map((m) => ({ rodzaj: 'miejscowosc', slug: m.slug }))

  return [...trasy, ...atrakcje, ...miejscowosci]
}

export async function GET(
  _zadanie: Request,
  { params }: { params: Promise<{ rodzaj: string; slug: string }> },
) {
  const { rodzaj, slug } = await params
  const zrodlo = zrodloZdjecia(rodzaj, slug)

  /*
    Brak zdjęcia to nie błąd — część tras nie ma ilustracji, a część atrakcji
    zdjęcia. Zwracamy 404, a strona i tak nie wskaże tego adresu: `obrazOG`
    pyta o to samo źródło przed złożeniem metadanych i przy pustym wyniku
    zostawia domyślny obraz portalu.
  */
  if (!zrodlo) return new NextResponse('Brak zdjęcia', { status: 404 })

  try {
    const plik = await readFile(path.join(process.cwd(), 'public', zrodlo))

    /*
      Ilustracje tras są malowane proceduralnie i komponowane wokół horyzontu
      na środku kadru — dla nich przycinamy symetrycznie. Zdjęcia atrakcji
      i miejscowości są zwykłymi fotografiami, w których to, co ważne, bywa
      gdziekolwiek; tam pozwalamy wybrać kadr po najbardziej kontrastowym
      miejscu. Ta sama reguła dla obu psułaby jedną z dwóch grup.

      Dlatego pytamy o źródło, a nie o rodzaj strony: część tras ma już własne
      zdjęcie zamiast rysunku i tym należy się kadrowanie jak fotografii.
    */
    const kadr = toFotografia(zrodlo) || rodzaj !== 'trasa' ? 'attention' : 'centre'

    const jpeg = await sharp(plik)
      .resize(SZEROKOSC, WYSOKOSC, { fit: 'cover', position: kadr })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer()

    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        'content-type': 'image/jpeg',
        'content-length': String(jpeg.length),
        'cache-control': PAMIEC_PODRECZNA,
      },
    })
  } catch (blad) {
    console.error(`Nie udało się przygotować obrazu OG dla ${rodzaj}/${slug}:`, blad)
    return new NextResponse('Nie udało się przygotować obrazu', { status: 404 })
  }
}
