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
  geometry: { type: 'LineString'; coordinates: number[][] }
}

const trasy = pobierzTrasy().filter((trasa) => trasa.slad !== null)
const cechy: Cecha[] = []
const pominiete: string[] = []

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
    properties: {
      id: trasa.id,
      nazwa: trasa.nazwa,
      slug: trasa.slug,
      adres: `/szlaki/${trasa.slug}`,
      dlugoscKm: trasa.dlugoscKm,
      czasMin: trasa.czasMin.tam,
      podejscieM: trasa.sumaPodejscM.tam,
      trudnosc: trasa.trudnosc,
      petla: trasa.petla,
      kolor: KOLORY_SZLAKOW[trasa.szlaki[0]] ?? '#2f5d43',
    },
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

const cel = path.join(process.cwd(), 'public', 'dane', 'szlaki.geojson')
writeFileSync(cel, JSON.stringify({ type: 'FeatureCollection', features: cechy }))

const waga = (readFileSync(cel).length / 1024).toFixed(0)
console.log(`szlaki.geojson: ${cechy.length} śladów, ${waga} kB`)
if (pominiete.length > 0) {
  console.log(`pominięto: ${pominiete.join(', ')}`)
}
