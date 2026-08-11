'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Włącznik ruchu dla sekcji kafelków.
 *
 * **Co robi.** Zakłada klasę `.w-ruchu`, gdy sekcja jest widoczna, i zdejmuje
 * ją, gdy zjedzie z ekranu albo karta przeglądarki pójdzie w tło. Wszystkie
 * animacje ambientowe wiszą w CSS pod tą klasą, więc jedno przełączenie
 * zatrzymuje sześć nieskończonych pętli naraz.
 *
 * **Po co.** Chmury, fale, gwiazdy i wirujące promienie chodzą bez końca. Na
 * telefonie w tle to jest realny pobór prądu za rysowanie czegoś, na co nikt
 * nie patrzy. `IntersectionObserver` i `visibilitychange` są tu tańsze niż
 * jakakolwiek biblioteka i nie dokładają ani kilobajta zależności.
 *
 * **Kaskadowe wejście tylko raz.** Klasa `.wchodzi` pojawia się przy pierwszym
 * wjechaniu sekcji w pole widzenia i zostaje zdjęta po zakończeniu animacji.
 * Przy powrocie z historii przeglądarki karty są już na miejscu i nic nie mruga
 * — a bez tego każde cofnięcie w przeglądarce odgrywałoby całą kaskadę od nowa.
 *
 * **Bez JavaScriptu wszystko i tak działa**: stanem spoczynkowym w CSS jest
 * pełna widoczność kafelków i wypełniony miernik. Ta warstwa dodaje ruch,
 * nie warunkuje treści.
 */

/** Ile trwa kaskada wejścia razem z opóźnieniem ostatniego kafelka. */
const KASKADA_MS = 1000

export function Ozywienie({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const uchwyt = useRef<HTMLDivElement>(null)
  const [widoczna, ustawWidoczna] = useState(false)
  const [wchodzi, ustawWchodzi] = useState(false)
  const juzWeszla = useRef(false)

  useEffect(() => {
    const element = uchwyt.current
    if (!element) return

    /*
      Osoby z włączonym ograniczeniem ruchu nie dostają ani kaskady, ani
      obserwatora. CSS i tak wyłącza animacje, ale bez tego dokładalibyśmy im
      nasłuch, który nie ma czego obserwować.
    */
    const bezRuchu = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (bezRuchu) return

    const obserwator = new IntersectionObserver(
      ([wpis]) => {
        ustawWidoczna(wpis.isIntersecting)

        if (wpis.isIntersecting && !juzWeszla.current) {
          juzWeszla.current = true
          ustawWchodzi(true)
          window.setTimeout(() => ustawWchodzi(false), KASKADA_MS)
        }
      },
      // Ćwierć kafelka wystarczy, żeby uznać sekcję za oglądaną — czekanie na
      // całą oznaczałoby, że na telefonie nie ruszy się nigdy.
      { threshold: 0.25 },
    )
    obserwator.observe(element)

    const naZmianieWidocznosci = () => {
      if (document.hidden) ustawWidoczna(false)
    }
    document.addEventListener('visibilitychange', naZmianieWidocznosci)

    return () => {
      obserwator.disconnect()
      document.removeEventListener('visibilitychange', naZmianieWidocznosci)
    }
  }, [])

  return (
    <div
      ref={uchwyt}
      className={[className, widoczna ? 'w-ruchu' : '', wchodzi ? 'wchodzi' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

/**
 * Miernik UV, który wypełnia się dopiero po wjechaniu w pole widzenia.
 *
 * Osobno od `Ozywienie`, bo to jednorazowe zdarzenie, a nie ciągły ruch:
 * animacja ma się odegrać raz, w chwili, gdy ktoś na nią patrzy. Uruchamiana
 * razem z resztą — przy wejściu na stronę — kończyłaby się, zanim ktokolwiek
 * przewinie do kafelka.
 */
export function MiernikUV({
  poziom,
  opis,
}: {
  /** Wypełnienie w procentach szerokości toru. */
  poziom: number
  opis: string
}) {
  const uchwyt = useRef<HTMLDivElement>(null)
  const [animuj, ustawAnimuj] = useState(false)

  useEffect(() => {
    const element = uchwyt.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const obserwator = new IntersectionObserver(
      ([wpis]) => {
        if (!wpis.isIntersecting) return
        ustawAnimuj(true)
        obserwator.disconnect()
      },
      { threshold: 0.5 },
    )
    obserwator.observe(element)

    return () => obserwator.disconnect()
  }, [])

  return (
    <div
      ref={uchwyt}
      className={`miernik${animuj ? ' animuj' : ''}`}
      style={{ ['--uv-poziom' as string]: `${poziom}%` }}
      role="img"
      aria-label={opis}
    >
      <div className="miernik-tor">
        <div className="miernik-wypelnienie" />
      </div>
      <div className="miernik-skala" aria-hidden>
        <span style={{ left: 0 }}>0</span>
        <span style={{ left: '27.3%' }}>3</span>
        <span style={{ left: '54.5%' }}>6</span>
        <span style={{ left: '72.7%' }}>8</span>
        <span style={{ left: '100%' }}>11+</span>
      </div>
    </div>
  )
}

/**
 * Odliczanie do najbliższego otwarcia, liczone na żywo.
 *
 * Jedyna liczba na całej stronie, która musi tykać w przeglądarce: reszta
 * odświeża się razem z danymi co kwadrans, a „za 2 h 37 min" po dziesięciu
 * minutach patrzenia byłoby po prostu nieprawdą.
 *
 * Pierwsze wyliczenie przychodzi z serwera i jest wypisane w HTML-u, więc
 * wartość widać od razu — także wtedy, gdy JavaScript nie dojdzie.
 */
export function OdliczanieDoOtwarcia({
  otwarcieGodzina,
  poczatkowe,
}: {
  otwarcieGodzina: number
  poczatkowe: string
}) {
  const [tekst, ustawTekst] = useState(poczatkowe)

  useEffect(() => {
    const przelicz = () => {
      const teraz = new Date()
      const wPolsce = new Intl.DateTimeFormat('pl-PL', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZone: 'Europe/Warsaw',
      }).formatToParts(teraz)

      const liczba = (typ: string) =>
        Number(wPolsce.find((czesc) => czesc.type === typ)?.value ?? 0)

      const sekundTeraz = (liczba('hour') % 24) * 3600 + liczba('minute') * 60 + liczba('second')
      const zostalo = otwarcieGodzina * 3600 - sekundTeraz

      if (zostalo <= 0) {
        ustawTekst('właśnie się otwiera')
        return
      }

      const godziny = Math.floor(zostalo / 3600)
      const minuty = Math.floor((zostalo % 3600) / 60)
      ustawTekst(godziny > 0 ? `za ${godziny} h ${minuty} min` : `za ${minuty} min`)
    }

    przelicz()
    // Co pół minuty: minuta na liczniku zmienia się rzadziej, a częstsze
    // przeliczanie i tak nie miałoby czego pokazać.
    const zegar = window.setInterval(przelicz, 30_000)
    return () => window.clearInterval(zegar)
  }, [otwarcieGodzina])

  return <span className="k-odliczanie">{tekst}</span>
}
