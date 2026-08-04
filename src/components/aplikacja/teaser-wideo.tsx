'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

/**
 * Nagranie z aplikacji jako teaser.
 *
 * Odtwarza się samo, bez dźwięku, w pętli — tak działają zapowiedzi
 * w sklepach z aplikacjami i tego się ludzie spodziewają. Ale WCAG mówi
 * jasno: cokolwiek rusza się dłużej niż pięć sekund bez udziału
 * użytkownika, musi dać się zatrzymać (kryterium 2.2.2). Stąd przycisk
 * pauzy, widoczny na stałe, a nie dopiero po najechaniu — na dotyku
 * najechania nie ma.
 *
 * Osoba, która w ustawieniach systemu poprosiła o ograniczenie ruchu,
 * dostaje nagranie zatrzymane na pierwszej klatce i sama decyduje, czy je
 * puścić. Sprawdzamy to w `useEffect`, bo przy renderowaniu na serwerze
 * `matchMedia` nie istnieje.
 */
export function TeaserWideo({
  zrodlo,
  plakat,
  opis,
}: {
  zrodlo: string
  /** Klatka pokazywana przed wczytaniem nagrania. */
  plakat: string
  opis: string
}) {
  const wideo = useRef<HTMLVideoElement>(null)
  const [gra, ustawGra] = useState(true)

  useEffect(() => {
    const el = wideo.current
    if (!el) return

    const mniejRuchu = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (mniejRuchu) {
      el.pause()
      ustawGra(false)
      return
    }

    // Autoodtwarzanie bywa blokowane mimo wyciszenia — wtedy przycisk musi
    // pokazywać stan zgodny z prawdą, a nie ten, którego się spodziewaliśmy.
    el.play().catch(() => ustawGra(false))
  }, [])

  const przelacz = () => {
    const el = wideo.current
    if (!el) return
    if (el.paused) {
      el.play().then(
        () => ustawGra(true),
        () => ustawGra(false),
      )
    } else {
      el.pause()
      ustawGra(false)
    }
  }

  return (
    <div className="relative size-full">
      <video
        ref={wideo}
        // `playsInline` powstrzymuje iOS przed otwarciem nagrania na pełnym
        // ekranie — bez tego makieta telefonu znika przy starcie odtwarzania.
        playsInline
        muted
        loop
        preload="metadata"
        poster={plakat}
        aria-label={opis}
        className="size-full object-cover"
      >
        <source src={zrodlo} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={przelacz}
        aria-label={gra ? 'Zatrzymaj nagranie' : 'Odtwórz nagranie'}
        className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-las-950/55 text-white backdrop-blur-sm transition-colors hover:bg-las-950/75 focus-visible:bg-las-950/75"
      >
        {gra ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
      </button>
    </div>
  )
}
