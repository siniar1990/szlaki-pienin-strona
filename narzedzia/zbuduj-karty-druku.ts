import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import puppeteer, { type Browser } from 'puppeteer'

import { htmlKarty } from '../src/lib/druk/dokument'
import { pobierzTrasy } from '../src/lib/dane/zrodlo'
import type { Trasa } from '../src/lib/dane/typy'

/**
 * Karty tras do druku — jeden PDF na trasę, składany na miejscu.
 *
 *     npm run karty           # tylko te, których treść się zmieniła
 *     npm run karty -- --all  # wszystkie od nowa
 *
 * **Dlaczego przy budowaniu, a nie przy żądaniu.** Karta zmienia się wtedy,
 * gdy zmieni się opis trasy — czyli przy wdrożeniu, nie w trakcie czyjejś
 * wizyty. Uruchamianie przeglądarki w funkcji serwerowej znaczyłoby kilka
 * sekund czekania dla pierwszego odwiedzającego i ciężką paczkę na produkcji,
 * a wynik i tak byłby ten sam bajt w bajt.
 *
 * **Dlaczego pliki lądują w repozytorium.** Bo wtedy wdrożenie nie potrzebuje
 * przeglądarki w ogóle — Vercel podaje gotowe pliki. Ten sam układ, co przy
 * `public/dane/`: wynik pracy narzędzia jest częścią repozytorium, a nie
 * czymś, co trzeba odtwarzać na każdej maszynie.
 *
 * Żeby nikt nie zapomniał ich odświeżyć, obok PDF-ów leży `karty.json` ze
 * skrótem treści każdej trasy. Test `karty-druku.test.ts` porównuje go z danymi
 * i mówi wprost, którą kartę trzeba przegenerować.
 */

const KATALOG = path.join(process.cwd(), 'public', 'druk')
const SPIS = path.join(KATALOG, 'karty.json')

/** Próg czytelności — poniżej niego karta idzie do poprawki, nie do druku. */
const PROG_PT = 6.5

export type WpisSpisu = {
  slug: string
  skrot: string
  panele: { nazwa: string; pt: number; przepelniony: boolean; skrocony: boolean }[]
}

/**
 * Skrót treści trasy.
 *
 * Liczony z tego, co widać na karcie — opisu, punktów, ostrzeżeń, śladu
 * i barw odcinków. Zmiana czegokolwiek z tej listy unieważnia PDF; poprawka
 * w kodzie strony, która karty nie dotyczy, nie zmusza do przegenerowania
 * pięćdziesięciu czterech plików.
 */
export function skrotTrasy(trasa: Trasa): string {
  const skladniki = JSON.stringify({
    nazwa: trasa.nazwa,
    dlugosc: trasa.dlugoscKm,
    czas: trasa.czasMin,
    podejscia: trasa.sumaPodejscM,
    kcal: trasa.kcal,
    trudnosc: trasa.trudnosc,
    petla: trasa.petla,
    szlaki: trasa.szlaki,
    punkty: trasa.punkty.map((p) => [p.nazwa, p.wysokoscM, p.czasNarastMin.tam, p.typ]),
    segmenty: trasa.segmenty,
    ostrzezenia: trasa.ostrzezenia,
    ciekawostki: trasa.ciekawostki.map((c) => [c.tytul, c.tekst]),
  })

  const dane = createHash('sha256').update(skladniki)

  for (const plik of [trasa.slad, trasa.kolory]) {
    if (!plik) continue
    try {
      dane.update(readFileSync(path.join(process.cwd(), 'public', plik)))
    } catch {
      // Brak pliku jest sam w sobie stanem — niech wpłynie na skrót.
      dane.update(`brak:${plik}`)
    }
  }

  return dane.digest('hex').slice(0, 16)
}

export function nazwaPliku(slug: string): string {
  return `szlaki-pienin-${slug}.pdf`
}

export function wczytajSpis(): WpisSpisu[] {
  try {
    return JSON.parse(readFileSync(SPIS, 'utf8')) as WpisSpisu[]
  } catch {
    return []
  }
}

async function zbudujKarte(
  przegladarka: Browser,
  trasa: Trasa,
  dzis: Date,
): Promise<WpisSpisu['panele']> {
  const strona = await przegladarka.newPage()
  try {
    const html = await htmlKarty(trasa, { dzis })

    // `setContent` zamiast pliku na dysku: cały dokument jest samowystarczalny
    // (fonty jako dane, kod QR narysowany), więc nie ma czego dociągać.
    await strona.setContent(html, { waitUntil: 'load' })
    await strona.waitForFunction('document.documentElement.dataset.kartaGotowa === "1"', {
      timeout: 20_000,
    })

    const panele = (await strona.evaluate('window.__karta.panele')) as WpisSpisu['panele']

    await strona.pdf({
      path: path.join(KATALOG, nazwaPliku(trasa.slug)),
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      // Bez tego Chrome dokłada nagłówek z adresem i datą — na karcie,
      // która ma być samą kartą, wygląda to jak wydruk strony internetowej.
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    })

    return panele
  } finally {
    await strona.close()
  }
}

async function main() {
  const wszystkie = process.argv.includes('--all')
  mkdirSync(KATALOG, { recursive: true })

  const trasy = pobierzTrasy()
  const poprzedni = new Map(wczytajSpis().map((w) => [w.slug, w]))

  // Data z zewnątrz, nie z zegara w trakcie renderowania: karta ma być
  // powtarzalna, a dwie generacje tego samego dnia mają dać ten sam plik.
  const dzis = new Date()

  const doZrobienia = trasy.filter((trasa) => {
    if (wszystkie) return true
    const wpis = poprzedni.get(trasa.slug)
    if (!wpis || wpis.skrot !== skrotTrasy(trasa)) return true
    return !existsSync(path.join(KATALOG, nazwaPliku(trasa.slug)))
  })

  console.log(`Tras: ${trasy.length}, do przegenerowania: ${doZrobienia.length}`)

  const spis: WpisSpisu[] = []
  let ostrzezenia = 0

  if (doZrobienia.length > 0) {
    const przegladarka = await puppeteer.launch({ headless: true })
    try {
      for (const trasa of doZrobienia) {
        const panele = await zbudujKarte(przegladarka, trasa, dzis)
        const najmniejszy = Math.min(...panele.map((p) => p.pt))
        const przepelnione = panele.filter((p) => p.przepelniony).map((p) => p.nazwa)

        const uwagi: string[] = []
        if (przepelnione.length > 0) uwagi.push(`PRZEPEŁNIENIE: ${przepelnione.join(', ')}`)
        if (najmniejszy < PROG_PT) uwagi.push(`${najmniejszy} pt`)
        if (uwagi.length > 0) ostrzezenia += 1

        console.log(
          `  ${trasa.slug.padEnd(38)} ${najmniejszy.toFixed(1)} pt` +
            (uwagi.length > 0 ? `  ← ${uwagi.join(' · ')}` : ''),
        )
        poprzedni.set(trasa.slug, { slug: trasa.slug, skrot: skrotTrasy(trasa), panele })
      }
    } finally {
      await przegladarka.close()
    }
  }

  for (const trasa of trasy) {
    const wpis = poprzedni.get(trasa.slug)
    if (wpis) spis.push({ ...wpis, skrot: skrotTrasy(trasa) })
  }

  writeFileSync(SPIS, `${JSON.stringify(spis, null, 2)}\n`)

  // Karty tras, których już nie ma — inaczej zostają w repozytorium na zawsze.
  const znane = new Set(trasy.map((t) => nazwaPliku(t.slug)))
  for (const plik of readdirSync(KATALOG)) {
    if (plik.endsWith('.pdf') && !znane.has(plik)) {
      unlinkSync(path.join(KATALOG, plik))
      console.log(`  usunięto osieroconą kartę: ${plik}`)
    }
  }

  console.log(
    ostrzezenia === 0
      ? `\nGotowe. Wszystkie karty mieszczą się w panelach, żadna poniżej ${PROG_PT} pt.`
      : `\nGotowe, ale ${ostrzezenia} kart wymaga uwagi — patrz wyżej.`,
  )
}

if (process.argv[1]?.endsWith('zbuduj-karty-druku.ts')) {
  main().catch((blad) => {
    console.error(blad)
    process.exit(1)
  })
}
