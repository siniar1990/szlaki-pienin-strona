'use client'

import { useEffect, useState } from 'react'
import { Check, Download, Link2, Share2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Pobranie śladu i udostępnienie trasy.
 *
 * Udostępnianie ma dwie drogi. Na telefonie sięgamy po `navigator.share` —
 * systemowy arkusz, w którym użytkownik wybiera WhatsAppa, wiadomość albo
 * notatki, i który wygląda tak, jak przywykł. Na komputerze, gdzie tego
 * mechanizmu zwykle nie ma, kopiujemy adres do schowka i mówimy o tym wprost.
 *
 * Sprawdzenia dostępności nie da się zrobić przy renderowaniu: na serwerze
 * `navigator` nie istnieje, a gdyby przycisk wyrenderował się inaczej na
 * serwerze i w przeglądarce, React zgłosiłby rozjazd. Stąd `useEffect`.
 */
export function DzialaniaTrasy({
  nazwa,
  gpx,
  opis,
}: {
  nazwa: string
  /** Adres pliku GPX albo null, gdy trasa nie ma jeszcze śladu. */
  gpx: string | null
  opis: string
}) {
  const [maUdostepnianie, ustawMaUdostepnianie] = useState(false)
  const [skopiowane, ustawSkopiowane] = useState(false)

  useEffect(() => {
    ustawMaUdostepnianie(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Komunikat „skopiowano" gaśnie sam po dwóch sekundach.
  useEffect(() => {
    if (!skopiowane) return
    const licznik = setTimeout(() => ustawSkopiowane(false), 2000)
    return () => clearTimeout(licznik)
  }, [skopiowane])

  const udostepnij = async () => {
    const adres = window.location.href

    if (maUdostepnianie) {
      try {
        await navigator.share({ title: `${nazwa} — Szlaki Pienin`, text: opis, url: adres })
        return
      } catch {
        // Użytkownik zamknął arkusz albo przeglądarka odmówiła — spadamy
        // do kopiowania, zamiast zostawiać kliknięcie bez żadnego skutku.
      }
    }

    try {
      await navigator.clipboard.writeText(adres)
      ustawSkopiowane(true)
    } catch {
      // Schowek bywa zablokowany bez HTTPS albo przez ustawienia. Wtedy
      // zaznaczamy adres w pasku, żeby dało się go skopiować ręcznie.
      window.prompt('Skopiuj adres trasy:', adres)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {gpx && (
        <a
          href={gpx}
          download
          className="inline-flex items-center gap-2 rounded-full bg-las-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-las-800"
        >
          <Download className="size-4" aria-hidden />
          Pobierz GPX
        </a>
      )}

      <button
        type="button"
        onClick={udostepnij}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors',
          skopiowane
            ? 'border-las-500 bg-las-50 text-las-800'
            : 'border-kamien-300 text-kamien-800 hover:border-las-500 hover:bg-las-50 hover:text-las-800',
        )}
      >
        {skopiowane ? (
          <>
            <Check className="size-4" aria-hidden />
            Skopiowano adres
          </>
        ) : (
          <>
            {maUdostepnianie ? (
              <Share2 className="size-4" aria-hidden />
            ) : (
              <Link2 className="size-4" aria-hidden />
            )}
            {maUdostepnianie ? 'Udostępnij' : 'Kopiuj link'}
          </>
        )}
      </button>
    </div>
  )
}
