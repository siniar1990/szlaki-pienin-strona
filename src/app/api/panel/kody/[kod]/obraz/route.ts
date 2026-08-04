import { NextResponse, type NextRequest } from 'next/server'

import { baza } from '@/lib/baza'
import { kodJakoPng, kodJakoSvg } from '@/lib/qr/generuj-kod'

/**
 * Plik kodu QR do druku.
 *
 * `?format=svg` (domyślnie) albo `?format=png`. SVG do drukarni, bo skaluje się
 * bez utraty ostrości; PNG tam, gdzie ktoś przyjmuje tylko rastry.
 *
 * Obraz generujemy w locie, zamiast trzymać go w bazie czy w plikach. Kod QR
 * jest funkcją adresu, a adres funkcją identyfikatora — przechowywanie wyniku
 * oznaczałoby trzymanie tej samej informacji dwa razy, z ryzykiem, że jedna
 * kopia się zdezaktualizuje.
 */
export async function GET(zadanie: NextRequest, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params

  // Sprawdzamy istnienie, żeby nie generować obrazów dla wymyślonych kodów —
  // wydrukowana tabliczka prowadząca donikąd to najgorszy możliwy błąd.
  const istnieje = await baza.kodQr.findUnique({ where: { kod }, select: { kod: true } })
  if (!istnieje) return NextResponse.json({ blad: 'Nie ma takiej tabliczki' }, { status: 404 })

  const format = zadanie.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'svg'

  if (format === 'png') {
    const png = await kodJakoPng(kod)
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'content-type': 'image/png',
        'content-disposition': `attachment; filename="${kod}.png"`,
        // Kod dla danego identyfikatora nigdy się nie zmieni — może leżeć
        // w pamięci podręcznej przeglądarki dowolnie długo.
        'cache-control': 'private, max-age=31536000, immutable',
      },
    })
  }

  const svg = await kodJakoSvg(kod)
  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'content-disposition': `attachment; filename="${kod}.svg"`,
      'cache-control': 'private, max-age=31536000, immutable',
    },
  })
}
