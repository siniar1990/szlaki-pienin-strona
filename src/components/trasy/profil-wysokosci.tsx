import type { ProfilWysokosci } from '@/lib/dane/zrodlo'
import { kilometry, metry } from '@/lib/format'

/**
 * Wykres wysokości trasy.
 *
 * Rysowany jako zwykły SVG po stronie serwera — do przeglądarki trafia gotowy
 * kształt, bez biblioteki wykresów i bez ani jednej linijki JavaScriptu.
 * Przy 53 trasach to różnica między portalem, który ładuje się natychmiast,
 * a takim, który dokłada 60 kB na każdą podstronę.
 *
 * Sam obrazek jest dla czytników ekranu niewidoczny (`aria-hidden`), bo
 * łamana linia nic im nie powie. Zamiast niej dostają opis słowny pod
 * wykresem — te same liczby, tylko zdaniem.
 */

const SZEROKOSC = 800
const WYSOKOSC = 220
const MARGINES = { gora: 16, dol: 28, lewo: 44, prawo: 12 }

export function ProfilWysokosciWykres({
  profil,
  className,
}: {
  profil: ProfilWysokosci
  className?: string
}) {
  const { punkty, minM, maxM, dlugoscKm } = profil

  // Skala pionowa dostaje zapas, żeby szczyt nie dotykał górnej krawędzi,
  // a dolina nie zlewała się z osią. Przy płaskiej trasie zapas ratuje
  // wykres przed dzieleniem przez zero.
  const zapas = Math.max(20, (maxM - minM) * 0.12)
  const doleM = minM - zapas
  const goraM = maxM + zapas
  const zakresM = goraM - doleM || 1

  const polePlotnaX = SZEROKOSC - MARGINES.lewo - MARGINES.prawo
  const polePlotnaY = WYSOKOSC - MARGINES.gora - MARGINES.dol

  const naX = (km: number) => MARGINES.lewo + (km / (dlugoscKm || 1)) * polePlotnaX
  const naY = (m: number) => MARGINES.gora + (1 - (m - doleM) / zakresM) * polePlotnaY

  const linia = punkty
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${naX(p.km).toFixed(1)} ${naY(p.wysokoscM).toFixed(1)}`)
    .join(' ')

  // Ta sama linia domknięta do dołu — pod nią kładziemy delikatne wypełnienie.
  const wypelnienie = `${linia} L${naX(dlugoscKm).toFixed(1)} ${(WYSOKOSC - MARGINES.dol).toFixed(1)} L${MARGINES.lewo} ${(WYSOKOSC - MARGINES.dol).toFixed(1)} Z`

  // Trzy poziome linie odniesienia: dół, środek i góra zakresu wysokości.
  const poziomy = [minM, Math.round((minM + maxM) / 2), maxM]

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${SZEROKOSC} ${WYSOKOSC}`}
        className="h-auto w-full"
        role="img"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gradient-profilu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-las-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-las-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {poziomy.map((m) => (
          <g key={m}>
            <line
              x1={MARGINES.lewo}
              y1={naY(m)}
              x2={SZEROKOSC - MARGINES.prawo}
              y2={naY(m)}
              stroke="var(--color-kamien-200)"
              strokeWidth="1"
            />
            <text
              x={MARGINES.lewo - 8}
              y={naY(m) + 4}
              textAnchor="end"
              className="fill-kamien-500 text-[11px]"
            >
              {Math.round(m)}
            </text>
          </g>
        ))}

        <path d={wypelnienie} fill="url(#gradient-profilu)" />
        <path
          d={linia}
          fill="none"
          stroke="var(--color-las-600)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          // `non-scaling-stroke` trzyma grubość linii, mimo że wykres jest
          // rozciągany w poziomie (`preserveAspectRatio="none"`). Bez tego
          // na szerokim ekranie linia robi się nienaturalnie gruba.
          vectorEffect="non-scaling-stroke"
        />

        <text
          x={MARGINES.lewo}
          y={WYSOKOSC - 8}
          className="fill-kamien-500 text-[11px]"
        >
          0 km
        </text>
        <text
          x={SZEROKOSC - MARGINES.prawo}
          y={WYSOKOSC - 8}
          textAnchor="end"
          className="fill-kamien-500 text-[11px]"
        >
          {kilometry(dlugoscKm)}
        </text>
      </svg>

      <figcaption className="mt-3 text-sm text-kamien-600">
        Profil wysokości: od {metry(minM)} do {metry(maxM)} n.p.m. na dystansie{' '}
        {kilometry(dlugoscKm)}. Wysokości z modelu terenu EU-DEM o rozdzielczości 25 m.
      </figcaption>
    </figure>
  )
}
