import type { Metadata } from 'next'

import { MapaTabliczek } from '@/components/panel/mapa-tabliczek'
import { pobierzKodyNaMape } from '@/lib/qr/statystyki'

export const metadata: Metadata = {
  title: 'Mapa tabliczek',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StronaMapyPanelu() {
  const kody = await pobierzKodyNaMape()

  return (
    <>
      <h1 className="font-heading text-2xl font-semibold text-kamien-900">Mapa tabliczek</h1>
      <p className="mt-2 text-kamien-600">
        {kody.length === 0
          ? 'Żadna tabliczka nie ma jeszcze ustalonego położenia. Uzupełnij współrzędne, żeby pojawiła się na mapie.'
          : `${kody.length} tabliczek z ustalonym położeniem. Wielkość znacznika odpowiada liczbie skanów.`}
      </p>

      <div className="mt-8">
        <MapaTabliczek kody={kody} />
      </div>
    </>
  )
}
