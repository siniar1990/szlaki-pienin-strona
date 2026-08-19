import { pobierzTrase, pobierzTrasy } from '@/lib/dane/zrodlo'
import { htmlKarty } from '@/lib/druk/dokument'

/**
 * Podgląd karty do druku — ten sam dokument, z którego powstaje PDF.
 *
 * Przydaje się w dwóch sytuacjach: przy poprawianiu szablonu, bo widać zmianę
 * bez przepuszczania jej przez generator, i u kogoś, kto woli drukować
 * z przeglądarki niż pobierać plik.
 *
 * **Dlaczego trasa API, a nie strona.** Karta ma być samą kartą — bez nagłówka
 * portalu, bez stopki i bez skryptów. Strona w układzie aplikacji zawsze coś
 * z tego przyniesie, a marginesy `@page` w środku cudzego układu nie działają
 * tak, jak się wydaje.
 */

export const dynamic = 'force-static'

export function generateStaticParams() {
  return pobierzTrasy().map((trasa) => ({ slug: trasa.slug }))
}

export async function GET(
  zadanie: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const trasa = pobierzTrase(slug)
  if (!trasa) return new Response('Nie ma takiej trasy', { status: 404 })

  const adres = new URL(zadanie.url)

  const html = await htmlKarty(trasa, {
    zPodpowiedzia: true,
    // Tryb oszczędny: blok ratunkowy bez ciemnego wypełnienia.
    oszczednie: adres.searchParams.get('oszczedny') === '1',
  })

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Podgląd nie ma trafiać do wyników wyszukiwania — pełną treścią trasy
      // jest jej strona, a nie kartka do złożenia.
      'X-Robots-Tag': 'noindex',
    },
  })
}
