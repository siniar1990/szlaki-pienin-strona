/**
 * Słońce nad Szczawnicą — faza doby, pozycja na łuku, długość dnia.
 *
 * **Dlaczego liczone u nas, a nie pobierane.** Wschód i zachód przychodzą już
 * z prognozy pogody, a wszystko pozostałe da się z nich wyprowadzić czystym
 * rachunkiem. Dokładanie biblioteki astronomicznej po to, żeby policzyć,
 * jaka część dnia minęła, byłoby zależnością utrzymywaną latami dla jednego
 * dzielenia.
 *
 * **Po co faza doby.** Bo steruje tym, co widać na kafelku: przed świtem
 * i po zmierzchu migoczą gwiazdy, a słońce stoi przy horyzoncie; w dzień
 * gwiazdy znikają, a słońce jedzie po łuku. Bez tego kafelek o piątej rano
 * wyglądałby tak samo jak w południe.
 */

export type FazaDoby = 'przed-switem' | 'dzien' | 'po-zmierzchu'

export type Slonce = {
  wschod: Date
  zachod: Date
  faza: FazaDoby
  /**
   * Jak daleko zaszedł dzień — od 0 przy wschodzie do 1 przy zachodzie.
   *
   * Poza dniem przyjmuje 0 albo 1, żeby słońce na łuku stało przy właściwym
   * krańcu, a nie wyskakiwało poza rysunek.
   */
  postep: number
  /** Długość dnia w minutach. */
  dlugoscDnia: number
}

export function policzSlonce(wschod: Date, zachod: Date, teraz = new Date()): Slonce {
  const start = wschod.getTime()
  const koniec = zachod.getTime()
  const chwila = teraz.getTime()

  const faza: FazaDoby =
    chwila < start ? 'przed-switem' : chwila > koniec ? 'po-zmierzchu' : 'dzien'

  /*
    Zabezpieczenie przed dzieleniem przez zero. Zdarzyć się to może tylko przy
    zepsutej odpowiedzi z prognozy, ale wtedy wolimy słońce na starcie łuku niż
    NaN wstawiony do atrybutu `cx`, po którym SVG przestaje się rysować w całości.
  */
  const dlugosc = Math.max(1, koniec - start)
  const postep = faza === 'dzien' ? (chwila - start) / dlugosc : faza === 'przed-switem' ? 0 : 1

  return {
    wschod,
    zachod,
    faza,
    postep,
    dlugoscDnia: Math.round(dlugosc / 60_000),
  }
}

/**
 * Punkt na półokręgu łuku dnia dla zadanego postępu.
 *
 * Łuk w mockupie biegnie od (8, 30) do (142, 30) — środek w (75, 30),
 * promień 67. Postęp 0 to lewy kraniec, 1 to prawy; kąt idzie od π do 0,
 * bo w SVG oś Y rośnie w dół, więc górę łuku daje odejmowanie sinusa.
 */
export function punktNaLuku(postep: number): { x: number; y: number } {
  const kat = Math.PI * (1 - Math.min(1, Math.max(0, postep)))

  return {
    x: Number((75 + 67 * Math.cos(kat) * -1).toFixed(1)),
    y: Number((30 - 67 * Math.sin(kat)).toFixed(1)),
  }
}

/** 889 → „14 h 49 min". */
export function dlugoscDniaSlownie(minuty: number): string {
  return `${Math.floor(minuty / 60)} h ${minuty % 60} min`
}

const OPISY_FAZY: Record<FazaDoby, string> = {
  'przed-switem': 'jeszcze przed świtem',
  dzien: 'dzień w toku',
  'po-zmierzchu': 'po zmierzchu',
}

export function opisFazy(faza: FazaDoby): string {
  return OPISY_FAZY[faza]
}
