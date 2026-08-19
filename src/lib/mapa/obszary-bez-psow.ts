import type { FillLayerSpecification, LineLayerSpecification } from 'maplibre-gl'

/**
 * Obszary z zakazem wprowadzania psów — odpowiednik warstw z ekranu „Trasy
 * z psem" w aplikacji (`lib/features/okolica/okolica_ekran.dart`).
 *
 * Zakaz nie kończy się na parku narodowym: rezerwaty Wąwóz Homole i Biała Woda
 * mają go osobno, mimo że leżą poza PPN, a psów nie wpuszcza się też na wzgórze
 * zamkowe w Czorsztynie. Granice pochodzą z OpenStreetMap i są szczegółowe —
 * sam park ma 1398 punktów, z wcięciami przy Przełomie Dunajca — bo zgrubny
 * obrys zamykałby ścieżki biegnące tuż obok.
 */

export const ADRES_OBSZAROW = '/dane/obszary/bez_psow.geojson'
export const ZRODLO_ZAKAZOW = 'obszary-bez-psow'
export const WZOR_KRESEK = 'kreski-zakazu'

export const WARSTWA_ZAKAZ_PODKLAD = 'zakazy-podklad'
export const WARSTWA_ZAKAZ_KRESKI = 'zakazy-kreski'
export const WARSTWA_ZAKAZ_GRANICA = 'zakazy-granica'

/** Czerwień zakazu — ta sama, którą maluje aplikacja. */
export const CZERWIEN_ZAKAZU = '#C62828'

/**
 * Ukośne kreski w czerwieni zakazu — wzór wypełnienia obszarów.
 *
 * **Dlaczego kreskowanie, a nie samo wypełnienie.** Półprzezroczysta plama
 * czytała się jak podświetlenie („tu coś ciekawego"), czyli dokładnie odwrotnie
 * niż trzeba. Kreskowanie ma jednoznaczny sens kartograficzny: obszar
 * wyłączony.
 *
 * Kafelek musi być bezszwowy, więc kreski rysujemy trzy razy — w kafelku
 * i po obu jego stronach — żeby przechodziły przez krawędź bez przeskoku.
 *
 * `null`, gdy przeglądarka nie dała kontekstu 2D; zostaje wtedy sama
 * podkładka i obwódka, czyli obszar nadal widać.
 */
const BOK = 12
const GESTOSC = 3

export function rysujKreski(): ImageData | null {
  const px = BOK * GESTOSC
  const plotno = document.createElement('canvas')
  plotno.width = px
  plotno.height = px

  const rysik = plotno.getContext('2d')
  if (!rysik) return null

  rysik.scale(GESTOSC, GESTOSC)
  rysik.strokeStyle = CZERWIEN_ZAKAZU
  rysik.globalAlpha = 0.85
  rysik.lineWidth = 2.4
  rysik.lineCap = 'square'

  for (const przesuniecie of [-BOK, 0, BOK]) {
    rysik.beginPath()
    rysik.moveTo(przesuniecie, BOK)
    rysik.lineTo(przesuniecie + BOK, 0)
    rysik.stroke()
  }

  return rysik.getImageData(0, 0, px, px)
}

export const GESTOSC_KRESEK = GESTOSC

/**
 * Trzy warstwy w kolejności rysowania.
 *
 * Najpierw jednolita podkładka, na niej kreskowanie, na wierzchu granica.
 * Same kreski nad ciemnym lasem gubiłyby się w podkładzie, a samo wypełnienie
 * nie mówiłoby „zakaz". Granica jest kreskowana, nie ciągła — obszar ma się
 * czytać inaczej niż szlak, a szlaki na tej mapie są ciągłe.
 */
export function warstwyZakazow(): [FillLayerSpecification, FillLayerSpecification, LineLayerSpecification] {
  return [
    {
      id: WARSTWA_ZAKAZ_PODKLAD,
      type: 'fill',
      source: ZRODLO_ZAKAZOW,
      paint: { 'fill-color': CZERWIEN_ZAKAZU, 'fill-opacity': 0.2 },
    },
    {
      id: WARSTWA_ZAKAZ_KRESKI,
      type: 'fill',
      source: ZRODLO_ZAKAZOW,
      paint: { 'fill-pattern': WZOR_KRESEK, 'fill-opacity': 0.75 },
    },
    {
      id: WARSTWA_ZAKAZ_GRANICA,
      type: 'line',
      source: ZRODLO_ZAKAZOW,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': CZERWIEN_ZAKAZU,
        'line-width': 3,
        'line-dasharray': [3, 2],
      },
    },
  ]
}
