import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download, ExternalLink } from 'lucide-react'

import { zapiszKod } from '@/app/panel/dzialania'
import { FormularzKodu } from '@/components/panel/formularz-kodu'
import { baza } from '@/lib/baza'
import { przeliczJesliTrzeba } from '@/lib/qr/agregacja'
import { adresKodu, kodJakoDataUrl } from '@/lib/qr/generuj-kod'
import { liczba } from '@/lib/format'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function StronaKodu({ params }: PageProps<'/panel/kody/[kod]'>) {
  const { kod } = await params
  await przeliczJesliTrzeba()

  const tabliczka = await baza.kodQr.findUnique({ where: { kod } })
  if (!tabliczka) notFound()

  const [podglad, ostatnieSkany] = await Promise.all([
    kodJakoDataUrl(tabliczka.kod),
    baza.skanQr.findMany({
      where: { kodQrId: tabliczka.id },
      orderBy: { czas: 'desc' },
      take: 10,
      select: { czas: true, urzadzenie: true, kraj: true, miasto: true },
    }),
  ])

  return (
    <>
      <Link href="/panel/kody" className="text-sm text-kamien-500 hover:text-las-700">
        ← Wszystkie tabliczki
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">{tabliczka.nazwa}</h1>
        <span className="font-mono text-lg text-kamien-500">{tabliczka.kod}</span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <FormularzKodu
          akcja={zapiszKod.bind(null, tabliczka.kod)}
          etykietaPrzycisku="Zapisz zmiany"
          wartosci={{
            nazwa: tabliczka.nazwa,
            opis: tabliczka.opis,
            kategoria: tabliczka.kategoria,
            nazwaLokalizacji: tabliczka.nazwaLokalizacji,
            powiazanaStrona: tabliczka.powiazanaStrona,
            szerokosc: tabliczka.szerokosc,
            dlugosc: tabliczka.dlugosc,
            status: tabliczka.status,
            dataMontazu: tabliczka.dataMontazu?.toISOString().slice(0, 10) ?? '',
          }}
        />

        <aside className="space-y-6">
          <div className="rounded-2xl border border-kamien-200 bg-white p-5 text-center">
            <Image
              src={podglad}
              alt={`Kod QR tabliczki ${tabliczka.kod}`}
              width={200}
              height={200}
              unoptimized
              className="mx-auto rounded-lg"
            />
            <p className="mt-3 break-all font-mono text-xs text-kamien-500">
              {adresKodu(tabliczka.kod)}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`/api/panel/kody/${tabliczka.kod}/obraz?format=svg`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-las-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-las-800"
              >
                <Download className="size-4" aria-hidden />
                Pobierz SVG
              </a>
              <a
                href={`/api/panel/kody/${tabliczka.kod}/obraz?format=png`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-kamien-300 px-4 py-2.5 text-sm font-medium text-kamien-800 hover:border-las-500 hover:bg-las-50"
              >
                <Download className="size-4" aria-hidden />
                Pobierz PNG
              </a>
              <a
                href={adresKodu(tabliczka.kod)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm text-kamien-500 hover:text-las-700"
              >
                Sprawdź działanie
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-kamien-200 bg-white p-5">
            <h2 className="font-heading text-base font-semibold text-kamien-900">Statystyki</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-kamien-500">Łącznie skanów</dt>
                <dd className="font-semibold tabular-nums text-kamien-900">
                  {liczba(tabliczka.liczbaSkanow)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-kamien-500">Ostatni skan</dt>
                <dd className="text-kamien-900">
                  {tabliczka.ostatniSkan
                    ? tabliczka.ostatniSkan.toLocaleString('pl-PL')
                    : 'nigdy'}
                </dd>
              </div>
            </dl>

            {ostatnieSkany.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-kamien-500">
                  Ostatnie skany
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-kamien-600">
                  {ostatnieSkany.map((s, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>{s.czas.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-kamien-500">
                        {s.urzadzenie.toLowerCase()}
                        {s.miasto ? ` · ${s.miasto}` : s.kraj ? ` · ${s.kraj}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
