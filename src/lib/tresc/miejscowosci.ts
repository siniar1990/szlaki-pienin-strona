import type { LokalizacjaAtrakcji } from './kategorie-atrakcji'

/**
 * Miejscowości Pienin.
 *
 * **Po co osobne strony.** Ktoś, kto szuka „co robić w Krościenku", trafiał
 * dotąd na listę pięćdziesięciu czterech tras z całych Pienin i musiał sam
 * zgadnąć, które są jego. Miejscowość jest naturalną jednostką planowania —
 * ludzie nie mieszkają w paśmie górskim, tylko w konkretnej wsi z konkretnym
 * parkingiem.
 *
 * **Dlaczego trzy, a nie sześć.** Bo tyle unosi treść. Sromowce mają w tym
 * portalu jedną atrakcję i zero tras zaczynających się na miejscu; osobna
 * strona byłaby pustym folderem udającym przewodnik. Grupujemy więc wokół
 * tego, co rzeczywiście łączy: Szczawnica ze Szlachtową i Jaworkami tworzy
 * jedną gminę, a Czorsztyn, Kluszkowce, Niedzica i Sromowce leżą wokół
 * jednego jeziora i jednego przełomu. Podział administracyjny byłby tu gorszą
 * podpowiedzią niż geografia — Niedzica leży w innej gminie niż Czorsztyn,
 * ale patrzą na siebie przez wodę.
 *
 * **Ten rejestr nie powiela danych.** Wskazuje na to, co już stoi w katalogu
 * atrakcji i w danych aplikacji; strona sama zbiera trasy i atrakcje po tych
 * kluczach. Przepisanie ich tutaj oznaczałoby, że przy pierwszej nowej trasie
 * strona miejscowości zaczyna kłamać.
 *
 * **Opisy powstały z faktów, które już są w portalu** — z katalogu atrakcji
 * i opisów tras. Ani jednej nowej daty, liczby czy ceny; tam, gdzie danych
 * brakuje, zdanie po prostu nie powstało.
 */

export type Miejscowosc = {
  slug: string
  /** Krótka nazwa — na kafelki i okruszki. */
  nazwa: string
  /** Pełna nazwa do tytułu strony i danych strukturalnych. */
  nazwaPelna: string
  /**
   * Nazwa w miejscowniku — do nagłówka „O Szczawnicy”.
   *
   * Wpisana wprost, bo polskiej odmiany nie da się wyprowadzić regułą:
   * Szczawnica → Szczawnicy, ale Krościenko → Krościenku, a Czorsztyn →
   * Czorsztynie. Próba doklejania końcówek dałaby „O Krościenkoy”.
   */
  wMiejscowniku: string
  /** Wsie i przysiółki objęte tą stroną, jeśli obejmuje więcej niż jedną. */
  obejmuje?: string[]
  /** Klucze z `LOKALIZACJE_ATRAKCJI` — stąd strona bierze atrakcje. */
  lokalizacje: LokalizacjaAtrakcji[]
  /** Wartości `miejscowoscStartu` z tras — stąd strona bierze szlaki. */
  nazwyTras: string[]
  /** Jedno zdanie: czym to miejsce jest. Na kafelek i do opisu strony. */
  lead: string
  /** Akapity o miejscu. */
  opis: string[]
  /** Jak tu dojechać i gdzie zostawić samochód. */
  dojazd: string[]
  /**
   * Slug atrakcji, której zdjęcie posłuży za nagłówek, dopóki miejscowość nie
   * dostanie własnego. Podmiana to wgranie pliku — patrz `zdjecia-miejscowosci`.
   */
  zdjecieZastepcze: string
}

export const MIEJSCOWOSCI: Miejscowosc[] = [
  {
    slug: 'szczawnica',
    wMiejscowniku: 'Szczawnicy',
    nazwa: 'Szczawnica',
    nazwaPelna: 'Szczawnica',
    obejmuje: ['Szlachtowa', 'Jaworki', 'Czarna Woda'],
    lokalizacje: ['szczawnica', 'szlachtowa', 'jaworki'],
    nazwyTras: ['Szczawnica', 'Szlachtowa', 'Jaworki'],
    lead:
      'Uzdrowisko u zbiegu Grajcarka i Dunajca, z którego wychodzi większość ' +
      'pienińskich szlaków — i najbliżej stąd do Wąwozu Homole.',
    opis: [
      'Szczawnica jest w Pieninach miejscem, z którego się wyrusza. Leży u zbiegu ' +
        'Grajcarka i Dunajca, między Pieninami Właściwymi a Małymi Pieninami, i to ' +
        'stąd zaczyna się większość opisanych w tym przewodniku tras — od ' +
        'kilkugodzinnych wyjść na Palenicę po całodniowe grzbietowe wyprawy Pasmem ' +
        'Radziejowej.',
      'Drugie życie miasta to uzdrowisko. Plac Dietla z drewnianymi willami, gankami ' +
        'i godłami nad wejściami jest sercem dawnego kurortu, a sześć wód leczniczych ' +
        'można wypić pod jednym dachem w odbudowanym „Domu nad Zdrojami”. Dwieście lat ' +
        'tej historii mieści się w trzech wystawach Muzeum Uzdrowiska w willi „Pałac”.',
      'Do miasta należą też Szlachtowa i Jaworki — dawne wsie Rusi Szlachtowskiej. ' +
        'Zostały po niej dwie cerkwie bez wiernych, dla których je zbudowano, i to ' +
        'jest najkrótsza możliwa opowieść o tym, co się tu wydarzyło. Wyżej, za ' +
        'Jaworkami, otwierają się Wąwóz Homole i rezerwat Biała Woda — osiemset metrów ' +
        'wapiennej szczeliny ze ścianami do stu dwudziestu metrów i dolina skałek nad ' +
        'potokiem, którym szło się do wsi, której już nie ma.',
    ],
    dojazd: [
      'Drogą wojewódzką 969 z Nowego Targu przez Krościenko albo z Nowego Sącza ' +
        'przez Łącko. Z Krakowa około dwóch i pół godziny.',
      'Parkingi przy placu Dietla, przy dolnej stacji kolei na Palenicę i przy ' +
        'przystani flisackiej. W szczycie sezonu najszybciej zapełniają się te ' +
        'przy wjazdach do Wąwozu Homole i Białej Wody.',
      'Bus z Krościenka kursuje regularnie; z Nowego Targu i Nowego Sącza dojeżdżają ' +
        'busy prywatnych przewoźników.',
    ],
    zdjecieZastepcze: 'plac-dietla-i-architektura-szalayowska',
  },
  {
    slug: 'kroscienko',
    wMiejscowniku: 'Krościenku',
    nazwa: 'Krościenko',
    nazwaPelna: 'Krościenko nad Dunajcem',
    lokalizacje: ['kroscienko'],
    nazwyTras: ['Krościenko nad Dunajcem'],
    lead:
      'Brama Trzech Koron i najkrótsze dojście na główną grań Pienin, ' +
      'z gotyckim kościołem i malowidłami z czterech stuleci przy rynku.',
    opis: [
      'Krościenko leży dokładnie tam, gdzie Dunajec wchodzi w Pieniny, i z tego ' +
        'położenia bierze się cała jego rola: to stąd prowadzi najkrótsze dojście na ' +
        'Trzy Korony i na główną grań. Kto ma jeden dzień i chce zobaczyć to, po co ' +
        'przyjeżdża się w Pieniny, zaczyna zwykle tutaj.',
      'Przy rynku stoi kościół Wszystkich Świętych — gotyk z pierwszej połowy ' +
        'czternastego wieku, z malowidłami z czterech stuleci i chrzcielnicą z orłem ' +
        'jagiellońskim. To najstarsza rzecz, jaką da się w Pieninach zobaczyć bez ' +
        'wychodzenia w góry.',
      'Dla rodzin z dziećmi Krościenko ma park linowy: sześć tras, zjazd tyrolski nad ' +
        'parkiem i całoroczny Ninja Park, od trzylatka po dorosłych. Wystarcza na ' +
        'popołudnie, gdy pogoda nie pozwala na grań.',
    ],
    dojazd: [
      'Skrzyżowanie dróg 969 i 969a — z Nowego Targu, ze Szczawnicy i znad Jeziora ' +
        'Czorsztyńskiego. Z Krakowa około dwóch godzin i piętnastu minut.',
      'Parkingi w centrum i przy wejściach na szlaki do Trzech Koron. Ten pod ' +
        'Sokolicą zapełnia się w weekendy przed dziewiątą.',
      'Busy do Szczawnicy, Nowego Targu i Nowego Sącza kursują z centrum.',
    ],
    zdjecieZastepcze: 'kosciol-wszystkich-swietych-w-kroscienku',
  },
  {
    slug: 'czorsztyn-niedzica',
    wMiejscowniku: 'Czorsztynie i Niedzicy',
    nazwa: 'Czorsztyn i Niedzica',
    nazwaPelna: 'Czorsztyn, Niedzica i okolice Jeziora Czorsztyńskiego',
    obejmuje: ['Czorsztyn', 'Niedzica', 'Kluszkowce', 'Sromowce Wyżne', 'Sromowce Niżne'],
    lokalizacje: ['czorsztyn', 'niedzica', 'kluszkowce', 'sromowce'],
    nazwyTras: ['Czorsztyn', 'Niedzica', 'Sromowce'],
    lead:
      'Dwa zamki patrzące na siebie przez wodę, zapora na Dunajcu ' +
      'i przystanie, z których wypływają tratwy flisackie.',
    opis: [
      'Zachodni kraniec Pienin ma układ, którego nie da się pomylić z niczym innym: ' +
        'dwa zamki po dwóch stronach wody. Ruiny Czorsztyna — królewskiej warowni ' +
        'z tarasami widokowymi na Tatry — i naprzeciw nich Zamek Dunajec w Niedzicy, ' +
        'najlepiej zachowany zamek nad tą rzeką, z muzeum, wozownią i spichlerzem.',
      'Wodę między nimi stworzyła zapora w Niedzicy. Jej korona jest dostępna bez ' +
        'biletu, a pod nią działa elektrownia z tunelem pięćdziesiąt metrów pod ' +
        'powierzchnią. Samo Jezioro Czorsztyńskie to rejsy statkiem, plaże, żagle ' +
        'i ścieżka rowerowa dookoła.',
      'Z przystani w Sromowcach wypływają tratwy flisackie w przełom Dunajca — ' +
        'najbardziej rozpoznawalna atrakcja Pienin, prowadzona przez flisaków, a nie ' +
        'przez silnik. Zimą narciarze jadą do Kluszkowiec, na stok Czorsztyn-Ski ' +
        'z widokiem na jezioro i Tatry.',
    ],
    dojazd: [
      'Droga 969 z Nowego Targu przez Dębno i Maniowy albo od strony Krościenka. ' +
        'Do Niedzicy zjazd na Frydman i dalej wzdłuż jeziora.',
      'Parkingi pod zamkiem w Niedzicy, przy zaporze, pod ruinami w Czorsztynie ' +
        'oraz przy przystaniach flisackich w Sromowcach Wyżnych-Kątach ' +
        'i w Sromowcach Niżnych.',
      'Między brzegami jeziora kursuje statek — bywa szybszy niż objazd samochodem ' +
        'przez zaporę.',
    ],
    zdjecieZastepcze: 'zamek-dunajec-w-niedzicy',
  },
]

export function znajdzMiejscowosc(slug: string): Miejscowosc | null {
  return MIEJSCOWOSCI.find((m) => m.slug === slug) ?? null
}

/**
 * Czy trasa zaczyna się w tej miejscowości.
 *
 * Dopasowanie po nazwie, a nie po współrzędnych, bo `miejscowoscStartu`
 * powstaje w warstwie danych z punktów trasy i jest już wtedy sprowadzone do
 * kilku ustalonych nazw. Drugie rozpoznawanie tego samego, tylko inną metodą,
 * rozjechałoby się z pierwszym przy pierwszej nowej trasie.
 */
export function trasaZMiejscowosci(miejscowosc: Miejscowosc, miejscowoscStartu: string): boolean {
  return miejscowosc.nazwyTras.includes(miejscowoscStartu)
}
