import QRCode from 'qrcode'

/**
 * Kod QR do karty — jako moduły do narysowania, nie jako obrazek.
 *
 * Liczymy go sami zamiast wołać zewnętrzne API, i to nie jest ostrożność na
 * wyrost: karta powstaje przy budowaniu, a budowanie ma się udać także wtedy,
 * gdy czyjś serwis akurat nie odpowiada. Przy okazji nikt postronny nie
 * dowiaduje się, które trasy drukujemy.
 *
 * Zwracamy siatkę modułów, a nie gotowy SVG, bo kartę składa React — dzięki
 * temu nie ma w niej ani jednego `dangerouslySetInnerHTML`.
 */

export type KodQr = {
  /** Bok siatki w modułach. */
  bok: number
  /** Współrzędne ciemnych modułów. */
  moduly: { x: number; y: number }[]
}

export async function kodQr(adres: string): Promise<KodQr> {
  /*
    Korekcja „M" — ta sama, której portal używa na tabliczkach. Wyższa
    zagęszcza siatkę, a kod na karcie ma 19 mm i musi dać się zeskanować
    telefonem z odległości wyciągniętej ręki, po wydruku na zwykłym papierze.
  */
  const kod = QRCode.create(adres, { errorCorrectionLevel: 'M' })
  const bok = kod.modules.size
  const dane = kod.modules.data

  const moduly: { x: number; y: number }[] = []
  for (let y = 0; y < bok; y += 1) {
    for (let x = 0; x < bok; x += 1) {
      if (dane[y * bok + x]) moduly.push({ x, y })
    }
  }

  return { bok, moduly }
}
