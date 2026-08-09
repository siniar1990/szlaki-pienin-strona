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
  },
} as const

/**
 * Adresy w sklepach.
 *
 * Puste, dopóki aplikacja nie zostanie opublikowana. Komponent przycisku
 * sam rozpoznaje pustkę i pokazuje wtedy stan „Wkrótce" zamiast martwego
 * odnośnika — użytkownik, który zeskanował kod QR na szlaku, dostaje uczciwą
 * informację, a nie błąd 404 w App Store.
 *
 * Po publikacji wystarczy wkleić tu adresy; nic więcej nie trzeba zmieniać.
 */
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

export const SKLEPY = {
  appStore: 'https://apps.apple.com/pl/app/szlaki-pienin/id6797675813',
  googlePlay: '',
} as const

export type Sklep = keyof typeof SKLEPY

export function czySklepDostepny(sklep: Sklep): boolean {
  return SKLEPY[sklep].length > 0
}

/**
 * Zapowiedziane daty premier w sklepach, w których aplikacji jeszcze nie ma.
 *
 * **Dlaczego data, a nie samo „wkrótce".** Ktoś z Androidem, który trafia na
 * portal i widzi wyszarzoną odznakę bez wyjaśnienia, wychodzi i nie wraca.
 * Konkretny dzień daje mu powód, żeby zajrzeć ponownie — a nam obowiązek,
 * żeby go dotrzymać.
 *
 * Wpis znika stąd w chwili, gdy w `SKLEPY` pojawi się adres: komponent
 * pokazuje datę wyłącznie przy sklepie bez odnośnika, więc opublikowanie
 * aplikacji samo zdejmuje zapowiedź. Nie ma jak zostawić na stronie daty,
 * która już minęła.
 */
export const PREMIERY: Partial<Record<Sklep, string>> = {
  googlePlay: '2026-08-24',
}

/** Data premiery po polsku, np. „24 sierpnia". `null`, gdy nie zapowiedziano. */
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
 * Są tu wyłącznie działy, które mają treść. „Miejscowości" i „Blog" dojdą,
 * gdy powstaną do nich teksty — pusty dział w menu wygląda jak zepsuta
 * strona i marnuje zaufanie, którego potem nie da się odzyskać.
 */
export const MENU = [
  { adres: '/szlaki', etykieta: 'Szlaki' },
  { adres: '/atrakcje', etykieta: 'Atrakcje' },
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
