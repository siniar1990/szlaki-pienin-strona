import type { Metadata } from 'next'
import { AlertTriangle, ExternalLink, Pause, Play, Rss, Trash2 } from 'lucide-react'

import { FormularzZrodla } from '@/components/panel/formularz-zrodla'
import { PrzyciskiZadan } from '@/components/panel/przyciski-zadan'
import { baza } from '@/lib/baza'
import { ileTemu } from '@/lib/wiadomosci/etykiety'
import { kluczDostepny } from '@/lib/wiadomosci/model-jezykowy'

import { przelaczZrodlo, usunZrodlo } from '../dzialania'

export const metadata: Metadata = {
  title: 'Źródła',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// Obchód z ocenianiem trwa kilkadziesiąt sekund — patrz wykaz znalezisk.
export const maxDuration = 60

/**
 * Lista źródeł, po których chodzi obchód.
 *
 * **Dlaczego widać, czy źródło ma kanał RSS.** Bo to jest różnica między
 * odczytem pewnym a zgadywaniem po odnośnikach ze strony. Źródło bez kanału
 * będzie przynosić więcej śmieci i wcześniej czy później przestanie działać
 * po przebudowie cudzego serwisu — administrator ma prawo wiedzieć, na czym
 * stoi, zanim zacznie się dziwić jakości znalezisk.
 *
 * **Dlaczego wyłączenie zamiast usunięcia.** Usunięcie kasuje razem ze
 * źródłem wszystkie jego znaleziska, więc artykuły odrzucone kiedyś wróciłyby
 * po ponownym dodaniu. Wyłączone źródło po prostu przestaje być odwiedzane.
 */
export default async function StronaZrodel() {
  const klucz = kluczDostepny()
  const zrodla = await baza.zrodloWiadomosci.findMany({
    orderBy: [{ aktywne: 'desc' }, { nazwa: 'asc' }],
    include: { _count: { select: { znaleziska: true } } },
  })

  const zBledem = zrodla.filter((zrodlo) => zrodlo.aktywne && zrodlo.ostatniBlad)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-kamien-900">
          Źródła
          <span className="ml-3 text-base font-normal text-kamien-500">{zrodla.length}</span>
        </h1>

        <PrzyciskiZadan kluczDostepny={klucz} />
      </div>

      <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-kamien-600">
        Obchód odwiedza te strony co dwanaście godzin i zapisuje artykuły, których jeszcze
        nie widział. Podaj adres strony z listą wiadomości — kanał RSS, jeśli serwis go ma,
        zostanie znaleziony sam.
      </p>

      {zBledem.length > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {zBledem.length} z {zrodla.length} źródeł nie odpowiedziało przy ostatnim obchodzie.
        </p>
      )}

      <div className="mt-6">
        <FormularzZrodla />
      </div>

      {zrodla.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-kamien-300 p-12 text-center text-kamien-500">
          Nie ma jeszcze żadnego źródła. Dodaj pierwsze powyżej.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-kamien-100 rounded-2xl border border-kamien-200 bg-white">
          {zrodla.map((zrodlo) => {
            const przelacz = przelaczZrodlo.bind(null, zrodlo.id)
            const usun = usunZrodlo.bind(null, zrodlo.id)

            return (
              <li
                key={zrodlo.id}
                className={`flex flex-wrap items-start gap-4 p-5 ${zrodlo.aktywne ? '' : 'opacity-60'}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-kamien-900">{zrodlo.nazwa}</span>
                    {zrodlo.adresKanalu ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-las-200 bg-las-50 px-2 py-0.5 text-xs text-las-800">
                        <Rss className="size-3" aria-hidden />
                        kanał RSS
                      </span>
                    ) : (
                      <span className="rounded-full border border-kamien-300 bg-kamien-100 px-2 py-0.5 text-xs text-kamien-600">
                        odczyt ze strony
                      </span>
                    )}
                    {!zrodlo.aktywne && (
                      <span className="rounded-full border border-kamien-300 bg-kamien-100 px-2 py-0.5 text-xs text-kamien-600">
                        wyłączone
                      </span>
                    )}
                  </p>

                  <a
                    href={zrodlo.adres}
                    target="_blank"
                    rel="noopener nofollow"
                    className="mt-1 inline-flex items-center gap-1.5 break-all text-sm text-kamien-500 hover:text-las-700"
                  >
                    {zrodlo.adres}
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </a>

                  <p className="mt-1.5 text-xs text-kamien-500">
                    Obchód {ileTemu(zrodlo.ostatniObchod)} · {zrodlo._count.znaleziska}{' '}
                    {zrodlo._count.znaleziska === 1 ? 'artykuł' : 'artykułów'} w bazie
                  </p>

                  {zrodlo.ostatniBlad && (
                    <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                      <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                      {zrodlo.ostatniBlad}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <form action={przelacz}>
                    <button
                      type="submit"
                      aria-label={zrodlo.aktywne ? 'Wyłącz źródło' : 'Włącz źródło'}
                      className="rounded-full border border-kamien-300 p-2 text-kamien-600 transition-colors hover:border-las-400 hover:text-las-800"
                    >
                      {zrodlo.aktywne ? (
                        <Pause className="size-4" aria-hidden />
                      ) : (
                        <Play className="size-4" aria-hidden />
                      )}
                    </button>
                  </form>
                  <form action={usun}>
                    <button
                      type="submit"
                      aria-label="Usuń źródło razem z jego znaleziskami"
                      className="rounded-full p-2 text-kamien-400 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
