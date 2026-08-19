import type { LngLatBoundsLike } from 'maplibre-gl'

/**
 * Ślad trasy sprowadzony do jednej cechy — odpowiednik `liniaTrasy`
 * z `wstega_trasy.dart`.
 *
 * **Dlaczego jedna cecha, a nie kilka.** Strzałki kierunku rozstawiane są
 * wzdłuż każdej cechy osobno. Przy pięciu odcinkach odstępy zaczynałyby się od
 * nowa na każdej granicy i strzałki zbijałyby się w kupki w miejscach zmiany
 * znakowania — czyli dokładnie tam, gdzie mapa ma być najczytelniejsza.
 *
 * Bierzemy pierwszą cechę i tylko wtedy, gdy jest linią. Ślady generujemy
 * sami i zawsze mają tę postać; plik o innej budowie to błąd danych, a nie
 * przypadek do obsłużenia zgadywaniem.
 */

type Wspolrzedna = [number, number, ...number[]]

export type LiniaTrasy = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    properties: Record<string, never>
    geometry: { type: 'LineString'; coordinates: Wspolrzedna[] }
  }[]
}

export function liniaTrasy(dane: unknown): LiniaTrasy | null {
  if (typeof dane !== 'object' || dane === null) return null

  const cechy = (dane as { features?: unknown }).features
  if (!Array.isArray(cechy) || cechy.length === 0) return null

  const geometria = (cechy[0] as { geometry?: unknown })?.geometry
  if (typeof geometria !== 'object' || geometria === null) return null
  if ((geometria as { type?: unknown }).type !== 'LineString') return null

  const wspolrzedne = (geometria as { coordinates?: unknown }).coordinates
  if (!Array.isArray(wspolrzedne) || wspolrzedne.length < 2) return null

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: wspolrzedne as Wspolrzedna[] },
      },
    ],
  }
}

/**
 * Zasięg śladu do dopasowania widoku.
 *
 * Liczymy go z pobranych współrzędnych, a nie pytamy mapy o cechy w źródle.
 * Pytanie mapy działa dopiero, gdy zdąży narysować kafelki, więc trzeba było
 * czekać na zdarzenie `idle` i przy wolnym łączu widok skakał już po tym,
 * jak użytkownik sam przesunął mapę.
 *
 * Trzeci element współrzędnej to wysokość — przy zasięgu nie ma znaczenia.
 */
export function granice(linia: LiniaTrasy): LngLatBoundsLike | null {
  const punkty = linia.features[0]?.geometry.coordinates
  if (!punkty || punkty.length === 0) return null

  let zachod = punkty[0][0]
  let wschod = punkty[0][0]
  let poludnie = punkty[0][1]
  let polnoc = punkty[0][1]

  for (const [dlugosc, szerokosc] of punkty) {
    if (dlugosc < zachod) zachod = dlugosc
    if (dlugosc > wschod) wschod = dlugosc
    if (szerokosc < poludnie) poludnie = szerokosc
    if (szerokosc > polnoc) polnoc = szerokosc
  }

  return [
    [zachod, poludnie],
    [wschod, polnoc],
  ]
}
