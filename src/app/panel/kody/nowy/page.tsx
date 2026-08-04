import type { Metadata } from 'next'
import Link from 'next/link'

import { utworzKod } from '@/app/panel/dzialania'
import { FormularzKodu } from '@/components/panel/formularz-kodu'
import { nastepnyKod } from '@/lib/qr/nastepny-kod'

export const metadata: Metadata = {
  title: 'Nowa tabliczka',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StronaNowegoKodu() {
  // Identyfikator pokazujemy zawczasu, żeby administrator wiedział, co
  // powstanie — nadaje go system, nie człowiek.
  const kod = await nastepnyKod()

  return (
    <>
      <Link href="/panel/kody" className="text-sm text-kamien-500 hover:text-las-700">
        ← Wszystkie tabliczki
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-kamien-900">Nowa tabliczka</h1>
      <p className="mt-2 text-kamien-600">
        Otrzyma identyfikator <span className="font-mono font-semibold">{kod}</span> i adres{' '}
        <span className="font-mono">szlakipienin.pl/qr/{kod}</span>.
      </p>

      <div className="mt-8">
        <FormularzKodu akcja={utworzKod} etykietaPrzycisku="Utwórz tabliczkę" />
      </div>
    </>
  )
}
