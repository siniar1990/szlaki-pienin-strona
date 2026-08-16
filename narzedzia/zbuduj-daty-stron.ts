import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { scalManifest, type ManifestDat } from '../src/lib/seo/daty'
import { stronyMapy } from '../src/lib/seo/strony-mapy'

/**
 * Odświeża `src/lib/seo/daty-stron.json` — pamięć dat zmian dla mapy witryny.
 *
 * Uruchamianie: ręcznie `npm run daty`, automatycznie workflow
 * `.github/workflows/daty-stron.yml` po każdym pushu do `main`.
 *
 * **Dlaczego to nie jest krok `prebuild`.** Maszyna budująca na Vercelu nie
 * ma historii gita, więc nie zna dat — a wynik i tak musiałby wrócić do
 * repozytorium, żeby przetrwać do następnego wdrożenia. Skrypt działa tam,
 * gdzie git jest pod ręką, a budowanie tylko czyta gotowy plik.
 *
 * **Skąd data zmiany.** Z ostatniego commita dotykającego źródeł strony.
 * W płytkiej kopii repozytorium (checkout bez pełnej historii) `git log`
 * przypisuje stare pliki do sztucznego commita granicznego i daty wychodzą
 * fałszywe — wtedy wolimy przyznać, że daty nie znamy, i wziąć dzisiejszą
 * dla stron, które naprawdę się zmieniły. Niezmienionych to nie dotyczy:
 * ich daty siedzą już w manifeście.
 */

// Skrypt zakłada uruchomienie z korzenia repozytorium (tak robi npm) —
// to samo założenie ma już `src/lib/dane/zrodlo.ts`.
const KORZEN = process.cwd()
const PLIK_MANIFESTU = path.join(KORZEN, 'src', 'lib', 'seo', 'daty-stron.json')

/** Dzisiejsza data UTC — dokładność dnia wystarcza `lastmod`, a nie udaje precyzji. */
const DZISIAJ = new Date().toISOString().slice(0, 10)

function git(argumenty: string[]): string {
  return execFileSync('git', argumenty, { cwd: KORZEN, encoding: 'utf8' }).trim()
}

function czyPelnaHistoria(): boolean {
  try {
    return git(['rev-parse', '--is-shallow-repository']) === 'false'
  } catch {
    return false
  }
}

/** Wszystkie pliki katalogu, rekurencyjnie i w stałym porządku — dla powtarzalnego skrótu. */
function rozwinPliki(sciezka: string): string[] {
  const pelna = path.join(KORZEN, sciezka)
  if (!statSync(pelna).isDirectory()) return [sciezka]

  return readdirSync(pelna, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((wpis) => rozwinPliki(path.join(sciezka, wpis.name)))
}

function skrotStrony(odcisk: { pliki?: string[]; tresc?: string }): string {
  const skrot = createHash('sha256')

  for (const zrodlo of odcisk.pliki ?? []) {
    if (!existsSync(path.join(KORZEN, zrodlo))) {
      // Głośno, nie po cichu: literówka w spisie źródeł dawałaby stronie
      // wieczny „brak zmian" i nikt by tego nie zauważył.
      throw new Error(`Źródło strony nie istnieje: ${zrodlo}`)
    }
    for (const plik of rozwinPliki(zrodlo)) {
      // Ścieżka wchodzi do skrótu razem z treścią — zmiana nazwy pliku też
      // jest zmianą, a separator nie pozwala skleić dwóch plików w jeden.
      skrot.update(plik)
      skrot.update('\0')
      skrot.update(readFileSync(path.join(KORZEN, plik)))
      skrot.update('\0')
    }
  }

  if (odcisk.tresc !== undefined) skrot.update(odcisk.tresc)

  return skrot.digest('hex')
}

function zbuduj(): void {
  const gitWiarygodny = czyPelnaHistoria()
  if (!gitWiarygodny) {
    console.warn(
      'Uwaga: brak pełnej historii gita — strony ze zmienioną treścią dostaną dzisiejszą datę.',
    )
  }

  // Jedna data na plik źródłowy, nie na stronę — trasy dzielą pliki między
  // kategoriami i kolekcjami, a `git log` jest tu najdroższym krokiem.
  const pamiecDat = new Map<string, string>()
  const dataPliku = (sciezka: string): string => {
    const zapamietana = pamiecDat.get(sciezka)
    if (zapamietana !== undefined) return zapamietana

    // `%cs` to data commita, nie autora: liczy się, kiedy zmiana weszła do
    // historii, bo od tego momentu mogła trafić na produkcję.
    const data = git(['log', '-1', '--format=%cs', '--', sciezka]) || DZISIAJ
    pamiecDat.set(sciezka, data)
    return data
  }

  const biezace = stronyMapy().map((strona) => ({
    sciezka: strona.sciezka,
    skrot: skrotStrony(strona.odcisk),
    dataZrodel: gitWiarygodny
      ? strona.datyZ.map(dataPliku).reduce((a, b) => (a > b ? a : b))
      : DZISIAJ,
  }))

  const stary: ManifestDat | null = existsSync(PLIK_MANIFESTU)
    ? (JSON.parse(readFileSync(PLIK_MANIFESTU, 'utf8')) as ManifestDat)
    : null

  const nowy = scalManifest(stary, biezace)

  const bezZmian = biezace.filter((b) => stary?.strony[b.sciezka]?.skrot === b.skrot).length
  const usuniete = Object.keys(stary?.strony ?? {}).filter(
    (sciezka) => !(sciezka in nowy.strony),
  ).length

  writeFileSync(PLIK_MANIFESTU, `${JSON.stringify(nowy, null, 2)}\n`)

  console.log(
    `Stron w mapie: ${biezace.length} — bez zmian: ${bezZmian}, ` +
      `zmienione lub nowe: ${biezace.length - bezZmian}, usunięte: ${usuniete}.`,
  )
}

zbuduj()
