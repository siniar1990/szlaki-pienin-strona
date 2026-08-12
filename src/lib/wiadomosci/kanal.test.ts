import { describe, expect, it } from 'vitest'

import { wydobadzTresc } from './kanal'

/**
 * Testy wydobywania treści artykułu.
 *
 * Ten kod myli się cicho: zwraca napis, więc wygląda na działający, a dopiero
 * redakcja odrzuca artykuł „bez treści" i nikt nie wie dlaczego. Dokładnie tak
 * przepadł prawdziwy tekst o spływie flisackim — strona miała szesnaście
 * kafelków `<article>` przed właściwym artykułem, a wybierany był pierwszy.
 */

const AKAPIT =
  'Zbliżający się długi weekend to dobry moment na spływ Dunajcem. Flisacy ' +
  'zaczynają rejsy o ósmej rano i kończą, gdy zrobi się ciemno. Tratwa mieści ' +
  'dwanaście osób, a przepłynięcie przełomu zajmuje jakieś dwie godziny. Bilety ' +
  'kupuje się na przystani w Sromowcach, nie przez internet.'

function strona(srodek: string): string {
  return `<html><head><title>x</title></head><body>${srodek}</body></html>`
}

describe('wydobadzTresc', () => {
  it('bierze treść z <article>, gdy jest tam prawdziwy tekst', () => {
    const html = strona(`<article><p>${AKAPIT}</p></article>`)
    expect(wydobadzTresc(html)).toContain('Flisacy zaczynają rejsy')
  })

  it('pomija kafelki zajawek i bierze artykuł, który stoi za nimi', () => {
    // Układ ze strony, na której to się zepsuło: lista „przeczytaj też"
    // w kodzie PRZED właściwym tekstem.
    const html = strona(
      '<article class="kafelek"><h3>Strażacy na ratunek kozie</h3><span>12 sierpnia</span></article>' +
        '<article class="kafelek"><h3>Inny tytuł</h3><span>11 sierpnia</span></article>' +
        `<article class="tresc"><p>${AKAPIT}</p></article>`,
    )

    const tekst = wydobadzTresc(html)
    expect(tekst).toContain('Flisacy zaczynają rejsy')
    expect(tekst).not.toContain('Strażacy na ratunek kozie')
  })

  it('wraca do <body>, gdy wszystkie <article> to zajawki', () => {
    // Prawdziwy przypadek z mojepieniny.pl: treść w ogóle nie leży
    // w <article>, a szesnaście kafelków owszem.
    const html = strona(
      '<article class="kafelek"><h3>Zajawka pierwsza</h3></article>' +
        '<article class="kafelek"><h3>Zajawka druga</h3></article>' +
        `<div class="wpis"><p>${AKAPIT}</p></div>`,
    )

    expect(wydobadzTresc(html)).toContain('Flisacy zaczynają rejsy')
  })

  it('wycina menu, stopkę i skrypty', () => {
    const html = strona(
      '<nav>Menu Kontakt Reklama</nav>' +
        '<script>var x = "tekst w skrypcie"</script>' +
        '<style>.a{color:red}</style>' +
        `<article><p>${AKAPIT}</p></article>` +
        '<footer>Wszelkie prawa zastrzeżone</footer>',
    )

    const tekst = wydobadzTresc(html)
    expect(tekst).toContain('Flisacy zaczynają rejsy')
    expect(tekst).not.toContain('tekst w skrypcie')
    expect(tekst).not.toContain('Wszelkie prawa')
    expect(tekst).not.toContain('color:red')
  })

  it('rozdziela akapity łamaniem wiersza, a nie sklejaniem słów', () => {
    const html = strona('<article><p>Pierwsze zdanie.</p><p>Drugie zdanie.</p></article>')
    // Model ma widzieć, gdzie kończy się myśl — bez tego dostaje ścianę słów.
    // Spacja po łamaniu zostaje po znaczniku otwierającym i nie przeszkadza.
    expect(wydobadzTresc(html)).toBe('Pierwsze zdanie.\n Drugie zdanie.')
  })

  it('odkodowuje encje', () => {
    const html = strona(`<article><p>Sromowce Wy&#380;ne &bdquo;K&aacute;ty&rdquo; ${AKAPIT}</p></article>`)
    expect(wydobadzTresc(html)).toContain('Sromowce Wyżne')
  })

  it('na stronie bez treści zwraca coś krótkiego, nie wywraca się', () => {
    expect(wydobadzTresc(strona('<article><h3>Sam tytuł</h3></article>')).length).toBeLessThan(400)
    expect(() => wydobadzTresc('')).not.toThrow()
  })
})
