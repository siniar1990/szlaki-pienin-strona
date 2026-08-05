import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { FormularzPaczki } from '@/components/panel/formularz-paczki'
import { PobierzKody } from '@/components/panel/pobierz-kody'
import { ZakresDat } from '@/components/panel/zakres-dat'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { pobierzKodyNaListe } from '@/lib/qr/statystyki'
import { odczytajZakres } from '@/lib/qr/zakres'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Tabliczki',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ETYKIETY_STATUSU: Record<string, { tekst: string; klasa: string }> = {
  AKTYWNY: { tekst: 'aktywna', klasa: 'bg-las-50 text-las-800 border-las-200' },
  NIEAKTYWNY: { tekst: 'nieaktywna', klasa: 'bg-kamien-100 text-kamien-600 border-kamien-300' },
  ZAPAS: { tekst: 'zapas', klasa: 'bg-amber-50 text-amber-900 border-amber-200' },
}

/**
 * Czas w formie, w jakiej mówi o nim człowiek.
 *
 * „10 minut temu" niesie inną informację niż „2026-08-05 09:47" — przy
 * pytaniu „czy ta tabliczka żyje" liczy się odległość od teraz, nie data.
 */
function ileTemu(kiedy: Date | null): string {
  if (!kiedy) return 'nigdy'

  const sekundy = Math.floor((Date.now() - kiedy.getTime()) / 1000)
  if (sekundy < 60) return 'przed chwilą'
  if (sekundy < 3600) return `${Math.floor(sekundy / 60)} min temu`
  if (sekundy < 86400) return `${Math.floor(sekundy / 3600)} h temu`
  return `${Math.floor(sekundy / 86400)} dni temu`
}

export default async function StronaKodow({ searchParams }: PageProps<'/panel/kody'>) {
  const zakres = odczytajZakres((await searchParams).zakres)

  // Ta sama zasada co na pulpicie: liczniki mają być prawdziwe w chwili,
  // w której ktoś na nie patrzy.
  await przeliczJesliTrzeba()

  const kody = await pobierzKodyNaListe(zakres)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">
          Tabliczki
          <span className="ml-3 text-base font-normal text-kamien-500">{kody.length}</span>
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <ZakresDat sciezka="/panel/kody" aktywny={zakres} />
          <PobierzKody />
          <FormularzPaczki />
          <Link
            href="/panel/kody/nowy"
            className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
          >
            <Plus className="size-4" aria-hidden />
            Nowa tabliczka
          </Link>
        </div>
      </div>

      {kody.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-kamien-300 p-12 text-center text-kamien-500">
          Nie ma jeszcze żadnej tabliczki. Zacznij od pojedynczej albo wygeneruj paczkę
          do druku.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-kamien-200 bg-white">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="border-b border-kamien-200 text-xs uppercase tracking-wider text-kamien-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Kod</th>
                <th scope="col" className="px-5 py-3 font-semibold">Nazwa</th>
                <th scope="col" className="px-5 py-3 font-semibold">Kategoria</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Skany
                  <span className="block text-[11px] font-normal normal-case tracking-normal text-kamien-400">
                    {zakres.opis}
                  </span>
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">Ostatni skan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kamien-100">
              {kody.map((k) => {
                const status = ETYKIETY_STATUSU[k.status]
                return (
                  <tr key={k.kod} className="transition-colors hover:bg-kamien-50">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-kamien-900">
                      <Link href={`/panel/kody/${k.kod}`} className="hover:text-las-700">
                        {k.kod}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/panel/kody/${k.kod}`} className="font-medium text-kamien-900 hover:text-las-700">
                        {k.nazwa}
                      </Link>
                      {k.nazwaLokalizacji && (
                        <span className="block text-sm text-kamien-500">{k.nazwaLokalizacji}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-kamien-600">
                      {k.kategoria.toLowerCase().replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-kamien-900">
                      {k.liczbaSkanow > 0 ? liczba(k.liczbaSkanow) : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-kamien-600">{ileTemu(k.ostatniSkan)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.klasa}`}>
                        {status.tekst}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
