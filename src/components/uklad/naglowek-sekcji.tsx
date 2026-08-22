import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Wspólny nagłówek sekcji na stronie głównej i listach.
 *
 * Nadtytuł jest `<p>`, a nie `<h3>` nad `<h2>` — kolejność nagłówków musi
 * rosnąć o jeden stopień, a taka para łamałaby ją na każdej sekcji i psuła
 * nawigację po nagłówkach w czytnikach ekranu.
 */
export function NaglowekSekcji({
  nadtytul,
  tytul,
  opis,
  odnosnik,
  className,
}: {
  nadtytul?: string
  tytul: string
  opis?: string
  odnosnik?: { adres: string; etykieta: string }
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {/*
          Krótka zielona kreska przed nadtytułem.

          Sekcje na białym tle potrzebowały czegoś, co je zaczyna — bez tego
          nadtytuł zawisa w pustce i pierwsze, co widać, jest sam tekst.
          Kreska kosztuje pięć milimetrów i jest jedynym elementem ozdobnym
          w tym komponencie; wszystko inne niesie treść.
        */}
        {nadtytul && (
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-las-600">
            <span className="h-px w-6 shrink-0 bg-las-400" aria-hidden />
            {nadtytul}
          </p>
        )}
        <h2 className="mt-3 text-sekcja font-semibold text-kamien-900">{tytul}</h2>
        {opis && <p className="mt-4 text-lg leading-relaxed text-kamien-600">{opis}</p>}
      </div>

      {odnosnik && (
        <Link
          href={odnosnik.adres}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-kamien-300 px-5 py-2.5 text-sm font-medium text-kamien-800 transition-colors hover:border-las-600 hover:bg-las-50 hover:text-las-800"
        >
          {odnosnik.etykieta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  )
}
