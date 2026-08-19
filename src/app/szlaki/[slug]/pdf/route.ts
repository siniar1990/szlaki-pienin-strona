import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { pobierzTrase, pobierzTrasy } from '@/lib/dane/zrodlo'

/**
 * Karta trasy jako PDF.
 *
 * Plik jest gotowy — składa go `npm run karty` przy pomocy przeglądarki bez
 * okna i leży w `public/druk/`. Ta trasa tylko go podaje, z nazwą i nagłówkiem
 * pobierania. Żadne żądanie nie uruchamia więc przeglądarki, także pierwsze:
 * karta zmienia się razem z opisem trasy, czyli przy wdrożeniu, a nie
 * w trakcie czyjejś wizyty.
 *
 * **Dlaczego nie odnośnik wprost do pliku w `public/`.** Bo wtedy przeglądarka
 * otwiera PDF w karcie zamiast go zapisać, a nazwa pliku bierze się z adresu.
 * Tu obie rzeczy są nasze: `Content-Disposition` i nazwa z nazwiskiem trasy.
 */

export const dynamic = 'force-static'

export function generateStaticParams() {
  return pobierzTrasy().map((trasa) => ({ slug: trasa.slug }))
}

export async function GET(_zadanie: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!pobierzTrase(slug)) return new Response('Nie ma takiej trasy', { status: 404 })

  const nazwa = `szlaki-pienin-${slug}.pdf`

  let plik: Buffer
  try {
    plik = await readFile(path.join(process.cwd(), 'public', 'druk', nazwa))
  } catch {
    /*
      Karty jeszcze nie zbudowano. Mówimy o tym wprost zamiast oddawać pustkę —
      to stan repozytorium, nie awaria u odwiedzającego, i naprawia go jedno
      polecenie.
    */
    return new Response('Karta tej trasy nie została jeszcze wygenerowana (npm run karty).', {
      status: 404,
    })
  }

  return new Response(new Uint8Array(plik), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nazwa}"`,
      'Content-Length': String(plik.byteLength),
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  })
}
