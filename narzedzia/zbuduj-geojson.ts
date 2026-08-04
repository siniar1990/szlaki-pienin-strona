import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { KATEGORIE_APLIKACJI } from '../src/lib/dane/kategorie'
import { pobierzAtrakcje, pobierzTrasy } from '../src/lib/dane/zrodlo'

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

/**
 * Kategoria trasy w brzmieniu z aplikacji.
 *
 * Bierzemy pierwszą pasującą z listy — kolejność w `KATEGORIE_APLIKACJI` jest
 * ta sama, co na ekranie startowym, więc trasa należąca do dwóch kategorii
 * trafia do tej, którą aplikacja pokazuje wyżej. Lista na mapie grupuje się
 * potem właśnie po tej nazwie.
 */
function kategoriaTrasy(trasa: (typeof wszystkie)[number]) {
  const kategoria = KATEGORIE_APLIKACJI.find((k) => k.pasuje(trasa))
  return {
    kategoria: kategoria?.slug ?? 'inne',
    kategoriaNazwa: kategoria?.nazwa ?? 'Pozostałe trasy',
    kategoriaKolejnosc: kategoria ? KATEGORIE_APLIKACJI.indexOf(kategoria) : 99,
  }
}

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
    pttk: trasa.pttk,
    maSlad,
    ...kategoriaTrasy(trasa),
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

/* ── Pliki GPX ────────────────────────────────────────────────────────────
   GPX to format, który rozumie każdy zegarek, nawigacja i Strava — a którego
   aplikacja nie trzyma, bo sama pracuje na GeoJSON-ie. Zamiast dokładać drugi
   zestaw plików do repozytorium aplikacji, wytwarzamy je tutaj, przy
   budowaniu, z tego samego śladu. Nie ma więc ryzyka, że kiedyś się rozjadą.

   Znaki `&`, `<` i `>` w nazwie trasy trzeba uciec — GPX to XML i jedna
   nieuciekniona ampersanda psuje cały plik.                                */

function ucieknijXml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const katalogGpx = path.join(process.cwd(), 'public', 'dane', 'gpx')
mkdirSync(katalogGpx, { recursive: true })

let zapisanychGpx = 0

for (const cecha of cechy) {
  if (cecha.geometry.type !== 'LineString') continue
  const w = cecha.properties as Record<string, string | number | boolean>

  const punkty = (cecha.geometry.coordinates as number[][])
    .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join('\n')

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="szlakipienin.pl" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${ucieknijXml(String(w.nazwa))}</name>
    <desc>${w.dlugoscKm} km, ${w.czasMin} min, ${w.podejscieM} m podejść. Opis trasy: https://szlakipienin.pl${w.adres}</desc>
    <link href="https://szlakipienin.pl${w.adres}"><text>${ucieknijXml(String(w.nazwa))}</text></link>
  </metadata>
  <trk>
    <name>${ucieknijXml(String(w.nazwa))}</name>
    <trkseg>
${punkty}
    </trkseg>
  </trk>
</gpx>
`
  writeFileSync(path.join(katalogGpx, `${w.id}.gpx`), gpx)
  zapisanychGpx += 1
}

/*
  Spis stron portalu dla panelu tabliczek.

  Formularz nowej tabliczki pozwala wskazać, do której strony ma prowadzić kod
  — i musi znać listę istniejących adresów, żeby nikt nie wpisał odnośnika do
  nieistniejącej atrakcji. Panel działa przy żądaniu, a dane tras leżą
  w plikach czytanych przy budowaniu; zamiast sięgać po dysk w czasie
  działania, wytwarzamy gotowy spis tutaj i podajemy go jako zwykły plik.
*/
const strony = [
  ...pobierzAtrakcje().map((a) => ({
    adres: `/atrakcje/${a.slug}`,
    nazwa: a.nazwa,
    rodzaj: 'atrakcja',
  })),
  ...wszystkie.map((t) => ({
    adres: `/szlaki/${t.slug}`,
    nazwa: t.nazwa,
    rodzaj: 'trasa',
  })),
].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))

writeFileSync(
  path.join(process.cwd(), 'public', 'dane', 'strony.json'),
  JSON.stringify(strony),
)
console.log(`strony.json: ${strony.length} adresów`)

const cel = path.join(process.cwd(), 'public', 'dane', 'szlaki.geojson')
writeFileSync(cel, JSON.stringify({ type: 'FeatureCollection', features: cechy }))

const waga = (readFileSync(cel).length / 1024).toFixed(0)
const linie = cechy.filter((c) => c.geometry.type === 'LineString').length
const punkty = cechy.length - linie
console.log(
  `szlaki.geojson: ${cechy.length} tras (${linie} ze śladem, ${punkty} jako punkt), ${waga} kB`,
)
console.log(`gpx: ${zapisanychGpx} plików`)
if (pominiete.length > 0) {
  console.log(`pominięto: ${pominiete.join(', ')}`)
}
