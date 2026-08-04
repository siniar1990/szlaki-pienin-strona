import QRCode from 'qrcode'

import { PORTAL } from '@/lib/konfiguracja'

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

/** Kod jako SVG — format do druku, skalowalny bez utraty ostrości. */
export async function kodJakoSvg(kod: string): Promise<string> {
  return QRCode.toString(adresKodu(kod), { ...OPCJE_WSPOLNE, type: 'svg', width: 1024 })
}

/** Kod jako PNG — do podglądu w panelu i tam, gdzie drukarnia nie przyjmie SVG. */
export async function kodJakoPng(kod: string): Promise<Buffer> {
  return QRCode.toBuffer(adresKodu(kod), { ...OPCJE_WSPOLNE, type: 'png', width: 2048 })
}

/** Kod jako dane wpisane wprost w atrybut `src` — do podglądu bez zapytania. */
export async function kodJakoDataUrl(kod: string): Promise<string> {
  return QRCode.toDataURL(adresKodu(kod), { ...OPCJE_WSPOLNE, width: 512 })
}
