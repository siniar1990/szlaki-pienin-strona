import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { pobierzTrasy } from '../src/lib/dane/zrodlo'

/**
 * Scala ślady wszystkich tras w jeden plik GeoJSON.
 *
 * Uruchamiany automatycznie przed budowaniem (`prebuild` w package.json).
 *
 * Po co: mapa portalu rysuje 49 tras naraz. Gdyby każda była osobnym źródłem,
 * przeglądarka wysłałaby 49 żądań i utworzyła 49 warstw — a MapLibre musi
 * przy każdej klatce sprawdzić każdą z nich. Jeden plik to jedno żądanie,
 * jedna warstwa i jedno zapytanie przy kliknięciu.
 *
 * Przy okazji wkładamy do właściwości każdego śladu to, co mapa musi wiedzieć
 * bez sięgania po inne dane: nazwę, adres strony trasy i liczby na kartę.
 * Dzięki temu kliknięcie w linię od razu ma czym wypełnić dymek.
 */

const KOLORY_SZLAKOW: Record<string, string> = {
  czerwony: '#c0392b',
  niebieski: '#1f6dad',
  zielony: '#2b7a4b',
  zolty: '#d69a00',
  czarny: '#2f3437',
}

type Cecha = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry:
    | { type: 'LineString'; coordinates: number[][] }
    | { type: 'Point'; coordinates: number[] }
}

const wszystkie = pobierzTrasy()
const trasy = wszystkie.filter((trasa) => trasa.slad !== null)
const cechy: Cecha[] = []
const pominiete: string[] = []

/** Wspólny zestaw właściwości — mapa czyta je i z linii, i z punktu. */
function wlasciwosci(trasa: (typeof wszystkie)[number], maSlad: boolean) {
  return {
    id: trasa.id,
    nazwa: trasa.nazwa,
    slug: trasa.slug,
    adres: `/szlaki/${trasa.slug}`,
    dlugoscKm: trasa.dlugoscKm,
    czasMin: trasa.czasMin.tam,
    podejscieM: trasa.sumaPodejscM.tam,
    trudnosc: trasa.trudnosc,
    petla: trasa.petla,
    maSlad,
    kolor: KOLORY_SZLAKOW[trasa.szlaki[0]] ?? '#2f5d43',
  }
}

for (const trasa of trasy) {
  const sciezka = path.join(process.cwd(), 'public', trasa.slad!)

  let geojson: {
    features?: { geometry?: { type?: string; coordinates?: number[][] } }[]
  }
  try {
    geojson = JSON.parse(readFileSync(sciezka, 'utf8'))
  } catch {
    pominiete.push(`${trasa.id} (brak pliku ${trasa.slad})`)
    continue
  }

  const linia = geojson.features?.find((cecha) => cecha.geometry?.type === 'LineString')
  if (!linia?.geometry?.coordinates?.length) {
    pominiete.push(`${trasa.id} (ślad bez linii)`)
    continue
  }

  cechy.push({
    type: 'Feature',
    properties: wlasciwosci(trasa, true),
    // Wysokości (trzecia wartość) obcinamy — mapa ich nie używa, a stanowią
    // jedną trzecią wagi pliku. Profil wysokości i tak czyta oryginalny ślad.
    geometry: {
      type: 'LineString',
      coordinates: linia.geometry.coordinates.map(([lon, lat]) => [
        Number(lon.toFixed(5)),
        Number(lat.toFixed(5)),
      ]),
    },
  })
}

/*
  Trasy bez zdigitalizowanego śladu.

  Czterem szczytom Korony Pienin ślad jeszcze nie powstał — w danych aplikacji
  po prostu go nie ma. Narysowanie przybliżonej linii „na oko" byłoby w górach
  niebezpieczne: ktoś poszedłby za nią w teren. Zamiast tego stawiamy punkt
  w miejscu szczytu, wyraźnie oznaczony jako trasa bez śladu, i prowadzimy
  do pełnego opisu. Dzięki temu na mapie jest komplet tras, a żadna linia
  nie obiecuje przebiegu, którego nikt nie sprawdził.
*/
for (const trasa of wszystkie) {
  if (trasa.slad !== null) continue

  // Punkt docelowy: ten o nazwie trasy (Korony Pienin nazywają się od szczytu),
  // a gdy takiego nie ma — ostatni punkt, czyli koniec trasy.
  const docelowy =
    trasa.punkty.find((punkt) => punkt.nazwa === trasa.nazwa) ??
    trasa.punkty[trasa.punkty.length - 1]

  if (!docelowy) {
    pominiete.push(`${trasa.id} (brak śladu i brak punktów)`)
    continue
  }

  cechy.push({
    type: 'Feature',
    properties: wlasciwosci(trasa, false),
    geometry: { type: 'Point', coordinates: docelowy.wspolrzedne },
  })
}

const cel = path.join(process.cwd(), 'public', 'dane', 'szlaki.geojson')
writeFileSync(cel, JSON.stringify({ type: 'FeatureCollection', features: cechy }))

const waga = (readFileSync(cel).length / 1024).toFixed(0)
const linie = cechy.filter((c) => c.geometry.type === 'LineString').length
const punkty = cechy.length - linie
console.log(
  `szlaki.geojson: ${cechy.length} tras (${linie} ze śladem, ${punkty} jako punkt), ${waga} kB`,
)
if (pominiete.length > 0) {
  console.log(`pominięto: ${pominiete.join(', ')}`)
}
