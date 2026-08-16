import QRCode from 'qrcode'
import sharp from 'sharp'

import { PORTAL } from '@/lib/konfiguracja'
import { podpisJakoSciezka } from '@/lib/qr/podpis'

/**
 * Generowanie obrazów kodu QR do druku.
 *
 * Poziom korekcji błędów: **H, czyli 30 procent**. To najwyższy dostępny
 * i przy tabliczce w terenie jedyny rozsądny. Kod wisi na deszczu, słońcu
 * i mrozie, obrasta kurzem, bywa zaklejony naklejką albo porysowany —
 * przy poziomie L wystarczy zabrudzenie siódmej części powierzchni, żeby
 * przestał się skanować. Cena to gęstszy wzór, bez znaczenia przy tabliczce
 * formatu dziesięć na dziesięć centymetrów.
 *
 * Margines (`quiet zone`) czterech modułów jest wymagany przez normę. Bez
 * niego czytniki gubią granicę kodu, zwłaszcza gdy tabliczka ma ciemne tło.
 */

const OPCJE_WSPOLNE = {
  errorCorrectionLevel: 'H' as const,
  margin: 4,
  color: {
    // Ciemna zieleń marki zamiast czystej czerni. Kontrast wobec bieli wynosi
    // ponad 12:1, czyli daleko powyżej progu, przy którym czytniki mają
    // kłopot — a tabliczka wygląda jak część identyfikacji, nie jak wydruk
    // z pierwszego lepszego generatora.
    dark: '#14532DFF',
    light: '#FFFFFFFF',
  },
}

/** Pełny adres, który trafia do kodu. */
export function adresKodu(kod: string): string {
  return `${PORTAL.adres}/qr/${kod}`
}

/**
 * Wariant z identyfikatorem — do druku, gdy pliki idą luzem.
 *
 * Sam kod QR jest dla człowieka nieodróżnialny od dwustu pozostałych;
 * identyfikator wydrukowany pod spodem pozwala przy montażu sprawdzić gołym
 * okiem, czy na tabliczce Sokolicy wisi kod Sokolicy. Wariant czysty zostaje,
 * bo bywa odwrotnie: szablon tabliczki ma już własny podpis i drugi byłby
 * dublem.
 */
export type OpcjeObrazu = {
  zIdentyfikatorem?: boolean
}

/*
  Geometria pasa z podpisem, w modułach kodu QR — dzięki temu proporcje są
  identyczne w SVG i PNG niezależnie od rozdzielczości. Pas zaczyna się DOPIERO
  pod marginesem kodu: cztery moduły ciszy wymagane przez normę zostają puste,
  napis ich nie narusza.
*/
const WYSOKOSC_PASA = 6
const ROZMIAR_PODPISU = 5
const LINIA_BAZOWA_PASA = 4.4

/** Podpis dopasowany do szerokości kodu — długi identyfikator zmniejszamy, nie ucinamy. */
function podpisNaSzerokosc(kod: string, moduly: number) {
  const najszerzej = moduly - 2 * OPCJE_WSPOLNE.margin
  const proba = podpisJakoSciezka(kod, ROZMIAR_PODPISU)
  if (proba.szerokosc <= najszerzej) return { ...proba, rozmiar: ROZMIAR_PODPISU }

  const rozmiar = (ROZMIAR_PODPISU * najszerzej) / proba.szerokosc
  return { ...podpisJakoSciezka(kod, rozmiar), rozmiar }
}

/** Liczba modułów kodu z marginesami — bok kwadratu, w którym rysuje go biblioteka. */
function bokWModulach(kod: string): number {
  return QRCode.create(adresKodu(kod), { errorCorrectionLevel: OPCJE_WSPOLNE.errorCorrectionLevel })
    .modules.size + 2 * OPCJE_WSPOLNE.margin
}

/** Kod jako SVG — format do druku, skalowalny bez utraty ostrości. */
export async function kodJakoSvg(kod: string, opcje: OpcjeObrazu = {}): Promise<string> {
  const svg = await QRCode.toString(adresKodu(kod), { ...OPCJE_WSPOLNE, type: 'svg', width: 1024 })
  if (!opcje.zIdentyfikatorem) return svg

  const bok = bokWModulach(kod)
  const podpis = podpisNaSzerokosc(kod, bok)

  /*
    Dosztukowujemy pas od dołu: wyższy viewBox, biały prostokąt pod spodem
    i napis jako ścieżka. Podmiany są dosłowne wobec tego, co produkuje
    biblioteka `qrcode` — gdyby kiedyś zmieniła format nagłówka, wolimy
    wybuchnąć tu, niż po cichu oddać plik bez podpisu.
  */
  const zNowymOknem = svg
    .replace(` height="1024" viewBox="0 0 ${bok} ${bok}"`,
      ` height="${Math.round((1024 * (bok + WYSOKOSC_PASA)) / bok)}" viewBox="0 0 ${bok} ${bok + WYSOKOSC_PASA}"`)
  if (zNowymOknem === svg) throw new Error(`Nieoczekiwany nagłówek SVG dla kodu ${kod}`)

  const pas =
    `<path fill="${OPCJE_WSPOLNE.color.light.slice(0, 7)}" d="M0 ${bok}h${bok}v${WYSOKOSC_PASA}H0z"/>` +
    // `geometricPrecision`, bo korzeń dokumentu ma `crispEdges` — dobre dla
    // kwadratów kodu, ale litery zamieniłoby w poszarpane schodki.
    `<path fill="${OPCJE_WSPOLNE.color.dark.slice(0, 7)}" shape-rendering="geometricPrecision" ` +
    `transform="translate(${((bok - podpis.szerokosc) / 2).toFixed(3)} ${bok + LINIA_BAZOWA_PASA})" ` +
    `d="${podpis.d}"/>`

  return zNowymOknem.replace('</svg>', `${pas}</svg>`)
}

/** Kod jako PNG — do podglądu w panelu i tam, gdzie drukarnia nie przyjmie SVG. */
export async function kodJakoPng(kod: string, opcje: OpcjeObrazu = {}): Promise<Buffer> {
  const png = await QRCode.toBuffer(adresKodu(kod), { ...OPCJE_WSPOLNE, type: 'png', width: 2048 })
  if (!opcje.zIdentyfikatorem) return png

  /*
    Zamiast rastrować cały złożony SVG, doklejamy pas do gotowego rastra:
    piksele samego kodu pozostają dokładnie te same co w wariancie czystym,
    bez przechodzenia przez drugi renderer. Napis i tak jest ścieżką, więc
    rastrowanie pasa nie dotyka żadnych fontów.
  */
  const { width: szerokosc, height: wysokosc } = await sharp(png).metadata()

  const bok = bokWModulach(kod)
  const skala = szerokosc / bok
  const wysokoscPasa = Math.round(WYSOKOSC_PASA * skala)
  const podpis = podpisNaSzerokosc(kod, bok)

  const pas =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${szerokosc}" height="${wysokoscPasa}">` +
    `<path fill="${OPCJE_WSPOLNE.color.dark.slice(0, 7)}" ` +
    `transform="translate(${(((bok - podpis.szerokosc) / 2) * skala).toFixed(2)} ${(LINIA_BAZOWA_PASA * skala).toFixed(2)}) scale(${skala.toFixed(4)})" ` +
    `d="${podpis.d}"/></svg>`

  return sharp(png)
    .extend({ bottom: wysokoscPasa, background: OPCJE_WSPOLNE.color.light.slice(0, 7) })
    .composite([{ input: Buffer.from(pas), top: wysokosc, left: 0 }])
    .png()
    .toBuffer()
}

/** Kod jako dane wpisane wprost w atrybut `src` — do podglądu bez zapytania. */
export async function kodJakoDataUrl(kod: string): Promise<string> {
  return QRCode.toDataURL(adresKodu(kod), { ...OPCJE_WSPOLNE, width: 512 })
}
