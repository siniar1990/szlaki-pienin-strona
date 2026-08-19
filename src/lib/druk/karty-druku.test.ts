import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { pobierzTrasy } from '@/lib/dane/zrodlo'

import { nazwaPliku, skrotTrasy, wczytajSpis } from '../../../narzedzia/zbuduj-karty-druku'

/**
 * Karty do druku — sprawdzenie kompletu przy każdym uruchomieniu testów.
 *
 * **Dlaczego test nie generuje kart.** Generowanie wymaga przeglądarki bez
 * okna i trwa około minuty; wpuszczenie tego do zestawu testów znaczyłoby, że
 * nikt ich już nie uruchamia przy każdej zmianie. Zamiast tego czytamy spis,
 * który zostawia po sobie generator: dla każdej trasy skrót jej treści i wynik
 * dopasowania paneli.
 *
 * Dzięki temu test odpowiada na pytanie, które naprawdę boli — „czy karta,
 * którą pobierze turysta, zgadza się z opisem trasy i czy da się ją
 * przeczytać" — i mówi wprost, co zrobić, gdy nie.
 */

const PROG_PT = 6.5
const KATALOG = path.join(process.cwd(), 'public', 'druk')

const trasy = pobierzTrasy()
const spis = new Map(wczytajSpis().map((wpis) => [wpis.slug, wpis]))

describe('karty tras do druku', () => {
  it('istnieją dla wszystkich tras', () => {
    const brakujace = trasy.filter((trasa) => !existsSync(path.join(KATALOG, nazwaPliku(trasa.slug))))
    expect(
      brakujace.map((t) => t.slug),
      'brakuje kart — uruchom `npm run karty`',
    ).toEqual([])
  })

  it('są zbudowane z aktualnej treści tras', () => {
    const nieaktualne = trasy
      .filter((trasa) => spis.get(trasa.slug)?.skrot !== skrotTrasy(trasa))
      .map((t) => t.slug)

    expect(nieaktualne, 'treść trasy zmieniła się po zbudowaniu karty — uruchom `npm run karty`').toEqual(
      [],
    )
  })

  it('mieszczą się w panelach — żadnego przepełnienia', () => {
    const przepelnione = trasy.flatMap((trasa) => {
      const panele = spis.get(trasa.slug)?.panele ?? []
      return panele.filter((p) => p.przepelniony).map((p) => `${trasa.slug}/${p.nazwa}`)
    })

    expect(przepelnione, 'treść wyszła poza panel — przy druku zostanie ucięta').toEqual([])
  })

  it(`nie schodzą z pismem poniżej ${PROG_PT} pt`, () => {
    const zamale = trasy.flatMap((trasa) => {
      const panele = spis.get(trasa.slug)?.panele ?? []
      return panele
        .filter((p) => p.pt < PROG_PT)
        .map((p) => `${trasa.slug}/${p.nazwa}: ${p.pt} pt`)
    })

    expect(zamale, 'karta na granicy czytelności — skróć treść albo popraw szablon').toEqual([])
  })

  it('nigdy nie skracają ostrzeżeń ani numerów ratunkowych', () => {
    // Panel praktyczny wolno skracać wyłącznie o ciekawostki; ostrzeżenia
    // i blok GOPR są w szablonie oznaczone `data-nieskracalne`, więc nie ma
    // ich jak stracić. Ten test pilnuje, żeby przy przyszłej poprawce
    // szablonu ktoś nie przeniósł ich do części skracalnej.
    const szablon = path.join(process.cwd(), 'src', 'components', 'druk', 'karta-trasy.tsx')
    const tresc = readFileSync(szablon, 'utf8')

    const ostrzezenia = tresc.slice(tresc.indexOf('dane.ostrzezenia.length > 0'))
    expect(ostrzezenia.slice(0, 400)).toContain('data-nieskracalne')

    const ratunek = tresc.slice(tresc.indexOf('className="ramka ratunek"'))
    expect(ratunek.slice(0, 200)).toContain('data-nieskracalne')
  })
})
