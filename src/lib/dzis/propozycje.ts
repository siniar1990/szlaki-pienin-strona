import type { TrasaNaLiscie } from '@/lib/dane/typy'

import type { PogodaPunktu } from './pogoda'

/**
 * Co robić w Pieninach przy dzisiejszej pogodzie.
 *
 * **Dlaczego reguła, a nie model językowy.** Bo tu nie ma nic do wymyślenia:
 * przy deszczu chce się krótko i nisko, przy wichurze nie chce się na grań,
 * przy słońcu chce się widoków. Zapytanie modelu kosztowałoby pieniądze,
 * dokładało sekundę do czasu odpowiedzi i raz na jakiś czas podpowiadałoby
 * bzdurę, której nikt by nie wyłapał. Reguła jest darmowa, natychmiastowa
 * i — co najważniejsze — daje się przetestować.
 *
 * **Dlaczego to nie jest ostrzeżenie.** Nie piszemy „nie wychodź" ani „szlak
 * zamknięty", bo tego nie wiemy; o zamknięciu szlaku decyduje park, a o
 * własnym bezpieczeństwie turysta. Podpowiadamy, co przy takiej pogodzie
 * ma więcej sensu — to jest rada, a nie decyzja podjęta za kogoś.
 */

/** Powód, dla którego akurat te trasy. Pokazywany nad propozycjami. */
export type PowodPropozycji = 'deszcz' | 'wichura' | 'upal' | 'snieg' | 'pogodnie'

export type Propozycja = {
  powod: PowodPropozycji
  /** Zdanie nad kafelkami — mówi, dlaczego akurat te. */
  wstep: string
  trasy: TrasaNaLiscie[]
}

/** Powyżej tylu km/h na grani przewracają człowieka porywy, nie wiatr. */
const WICHURA_KMH = 45

/** Od tylu stopni w dolinie podejście w pełnym słońcu przestaje być odpoczynkiem. */
const UPAL_C = 27

/** Kody WMO od 51 w górę to wszystko, co pada — mżawka, deszcz, śnieg, burza. */
const PADA_OD = 51

/** Powyżej tego progu na grani leży śnieg, a nie jego resztki w cieniu. */
const SNIEG_CM = 5

/**
 * Wysokość, powyżej której trasa jest „w graniach".
 *
 * Osiemset metrów to w Pieninach próg, za którym kończy się las bukowy
 * i zaczynają odsłonięte grzbiety — czyli dokładnie ten teren, którego przy
 * wichurze i burzy chce się uniknąć.
 */
const GRAN_M = 800

/** Trasa krótka na tyle, żeby zmieścić się między dwoma deszczami. */
const KROTKA_KM = 8

export function powodDnia(dolina: PogodaPunktu, gran: PogodaPunktu, porywy: number): PowodPropozycji {
  /*
    Kolejność ma znaczenie i nie jest alfabetyczna — to ranking tego, co
    najbardziej zmienia plan dnia. Wichura wygrywa z deszczem, bo w deszczu
    da się chodzić, a w porywach na Sokolicy nie. Śnieg wygrywa z upałem
    z oczywistych powodów.
  */
  if (porywy >= WICHURA_KMH) return 'wichura'
  if (gran.snieg >= SNIEG_CM) return 'snieg'
  if (dolina.kod >= PADA_OD || dolina.opad > 0) return 'deszcz'
  if (dolina.temperatura >= UPAL_C) return 'upal'
  return 'pogodnie'
}

const WSTEPY: Record<PowodPropozycji, string> = {
  deszcz:
    'Pada. Te trasy są krótkie i prowadzą dołem — da się je zmieścić między ' +
    'dwoma przelotnymi opadami i nie trzeba schodzić mokrymi skałami.',
  wichura:
    'Na grani mocno wieje. Grzbiety zostawiamy na inny dzień; te trasy trzymają ' +
    'się dolin i lasu, gdzie porywy są o połowę słabsze.',
  upal:
    'Gorąco. Te trasy dają cień i wodę po drodze — wyjście w skwarze na odkrytą ' +
    'grań jest wysiłkiem, po którym nie pamięta się widoku.',
  snieg:
    'Na górze leży śnieg. Te trasy są krótsze i łatwiejsze; na oblodzonych ' +
    'stromiznach przydadzą się raczki, a w kieszeni czołówka, bo dzień jest krótki.',
  pogodnie: 'Ładnie. Szkoda dnia na dolinę — te trasy prowadzą tam, gdzie widać najdalej.',
}

const KOLEJNOSC_TRUDNOSCI: Record<string, number> = { latwa: 0, srednia: 1, trudna: 2 }

/**
 * Trzy trasy dobrane do pogody.
 *
 * **Od najłatwiejszej.** Filtr „pogodnie" przepuszcza wszystko powyżej
 * ośmiuset metrów, a w Pieninach są to w większości trasy trudne — przy
 * sortowaniu po nazwie wychodziły trzy całodniowe wyprawy dla każdego, kto
 * rano zajrzy na stronę. Trudność przed długością, bo o rezygnacji decyduje
 * najpierw stromizna, a dopiero potem kilometry.
 *
 * **Bez losowania.** Kolejność jest w pełni wyznaczona przez dane, więc przy
 * tej samej pogodzie strona pokazuje to samo. Losowanie wyglądałoby żywiej,
 * ale kto odświeża stronę i widzi inne trasy, słusznie przestaje wierzyć, że
 * stoi za tym jakakolwiek zasada.
 */
export function zaproponujTrasy(
  trasy: TrasaNaLiscie[],
  powod: PowodPropozycji,
  ile = 3,
): Propozycja {
  const wysokosc = (trasa: TrasaNaLiscie) => trasa.najwyzszyPunktM ?? trasa.wysokoscSzczytuM ?? 0

  const dobor: Record<PowodPropozycji, (trasa: TrasaNaLiscie) => boolean> = {
    deszcz: (t) => t.dlugoscKm <= KROTKA_KM && wysokosc(t) < GRAN_M,
    wichura: (t) => wysokosc(t) < GRAN_M,
    upal: (t) => t.dlugoscKm <= KROTKA_KM && wysokosc(t) < GRAN_M,
    snieg: (t) => t.dlugoscKm <= KROTKA_KM && t.trudnosc !== 'trudna',
    pogodnie: (t) => wysokosc(t) >= GRAN_M,
  }

  const pasujace = trasy.filter(dobor[powod]).sort(
    (a, b) =>
      KOLEJNOSC_TRUDNOSCI[a.trudnosc] - KOLEJNOSC_TRUDNOSCI[b.trudnosc] ||
      a.dlugoscKm - b.dlugoscKm ||
      // Nazwa tylko po to, żeby dwie identyczne co do liczb trasy nie
      // zamieniały się miejscami między budowaniami.
      a.nazwa.localeCompare(b.nazwa, 'pl'),
  )

  /*
    Gdy filtr znajdzie za mało tras, dobieramy resztę z całej listy zamiast
    zostawiać dziurę w rzędzie kafelków — ale NIE przy wichurze i śniegu.

    Tam filtr nie odsiewa tras mniej wygodnych, tylko takie, na które przy
    tej pogodzie lepiej nie iść. Dołożenie grani „żeby były trzy kafelki"
    zamieniłoby radę w jej przeciwieństwo, a układ strony nie jest wart
    czyjegoś wieczoru z GOPR-em. Dwa kafelki są w porządku.
  */
  const uzupelniac = powod !== 'wichura' && powod !== 'snieg'

  const brakujace = uzupelniac
    ? trasy.filter((t) => !pasujace.includes(t)).sort((a, b) => a.dlugoscKm - b.dlugoscKm)
    : []

  return {
    powod,
    wstep: WSTEPY[powod],
    trasy: [...pasujace, ...brakujace].slice(0, ile),
  }
}
