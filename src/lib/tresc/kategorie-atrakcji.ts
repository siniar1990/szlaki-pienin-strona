/**
 * Kategorie i lokalizacje atrakcji.
 *
 * Osobny moduł od samego katalogu, bo czyta go i strona, i karta, i przyszły
 * komponent partnera — a katalog jest długi i importowanie go tylko po nazwę
 * kategorii ciągnęłoby pięćdziesiąt siedem rekordów tam, gdzie potrzeba
 * jednego napisu.
 *
 * Kolejność kategorii jest kolejnością sekcji na stronie i nie jest
 * przypadkowa: zaczynamy od tego, po co ludzie tu przyjeżdżają (przyroda
 * i Dunajec), a kończymy na tym, co dotyczy jednej pory roku.
 */

export type KategoriaAtrakcji =
  | 'przyroda'
  | 'woda'
  | 'aktywnie'
  | 'rodziny'
  | 'kultura'
  | 'zima'

export type DefinicjaKategoriiAtrakcji = {
  klucz: KategoriaAtrakcji
  nazwa: string
  /** Zdanie pod nagłówkiem sekcji. */
  opis: string
}

export const KATEGORIE_ATRAKCJI: DefinicjaKategoriiAtrakcji[] = [
  {
    klucz: 'przyroda',
    nazwa: 'Przyroda',
    opis: 'Wąwozy, wodospady, rezerwaty i park narodowy — to, po co się tu przyjeżdża.',
  },
  {
    klucz: 'woda',
    nazwa: 'Woda i Dunajec',
    opis:
      'Przełom z pokładu tratwy, rafting i kajaki, rejsy po Jeziorze ' +
      'Czorsztyńskim oraz Grajcarek w środku Szczawnicy.',
  },
  {
    klucz: 'aktywnie',
    nazwa: 'Aktywnie',
    opis: 'Rower, koń, off-road i warsztaty — dla tych, którzy nie chcą tylko patrzeć.',
  },
  {
    klucz: 'rodziny',
    nazwa: 'Rodziny',
    opis: 'Miejsca, w których dziecko wytrzyma dłużej niż kwadrans.',
  },
  {
    klucz: 'kultura',
    nazwa: 'Kultura i historia',
    opis: 'Zamki, muzea, cerkwie i uzdrowiskowa architektura Szczawnicy.',
  },
  {
    klucz: 'zima',
    nazwa: 'Zima',
    opis: 'Wyciągi, trasy narciarskie, skitury i kuligi.',
  },
]

export function nazwaKategorii(klucz: KategoriaAtrakcji): string {
  return KATEGORIE_ATRAKCJI.find((k) => k.klucz === klucz)?.nazwa ?? klucz
}

/* ── Lokalizacje ─────────────────────────────────────────────────────────── */

export type LokalizacjaAtrakcji =
  | 'szczawnica'
  | 'jaworki'
  | 'szlachtowa'
  | 'kroscienko'
  | 'czorsztyn'
  | 'niedzica'
  | 'sromowce'
  | 'kluszkowce'
  | 'pieniny'
  | 'slowacja'

/**
 * Lokalizacje w kolejności od największego skupiska atrakcji.
 *
 * „Pieniny i okolice" nie jest workiem na resztę, tylko odpowiedzią na rzeczy,
 * które nie mają jednego adresu: wypożyczalnie rowerów działają w kilku
 * miejscowościach naraz, a Velo Dunajec ciągnie się przez całą dolinę.
 */
export const LOKALIZACJE_ATRAKCJI: { klucz: LokalizacjaAtrakcji; nazwa: string }[] = [
  { klucz: 'szczawnica', nazwa: 'Szczawnica' },
  { klucz: 'jaworki', nazwa: 'Jaworki' },
  { klucz: 'szlachtowa', nazwa: 'Szlachtowa' },
  { klucz: 'kroscienko', nazwa: 'Krościenko' },
  { klucz: 'czorsztyn', nazwa: 'Czorsztyn' },
  { klucz: 'niedzica', nazwa: 'Niedzica' },
  { klucz: 'sromowce', nazwa: 'Sromowce' },
  { klucz: 'kluszkowce', nazwa: 'Kluszkowce' },
  { klucz: 'pieniny', nazwa: 'Pieniny i okolice' },
  { klucz: 'slowacja', nazwa: 'Słowacja' },
]

export function nazwaLokalizacji(klucz: LokalizacjaAtrakcji): string {
  return LOKALIZACJE_ATRAKCJI.find((l) => l.klucz === klucz)?.nazwa ?? klucz
}

/* ── Partner kategorii ───────────────────────────────────────────────────── */

/**
 * Partner kategorii — miejsce na przyszły model, w którym jedna firma wykupuje
 * wyróżnienie w obrębie jednej kategorii.
 *
 * **Dziś wszystkie wpisy to `null` i nic ich nie renderuje.** Rejestr istnieje
 * po to, żeby włączenie partnera było wypełnieniem jednego pola, a nie
 * przebudową katalogu i strony. Komponent, który go pokaże, stoi obok
 * w `components/atrakcje/partner-kategorii.tsx` i sam pilnuje, żeby bez
 * wpisu nie narysować niczego.
 *
 * Dwa zabezpieczenia wpisane w typ, a nie w dobre chęci:
 *
 *  - `wlaczony` osobno od samego wpisu — umowa może wygasnąć albo zostać
 *    zawieszona, a wtedy wygodniej przestawić jedną wartość niż usuwać
 *    i odtwarzać dane partnera,
 *  - `oznaczenie` z wartością domyślną „Partner Szlaki Pienin" — treść
 *    sponsorowana musi być oznaczona, więc etykieta jest częścią modelu,
 *    a nie ozdobą po stronie widoku, którą da się przez przypadek pominąć.
 */
export type PartnerKategorii = {
  /** Slug atrakcji, która ma zostać wyróżniona. */
  atrakcja: string
  wlaczony: boolean
  /** Widoczne oznaczenie treści opłaconej. */
  oznaczenie: string
  /** Dokąd prowadzi przycisk w karcie partnera. */
  adresOferty?: string
}

export const PARTNERZY_KATEGORII: Record<KategoriaAtrakcji, PartnerKategorii | null> = {
  przyroda: null,
  woda: null,
  aktywnie: null,
  rodziny: null,
  kultura: null,
  zima: null,
}

/**
 * Strony atrakcji, na których wisi zaproszenie dla przyszłego partnera.
 *
 * Nie na stronie katalogu, tylko na wybranych stronach pojedynczych atrakcji —
 * lista atrakcji ma zostać wolna od ogłoszeń. Kto wchodzi na `/atrakcje`, szuka
 * pomysłu na dzień; ogłoszenie w tym miejscu przeszkadza wszystkim, żeby
 * dotrzeć do jednej osoby.
 *
 * Na stronie konkretnej atrakcji jest inaczej: ktoś, kto czyta o raftingu,
 * może akurat prowadzić firmę raftingową. Ogłoszenie trafia więc bliżej
 * właściwego czytelnika i nie zaśmieca drogi pozostałym.
 *
 * Rozszerza się dopisaniem slugu.
 */
export const ZAPROSZENIA_NA_STRONACH: readonly string[] = ['rafting-na-dunajcu']

export function partnerKategorii(kategoria: KategoriaAtrakcji): PartnerKategorii | null {
  const wpis = PARTNERZY_KATEGORII[kategoria]
  return wpis?.wlaczony ? wpis : null
}
