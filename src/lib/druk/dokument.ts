import { readFileSync } from 'node:fs'
import path from 'node:path'

import { KartaTrasy } from '@/components/druk/karta-trasy'
import type { Trasa } from '@/lib/dane/typy'
import { PORTAL } from '@/lib/konfiguracja'

import { skryptDopasowania } from './autodopasowanie'
import { daneKarty } from './dane-karty'

/**
 * Karta trasy jako kompletny dokument HTML.
 *
 * **Jedna funkcja dla podglądu i dla PDF-a.** Podgląd pod `/szlaki/<slug>/druk`
 * i plik budowany skryptem biorą dokładnie ten sam wynik, więc to, co widać
 * w przeglądarce, jest tym, co wyjdzie z drukarki. Dwie ścieżki renderowania
 * rozjechałyby się przy pierwszej poprawce w jednej z nich — a rozjazd
 * zauważyłby dopiero ktoś, kto już wydrukował.
 *
 * **Dlaczego dokument, a nie strona Next.js.** Karta ma być samą kartą: bez
 * nagłówka portalu, bez stopki, bez skryptów analitycznych. Strona w układzie
 * aplikacji zawsze coś z tego przyniesie, a `@page { margin: 0 }` w środku
 * cudzego układu nie działa tak, jak się wydaje.
 */

const KATALOG = path.join(process.cwd(), 'src')

/** Style i fonty czytamy raz na proces — 54 karty to 54 te same odczyty. */
let pamiecStylu: string | null = null

/**
 * Fonty wchodzą w dokument jako dane, nie jako adres.
 *
 * Gdyby karta ładowała krój z sieci, PDF budowany bez dostępu do niej
 * wyszedłby złożony czymkolwiek — a podmieniony krój to inne szerokości liter,
 * czyli inne łamanie wierszy i cała robota autodopasowania na nic.
 * Inter jest na licencji SIL OFL, więc pliki mogą leżeć w repozytorium.
 */
function stylKarty(): string {
  if (pamiecStylu) return pamiecStylu

  const czcionka = (nazwa: string) =>
    readFileSync(path.join(KATALOG, 'lib', 'druk', 'czcionki', nazwa)).toString('base64')

  const arkusz = readFileSync(path.join(KATALOG, 'components', 'druk', 'karta.css'), 'utf8')

  pamiecStylu = `
@font-face {
  font-family: Inter;
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url(data:font/woff2;base64,${czcionka('inter-latin-ext.woff2')}) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: Inter;
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
  src: url(data:font/woff2;base64,${czcionka('inter-latin.woff2')}) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
html, body { margin: 0; padding: 0; background: #fff; -webkit-font-smoothing: antialiased; }
${arkusz}
`
  return pamiecStylu
}

export type OpcjeKarty = {
  /** Blok „Ratunek w górach" bez wypełnienia — mniej tuszu. */
  oszczednie?: boolean
  /** Data na stopce; podawana z zewnątrz, żeby wynik dało się porównywać. */
  dzis?: Date
  /** Pasek z podpowiedzią, jak drukować. W PDF-ie zbędny. */
  zPodpowiedzia?: boolean
}

export async function htmlKarty(trasa: Trasa, opcje: OpcjeKarty = {}): Promise<string> {
  const dane = await daneKarty(trasa, opcje.dzis ?? new Date())

  /*
    `react-dom/server` wczytywany w czasie wykonania, a nie zwykłym importem.
    Next.js odrzuca statyczny import tej paczki w kodzie App Routera — słusznie,
    bo w komponentach serwerowych renderowanie do łańcucha znaków jest zwykle
    omyłką. Tutaj nie jest: karta nie jest stroną portalu, tylko osobnym
    dokumentem, który musi powstać identycznie w dwóch miejscach — pod adresem
    podglądu i w skrypcie budującym PDF-y poza Next.js.
  */
  const { renderToStaticMarkup } = await import('react-dom/server')

  const karta = renderToStaticMarkup(
    KartaTrasy({ dane, oszczednie: opcje.oszczednie ?? false }),
  )

  const podpowiedz = opcje.zPodpowiedzia
    ? `<div class="podpowiedz" style="max-width:210mm;margin:14px auto 10px;font:13px/1.6 Inter,Arial,sans-serif;color:#3b4a43">
         <b>Podgląd karty trasy A4.</b> Drukuj jednostronnie, 100% skali, bez marginesów.
         Złóż w poziomie, potem w pionie → format A6 do kieszeni.
         Panel widoczny po złożeniu: <b>mapa</b> (lewy górny).
         <button type="button" onclick="window.print()" style="margin-left:10px;padding:4px 12px;border:1px solid #dcdcd6;border-radius:99px;background:#fff;cursor:pointer;font:inherit">Drukuj</button>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapuj(trasa.nazwa)} — karta trasy A4 | ${PORTAL.nazwa}</title>
<style>${stylKarty()}</style>
</head>
<body>
${podpowiedz}
${karta}
<script>${skryptDopasowania(trasa.slug, PORTAL.adres.replace(/^https:\/\//, ''))}</script>
</body>
</html>`
}

function escapuj(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
