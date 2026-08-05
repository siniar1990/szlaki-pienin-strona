import type { Metadata } from 'next'

import { MapaTabliczek } from '@/components/panel/mapa-tabliczek'
import { ZakresDat } from '@/components/panel/zakres-dat'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { pobierzKodyNaMape } from '@/lib/qr/statystyki'
import { odczytajZakres } from '@/lib/qr/zakres'
import { wygladZnacznika } from '@/lib/qr/wyglad-znacznika'

export const metadata: Metadata = {
  title: 'Mapa tabliczek',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StronaMapyPanelu({ searchParams }: PageProps<'/panel/mapa'>) {
  const zakres = odczytajZakres((await searchParams).zakres)

  // Liczniki przy punktach biorą się z agregacji, a ta nie chodzi po każdym
  // skanie. Bez tego wywołania mapa pokazywałaby stan sprzed ostatniego
  // przeliczenia — czyli, przy pechowym trafieniu, sprzed nocy.
  await przeliczJesliTrzeba()
  const kody = await pobierzKodyNaMape(zakres)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">Mapa tabliczek</h1>
        <ZakresDat sciezka="/panel/mapa" aktywny={zakres} />
      </div>
      <p className="mt-2 text-kamien-600">
        {kody.length === 0
          ? 'Żadna tabliczka nie ma jeszcze ustalonego położenia. Uzupełnij współrzędne, żeby pojawiła się na mapie.'
          : `${kody.length} tabliczek z ustalonym położeniem. Liczba przy punkcie to skany ${zakres.opis}, a im większa kropka, tym większy ruch.`}
      </p>

      {kody.length > 0 && <Legenda najwiecej={Math.max(1, ...kody.map((k) => k.liczbaSkanow))} />}

      <div className="mt-8">
        <MapaTabliczek kody={kody} />
      </div>
    </>
  )
}

/**
 * Legenda.
 *
 * Skala jest **względna**: największa kropka należy do tabliczki z największym
 * ruchem w wybranym zakresie, a nie do jakiegoś ustalonego progu. Bez tego
 * zdania duża kropka wyglądałaby na obiektywną ocenę, a jest tylko porównaniem
 * z resztą — i zmienia znaczenie przy każdej zmianie zakresu.
 *
 * Wielkości liczy ta sama funkcja, która rysuje znaczniki. Gdyby legenda miała
 * własne, rozjechałyby się przy pierwszej zmianie skali i legenda kłamałaby
 * tym pewniej, im dłużej nikt by jej nie sprawdzał.
 */
function Legenda({ najwiecej }: { najwiecej: number }) {
  const pozycje = [
    { ...wygladZnacznika(0, najwiecej, 'AKTYWNY'), opis: 'wisi, ale bez skanów' },
    { ...wygladZnacznika(Math.max(1, Math.round(najwiecej / 8)), najwiecej, 'AKTYWNY'), opis: 'niewielki ruch' },
    { ...wygladZnacznika(najwiecej, najwiecej, 'AKTYWNY'), opis: `najwięcej skanów (${najwiecej})` },
    { ...wygladZnacznika(0, najwiecej, 'ZAPAS'), opis: 'nieaktywna lub w zapasie' },
  ]

  return (
    <ul className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-kamien-600">
      {pozycje.map((p) => (
        <li key={p.opis} className="flex items-center gap-2.5">
          {/* Stała szerokość pola na kropkę, żeby podpisy nie przeskakiwały
              w bok wraz ze zmianą jej średnicy. */}
          <span className="flex w-9 shrink-0 justify-center" aria-hidden>
            <span
              className="shrink-0 rounded-full shadow-sm"
              style={{
                width: `${p.rozmiar}px`,
                height: `${p.rozmiar}px`,
                backgroundColor: p.kolor,
                border: `${Math.max(2, Math.round(p.rozmiar / 7))}px solid ${p.obrys}`,
              }}
            />
          </span>
          {p.opis}
        </li>
      ))}
    </ul>
  )
}
