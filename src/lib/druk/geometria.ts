/**
 * Rzutowanie i wygładzanie śladu na potrzeby mapy w karcie do druku.
 *
 * Mapa karty nie jest kafelkami — rysujemy ją jako SVG wprost ze śladu. Powód
 * jest drukarski: kafelki rastrowe wychodzą na laserówce szarą papką, a wektor
 * jest ostry na każdej rozdzielczości i nie wymaga sieci w chwili generowania.
 */

export type Punkt = readonly [number, number]

/** Prostokąt obejmujący: [zachód, południe, wschód, północ]. */
export type Zasieg = readonly [number, number, number, number]

export function zasiegPunktow(punkty: readonly Punkt[]): Zasieg | null {
  if (punkty.length === 0) return null

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

  return [zachod, poludnie, wschod, polnoc]
}

/**
 * Przelicznik ze stopni na jednostki rysunku.
 *
 * **Korekta `cos(lat)` jest obowiązkowa.** Stopień długości geograficznej jest
 * na 49° równoleżniku o jedną trzecią krótszy niż stopień szerokości. Bez tej
 * poprawki pętla robi się rozciągnięta w poziomie i mapa kłamie o kształcie
 * trasy — a kształt jest jedyną rzeczą, po której turysta rozpozna ją
 * w terenie.
 */
export type Rzutowanie = {
  (punkt: Punkt): readonly [number, number]
  /** Ile jednostek rysunku ma jeden metr w poziomie — do podziałki. */
  jednostekNaMetr: number
}

const METROW_NA_STOPIEN = 111_320

export function rzutowanie(
  zasieg: Zasieg,
  szerokoscPx: number,
  wysokoscPx: number,
  margines: number,
): Rzutowanie {
  const [zachod, poludnie, wschod, polnoc] = zasieg
  const srodkowaSzerokosc = (poludnie + polnoc) / 2
  const scisk = Math.cos((srodkowaSzerokosc * Math.PI) / 180)

  // Ślad sprowadzony do płaszczyzny: długość ściśnięta, szerokość bez zmian.
  const plaskaSzerokosc = Math.max((wschod - zachod) * scisk, 1e-9)
  const plaskaWysokosc = Math.max(polnoc - poludnie, 1e-9)

  const dostepnaSzerokosc = szerokoscPx - 2 * margines
  const dostepnaWysokosc = wysokoscPx - 2 * margines

  // Jedna skala dla obu osi — inaczej znów wyszłoby rozciągnięcie.
  const skala = Math.min(dostepnaSzerokosc / plaskaSzerokosc, dostepnaWysokosc / plaskaWysokosc)

  // Reszta miejsca idzie po równo na oba boki, więc ślad ląduje na środku.
  const zapasX = (dostepnaSzerokosc - plaskaSzerokosc * skala) / 2
  const zapasY = (dostepnaWysokosc - plaskaWysokosc * skala) / 2

  const rzut = ((punkt: Punkt) => {
    const x = margines + zapasX + (punkt[0] - zachod) * scisk * skala
    // Oś Y w SVG rośnie w dół, a szerokość geograficzna w górę.
    const y = margines + zapasY + (polnoc - punkt[1]) * skala
    return [x, y] as const
  }) as Rzutowanie

  rzut.jednostekNaMetr = skala / METROW_NA_STOPIEN

  return rzut
}

/**
 * Wygładzanie Chaikina — ścina rogi, zostawiając końce na miejscu.
 *
 * Surowy ślad z GPS-u na małej skali wygląda kanciasto: każde drgnięcie
 * odbiornika jest widoczne jako ząbek. Dwie iteracje wystarczą, żeby linia
 * czytała się jak narysowana, a nie jak zapis pomiaru.
 *
 * Końce zostawiamy nienaruszone celowo — na nich stoją znaczniki punktów
 * etapowych i sąsiednie odcinki, więc przesunięcie rozjechałoby styk barw.
 */
export function wygladz(punkty: readonly Punkt[], iteracje = 2): Punkt[] {
  let wynik = [...punkty]

  for (let i = 0; i < iteracje; i += 1) {
    if (wynik.length < 3) return wynik

    const nastepne: Punkt[] = [wynik[0]]
    for (let j = 0; j < wynik.length - 1; j += 1) {
      const a = wynik[j]
      const b = wynik[j + 1]
      nastepne.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
      nastepne.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    nastepne.push(wynik[wynik.length - 1])
    wynik = nastepne
  }

  return wynik
}

/** Ścieżka SVG z listy punktów — same odcinki proste, bo są już wygładzone. */
export function sciezka(punkty: readonly (readonly [number, number])[]): string {
  return punkty
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
}

/**
 * Podziałka: okrągła odległość zajmująca sensowną część szerokości mapy.
 *
 * Sztywny kilometr zawodzi w obie strony — na trasie po Szczawnicy zająłby pół
 * mapy, a na trasie przez całe Pieniny byłby ledwie kreską.
 */
const STOPNIE_M = [100, 200, 500, 1000, 2000, 5000, 10_000]

export function podzialka(
  jednostekNaMetr: number,
  szerokoscPx: number,
): { dlugoscPx: number; etykieta: string } {
  const docelowa = szerokoscPx * 0.22

  let wybrana = STOPNIE_M[0]
  for (const metry of STOPNIE_M) {
    if (metry * jednostekNaMetr <= docelowa) wybrana = metry
  }

  return {
    dlugoscPx: wybrana * jednostekNaMetr,
    etykieta: wybrana >= 1000 ? `${wybrana / 1000} km` : `${wybrana} m`,
  }
}

/** Odległość w metrach — wzór haversine, ten sam co w reszcie portalu. */
export function odlegloscM(a: Punkt, b: Punkt): number {
  const R = 6_371_000
  const fi1 = (a[1] * Math.PI) / 180
  const fi2 = (b[1] * Math.PI) / 180
  const dFi = fi2 - fi1
  const dLambda = ((b[0] - a[0]) * Math.PI) / 180

  const h =
    Math.sin(dFi / 2) ** 2 + Math.cos(fi1) * Math.cos(fi2) * Math.sin(dLambda / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}
