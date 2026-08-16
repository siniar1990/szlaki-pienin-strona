import { readFileSync } from 'node:fs'
import path from 'node:path'

import { parse, type Font } from 'opentype.js'

/**
 * Identyfikator tabliczki jako ścieżki wektorowe — bez polegania na fontach.
 *
 * **Dlaczego nie `<text>`.** Napis w SVG rysuje się fontem zainstalowanym
 * u odbiorcy: w drukarni, która Intera nie ma, „P001" wypadłoby w zastępczym
 * kroju albo wcale. Jeszcze gorzej z PNG — rastruje go serwer na Vercelu,
 * a tam nie ma żadnych fontów systemowych i tekst po prostu by zniknął.
 * Zamiana liter na krzywe już po naszej stronie ucina obie zależności:
 * plik wygląda wszędzie tak samo, czyli tak, jak wyszedł stąd.
 *
 * Font leży w repozytorium (Inter SemiBold, licencja OFL — ta sama rodzina,
 * którą portal i tak pisze), a `next.config.ts` dokłada go do paczki
 * serwerowej tras generujących obrazy.
 */

const PLIK_FONTU = path.join(process.cwd(), 'src', 'lib', 'qr', 'czcionki', 'Inter-SemiBold.ttf')

// Font parsujemy raz na proces — paczka dwustu kodów pyta o niego dwieście
// razy, a wynik jest zawsze ten sam.
let pamiecFontu: Font | null = null

function font(): Font {
  if (!pamiecFontu) {
    const bajty = readFileSync(PLIK_FONTU)
    pamiecFontu = parse(bajty.buffer.slice(bajty.byteOffset, bajty.byteOffset + bajty.byteLength))
  }
  return pamiecFontu
}

export type SciezkaPodpisu = {
  /** Atrybut `d` — kontury napisu, początek na linii bazowej przy x = 0. */
  d: string
  /** Szerokość napisu w tych samych jednostkach co `rozmiar`. */
  szerokosc: number
}

/**
 * Kontury napisu w zadanym rozmiarze (wysokości em).
 *
 * Glify bierzemy znak po znaku zamiast składać cały napis, bo pełny skład
 * w opentype.js potyka się o tablicę GSUB Intera (nieobsługiwany format
 * podstawień) — a identyfikatory to wersaliki i cyfry, które żadnych
 * podstawień ani ligatur nie potrzebują. Z tego samego powodu pomijamy
 * kerning: w Interze dla takich par jest pomijalny.
 */
export function podpisJakoSciezka(tekst: string, rozmiar: number): SciezkaPodpisu {
  const krój = font()
  const czesci: string[] = []
  let x = 0

  for (const znak of tekst) {
    const glif = krój.charToGlyph(znak)
    czesci.push(glif.getPath(x, 0, rozmiar).toPathData(3))
    x += ((glif.advanceWidth ?? 0) / krój.unitsPerEm) * rozmiar
  }

  return { d: czesci.join(''), szerokosc: x }
}
