import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

import { KartaWiadomosci } from '@/components/aktualnosci/karta-wiadomosci'
import { NaglowekStrony } from '@/components/uklad/naglowek-strony'
import { odmien } from '@/lib/format'
import { pobierzWiadomosci } from '@/lib/wiadomosci/zapytania'

export const metadata: Metadata = {
  title: 'Aktualności',
  description:
    'Co słychać w Pieninach: zmiany na szlakach, wydarzenia, warunki w górach ' +
    'i sprawy Szczawnicy, Krościenka i Czorsztyna.',
  alternates: { canonical: '/aktualnosci' },
}

/**
 * Lista aktualności.
 *
 * **Dlaczego pierwsza notka jest większa.** Dział informacyjny bez hierarchii
 * czyta się jak archiwum: dwadzieścia równych kafelków, z których żaden nie
 * mówi „od tego zacznij". Wyróżnienie najnowszej daje wchodzącemu punkt
 * zaczepienia i jest zarazem prawdziwe — to jest ta rzecz, która stała się
 * ostatnio.
 *
 * **Dlaczego nie ma tu reklam ani miejsc partnerskich.** Świadoma decyzja
 * właściciela na ten etap. Miejsce, w którym kiedyś staną, jest przy
 * atrakcjach — dział informacyjny zostaje czysty.
 */
export default async function StronaAktualnosci() {
  const wiadomosci = await pobierzWiadomosci(30)
  const [najnowsza, ...pozostale] = wiadomosci

  return (
    <>
      <NaglowekStrony
        okruszki={[{ nazwa: 'Aktualności', adres: '/aktualnosci' }]}
        tytul="Aktualności"
        lead="Co słychać w Pieninach — zmiany na szlakach, wydarzenia, warunki w górach i sprawy Szczawnicy, Krościenka i Czorsztyna."
      />

      <div className="obszar py-14 lg:py-20">
        {wiadomosci.length === 0 ? (
          <div className="mx-auto max-w-[46ch] rounded-2xl border border-dashed border-kamien-300 bg-kamien-50 px-8 py-14 text-center">
            <Newspaper className="mx-auto size-8 text-kamien-400" aria-hidden />
            <h2 className="mt-5 font-heading text-xl font-semibold text-kamien-900">
              Jeszcze nic tu nie ma
            </h2>
            <p className="mt-3 leading-relaxed text-kamien-600">
              Pierwsze wiadomości pojawią się wkrótce. Do tego czasu zajrzyj do{' '}
              <Link href="/szlaki" className="font-medium text-las-700 hover:underline">
                opisów tras
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-kamien-500">
              {wiadomosci.length}{' '}
              {odmien(wiadomosci.length, ['wiadomość', 'wiadomości', 'wiadomości'])}
            </p>

            {/*
              Najnowsza zajmuje dwie kolumny z trzech na szerokim ekranie.
              Na telefonie siatka i tak spłaszcza się do jednej kolumny, więc
              wyróżnienie zostaje wyłącznie w rozmiarze nagłówka.
            */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <KartaWiadomosci wiadomosc={najnowsza} wyrozniona />
              </div>

              {pozostale.map((wiadomosc) => (
                <KartaWiadomosci key={wiadomosc.slug} wiadomosc={wiadomosc} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
