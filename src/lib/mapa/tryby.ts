import type { StyleSpecification } from 'maplibre-gl'

/**
 * Trzy tryby podkładu mapy — te same, które ma aplikacja.
 *
 * Style przeniesione z `lib/features/mapa/tryb_mapy.dart`, żeby mapa na
 * stronie i mapa w telefonie pokazywały to samo. Opisy też są stamtąd: pisał
 * je ktoś, kto chodzi po tych szlakach, i mówią, do czego który tryb służy,
 * a nie czym jest technicznie.
 *
 * **Tryby terenowy i satelitarny wymagają sieci** — to kafelki rastrowe
 * z cudzych serwerów. Normalny też, ale jego kafelki są lżejsze i szybsze.
 *
 * **Atrybucja siedzi w samych stylach**, w polu `attribution` każdego źródła.
 * MapLibre pokazuje ją wtedy sam, w rogu mapy. Licencje OpenTopoMap (CC-BY-SA)
 * i Esri tego wymagają, a wpisanie ich do stylu jest jedynym sposobem, żeby
 * nie dało się o nich zapomnieć przy kolejnej zmianie.
 */

export type TrybMapy = 'normalny' | 'teren' | 'satelita'

export const TRYBY: { id: TrybMapy; nazwa: string; opis: string }[] = [
  {
    id: 'normalny',
    nazwa: 'Normalna',
    opis: 'Ulice, budynki i nazwy miejscowości — najlżejsza, dobra do dojazdu.',
  },
  {
    id: 'teren',
    nazwa: 'Teren',
    opis: 'Poziomice, cieniowanie stoków i znakowanie szlaków — najlepsza na szlaku.',
  },
  {
    id: 'satelita',
    nazwa: 'Satelita',
    opis: 'Zdjęcia lotnicze — widać, czy droga idzie lasem, czy odkrytą polaną.',
  },
]

const NORMALNY = 'https://tiles.openfreemap.org/styles/liberty'

/**
 * Teren: rastrowa OpenTopoMap z przygaszonymi budynkami.
 *
 * Budynki dokładamy z wektorów OpenFreeMap i wygaszamy je delikatnym
 * wypełnieniem. Bez tego zabudowa Szczawnicy na poziomicach zlewa się
 * w jedną plamę i nie widać, gdzie kończy się miasto, a zaczyna zbocze.
 */
const TEREN: StyleSpecification = {
  version: 8,
  name: 'Teren (OpenTopoMap)',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    opentopomap: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        '© OpenStreetMap contributors, SRTM | styl © OpenTopoMap (CC-BY-SA)',
    },
    budynki: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  },
  layers: [
    { id: 'tlo', type: 'background', paint: { 'background-color': '#F4F0E8' } },
    { id: 'opentopomap', type: 'raster', source: 'opentopomap' },
    {
      id: 'budynki-stlumienie',
      type: 'fill',
      source: 'budynki',
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-color': '#EDE6D6',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.35, 15, 0.7],
      },
    },
  ],
}

/**
 * Satelita: zdjęcia Esri z nazwami miejscowości na wierzchu.
 *
 * Same zdjęcia są nieczytelne bez podpisów — z lotu ptaka jedna dolina wygląda
 * jak druga. Etykiety idą z wektorów, w bieli z ciemną obwódką, bo pod spodem
 * bywa i jasna łąka, i czarny las.
 */
const SATELITA: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    sat: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
    openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  },
  layers: [
    { id: 'sat', type: 'raster', source: 'sat' },
    {
      id: 'miejsca',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'village'],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Bold'],
        'text-size': 13,
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#1A1A1A',
        'text-halo-width': 1.6,
      },
    },
  ],
}

export function stylTrybu(tryb: TrybMapy): string | StyleSpecification {
  if (tryb === 'teren') return TEREN
  if (tryb === 'satelita') return SATELITA
  return NORMALNY
}
