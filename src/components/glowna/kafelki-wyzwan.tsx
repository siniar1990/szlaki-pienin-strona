import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { kilometry } from '@/lib/format'
import type { Wyzwanie } from '@/lib/dane/typy'

/**
 * Kafelki pienińskich wyzwań.
 *
 * **Dlaczego nie ilustracja trasy w tle.** Pierwsza wersja brała malowane
 * ilustracje z aplikacji, tak jak kafelki kategorii. Wyszło słabo i to nie jest
 * kwestia gustu: te trzy ilustracje są niemal identyczne — ta sama łąka, te same
 * wzgórza, różnica to drobny detal w tle. Pod przyciemnieniem potrzebnym pod
 * biały napis czytały się jako trzy jednakowe bladozielone prostokąty, czyli
 * dokładnie odwrotnie do zadania, jakie ma kafelek: rozpoznać się z odległości.
 *
 * **Co jest w zamian.** Panel w barwie kamienia z odznaką jako głównym
 * elementem. Odznaka jest tożsamością wyzwania — tym, co człowiek dostaje na
 * końcu, i tym, co pamięta. Jest też jedyną rzeczą, której kafelki kategorii nie
 * mają w ogóle, więc od razu widać, że to inny gatunek kafelka.
 *
 * Trzy kamienie dają trzy naprawdę różne kafelki: granatowy, karmazynowy
 * i zielony. Barwa nadal nie jest jedynym nośnikiem — nadtytuł mówi wprost
 * „Pienińskie wyzwanie", a każda odznaka wygląda inaczej także w odcieniach
 * szarości.
 */

type Warstwy = { tlo: string; poswiata: string; kreska: string }

/**
 * Barwy kamieni. Gradienty w stylu, nie w klasach Tailwinda: te ostatnie muszą
 * być wypisane dosłownie w źródle, żeby skaner je zobaczył, a trzy warstwy
 * gradientu na kafelek dałyby dziewięć nieczytelnych klas.
 *
 * Każdy kafelek ma trzy warstwy: skos od ciemnego do jaśniejszego (daje
 * głębię), poświatę pod odznaką (odkleja ją od tła) i cienką jaśniejszą kreskę
 * przy górnej krawędzi (imituje światło padające na fasetę kamienia).
 */
const KAMIENIE: Record<string, Warstwy> = {
  diament: {
    tlo: 'linear-gradient(150deg, #123a5e 0%, #0b2540 45%, #071726 100%)',
    poswiata: 'radial-gradient(circle at 68% 42%, rgb(120 190 240 / 0.30) 0%, transparent 62%)',
    kreska: 'linear-gradient(180deg, rgb(160 210 255 / 0.35) 0%, transparent 38%)',
  },
  rubin: {
    tlo: 'linear-gradient(150deg, #6d1424 0%, #4a0e1a 45%, #2a0509 100%)',
    poswiata: 'radial-gradient(circle at 68% 42%, rgb(255 130 150 / 0.26) 0%, transparent 62%)',
    kreska: 'linear-gradient(180deg, rgb(255 180 195 / 0.32) 0%, transparent 38%)',
  },
  szmaragd: {
    tlo: 'linear-gradient(150deg, #0a5c42 0%, #06392a 45%, #02180f 100%)',
    poswiata: 'radial-gradient(circle at 68% 42%, rgb(110 235 185 / 0.26) 0%, transparent 62%)',
    kreska: 'linear-gradient(180deg, rgb(160 245 210 / 0.32) 0%, transparent 38%)',
  },
}

const KAMIEN_ZAPAS: Warstwy = {
  tlo: 'linear-gradient(150deg, #3d4a52 0%, #26313a 45%, #141c22 100%)',
  poswiata: 'radial-gradient(circle at 68% 42%, rgb(200 215 225 / 0.22) 0%, transparent 62%)',
  kreska: 'linear-gradient(180deg, rgb(220 230 240 / 0.28) 0%, transparent 38%)',
}

export function KafelkiWyzwan({
  wyzwania,
}: {
  wyzwania: {
    wyzwanie: Wyzwanie
    dlugoscKm: number | null
  }[]
}) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {wyzwania.map(({ wyzwanie, dlugoscKm }) => {
        const kamien = KAMIENIE[wyzwanie.id] ?? KAMIEN_ZAPAS

        return (
          <li key={wyzwanie.slug}>
            <Link
              href={`/wyzwania/${wyzwanie.slug}`}
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl shadow-miekki transition-all duration-300 hover:-translate-y-1 hover:shadow-wysoki"
              style={{ backgroundImage: kamien.tlo }}
            >
              <span aria-hidden className="absolute inset-0" style={{ backgroundImage: kamien.poswiata } } />
              <span aria-hidden className="absolute inset-x-0 top-0 h-1/3" style={{ backgroundImage: kamien.kreska }} />

              {/*
                Odznaka wychodzi poza prawą krawędź. Kadr przestaje być płaski,
                a odznaka może być duża, nie zabierając miejsca napisom —
                w kafelku szerokości trzydziestu procent ekranu to jedyny sposób,
                żeby dała się rozpoznać.
              */}
              {wyzwanie.odznaka && (
                <Image
                  src={wyzwanie.odznaka}
                  alt=""
                  width={320}
                  height={320}
                  loading="lazy"
                  className="absolute -right-6 top-1/2 z-10 w-[42%] max-w-[9.5rem] -translate-y-[58%] drop-shadow-[0_6px_20px_rgb(0_0_0_/_0.45)] transition-transform duration-500 group-hover:scale-105 sm:-right-7"
                />
              )}

              {/* Przyciemnienie u dołu — pod napisami, nie na całym kadrze.
                  Panel jest ciemny sam z siebie, ale poświata rozjaśnia środek
                  i biały tekst mógłby się na niej gubić. */}
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 z-10 h-3/5"
                style={{ backgroundImage: 'linear-gradient(0deg, rgb(0 0 0 / 0.55) 0%, transparent 100%)' }}
              />

              <div className="relative z-20 max-w-[68%] p-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Pienińskie wyzwanie
                </p>
                <h3 className="mt-1.5 font-heading text-2xl font-semibold leading-tight text-white sm:text-[1.6rem]">
                  {wyzwanie.nazwa}
                </h3>
                {/*
                  Podtytuł i długość w osobnych wierszach, nie rozdzielone
                  kropką. Kropka między nimi wygląda dobrze tylko wtedy, gdy oba
                  mieszczą się w jednej linii — przy „Pogranicze: od wąwozu po
                  przełom rzeki" zawijała się i zaczynała wiersz od znaku
                  interpunkcyjnego.
                */}
                {wyzwanie.podtytul && (
                  <p className="mt-2 text-sm leading-snug text-white/80">{wyzwanie.podtytul}</p>
                )}
                {dlugoscKm !== null && (
                  <p className="mt-1 text-sm tabular-nums text-white/65">{kilometry(dlugoscKm)}</p>
                )}
              </div>

              <span
                aria-hidden
                className="absolute left-5 top-5 z-20 grid size-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
