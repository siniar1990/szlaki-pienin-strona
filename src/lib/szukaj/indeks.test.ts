import { describe, expect, it } from 'vitest'

import { naSlug } from '@/lib/dane/slug'
import { pobierzTrasy } from '@/lib/dane/zrodlo'
import { ATRAKCJE_TURYSTYCZNE } from '@/lib/tresc/atrakcje-turystyczne'
import { MIEJSCOWOSCI } from '@/lib/tresc/miejscowosci'

import { zbudujIndeks } from './indeks'

/**
 * Wyszukiwarka bywa niekompletna po cichu.
 *
 * Katalog atrakcji nie trafiał do indeksu przez cały czas jego istnienia
 * i nikt tego nie zauważył — bo wyszukiwarka nie zgłasza braku, tylko go nie
 * pokazuje. Strona z zamkiem w Niedzicy istniała, miała godziny i ceny,
 * a wpisanie „Niedzica" nie dawało nic.
 *
 * Te testy pilnują dwóch rzeczy: że każde źródło treści jest w indeksie
 * i że dwa wpisy nie prowadzą pod ten sam adres.
 */

const indeks = zbudujIndeks()
const adresy = new Set(indeks.map((wpis) => wpis.adres))

/** Tekst, który wyszukiwarka faktycznie przeszukuje — nazwa, miejsce, opis. */
function przeszukiwany(wpis: (typeof indeks)[number]): string {
  return naSlug(`${wpis.nazwa} ${wpis.miejsce ?? ''} ${wpis.opis ?? ''}`)
}

describe('indeks wyszukiwarki', () => {
  it('zna każdą trasę', () => {
    const brakujace = pobierzTrasy()
      .filter((trasa) => !adresy.has(`/szlaki/${trasa.slug}`))
      .map((trasa) => trasa.slug)

    expect(brakujace).toEqual([])
  })

  it('zna każdą atrakcję z katalogu', () => {
    const brakujace = ATRAKCJE_TURYSTYCZNE.filter(
      (atrakcja) => !adresy.has(`/atrakcje/${atrakcja.slug}`),
    ).map((atrakcja) => atrakcja.slug)

    expect(brakujace).toEqual([])
  })

  it('zna każdą miejscowość', () => {
    const brakujace = MIEJSCOWOSCI.filter(
      (miejscowosc) => !adresy.has(`/miejscowosci/${miejscowosc.slug}`),
    ).map((miejscowosc) => miejscowosc.slug)

    expect(brakujace).toEqual([])
  })

  it('nie prowadzi dwóch wpisów pod ten sam adres', () => {
    // Slug `palenica` jest i w katalogu atrakcji, i wśród punktów tras.
    // Dwa wyniki wskazujące tę samą stronę wyglądają jak usterka.
    const policzone = new Map<string, number>()
    for (const wpis of indeks) policzone.set(wpis.adres, (policzone.get(wpis.adres) ?? 0) + 1)

    const powtorzone = [...policzone].filter(([, ile]) => ile > 1).map(([adres]) => adres)
    expect(powtorzone).toEqual([])
  })

  it('znajduje zamek w Niedzicy po nazwie miejscowości', () => {
    /*
      Nazwa atrakcji brzmi „Zamek Dunajec w Niedzicy" — w miejscowniku. Szuka
      się jej wpisując mianownik, więc dopasowanie może zajść wyłącznie przez
      pole miejscowości. To ten przypadek zgłosił właściciel portalu i to on
      pilnuje, żeby pole nie zniknęło przy sprzątaniu.
    */
    const trafienia = indeks.filter((wpis) => przeszukiwany(wpis).includes('niedzica'))

    expect(trafienia.map((wpis) => wpis.adres)).toContain('/atrakcje/zamek-dunajec-w-niedzicy')
  })

  it('każdy wpis ma dokąd prowadzić', () => {
    const puste = indeks.filter((wpis) => !wpis.adres.startsWith('/') || wpis.nazwa.trim() === '')
    expect(puste).toEqual([])
  })
})
