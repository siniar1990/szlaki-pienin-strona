import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Podgląd mapy na stronie głównej.
 *
 * Zamiast zdjęcia mapy albo pustego prostokąta rysujemy prawdziwe ślady
 * wszystkich tras — ten sam plik GeoJSON, z którego korzysta mapa
 * interaktywna. Obrazek jest więc zawsze aktualny: dochodzi trasa
 * w aplikacji, dochodzi kreska tutaj, bez niczyjej pracy.
 *
 * Całość powstaje przy budowaniu jako zwykły SVG. Do przeglądarki idzie
 * gotowy kształt — żadnego JavaScriptu, żadnych kafelków mapowych,
 * żadnego zapytania sieciowego.
 */

type Cecha = {
  properties: { kolor: string; maSlad: boolean; nazwa: string }
  geometry:
    | { type: 'LineString'; coordinates: [number, number][] }
    | { type: 'Point'; coordinates: [number, number] }
}

const SZEROKOSC = 800
const WYSOKOSC = 600
const MARGINES = 24

export function PodgladMapy({ className }: { className?: string }) {
  const plik = path.join(process.cwd(), 'public', 'dane', 'szlaki.geojson')

  let cechy: Cecha[]
  try {
    cechy = (JSON.parse(readFileSync(plik, 'utf8')) as { features: Cecha[] }).features
  } catch {
    // Podgląd jest ozdobą sekcji, nie jej treścią — brak pliku nie może
    // wywalić budowania całej strony głównej.
    return null
  }

  // Zasięg wszystkich śladów, żeby wpasować je w kadr.
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  const wszystkiePunkty = cechy.flatMap((cecha) =>
    cecha.geometry.type === 'LineString'
      ? cecha.geometry.coordinates
      : [cecha.geometry.coordinates],
  )

  for (const [lon, lat] of wszystkiePunkty) {
    if (lon < minX) minX = lon
    if (lon > maxX) maxX = lon
    if (lat < minY) minY = lat
    if (lat > maxY) maxY = lat
  }

  /*
    Rzut walcowy z poprawką na szerokość geograficzną.

    Na 49° równoleżnik stopień długości jest o jedną trzecią krótszy niż
    stopień szerokości. Bez pomnożenia przez cosinus mapa wyszłaby rozciągnięta
    w poziomie i Pieniny wyglądałyby jak naleśnik.
  */
  const cosSzerokosci = Math.cos((((minY + maxY) / 2) * Math.PI) / 180)
  const zakresX = (maxX - minX) * cosSzerokosci
  const zakresY = maxY - minY

  const skala = Math.min(
    (SZEROKOSC - 2 * MARGINES) / zakresX,
    (WYSOKOSC - 2 * MARGINES) / zakresY,
  )
  const przesuniecieX = (SZEROKOSC - zakresX * skala) / 2
  const przesuniecieY = (WYSOKOSC - zakresY * skala) / 2

  const naX = (lon: number) => przesuniecieX + (lon - minX) * cosSzerokosci * skala
  // Oś Y w SVG rośnie w dół, a szerokość geograficzna w górę — stąd odjęcie.
  const naY = (lat: number) => WYSOKOSC - przesuniecieY - (lat - minY) * skala

  const linie = cechy.filter((c) => c.geometry.type === 'LineString')
  const punkty = cechy.filter((c) => c.geometry.type === 'Point')

  return (
    <svg
      viewBox={`0 0 ${SZEROKOSC} ${WYSOKOSC}`}
      className={className}
      role="img"
      aria-label={`Szkic przebiegu ${cechy.length} tras opisanych w portalu`}
    >
      {linie.map((cecha, indeks) => {
        const d = (cecha.geometry as { coordinates: [number, number][] }).coordinates
          .map(
            ([lon, lat], i) =>
              `${i === 0 ? 'M' : 'L'}${naX(lon).toFixed(1)} ${naY(lat).toFixed(1)}`,
          )
          .join(' ')

        return (
          <path
            key={indeks}
            d={d}
            fill="none"
            stroke={cecha.properties.kolor}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.9"
          />
        )
      })}

      {punkty.map((cecha, indeks) => {
        const [lon, lat] = (cecha.geometry as { coordinates: [number, number] }).coordinates
        return (
          <circle
            key={`p-${indeks}`}
            cx={naX(lon)}
            cy={naY(lat)}
            r="3.5"
            fill="none"
            stroke={cecha.properties.kolor}
            strokeWidth="2"
          />
        )
      })}
    </svg>
  )
}
