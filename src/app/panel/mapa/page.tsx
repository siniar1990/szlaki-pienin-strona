import type { Metadata } from 'next'

import { MapaTabliczek } from '@/components/panel/mapa-tabliczek'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { pobierzKodyNaMape } from '@/lib/qr/statystyki'

export const metadata: Metadata = {
  title: 'Mapa tabliczek',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StronaMapyPanelu() {
  // Liczniki przy punktach biorą się z agregacji, a ta nie chodzi po każdym
  // skanie. Bez tego wywołania mapa pokazywałaby stan sprzed ostatniego
  // przeliczenia — czyli, przy pechowym trafieniu, sprzed nocy.
  await przeliczJesliTrzeba()
  const kody = await pobierzKodyNaMape()

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Mapa tabliczek</h1>
      <p className="mt-2 text-kamien-600">
        {kody.length === 0
          ? 'Żadna tabliczka nie ma jeszcze ustalonego położenia. Uzupełnij współrzędne, żeby pojawiła się na mapie.'
          : `${kody.length} tabliczek z ustalonym położeniem. Liczba przy punkcie to skany, a im ciemniejsza zieleń, tym większy ruch.`}
      </p>

      {kody.length > 0 && <Legenda />}

      <div className="mt-8">
        <MapaTabliczek kody={kody} />
      </div>
    </>
  )
}

/**
 * Legenda barw. Skala zieleni jest względna — najciemniejszy odcień należy do
 * tabliczki z największym ruchem, nie do jakiegoś ustalonego progu. Bez tego
 * wyjaśnienia ciemna kropka wyglądałaby na obiektywną ocenę, a jest tylko
 * porównaniem z resztą.
 */
function Legenda() {
  const pozycje: { kolor: string; opis: string }[] = [
    { kolor: '#cbd5e1', opis: 'aktywna, bez skanów' },
    { kolor: 'hsl(152 45% 52%)', opis: 'umiarkowany ruch' },
    { kolor: 'hsl(152 45% 28%)', opis: 'najwięcej skanów' },
    { kolor: '#94a3b8', opis: 'nieaktywna lub w zapasie' },
  ]

  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-kamien-600">
      {pozycje.map((p) => (
        <li key={p.opis} className="flex items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: p.kolor }}
            aria-hidden
          />
          {p.opis}
        </li>
      ))}
    </ul>
  )
}
