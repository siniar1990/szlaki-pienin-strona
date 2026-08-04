import type { PunktWykresu } from '@/lib/qr/statystyki'

/**
 * Słupki dzienne rysowane jako SVG po stronie serwera.
 *
 * Bez biblioteki wykresów. Trzydzieści słupków i jedna oś nie uzasadniają
 * dokładania kilkudziesięciu kilobajtów JavaScriptu do panelu, który i tak
 * odświeża się przy każdym wejściu.
 *
 * Sam obrazek jest dla czytników ekranu niewidoczny — zamiast niego dostają
 * tabelę z tymi samymi liczbami, ukrytą wizualnie. Wykres, którego nie da się
 * przeczytać inaczej niż okiem, jest dla części odbiorców pustym miejscem.
 */

const SZEROKOSC = 900
const WYSOKOSC = 220
const DOL = 190

export function WykresDzienny({ punkty }: { punkty: PunktWykresu[] }) {
  const maks = Math.max(1, ...punkty.map((p) => p.liczba))
  const szerokoscSlupka = SZEROKOSC / punkty.length

  return (
    <>
      <svg viewBox={`0 0 ${SZEROKOSC} ${WYSOKOSC}`} className="h-auto w-full" aria-hidden>
        {/* Linie odniesienia: zero, połowa i wartość największa. */}
        {[0, 0.5, 1].map((udzial) => {
          const y = DOL - udzial * (DOL - 20)
          return (
            <g key={udzial}>
              <line x1="0" y1={y} x2={SZEROKOSC} y2={y} stroke="var(--color-kamien-200)" strokeWidth="1" />
              <text x="4" y={y - 5} className="fill-kamien-400 text-[11px]">
                {Math.round(maks * udzial)}
              </text>
            </g>
          )
        })}

        {punkty.map((punkt, i) => {
          const wysokosc = (punkt.liczba / maks) * (DOL - 20)
          return (
            <rect
              key={punkt.dzien}
              x={i * szerokoscSlupka + szerokoscSlupka * 0.15}
              y={DOL - wysokosc}
              width={szerokoscSlupka * 0.7}
              height={Math.max(wysokosc, punkt.liczba > 0 ? 2 : 0)}
              rx="2"
              fill="var(--color-las-600)"
            />
          )
        })}

        {/* Podpisy tylko co siódmy dzień — trzydzieści dat obok siebie zlewa
            się w szarą wstęgę i nie da się przeczytać żadnej. */}
        {punkty.map((punkt, i) =>
          i % 7 === 0 ? (
            <text
              key={`data-${punkt.dzien}`}
              x={i * szerokoscSlupka + szerokoscSlupka / 2}
              y={DOL + 18}
              textAnchor="middle"
              className="fill-kamien-500 text-[11px]"
            >
              {punkt.dzien.slice(8)}.{punkt.dzien.slice(5, 7)}
            </text>
          ) : null,
        )}
      </svg>

      <table className="sr-only">
        <caption>Liczba skanów w poszczególnych dniach</caption>
        <thead>
          <tr>
            <th scope="col">Dzień</th>
            <th scope="col">Skany</th>
          </tr>
        </thead>
        <tbody>
          {punkty.map((punkt) => (
            <tr key={punkt.dzien}>
              <th scope="row">{punkt.dzien}</th>
              <td>{punkt.liczba}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
