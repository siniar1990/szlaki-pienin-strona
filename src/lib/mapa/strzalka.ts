/**
 * Ikona strzałki kierunku marszu — odpowiednik `rysujStrzalkeTrasy`
 * z `lib/features/okolica/markery.dart`.
 *
 * Rysujemy ją w przeglądarce zamiast wczytywać plik PNG i to jest wybór, nie
 * lenistwo: kształt jest wtedy opisany tymi samymi liczbami co w aplikacji
 * i przy zmianie w jednym miejscu widać, co poprawić w drugim. Obrazek
 * w repozytorium rozjechałby się po cichu.
 *
 * Grot wypełnia większość kwadratu — przy pierwszej próbie zajmował połowę
 * i na wstędze ginął, wyglądając na przypadkowy pyłek.
 */

/** Bok ikony w punktach; przy `GESTOSC` 3 daje 78 × 78 pikseli. */
const BOK = 26
const GESTOSC = 3

const KOLOR = '#FFFFFF'
const OBWODKA = '#2B0A1E'

/**
 * Zwraca gotowy obrazek do `map.addImage`.
 *
 * `null`, gdy przeglądarka nie dała kontekstu 2D — mapa działa wtedy bez
 * strzałek zamiast się wywracać. Kierunek marszu wynika też z kolejności
 * punktów etapowych pod mapą, więc to nie jest utrata jedynego źródła.
 */
export function rysujStrzalke(): ImageData | null {
  const px = BOK * GESTOSC
  const plotno = document.createElement('canvas')
  plotno.width = px
  plotno.height = px

  const rysik = plotno.getContext('2d')
  if (!rysik) return null

  rysik.scale(GESTOSC, GESTOSC)

  const szewron = new Path2D()
  szewron.moveTo(7.5, 4.5)
  szewron.lineTo(19.5, 13.0)
  szewron.lineTo(7.5, 21.5)

  rysik.lineCap = 'round'
  rysik.lineJoin = 'round'

  // Najpierw ciemna obwódka, potem biały grot na niej — kolejność daje
  // równą ramkę bez rysowania dwóch osobnych kształtów.
  rysik.strokeStyle = OBWODKA
  rysik.lineWidth = 7.2
  rysik.stroke(szewron)

  rysik.strokeStyle = KOLOR
  rysik.lineWidth = 4.0
  rysik.stroke(szewron)

  return rysik.getImageData(0, 0, px, px)
}

/** Gęstość pikseli ikony — `map.addImage` musi ją znać, żeby nie skalować dwa razy. */
export const GESTOSC_STRZALKI = GESTOSC
