/**
 * Ustawienia portalu — wszystko, co zmienia się rzadko, ale w kilku miejscach.
 *
 * Trzymamy to razem, żeby zmiana adresu sklepu albo nazwiska w stopce była
 * jedną poprawką, a nie polowaniem po komponentach.
 */

export const PORTAL = {
  nazwa: 'Szlaki Pienin',
  adres: 'https://szlakipienin.pl',
  opis:
    'Szlaki piesze i rowerowe, atrakcje, mapy offline i nawigacja GPS — ' +
    'przewodnik po Pieninach na telefon i w przeglądarce.',
  jezyk: 'pl-PL',
  /** Adres bez protokołu — czytelniejszy w temacie wiadomości. */
  adresSkrocony: 'szlakipienin.pl',
  kontakt: 'siniar1990@gmail.com',
  /**
   * Kto firmuje notki w dziale aktualności.
   *
   * Organizacja, nie osoba — i to jest decyzja świadoma. Notki powstają
   * z przeglądu lokalnej prasy, szkic pisze model, a zatwierdza je właściciel
   * portalu. Podpisanie tego imieniem i nazwiskiem sugerowałoby reporterską
   * pracę w terenie, której nie było. Schema.org dopuszcza organizację jako
   * autora i to jest tu jedyny uczciwy zapis.
   */
  redakcja: 'Redakcja Szlaki Pienin',
  /** Nazwa aplikacji w sklepach; używana też w danych strukturalnych. */
  aplikacja: {
    nazwa: 'Szlaki Pienin',
    identyfikatorIOS: 'pl.szczawnica.szlakiPienin',
    /*
      Identyfikator w Google Play różni się od iOS-owego zapisem — podkreślenie
      zamiast wielkiej litery. To nie pomyłka: tak aplikacja została wydana
      i tego zapisu trzyma się adres w sklepie, więc nie da się mieć jednego
      identyfikatora na obie platformy.
    */
    identyfikatorAndroid: 'pl.szczawnica.szlaki_pienin',
  },
} as const

/**
 * Klucz dostępu formularza kontaktowego (Web3Forms).
 *
 * Jawny z założenia usługi — w ich dokumentacji stoi wprost w polu ukrytym
 * formularza. Pozwala wyłącznie wysłać wiadomość na jeden zdefiniowany adres
 * i nie daje dostępu do niczego więcej.
 *
 * Stoi tu, a nie w zmiennej środowiskowej, bo zmienna sugerowałaby sekret,
 * którym to nie jest — a przy okazji wymagałaby konfiguracji przy każdym
 * nowym środowisku, nie chroniąc niczego.
 */
export const KLUCZ_WEB3FORMS = '25f55b8f-5d20-475a-97cd-14cdeb050128'

/**
 * Adresy w sklepach.
 *
 * Pusty adres znaczy „aplikacji tam jeszcze nie ma" i cały portal rozpoznaje
 * to sam: odznaka robi się wyszarzonym napisem „wkrótce" zamiast martwego
 * odnośnika, a tabliczka QR nie przekierowuje w kartę, której nie ma.
 * Mechanizm zostaje, choć dziś oba adresy są wypełnione — gdyby kiedyś
 * aplikacja wypadła ze sklepu, wystarczy wyczyścić jedno pole.
 */
export const SKLEPY = {
  appStore: 'https://apps.apple.com/pl/app/szlaki-pienin/id6797675813',
  googlePlay: `https://play.google.com/store/apps/details?id=${PORTAL.aplikacja.identyfikatorAndroid}`,
} as const

export type Sklep = keyof typeof SKLEPY

export function czySklepDostepny(sklep: Sklep): boolean {
  return SKLEPY[sklep].length > 0
}

/**
 * Zapowiedziane daty premier w sklepach, w których aplikacji jeszcze nie ma.
 *
 * **Dziś pusta, bo aplikacja jest w obu sklepach** — nie ma czego
 * zapowiadać. Mechanizm zostaje na wypadek kolejnej platformy i dlatego, że
 * uczy ostrożności: stała tu zapowiedź premiery Androida na 24 sierpnia 2026,
 * aplikacja nie przeszła do tego dnia weryfikacji w Google Play i portal
 * obiecywał termin, którego nie dotrzymał — gorzej niż brak terminu.
 *
 * **Kiedy wpisywać datę.** Dopiero gdy dzień publikacji jest pewny. Konkretny
 * dzień jest lepszy od „wkrótce", bo daje powód, żeby zajrzeć ponownie — ale
 * tylko wtedy, gdy da się go dotrzymać. Format: `'2026-09-15'`.
 *
 * Wpis przestaje działać sam w chwili, gdy w `SKLEPY` pojawi się adres: data
 * pokazuje się wyłącznie przy sklepie bez odnośnika, więc opublikowanie
 * aplikacji zdejmuje zapowiedź bez niczyjej pamięci.
 */
export const PREMIERY: Partial<Record<Sklep, string>> = {}

/** Data premiery po polsku, np. „15 września". `null`, gdy nie zapowiedziano. */
export function dataPremiery(sklep: Sklep): string | null {
  const dzien = PREMIERY[sklep]
  if (!dzien || czySklepDostepny(sklep)) return null

  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' }).format(
    new Date(`${dzien}T12:00:00Z`),
  )
}

/**
 * Źródła treści — pokazywane przy trasach i atrakcjach.
 *
 * Portal nie jest autorem opisów tras; są z przewodnika PTTK. Podpisanie
 * tego wprost to nie tylko uczciwość wobec autora, ale i sygnał dla
 * wyszukiwarki, że treść ma udokumentowane pochodzenie.
 */
export const ZRODLA = {
  przewodnik: {
    tytul: 'Szlaki pełne zdrowia',
    autor: 'Piotr Krzywda',
    wydawca: 'PTTK Oddział Pieniński',
    wydanie: 'wyd. II, 2019',
  },
  kapliczki: {
    tytul: 'Śladami kapliczek, krzyży i figur przydrożnych Szczawnicy',
  },
} as const

/**
 * Główna nawigacja portalu.
 *
 * Są tu wyłącznie działy, które mają treść — pusty dział w menu wygląda jak
 * zepsuta strona i marnuje zaufanie, którego potem nie da się odzyskać.
 * „Miejscowości" doszły, gdy powstały do nich teksty; „Blog" wciąż czeka.
 *
 * „Dziś" stoi pierwsze, choć powstało ostatnie. To jedyny dział, którego
 * treść zmienia się w ciągu dnia, a więc jedyny, po który ktoś wraca
 * codziennie — reszta odpowiada na pytania zadawane raz.
 */
export const MENU = [
  { adres: '/dzis', etykieta: 'Dziś' },
  { adres: '/szlaki', etykieta: 'Szlaki' },
  { adres: '/atrakcje', etykieta: 'Atrakcje' },
  { adres: '/miejscowosci', etykieta: 'Miejscowości' },
  { adres: '/mapa', etykieta: 'Mapa' },
  { adres: '/aktualnosci', etykieta: 'Aktualności' },
  { adres: '/aplikacja', etykieta: 'Aplikacja' },
] as const

/** Telefony ratunkowe — powtarzają się na stronach tras i w stopce. */
export const RATUNEK = {
  gopr: '601 100 300',
  goprSkrocony: '985',
  alarmowy: '112',
} as const
