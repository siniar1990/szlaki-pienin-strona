import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Bot, MapPin, QrCode, TrendingUp } from 'lucide-react'

import { WykresDzienny } from '@/components/panel/wykres-dzienny'
import { ZakresDat } from '@/components/panel/zakres-dat'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { pobierzPodsumowanie, pobierzRuchOdsiany, pobierzWykresDzienny } from '@/lib/qr/statystyki'
import { odczytajZakres } from '@/lib/qr/zakres'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Pulpit',
  robots: { index: false, follow: false },
}

// Statystyki mają być bieżące — nie ma czego trzymać w pamięci podręcznej.
export const dynamic = 'force-dynamic'

export default async function StronaPulpitu({ searchParams }: PageProps<'/panel'>) {
  const zakres = odczytajZakres((await searchParams).zakres)

  // Statystyki przelicza zadanie dobowe, ale na darmowym planie to za rzadko,
  // żeby pulpit pokazywał prawdę. Sprawdzamy więc przy wejściu, czy doszły
  // nowe skany — jeśli tak, przeliczamy je od razu. Gdy nic się nie zmieniło,
  // sprawdzenie kończy się na dwóch zapytaniach.
  await przeliczJesliTrzeba()

  const [podsumowanie, wykres, odsiane] = await Promise.all([
    pobierzPodsumowanie(zakres),
    pobierzWykresDzienny(zakres),
    pobierzRuchOdsiany(zakres),
  ])

  const platformy = podsumowanie.udzialPlatform
  const sumaPlatform = platformy.ios + platformy.android + platformy.desktop
  const procent = (ile: number) => (sumaPlatform > 0 ? Math.round((ile / sumaPlatform) * 100) : 0)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">Pulpit</h1>
        <ZakresDat sciezka="/panel" aktywny={zakres} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kafelek
          ikona={Activity}
          etykieta="Skany (ludzie)"
          wartosc={liczba(podsumowanie.lacznieSkanow)}
          podpis={zakres.opis}
        />
        <Kafelek
          ikona={TrendingUp}
          etykieta="Dzisiaj"
          wartosc={liczba(podsumowanie.dzisiaj)}
          podpis="liczone na bieżąco"
        />
        <Kafelek
          ikona={QrCode}
          etykieta="Aktywne tabliczki"
          wartosc={`${podsumowanie.aktywnychKodow} / ${podsumowanie.wszystkichKodow}`}
        />
        <Kafelek
          ikona={MapPin}
          etykieta="Najpopularniejsza"
          wartosc={podsumowanie.najpopularniejszy?.nazwa ?? '—'}
          podpis={
            podsumowanie.najpopularniejszy
              ? `${liczba(podsumowanie.najpopularniejszy.liczbaSkanow)} skanów`
              : 'brak danych'
          }
        />
      </div>

      <OdsianyRuch odsiane={odsiane} opisZakresu={zakres.opis} />

      <section className="mt-10 rounded-2xl border border-kamien-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-kamien-900">
          Skany {zakres.opis}
        </h2>
        <div className="mt-6">
          <WykresDzienny punkty={wykres} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-kamien-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-kamien-900">Systemy</h2>
        {sumaPlatform === 0 ? (
          <p className="mt-4 text-kamien-500">
            Brak danych — statystyka pojawi się po pierwszych skanach.
          </p>
        ) : (
          <dl className="mt-5 space-y-3">
            {(
              [
                ['Android', platformy.android],
                ['iOS', platformy.ios],
                ['Komputer', platformy.desktop],
              ] as const
            ).map(([nazwa, ile]) => (
              <div key={nazwa} className="flex items-center gap-4">
                <dt className="w-24 shrink-0 text-sm text-kamien-600">{nazwa}</dt>
                <dd className="flex flex-1 items-center gap-3">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-kamien-100">
                    <span
                      className="block h-full rounded-full bg-las-600"
                      style={{ width: `${procent(ile)}%` }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-kamien-700">
                    {procent(ile)}% · {liczba(ile)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <p className="mt-8 text-sm text-kamien-500">
        Statystyki przeliczają się przy każdym wejściu na pulpit, gdy pojawią
        się nowe skany.{' '}
        <Link href="/panel/kody" className="font-medium text-las-700 hover:underline">
          Zobacz wszystkie tabliczki
        </Link>
        .
      </p>
    </>
  )
}

function Kafelek({
  ikona: Ikona,
  etykieta,
  wartosc,
  podpis,
}: {
  ikona: React.ComponentType<{ className?: string }>
  etykieta: string
  wartosc: string
  podpis?: string
}) {
  return (
    <div className="rounded-2xl border border-kamien-200 bg-white p-5">
      <Ikona className="size-5 text-las-600" />
      <p className="mt-3 text-sm text-kamien-500">{etykieta}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-kamien-900">
        {wartosc}
      </p>
      {podpis && <p className="mt-0.5 text-xs text-kamien-400">{podpis}</p>}
    </div>
  )
}

/**
 * Ruch, którego nie policzyliśmy.
 *
 * **Dlaczego to w ogóle widać.** 14 sierpnia 2026 licznik tabliczki P009
 * skoczył o 22 skany z Iowa, Utah i Oregonu — to były crawlery Facebooka
 * budujące podgląd odnośnika, kilka minut po opublikowaniu posta. Liczba
 * wyglądała świetnie i była nieprawdziwa. Filtr odsiewa taki ruch, ale filtr
 * bez wglądu w to, co odsiał, jest tylko inną odmianą tego samego problemu:
 * nie wiadomo, czy odsiewa boty, czy turystów.
 *
 * **Dlaczego zwinięte.** Bo to nie jest liczba, którą się ogląda codziennie.
 * Ma być pod ręką, gdy któraś reguła zacznie się dziwnie zachowywać — i wtedy
 * od razu widać, która.
 */
function OdsianyRuch({
  odsiane,
  opisZakresu,
}: {
  odsiane: Awaited<ReturnType<typeof pobierzRuchOdsiany>>
  opisZakresu: string
}) {
  if (odsiane.boty === 0 && odsiane.niepewne === 0) return null

  return (
    <details className="mt-6 rounded-2xl border border-kamien-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-medium text-kamien-700">
        <Bot className="mr-2 inline size-4 align-text-bottom" aria-hidden />
        Odsiane: {liczba(odsiane.boty)} botów, {liczba(odsiane.niepewne)} niepewnych
        <span className="ml-2 font-normal text-kamien-500">({opisZakresu})</span>
      </summary>

      <ul className="mt-4 space-y-1 text-sm text-kamien-600">
        {odsiane.powody.map((p) => (
          <li key={p.powod} className="flex justify-between gap-4">
            <span className="font-mono text-xs text-kamien-500">{p.powod}</span>
            <span>{liczba(p.liczba)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-kamien-500">
        Boty dostają normalną stronę — nie blokujemy ich, żeby Facebook nadal
        umiał zbudować podgląd odnośnika. Nie wchodzą tylko do liczb powyżej.
      </p>
    </details>
  )
}
