/**
 * Dopasowanie treści do panelu — wykonywane w przeglądarce, po wyrenderowaniu.
 *
 * **Dlaczego to nie da się policzyć na serwerze.** O tym, czy tekst się mieści,
 * decyduje łamanie wierszy, a to zna dopiero silnik przeglądarki: te same
 * znaki w tym samym kroju złamią się inaczej przy innej szerokości panelu.
 * Serwer mógłby najwyżej zgadywać po liczbie znaków, a trasy różnią się
 * objętością kilkakrotnie — „Słowacki akcent" ma trzy odcinki opisu,
 * „Nie mam roweru" dwadzieścia jeden kilometrów tekstu.
 *
 * Kolejność ratowania miejsca jest ustalona i wynika z tego, co komu grozi:
 *
 *   1. zmniejszamy pismo — do 6 pt i ani punktu niżej,
 *   2. skracamy treść oznaczoną `data-skracalne`, całymi zdaniami od końca,
 *   3. nie ruszamy niczego oznaczonego `data-nieskracalne`.
 *
 * Ostrzeżenia i numery ratunkowe są `data-nieskracalne`. Nieczytelny wydruk
 * jest zły, ale wydruk bez ostrzeżenia o orientacji jest gorszy.
 *
 * Funkcja jest samodzielna — bez importów — bo trafia na stronę przez
 * `toString()` i wykonuje się jako zwykły skrypt. Dzięki temu ten sam kod
 * przechodzi przez kompilator TypeScriptu, zamiast być łańcuchem znaków.
 */

export type WynikPanelu = {
  nazwa: string
  /** Rozmiar tekstu opisu w punktach, po dopasowaniu. */
  pt: number
  przepelniony: boolean
  skrocony: boolean
}

/** Rozmiar tekstu opisu przy skali 1,0 — 0,68 em przy podstawie 10 pt. */
const TEKST_PT = 6.8

export function dopasujPanele(): WynikPanelu[] {
  const PODSTAWA = 10
  const TEKST = 6.8
  const DNO = 6
  const PROG = 6.5
  const KROK = 0.2

  const krokSkali = KROK / TEKST
  const skalaProgu = PROG / TEKST
  const skalaDna = DNO / TEKST

  const wyniki: WynikPanelu[] = []

  const przepelniony = (panel: HTMLElement) => panel.scrollHeight > panel.clientHeight + 1

  for (const panel of Array.from(document.querySelectorAll<HTMLElement>('.panel'))) {
    const nazwa = panel.dataset.panel ?? '?'
    let skala = 1
    let skrocony = false

    const zmniejszajDo = (granica: number) => {
      while (przepelniony(panel) && skala - krokSkali >= granica) {
        skala -= krokSkali
        panel.style.fontSize = `${(PODSTAWA * skala).toFixed(3)}pt`
      }
    }

    /*
      Kolejność ma znaczenie i nie jest oczywista.

      Najpierw zjeżdżamy pismem tylko do 6,5 pt — tyle jeszcze czyta się bez
      wysiłku na wyciągnięcie ręki. Dopiero potem tniemy treść, a zejście do
      6 pt zostaje na ostatnią chwilę, gdy nie ma już czego uciąć.

      Odwrotna kolejność (najpierw pismo do dna, potem cięcie) dawała karty
      z kompletem tekstu złożonym szóstką — czyli formalnie pełne, a w terenie
      nieczytelne. Zdanie mniej boli mniej niż cała strona, której nie da się
      przeczytać bez okularów.
    */
    zmniejszajDo(skalaProgu)

    if (przepelniony(panel)) {
      const skracalne = panel.querySelector<HTMLElement>('[data-skracalne]')
      if (skracalne) {
        let bezpiecznik = 400
        while (przepelniony(panel) && bezpiecznik > 0) {
          bezpiecznik -= 1
          if (!utnijZdanie(skracalne)) break
          skrocony = true
        }
      }
    }

    if (przepelniony(panel)) zmniejszajDo(skalaDna)

    wyniki.push({
      nazwa,
      pt: Number((TEKST * skala).toFixed(2)),
      przepelniony: przepelniony(panel),
      skrocony,
    })
  }

  return wyniki
}

/**
 * Ucina jedno zdanie od końca skracalnej treści.
 *
 * Zwraca `false`, gdy nie ma już czego uciąć — wtedy pętla wyżej odpuszcza
 * zamiast kręcić się w nieskończoność.
 */
function utnijZdanie(skracalne: HTMLElement): boolean {
  const akapity = Array.from(skracalne.querySelectorAll<HTMLElement>('p'))

  for (let i = akapity.length - 1; i >= 0; i -= 1) {
    const akapit = akapity[i]
    const tekst = akapit.textContent ?? ''

    // Granica zdania: kropka, wykrzyknik albo pytajnik ze spacją po nim.
    const zdania = tekst.match(/[^.!?]+[.!?]+["»”]?\s*/g)

    if (zdania && zdania.length > 1) {
      zdania.pop()
      akapit.textContent = zdania.join('').trimEnd()
      return true
    }

    /*
      Zostało ostatnie zdanie — leci cały blok, razem z nagłówkiem, bo sam
      nagłówek nad pustką wygląda na uszkodzony plik.

      Wolno usunąć również ostatni blok. Wcześniej stał tu warunek chroniący
      ostatnie dziecko i to on zostawiał panele przepełnione: gdy skracalna
      treść to jedna ramka, nie było już czego uciąć i pętla kręciła się bez
      skutku aż do bezpiecznika.
    */
    const blok = akapit.closest<HTMLElement>('.odcinek, .ramka')
    const doUsuniecia = blok && blok.parentElement === skracalne ? blok : akapit

    if (doUsuniecia.parentElement === skracalne) {
      doUsuniecia.remove()
      return true
    }
  }

  return false
}

/**
 * Skrypt do wstrzyknięcia na stronę.
 *
 * Zapisuje wynik w `window.__karta`, skąd czyta go generator PDF-ów przy
 * budowaniu. Bez tego kanału test nie miałby jak sprawdzić, czy któraś
 * z pięćdziesięciu czterech kart nie zeszła poniżej progu czytelności.
 */
export function skryptDopasowania(slug: string, adres: string): string {
  return `
/*
  Atrapa pomocnika esbuilda. Funkcje trafiają na stronę przez \`toString()\`,
  a kompilator wstawia w ich ciała wywołania \`__name(...)\` — służą wyłącznie
  do zachowania nazw w śladach stosu. Na stronie tej funkcji nie ma i skrypt
  wywracał się na starcie, zanim cokolwiek zdążył dopasować. Atrapa oddaje
  pierwszy argument i sprawa jest zamknięta niezależnie od tego, czym akurat
  kompilujemy.
*/
var __name = window.__name || function (f) { return f };
${utnijZdanie.toString()}
${dopasujPanele.toString()}
(function () {
  var wyniki = dopasujPanele();
  var opis = document.querySelector('[data-panel="opis"] [data-skracalne]');
  var skrocony = wyniki.some(function (w) { return w.nazwa === 'opis' && w.skrocony });
  if (opis && skrocony) {
    var nota = document.createElement('p');
    nota.className = 'stopka-panelu';
    nota.textContent = 'Pełny opis: ${adres}/szlaki/${slug}';
    opis.parentElement.appendChild(nota);
  }
  window.__karta = { slug: ${JSON.stringify(slug)}, panele: wyniki };
  document.documentElement.dataset.kartaGotowa = '1';
})();
`
}

export { TEKST_PT }
