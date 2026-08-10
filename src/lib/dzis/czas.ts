/**
 * Czas polski bez oznaczenia strefy.
 *
 * **Problem, który to rozwiązuje.** Instytucje podają godziny tak, jak stoją
 * na zegarze w Polsce: IMGW zwraca „2026-08-09 23:50" i nic więcej. JavaScript
 * czyta taki napis jako czas lokalny *maszyny*, a maszyna, na której to
 * działa, chodzi w UTC. Efekt: na komputerze w Polsce wychodzi 23:50,
 * a na serwerze 01:50 — dwie godziny w przód, bez śladu błędu w kodzie.
 *
 * Trafiło to na produkcję przy pierwszym wdrożeniu „Dziś w Pieninach" i było
 * niewidoczne lokalnie, bo lokalnie obie strefy są tą samą strefą.
 *
 * **Dlaczego nie stała liczba godzin.** Bo Polska zmienia czas dwa razy do
 * roku: zimą +1, latem +2. Wpisanie którejkolwiek na stałe daje pół roku
 * poprawnych odczytów i pół roku przesuniętych — czyli błąd, który wraca
 * co pół roku i za każdym razem wygląda na nowy.
 */

const STREFA = 'Europe/Warsaw'

/**
 * Przesunięcie strefy warszawskiej względem UTC w danej chwili, w milisekundach.
 *
 * Liczymy je przez sformatowanie tej samej chwili w obu strefach i odjęcie —
 * to jedyny sposób, żeby zapytać środowisko o rzeczywistą regułę czasu letniego
 * zamiast odtwarzać ją własnym kalendarzem.
 */
function przesuniecie(chwila: Date): number {
  const formatuj = (strefa: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: strefa,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(chwila)

  // `Date.parse` na sformatowanym napisie czyta go jako czas lokalny maszyny,
  // ale robimy to dla obu stref tak samo, więc różnica jest już niezależna
  // od tego, w jakiej strefie chodzi serwer.
  return Date.parse(formatuj(STREFA)) - Date.parse(formatuj('UTC'))
}

/**
 * Napis z polskim czasem lokalnym na prawdziwą chwilę.
 *
 * Przyjmuje „2026-08-09 23:50" i „2026-08-09T23:50" — IMGW używa spacji.
 * Zwraca `null` dla wartości, których nie da się odczytać; wywołujący ma
 * wtedy pominąć odczyt, a nie pokazać datę wziętą z niczego.
 *
 * Przesunięcie liczymy dwukrotnie: pierwszy raz dla przybliżonej chwili,
 * drugi dla poprawionej. Bez tego odczyt z nocy zmiany czasu wypadałby po
 * niewłaściwej stronie granicy. Wewnątrz samej godziny przestawiania zegarów
 * wynik pozostaje niejednoznaczny — ale tam niejednoznaczny jest sam czas,
 * a nie ten rachunek.
 */
export function zPolskiegoCzasu(napis: string): Date | null {
  const znormalizowany = napis.trim().replace(' ', 'T')

  const jakbyUtc = new Date(`${znormalizowany}Z`)
  if (Number.isNaN(jakbyUtc.getTime())) return null

  const pierwsze = new Date(jakbyUtc.getTime() - przesuniecie(jakbyUtc))
  return new Date(jakbyUtc.getTime() - przesuniecie(pierwsze))
}

/**
 * Data i godzina w Polsce, rozłożona na części.
 *
 * Kalendarz otwarcia potrzebuje czterech liczb i wszystkie muszą pochodzić
 * z tego samego zegara. Wcześniej brał miesiąc i dzień z `Date` (czyli
 * z zegara serwera), a godzinę i dzień tygodnia liczył dla Polski — co przez
 * dwie godziny na dobę, między północą a drugą, dawało datę z wczoraj przy
 * dzisiejszym dniu tygodnia. Na zmianie sezonu 30 kwietnia o wpół do pierwszej
 * zamek byłby jeszcze zimowy, a w nocy z poniedziałku na wtorek muzeum
 * dostawało wtorkowe godziny przy poniedziałkowej dacie.
 */
export type ChwilaWPolsce = {
  /** Miesiąc liczony od 1, jak w mowie, a nie od zera jak w `Date`. */
  miesiac: number
  dzien: number
  godzina: number
  /** 0 to niedziela — zgodnie z `Date.getDay()`. */
  dzienTygodnia: number
}

const DNI = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function chwilaWPolsce(teraz = new Date()): ChwilaWPolsce {
  const czesci = new Intl.DateTimeFormat('en-US', {
    timeZone: STREFA,
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(teraz)

  const wartosc = (typ: string) => czesci.find((czesc) => czesc.type === typ)?.value ?? ''

  return {
    miesiac: Number(wartosc('month')),
    dzien: Number(wartosc('day')),
    // O północy `hour12: false` potrafi dać „24" zamiast „0" — zależnie od
    // wersji środowiska. Reszta modułu zakłada zakres 0–23.
    godzina: Number(wartosc('hour')) % 24,
    dzienTygodnia: DNI.indexOf(wartosc('weekday')),
  }
}
