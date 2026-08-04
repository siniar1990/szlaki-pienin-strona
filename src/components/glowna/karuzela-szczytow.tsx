'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight, Mountain } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Karuzela najwyższych szczytów.
 *
 * Przesuwanie odbywa się przyciskami, nie kółkiem myszy. Pod spodem jest
 * zwykły kontener przewijany w poziomie z zatrzaskiem na kartach — dzięki
 * temu na telefonie działa naturalne przesuwanie palcem, a na komputerze
 * strzałki. Pasek przewijania jest ukryty, żeby nie sugerował, że to ma być
 * główny sposób obsługi.
 *
 * Rozwiązanie z przewijaniem, a nie z `transform`, ma dwie zalety: układ sam
 * dostosowuje liczbę widocznych kart do szerokości okna, a przeglądarka sama
 * dowija kartę do widoku, gdy ktoś przechodzi po nich tabulatorem.
 */

export type SzczytNaKarcie = {
  slug: string
  nazwa: string
  wysokoscM: number
  /** Ilustracja trasy prowadzącej na szczyt albo null. */
  obrazek: string | null
  /** Ile opisanych tras prowadzi na ten szczyt. */
  liczbaTras: number
}

export function KaruzelaSzczytow({ szczyty }: { szczyty: SzczytNaKarcie[] }) {
  const tor = useRef<HTMLUListElement>(null)
  const [naPoczatku, ustawNaPoczatku] = useState(true)
  const [naKoncu, ustawNaKoncu] = useState(false)

  /** Sprawdza, czy jest jeszcze dokąd przewijać — od tego zależą przyciski. */
  const zbadajPozycje = useCallback(() => {
    const el = tor.current
    if (!el) return
    // Tolerancja jednego piksela: przeglądarki potrafią zwrócić 0,5 px różnicy
    // przy pełnym przewinięciu i przycisk zostawałby aktywny bez powodu.
    ustawNaPoczatku(el.scrollLeft <= 1)
    ustawNaKoncu(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = tor.current
    if (!el) return
    zbadajPozycje()
    el.addEventListener('scroll', zbadajPozycje, { passive: true })
    window.addEventListener('resize', zbadajPozycje)
    return () => {
      el.removeEventListener('scroll', zbadajPozycje)
      window.removeEventListener('resize', zbadajPozycje)
    }
  }, [zbadajPozycje])

  /** Przesuwa o tyle kart, ile mieści się w widoku, minus jedna dla ciągłości. */
  const przesun = (kierunek: -1 | 1) => {
    const el = tor.current
    if (!el) return
    const karta = el.querySelector('li')
    const szerokoscKarty = karta ? karta.getBoundingClientRect().width + 20 : 320
    const ileKart = Math.max(1, Math.floor(el.clientWidth / szerokoscKarty) - 1)
    el.scrollBy({ left: kierunek * szerokoscKarty * ileKart, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <ul
        ref={tor}
        // `[scrollbar-width:none]` chowa pasek w Firefoksie, a `::-webkit`
        // w przeglądarkach opartych na WebKicie. Bez tego pod kartami
        // wisiałby szary pasek psujący rytm sekcji.
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {szczyty.map((szczyt, indeks) => (
          <li
            key={szczyt.slug}
            className="w-[15rem] shrink-0 snap-start sm:w-[17rem]"
          >
            <Link
              href={`/atrakcje/${szczyt.slug}`}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-2xl border border-kamien-200 shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki focus-visible:-translate-y-1"
            >
              {szczyt.obrazek ? (
                <Image
                  src={szczyt.obrazek}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 60vw, 17rem"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-las-600 to-las-900" />
              )}

              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-las-950/92 via-las-950/40 to-las-950/10"
              />

              {/* Numer w kolekcji — szczyty idą od najwyższego, więc „01"
                  naprawdę znaczy „najwyższy". */}
              <span
                aria-hidden
                className="absolute left-5 top-4 font-plakat text-3xl leading-none text-white/45"
              >
                {String(indeks + 1).padStart(2, '0')}
              </span>

              <div className="relative z-10 p-5 [text-shadow:0_1px_10px_rgb(11_58_38_/_0.55)]">
                <p className="font-plakat text-3xl leading-none text-white">
                  {szczyt.wysokoscM}
                  <span className="ml-1 text-base font-normal text-white/75">m n.p.m.</span>
                </p>
                <h3 className="mt-2 font-heading text-xl font-semibold leading-tight text-white">
                  {szczyt.nazwa}
                </h3>
                <p className="mt-1 text-sm text-white/75">
                  {szczyt.liczbaTras}{' '}
                  {szczyt.liczbaTras === 1
                    ? 'trasa dojścia'
                    : szczyt.liczbaTras < 5
                      ? 'trasy dojścia'
                      : 'tras dojścia'}
                </p>
              </div>

              <span
                aria-hidden
                className="absolute bottom-5 right-5 z-10 grid size-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-3">
        <Przycisk kierunek="wstecz" wylaczony={naPoczatku} onClick={() => przesun(-1)} />
        <Przycisk kierunek="dalej" wylaczony={naKoncu} onClick={() => przesun(1)} />

        <p className="ml-2 flex items-center gap-2 text-sm text-kamien-500">
          <Mountain className="size-4" aria-hidden />
          {szczyty.length} szczytów, od najwyższego
        </p>
      </div>
    </div>
  )
}

function Przycisk({
  kierunek,
  wylaczony,
  onClick,
}: {
  kierunek: 'wstecz' | 'dalej'
  wylaczony: boolean
  onClick: () => void
}) {
  const Ikona = kierunek === 'wstecz' ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={wylaczony}
      aria-label={kierunek === 'wstecz' ? 'Poprzednie szczyty' : 'Następne szczyty'}
      className={cn(
        'grid size-11 place-items-center rounded-full border transition-all duration-200',
        wylaczony
          ? 'cursor-default border-kamien-200 text-kamien-300'
          : 'border-kamien-300 text-kamien-800 hover:border-las-600 hover:bg-las-50 hover:text-las-800 active:scale-95',
      )}
    >
      <Ikona className="size-5" aria-hidden />
    </button>
  )
}
