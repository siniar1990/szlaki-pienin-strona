import { type Punkt, odlegloscM } from './geometria'

/**
 * Profil wysokości na karcie — model do narysowania w SVG.
 *
 * **Skala pionowa jest rozciągnięta na cały pas, a nie wierna metrom.**
 * Trasa wznosząca się o 300 m na 12 km w skali wiernej byłaby linią prostą
 * i nie powiedziałaby nic. Wykres ma pokazać KSZTAŁT wysiłku: gdzie ostro pod
 * górę, gdzie płasko, gdzie w dół — a do tego najniższy punkt musi wylądować
 * na dole pasa, a najwyższy na górze. Liczby przy osi mówią, ile to naprawdę.
 *
 * Punkty etapowe siadają na krzywej po odległości, a nie po czasie: kropka obok
 * linii wygląda na błąd rysunku, nawet gdy czas jest policzony dobrze.
 */

export const SZEROKOSC = 1000
export const WYSOKOSC = 300

/** Pas, w którym mieści się krzywa — wartości wprost z mockupu. */
const GORA = 66
const DOL = 246
const PODSTAWA = 266
const WYPELNIENIE_DO = 260
const LEWO = 4
const PRAWO = 994

export type ProfilKarty = {
  /** Ścieżka krzywej. */
  linia: string
  /** Ta sama krzywa domknięta do podstawy — pod wypełnienie. */
  wypelnienie: string
  podstawaY: number
  /** Kropki punktów etapowych, leżące dokładnie na krzywej. */
  kropki: { x: number; y: number }[]
  /** Podpisy pod osią: start, najwyższy punkt, meta. */
  podpisy: { x: number; tekst: string; kotwica: 'start' | 'middle' | 'end' }[]
  najwyzszy: { x: number; y: number; tekst: string } | null
  minM: number
  maxM: number
}

export type PunktProfilu = { wspolrzedne: Punkt; nazwa: string }

export function zbudujProfil(
  slad: readonly (readonly [number, number, number?])[],
  punktyEtapowe: readonly PunktProfilu[],
): ProfilKarty | null {
  const zWysokoscia = slad.filter((p) => typeof p[2] === 'number')
  if (zWysokoscia.length < 2) return null

  // Odległość narastająco — oś pozioma. Indeks punktu nie nadaje się: GPS
  // gęściej próbkuje w miejscach, gdzie się szło wolno, i wykres kłamałby
  // o proporcjach podejść.
  const narastajaco: number[] = [0]
  for (let i = 1; i < zWysokoscia.length; i += 1) {
    const a: Punkt = [zWysokoscia[i - 1][0], zWysokoscia[i - 1][1]]
    const b: Punkt = [zWysokoscia[i][0], zWysokoscia[i][1]]
    narastajaco.push(narastajaco[i - 1] + odlegloscM(a, b))
  }
  const calosc = narastajaco[narastajaco.length - 1]
  if (calosc <= 0) return null

  const wysokosci = zWysokoscia.map((p) => p[2] as number)
  const minM = Math.min(...wysokosci)
  const maxM = Math.max(...wysokosci)
  const rozpietosc = Math.max(maxM - minM, 1)

  const naX = (metry: number) => LEWO + (metry / calosc) * (PRAWO - LEWO)
  const naY = (m: number) => DOL - ((m - minM) / rozpietosc) * (DOL - GORA)

  const punkty = zWysokoscia.map((p, i) => ({
    x: naX(narastajaco[i]),
    y: naY(p[2] as number),
  }))

  const linia = punkty
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const wypelnienie = `${linia} L ${PRAWO.toFixed(1)} ${WYPELNIENIE_DO} L ${LEWO.toFixed(1)} ${WYPELNIENIE_DO} Z`

  // Punkt etapowy trafia na krzywą w miejscu, w którym ślad przechodzi mu
  // najbliżej — dzięki temu kropka leży NA linii, a nie obok niej.
  const kropki = punktyEtapowe.map((punkt) => {
    let najlepszy = 0
    let najblizej = Infinity
    for (let i = 0; i < zWysokoscia.length; i += 1) {
      const dLon = zWysokoscia[i][0] - punkt.wspolrzedne[0]
      const dLat = zWysokoscia[i][1] - punkt.wspolrzedne[1]
      const d = dLon * dLon + dLat * dLat
      if (d < najblizej) {
        najblizej = d
        najlepszy = i
      }
    }
    return punkty[najlepszy]
  })

  const indeksNajwyzszego = wysokosci.indexOf(maxM)
  const najwyzszy = {
    x: punkty[indeksNajwyzszego].x,
    y: punkty[indeksNajwyzszego].y,
    tekst: `${Math.round(maxM)} m`,
  }

  // Trzy podpisy, nie więcej: przy dziesięciu punktach etapowych nazwy zlałyby
  // się w pasek nieczytelnych liter.
  const podpisy: ProfilKarty['podpisy'] = []
  if (punktyEtapowe.length > 0) {
    podpisy.push({ x: LEWO, tekst: punktyEtapowe[0].nazwa, kotwica: 'start' })
  }
  if (punktyEtapowe.length > 2) {
    const srodkowy = najblizszyPunktEtapowy(punktyEtapowe, zWysokoscia, indeksNajwyzszego)
    if (srodkowy) podpisy.push({ x: najwyzszy.x, tekst: srodkowy, kotwica: 'middle' })
  }
  if (punktyEtapowe.length > 1) {
    podpisy.push({
      x: PRAWO,
      tekst: punktyEtapowe[punktyEtapowe.length - 1].nazwa,
      kotwica: 'end',
    })
  }

  return {
    linia,
    wypelnienie,
    podstawaY: PODSTAWA,
    kropki,
    podpisy,
    najwyzszy,
    minM: Math.round(minM),
    maxM: Math.round(maxM),
  }
}

/** Nazwa punktu etapowego najbliższego danemu miejscu na śladzie. */
function najblizszyPunktEtapowy(
  punkty: readonly PunktProfilu[],
  slad: readonly (readonly [number, number, number?])[],
  indeks: number,
): string | null {
  const cel = slad[indeks]
  let nazwa: string | null = null
  let najblizej = Infinity

  for (const punkt of punkty) {
    const dLon = punkt.wspolrzedne[0] - cel[0]
    const dLat = punkt.wspolrzedne[1] - cel[1]
    const d = dLon * dLon + dLat * dLat
    if (d < najblizej) {
      najblizej = d
      nazwa = punkt.nazwa
    }
  }

  return nazwa
}
