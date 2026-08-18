import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { FormularzPaczki } from '@/components/panel/formularz-paczki'
import { PobierzKody } from '@/components/panel/pobierz-kody'
import { TabelaKodow, type WierszKodu } from '@/components/panel/tabela-kodow'
import { ZakresDat } from '@/components/panel/zakres-dat'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { pobierzKodyNaListe } from '@/lib/qr/statystyki'
import { odczytajZakres } from '@/lib/qr/zakres'

export const metadata: Metadata = {
  title: 'Tabliczki',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Czas w formie, w jakiej mówi o nim człowiek.
 *
 * „10 minut temu" niesie inną informację niż „2026-08-05 09:47" — przy
 * pytaniu „czy ta tabliczka żyje" liczy się odległość od teraz, nie data.
 *
 * Liczone na serwerze, raz dla całej tabeli: jedna chwila odniesienia
 * i żadnego rozjazdu przy uzgadnianiu znaczników w przeglądarce.
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

  const wiersze: WierszKodu[] = kody.map((k) => ({
    kod: k.kod,
    nazwa: k.nazwa,
    nazwaLokalizacji: k.nazwaLokalizacji,
    status: k.status,
    liczbaSkanow: k.liczbaSkanow,
    ostatniSkanMs: k.ostatniSkan?.getTime() ?? null,
    ostatniSkanEtykieta: ileTemu(k.ostatniSkan),
  }))

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
        <TabelaKodow wiersze={wiersze} opisZakresu={zakres.opis} />
      )}
    </>
  )
}
