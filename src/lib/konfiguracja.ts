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
  kontakt: 'siniar1990@gmail.com',
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
export const SKLEPY = {
  appStore: '',
  googlePlay: '',
} as const

export type Sklep = keyof typeof SKLEPY

export function czySklepDostepny(sklep: Sklep): boolean {
  return SKLEPY[sklep].length > 0
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
  { adres: '/wyzwania', etykieta: 'Odznaki' },
  { adres: '/aplikacja', etykieta: 'Aplikacja' },
] as const

/** Telefony ratunkowe — powtarzają się na stronach tras i w stopce. */
export const RATUNEK = {
  gopr: '601 100 300',
  goprSkrocony: '985',
  alarmowy: '112',
} as const
