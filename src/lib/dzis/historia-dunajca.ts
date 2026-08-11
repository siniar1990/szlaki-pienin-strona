import { baza } from '@/lib/baza'

import type { StanDunajca } from './dunajec'

/**
 * Historia stanu wody — punkty do wykresu na kafelku Dunajca.
 *
 * **Dlaczego zapisujemy własne odczyty.** IMGW udostępnia wyłącznie ostatni
 * pomiar; historii z tego interfejsu nie da się pobrać. Wykres z ostatniej
 * doby może więc powstać tylko z tego, co sami odłożyliśmy — a nie z niczego,
 * bo portal nie rysuje wymyślonych przebiegów.
 *
 * **Wykres pojawia się dopiero, gdy jest z czego go zrobić.** Zaraz po
 * wdrożeniu baza jest pusta i kafelek pokazuje samą liczbę. Linia z dwóch
 * punktów sugerowałaby trend, którego nikt nie zmierzył; brak linii nie
 * sugeruje niczego.
 */

/** Ile godzin wstecz pokazuje wykres. */
const OKNO_GODZIN = 24

/**
 * Poniżej tylu punktów nie rysujemy nic.
 *
 * Przy odpytywaniu co kwadrans doba daje ich blisko sto, więc sześć to jakieś
 * półtorej godziny działania — dość, żeby linia cokolwiek znaczyła, i mało,
 * żeby wykres nie kazał na siebie czekać dzień po wdrożeniu.
 */
const NAJMNIEJ_PUNKTOW = 6

/** Po ilu godzinach kasujemy odczyt. Dwie doby, żeby okno miało zapas. */
const PRZECHOWUJEMY_GODZIN = 48

export type PunktHistorii = { pomiar: Date; poziom: number }

/**
 * Czy tabela historii w ogóle istnieje.
 *
 * Migracja wchodzi osobno od kodu, więc jest okno, w którym wdrożony portal
 * pyta o tabelę, której jeszcze nie ma. Bez tej flagi Prisma zgłaszałaby błąd
 * przy każdym renderze każdej strony korzystającej z danych dnia — a to jest
 * dziennik zapchany komunikatem o czymś, co i tak jest obsłużone.
 *
 * Flaga żyje tyle, co proces: po zastosowaniu migracji wystarczy najbliższe
 * przewdrożenie albo zwykłe wygaśnięcie funkcji, żeby portal spróbował znowu.
 */
let brakTabeli = false

/** Kod Prismy dla „relacja nie istnieje". */
const TABELA_NIE_ISTNIEJE = 'P2021'

/**
 * Zapisuje odczyt i zwraca historię z ostatniej doby.
 *
 * Zapis i odczyt w jednym miejscu, bo dzieją się w tej samej chwili i z tego
 * samego powodu. Rozdzielenie ich oznaczałoby drugie zadanie cykliczne
 * pilnujące, żeby historia rosła — a ona ma rosnąć dokładnie wtedy, kiedy
 * ktoś patrzy na kafelek.
 */
export async function zapiszIPobierzHistorie(
  stan: StanDunajca | null,
): Promise<PunktHistorii[]> {
  if (brakTabeli) return []

  try {
    if (stan) {
      /*
        `create` z pochłoniętym konfliktem, a nie `upsert`: ta sama chwila
        pomiaru wraca z IMGW przy każdym odpytaniu, dopóki stacja nie zaraportuje
        nowej. Nadpisywanie jej tą samą wartością to zapis bez powodu.
      */
      await baza.odczytDunajca
        .create({
          data: {
            pomiar: stan.pomiar,
            poziom: stan.poziom,
            temperaturaWody: stan.temperaturaWody,
          },
        })
        .catch(() => undefined)
    }

    const od = new Date(Date.now() - OKNO_GODZIN * 3600_000)

    const [punkty] = await Promise.all([
      baza.odczytDunajca.findMany({
        where: { pomiar: { gte: od } },
        orderBy: { pomiar: 'asc' },
        select: { pomiar: true, poziom: true },
      }),
      // Sprzątanie przy okazji — osobne zadanie cykliczne dla trzech wierszy
      // dziennie byłoby maszynerią cięższą od problemu.
      baza.odczytDunajca.deleteMany({
        where: { pomiar: { lt: new Date(Date.now() - PRZECHOWUJEMY_GODZIN * 3600_000) } },
      }),
    ])

    return punkty.length >= NAJMNIEJ_PUNKTOW ? punkty : []
  } catch (blad) {
    /*
      Awaria bazy nie może zabrać kafelka. Stan wody przychodzi z IMGW
      niezależnie od tego, czy mamy historię — wykres jest dodatkiem, nie
      warunkiem pokazania liczby.
    */
    if (
      typeof blad === 'object' &&
      blad !== null &&
      'code' in blad &&
      blad.code === TABELA_NIE_ISTNIEJE
    ) {
      brakTabeli = true
      console.warn('Historia Dunajca: brak tabeli — wykres zostaje ukryty do czasu migracji.')
      return []
    }

    console.error('Nie udało się zapisać historii Dunajca:', blad)
    return []
  }
}

/**
 * Punkty historii na współrzędne wykresu 132 × 26 z mockupu.
 *
 * Skalujemy do rzeczywistego zakresu odczytów, a nie do zera: dobowe wahania
 * Dunajca to kilka centymetrów przy stanie liczonym w setkach, więc oś od zera
 * dałaby linię prostą. Zakres poniżej czterech centymetrów rozciągamy sztucznie,
 * żeby szum pomiarowy nie udawał gwałtownego przyboru.
 */
export function wspolrzedneWykresu(punkty: PunktHistorii[]): {
  linia: string
  teraz: { x: number; y: number }
} | null {
  if (punkty.length < NAJMNIEJ_PUNKTOW) return null

  const poziomy = punkty.map((p) => p.poziom)
  const najnizszy = Math.min(...poziomy)
  const najwyzszy = Math.max(...poziomy)
  const rozpietosc = Math.max(4, najwyzszy - najnizszy)
  const srodek = (najnizszy + najwyzszy) / 2

  const wspolrzedne = punkty.map((punkt, indeks) => {
    const x = 2 + (indeks / (punkty.length - 1)) * 120
    // Wykres ma 26 px wysokości; zostawiamy po 4 px marginesu na kropkę „teraz".
    const y = 13 - ((punkt.poziom - srodek) / rozpietosc) * 18
    return { x: Number(x.toFixed(1)), y: Number(Math.min(22, Math.max(4, y)).toFixed(1)) }
  })

  return {
    linia: wspolrzedne.map((w) => `${w.x},${w.y}`).join(' '),
    teraz: wspolrzedne[wspolrzedne.length - 1],
  }
}
