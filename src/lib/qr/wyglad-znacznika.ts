/**
 * Jak wygląda tabliczka na mapie panelu.
 *
 * Osobny moduł, bo korzystają z niego dwie strony: mapa (komponent kliencki)
 * i jej legenda (renderowana na serwerze). Gdyby zasada mieszkała w jednym
 * z nich, druga musiałaby ją powtórzyć — a legenda pokazująca inne wielkości
 * niż mapa jest gorsza niż brak legendy.
 *
 * **Dlaczego wielkość, a nie barwa.** Pierwsza wersja różnicowała punkty
 * wyłącznie odcieniem zieleni. Dla części ludzi — a rozróżnianie barw to nie
 * jest rzadka przypadłość — dwa sąsiednie odcienie tej samej barwy są nie do
 * odróżnienia, więc mapa nie niosła dla nich żadnej informacji. Teraz ruch
 * niesie wielkość kropki, a barwa i liczba pod nią tylko ją powtarzają. Trzy
 * niezależne zapisy tej samej rzeczy: gdy jeden zawiedzie, zostają dwa.
 *
 * **Dlaczego kształt na stan.** Tabliczka bez skanów i tabliczka wyłączona to
 * dwie różne sytuacje, a obie mają zero. Zapisujemy je kółkiem pustym
 * w środku — z obwódką zieloną dla wiszącej i szarą dla wyłączonej. Puste
 * kółko odróżnia się od pełnego niezależnie od rozpoznawania barw.
 */

/** Poniżej trzynastu pikseli znacznik przestaje być celem do kliknięcia,
 *  powyżej trzydziestu sześciu zasłania podkład. */
export const NAJMNIEJSZA = 13
export const NAJWIEKSZA = 36

export type WygladZnacznika = { rozmiar: number; kolor: string; obrys: string }

/**
 * Skala pierwiastkowa, nie liniowa. Powód jest ten sam, dla którego stosuje się
 * ją na mapach z proporcjonalnymi kołami: oko porównuje **pola** kółek, a nie
 * ich średnice. Przy skali liniowej punkt z dziesięciokrotnym ruchem wyglądałby
 * na stukrotnie większy.
 */
export function wygladZnacznika(
  skany: number,
  najwiecej: number,
  status: string,
): WygladZnacznika {
  if (status !== 'AKTYWNY') {
    return { rozmiar: NAJMNIEJSZA, kolor: '#ffffff', obrys: '#94a3b8' }
  }

  // Wisi, ale milczy. To najważniejsze pytanie przy tej mapie, więc stan musi
  // rzucać się w oczy sam z siebie.
  if (skany === 0) {
    return { rozmiar: NAJMNIEJSZA, kolor: '#ffffff', obrys: '#4a7c59' }
  }

  const udzial = Math.sqrt(skany / Math.max(1, najwiecej))

  return {
    rozmiar: Math.round(NAJMNIEJSZA + udzial * (NAJWIEKSZA - NAJMNIEJSZA)),
    // Odcień jest tu dodatkiem, nie nośnikiem — powtarza to, co mówi wielkość.
    kolor: `hsl(152 45% ${Math.round(58 - udzial * 30)}%)`,
    obrys: '#ffffff',
  }
}
