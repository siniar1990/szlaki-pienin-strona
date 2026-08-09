import { nazwaLokalizacji } from './kategorie-atrakcji'

/**
 * Dopuszczalne ikony w przewodniku.
 *
 * Zamknięty zbiór, a nie dowolny napis: komponent mapuje te klucze na
 * konkretne ikony, a literówka w nazwie dałaby pustą dziurę w układzie
 * zamiast błędu przy budowaniu.
 */
export type KluczIkony =
  | 'ryba'
  | 'zasady'
  | 'mapa'
  | 'sprzet'
  | 'dziecko'
  | 'zezwolenie'
  | 'sezon'
  | 'trasa'
  | 'adrenalina'
  | 'woda'
import type { KategoriaAtrakcji, LokalizacjaAtrakcji } from './kategorie-atrakcji'

/**
 * Katalog atrakcji Pienin.
 *
 * **Kategoria zamiast grupy.** Wcześniej każda atrakcja należała do dokładnie
 * jednej grupy, co wymuszało wybory bez dobrej odpowiedzi: kolej na Palenicę
 * jest i rodzinna, i sportowa, a kuligi są zimowe i aktywne naraz. Teraz
 * `kategorie` to lista — jedna atrakcja, wiele przynależności, ani jednego
 * duplikatu. To jest ta sama zasada, którą stosuje aplikacja przy trasach
 * (`kategorie_dodatkowe`), więc portal i telefon dzielą sposób myślenia.
 *
 * **Lokalizacja osobno od kategorii.** Miejscowość jest atrybutem, nie
 * szufladą. Turysta pyta najpierw „co mogę robić", a dopiero potem „gdzie" —
 * i tak samo działa filtrowanie na stronie.
 *
 * **Pola bez treści zostają puste.** Sporo pozycji z katalogu to miejsca,
 * o których projekt nie ma jeszcze ani zdania opisu, ani zdjęcia, ani
 * współrzędnych — wypożyczalnie rowerów, paintball, plaże, warsztaty.
 * Zostawiamy je puste zamiast dopisywać prawdopodobnie brzmiące zdania.
 * Karta bez opisu jest uczciwa; karta z wymyślonym opisem jest kłamstwem,
 * które ktoś zweryfikuje dopiero na miejscu.
 *
 * **Pola partnerskie są przygotowane, ale nieużywane.** `sponsorowana`,
 * `partnerKategorii` i `priorytetPartnera` czekają na model, w którym jedna
 * firma wykupuje wyróżnienie w kategorii. Dziś wszystkie są puste i nic ich
 * nie czyta poza typami — chodzi o to, żeby włączenie tego nie wymagało
 * przebudowy katalogu.
 */

export type AtrakcjaTurystyczna = {
  slug: string
  nazwa: string
  /** Do której kategorii trafia; pierwsza jest wiodąca (badge na karcie). */
  kategorie: KategoriaAtrakcji[]
  /** Węższy rodzaj wewnątrz kategorii — pod przyszłe kategorie komercyjne. */
  podkategoria: string | null
  lokalizacja: LokalizacjaAtrakcji
  /** Doprecyzowanie miejsca, gdy sama miejscowość to za mało. */
  miejscowosc?: string
  /** Jedno zdanie na kartę. Puste, gdy projekt nie ma opisu. */
  skrot: string
  /** Pełny opis na stronę atrakcji. Pusta lista = brak treści. */
  opis: string[]
  /**
   * Praktyczny przewodnik w punktach, z ikoną przy każdym.
   *
   * Dla atrakcji, przy których sam opis nie wystarcza, bo trzeba coś wiedzieć
   * przed wyjściem z domu: gdzie wolno, czego potrzeba, na co uważać. Akapity
   * nadają się do opowiadania, ale kto szuka jednej konkretnej informacji,
   * przebiega wzrokiem po ikonach, a nie czyta czterech akapitów.
   *
   * Pole opcjonalne i rzadkie — nie każda atrakcja go potrzebuje i nie każdą
   * warto rozdmuchiwać do rozmiarów poradnika.
   */
  przewodnik?: { ikona: KluczIkony; tytul: string; tekst: string }[]
  /**
   * Trasy z aplikacji, które prowadzą przez to miejsce — po identyfikatorze
   * (`5D`, `SZMARAGD`). Nie przepisujemy tu nazw ani długości: strona pobiera
   * je z danych aplikacji, więc po korekcie trasy w telefonie zmieniają się
   * same, a niedopasowanie jest niemożliwe.
   */
  trasy?: string[]
  sezon?: string
  /** Wymaga potwierdzenia na miejscu — szczegóły bywają zmienne. */
  doPotwierdzenia?: boolean
  /** Wyróżniona w swojej kategorii — trafia do sekcji „Najważniejsze”. */
  wyrozniona?: boolean

  /* ── Pola czekające na treść ──────────────────────────────────────────── */
  wspolrzedne?: [number, number]
  strona?: string
  rezerwacja?: string
  cena?: string
  godziny?: string

  /* ── Pola pod przyszłego partnera kategorii ───────────────────────────── */
  sponsorowana?: boolean
  partnerKategorii?: KategoriaAtrakcji
  priorytetPartnera?: number
}

export const ATRAKCJE_TURYSTYCZNE: AtrakcjaTurystyczna[] = [

  {
    slug: 'splyw-dunajcem-tratwami',
    nazwa: 'Spływ Dunajcem tratwami flisackimi',
    kategorie: ['woda'],
    podkategoria: 'splywy',
    lokalizacja: 'sromowce',
    miejscowosc: 'Sromowce — Szczawnica lub Krościenko',
    wyrozniona: true,
    trasy: ['DP'],
    skrot: 'Przełom Dunajca z pokładu tratwy prowadzonej przez flisaka. Dwie przystanie startowe i dwie mety do wyboru.',
    opis: [
      'Najbardziej znana atrakcja Pienin i jedyny sposób, żeby zobaczyć przełom ' +
        'Dunajca od strony wody — płynie się pod ścianami Trzech Koron ' +
        'i Sokolicy.',
      'Spływ zaczyna się na jednej z dwóch przystani: w Sromowcach Wyżnych — ' +
        'Kątach albo w Sromowcach Niżnych. Kąty leżą wyżej rzeki, więc ta trasa ' +
        'jest dłuższa; ze Sromowiec Niżnych płynie się krócej. Bilety kupuje ' +
        'się w kasach na obu przystaniach.',
      'Mety też są dwie: w Szczawnicy, przy przystani z ozdobną drewnianą ' +
        'bramą, albo dalej w dół rzeki — w Krościenku nad Dunajcem. Kombinacja ' +
        'przystani startowej i mety decyduje o tym, jak długo się płynie; ' +
        'przewoźnik podaje warianty przy kasie.',
      'Tradycja flisacka na Dunajcu sięga XIX wieku i jest przekazywana ' +
        'w pienińskich rodzinach z pokolenia na pokolenie. Flisak steruje ' +
        'tratwą i po drodze opowiada o mijanych skałach i legendach.',
      'Powrót do samochodu zostawionego przy przystani startowej organizują ' +
        'przewoźnicy busami; można też wrócić rowerem ścieżką wzdłuż rzeki.',
    ],
    sezon: 'od wiosny do jesieni, zależnie od stanu wody',
  },
  {
    slug: 'jezioro-czorsztynskie-rejsy',
    nazwa: 'Jezioro Czorsztyńskie i rejsy statkiem',
    kategorie: ['woda', 'rodziny'],
    podkategoria: 'rejsy',
    lokalizacja: 'czorsztyn',
    wyrozniona: true,
    skrot: 'Sztuczne jezioro między dwoma zamkami — rejsy, plaże, żagle i ścieżka dookoła.',
    opis: [
      'Zbiornik powstał po spiętrzeniu Dunajca zaporą w Niedzicy. Nad jego ' +
        'taflą stoją naprzeciw siebie dwa zamki: ruiny Czorsztyna po północnej ' +
        'stronie i zamek Dunajec w Niedzicy po południowej — widok, którego ' +
        'nie było tu przed zalaniem doliny.',
      'Po jeziorze kursują statki i mniejsze jednostki, łączące przystanie po ' +
        'obu stronach. To najwygodniejszy sposób, żeby zobaczyć oba zamki ' +
        'jednego dnia bez objeżdżania jeziora samochodem, a przy okazji jedyny, ' +
        'z którego widać je oba naraz z wody.',
      'Poza rejsami jezioro żyje sportami. Wieje tu na tyle regularnie, że ' +
        'zbiornik ma swoje miejsce na mapie windsurferów; pod żagle wypływają ' +
        'też jachty, a bliżej brzegu jeżdżą deski z wiosłem, kajaki i rowery ' +
        'wodne. Wypożyczalnie działają przy przystaniach w sezonie.',
      'Brzegi są łagodne i miejscami przygotowane do kąpieli — z plażami, ' +
        'trawą i miejscem na koc. Dookoła jeziora biegnie ścieżka rowerowa, ' +
        'więc da się je objechać w jeden dzień, zaglądając po drodze do obu ' +
        'zamków i pod zaporę.',
    ],
    sezon: 'sezon letni',
    doPotwierdzenia: true,
  },
  {
    slug: 'zapora-w-niedzicy',
    nazwa: 'Zapora i elektrownia w Niedzicy',
    kategorie: ['kultura', 'woda'],
    podkategoria: 'technika',
    lokalizacja: 'niedzica',
    wyrozniona: true,
    skrot: 'Korona zapory dostępna bez biletu, a pod nią elektrownia i tunel pięćdziesiąt metrów pod wodą.',
    opis: [
      'Zapora spiętrzająca Dunajec, która utworzyła Jezioro Czorsztyńskie. ' +
        'Koroną prowadzi przejście — z jednej strony rozciąga się widok na taflę ' +
        'jeziora i zamki, z drugiej na dolinę Dunajca i Pieniny.',
      'Po koronie można spacerować bezpłatnie, bez ograniczeń i o każdej porze. ' +
        'Sama zapora jest więc atrakcją, po którą nie trzeba niczego planować ' +
        'ani kupować — wystarczy przyjść.',
      'Wnętrze to osobna historia i wymaga przewodnika. Do zwiedzania udostępniono ' +
        'pomieszczenia technologiczne elektrowni wraz z urządzeniami do produkcji ' +
        'prądu oraz podziemny tunel — galerię kontrolną zapory głównej, ' +
        'poprowadzoną w skale około pięćdziesięciu metrów pod wodą i nasypem.',
      'Trasy są dwie. „Ogólne zwiedzanie elektrowni" obejmuje małą galerię pod ' +
        'przelewem stokowym, wewnętrzny balkon widokowy oraz dwa poziomy ' +
        'technologiczne: halę maszyn i poziom pokrywy turbiny — zajmuje około ' +
        'godziny. „Szczegółowe zwiedzanie elektrowni i zapory" dokłada do tego ' +
        'przejście galerią kontrolno-pomiarową zapory głównej z wejściem na ' +
        'koronę i trwa około dwóch godzin.',
    ],
    cena: 'Korona zapory bezpłatnie. Zwiedzanie z przewodnikiem 22 zł od osoby albo 220–480 zł za grupę, zależnie od liczebności.',
  },
  {
    slug: 'pijalnia-wod-mineralnych',
    nazwa: 'Pijalnia wód mineralnych',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    skrot: 'Sześć wód leczniczych pod jednym dachem, w odbudowanym „Domu nad Zdrojami”.',
    opis: [
      'Szczawnica wzięła nazwę od szczaw — wód mineralnych nasyconych dwutlenkiem ' +
        'węgla, wypływających w dolinie Grajcarka. To dla nich Józef Szalay ' +
        'zbudował w XIX wieku uzdrowisko, które do dziś wyznacza charakter miasta.',
      'Pijalnia stoi we wschodniej części Placu Dietla, w „Domu nad Zdrojami” — ' +
        'budynku wzniesionym przez Józefa Stefana Szalaya w 1863 roku. Dom spłonął ' +
        'w 2002 roku i został odbudowany przez rodzinę Mańkowskich; ponownie ' +
        'otwarto go w 2008 roku. Na piętrze mieści się Galeria Pijalni Wód ' +
        'Mineralnych.',
      'Nalewa się tu wody z sześciu ujęć i różnią się one bardziej, niż można się ' +
        'spodziewać: od lekkiej, żelazistej Heleny po Józefa, w którym mineralizacja ' +
        'jest sześć razy wyższa. Wodę pije się powoli, małymi łykami, spacerując — ' +
        'tak robiono to tutaj od XIX wieku i tak robi się nadal.',
      'To jedna z niewielu atrakcji w Pieninach, która nie zależy od pogody. ' +
        'Godzin otwarcia ani opłat nie podajemy — uzdrowisko nie publikuje ich na ' +
        'stałe, więc lepiej sprawdzić na miejscu albo zadzwonić.',
    ],
    przewodnik: [
      {
        ikona: 'woda',
        tytul: 'Helena — najlżejsza',
        tekst:
          'Mineralizacja około 1,8 g/l, z żelazem. Podawana przy dolegliwościach ' +
          'układu oddechowego i reumatycznych. Dobra na początek, jeśli mocne wody ' +
          'nie leżą Ci w smaku.',
      },
      {
        ikona: 'woda',
        tytul: 'Jan',
        tekst:
          'Około 4,6 g/l, z jodem. Znana od 1869 roku, nazwana po Janie Zielonce, ' +
          'zarządcy zakładu zdrojowego. Kierowana do układu moczowego.',
      },
      {
        ikona: 'woda',
        tytul: 'Stefan',
        tekst:
          'Około 4,8 g/l, z wapniem. Odkryta w 1828 roku, imię po Stefanie Szalayu. ' +
          'Polecana przy dolegliwościach dróg oddechowych i alergiach.',
      },
      {
        ikona: 'woda',
        tytul: 'Józefina — najstarsza',
        tekst:
          'Najstarsze ujęcie uzdrowiska, około 5,9 g/l, z jodem. Imię po Józefinie ' +
          'Szalayowej. Stosowana przy nieżytach gardła i nosa oraz w profilaktyce astmy.',
      },
      {
        ikona: 'woda',
        tytul: 'Józef — najmocniejsza w pijalni',
        tekst:
          'Ponad 11 g/l — dwa razy więcej niż Józefina. Ujęta w 1986 roku, nazwana ' +
          'po budowniczym uzdrowiska. Kierowana do układu pokarmowego.',
      },
      {
        ikona: 'woda',
        tytul: 'Magdalena — rekordzistka',
        tekst:
          'Odkryta w 1839 roku, mineralizacja rzędu 27 g/l i wysoka zawartość jodu. ' +
          'Najsilniej zmineralizowana woda Szczawnicy — pije się ją w małych ilościach.',
      },
    ],
  },
  {
    slug: 'zdroje-szczawnicy',
    nazwa: 'Zdroje Szczawnicy',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    trasy: ['5A'],
    skrot: 'Dziewięć nazwanych ujęć wód mineralnych — trzy z nich ogólnodostępne i darmowe.',
    opis: [
      'Wody Szczawnicy biorą się z geologii: masyw Bryjarki zbudowany jest ' +
        'z andezytów, skał pochodzenia wulkanicznego, i to one odpowiadają za ' +
        'nasycenie wód dwutlenkiem węgla. Stąd przydomek „góra wód” i stąd całe ' +
        'uzdrowisko.',
      'Każde ujęcie ma imię, a imiona pochodzą najczęściej od rodziny Szalayów ' +
        'i ludzi uzdrowiska: Józefina, Stefan, Józef, Jan. Wody różnią się ' +
        'zasadniczo — od Heleny z mineralizacją poniżej 2 g/l po Magdalenę ' +
        'z 27 g/l, jedną z najbardziej zmineralizowanych wód w Polsce.',
      'Sześć wód nalewa się w Pijalni na Placu Dietla, za opłatą. Trzy — Szymon, ' +
        'Wanda i Pitoniakówka — są ogólnodostępne i darmowe: przy wejściu na kolej ' +
        'na Palenicę, w Parku Dolnym powyżej kapliczki oraz przy ulicy Skotnickiej. ' +
        'Wystarczy przyjść z butelką.',
      'Obejście zdrojów to dobry pomysł na dzień, w którym w górach wisi mgła — ' +
        'wszystko mieści się w granicach uzdrowiska i idzie się po płaskim.',
    ],
    przewodnik: [
      {
        ikona: 'woda',
        tytul: 'Pitoniakówka — ogólnodostępna',
        tekst:
          'Odkryta w latach 30. XX wieku, gdy wójtem Szczawnicy Niżnej był Jan ' +
          'Pitoniak. Odwiert Józefina II z 1952 roku, ponownie ujęty w 1968. ' +
          'Szczawa wodorowęglanowo-chlorkowo-sodowa z rekordową zawartością ' +
          'dwutlenku węgla — 2290 mg/l przy wydajności 21 l/min. Przy ulicy ' +
          'Skotnickiej, latem ogólnie dostępna.',
      },
      {
        ikona: 'woda',
        tytul: 'Szymon — najwydajniejszy',
        tekst:
          'Odkryty w połowie XIX wieku, mineralizacja około 3 g/l. Najwydajniejsze ' +
          'źródło uzdrowiska — dawniej zasilało kąpiele w dolnym zakładzie ' +
          'zdrojowym. Dziś ogólnodostępne.',
      },
      {
        ikona: 'woda',
        tytul: 'Wanda — w Parku Dolnym',
        tekst:
          'Znana od lat 60. XIX wieku. Podawana przy nieżytach żołądka i jelit ' +
          'oraz skazie moczanowej. Ujęcie w Parku Dolnym, ogólnodostępne.',
      },
      {
        ikona: 'woda',
        tytul: 'Helena',
        tekst:
          'Odwiert w Parku Dolnym, znany od 1966 roku. Najlżejsza z wód — około ' +
          '1,8 g/l, z żelazem. Nalewana w pijalni.',
      },
      {
        ikona: 'woda',
        tytul: 'Józefina, Stefan, Józef',
        tekst:
          'Trzy ujęcia z pijalni, nazwane po rodzinie Szalayów. Józefina jest ' +
          'najstarsza, Stefan pochodzi z 1828 roku, Józef — z 1986 i ma ponad ' +
          '11 g/l mineralizacji.',
      },
      {
        ikona: 'woda',
        tytul: 'Magdalena i Jan',
        tekst:
          'Magdalena (1839) to rekord mineralizacji — 27 g/l. Jan (1869) był ' +
          'kiedyś podstawą butelkowanej „Szczawniczanki”. Obie dostępne w pijalni.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'kolej-na-palenice',
    nazwa: 'Kolej krzesełkowa na Palenicę',
    kategorie: ['rodziny', 'aktywnie'],
    podkategoria: 'wyciagi',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    trasy: ['7D', 'KP23'],
    skrot: 'Wyjazd nad Szczawnicę w kilka minut — i początek kilku szlaków.',
    opis: [
      'Kolej wywozi z centrum uzdrowiska na Palenicę (722 m n.p.m.). Z góry ' +
        'rozciąga się widok na Szczawnicę, dolinę Dunajca i pienińskie grzbiety, ' +
        'a przy dobrej widoczności także na Tatry.',
      'Dla większości to najprostszy sposób, żeby wejść wysoko bez podejścia — ' +
        'ale kolej jest też początkiem dłuższego dnia. Ze szczytu prowadzą ' +
        'szlaki na Szafranówkę, Wysoki Wierch i dalej grzbietem Małych Pienin ' +
        'ku Wąwozowi Homole. Można też zjechać na dół pieszo, w niecałą godzinę.',
      'Bilety są w dwóch wariantach: w jedną stronę, gdy planuje się zejście ' +
        'pieszo, albo góra–dół. Przy kasach automatycznych płaci się kilka ' +
        'złotych więcej niż w sklepie internetowym, więc jeśli data jest pewna, ' +
        'warto kupić z wyprzedzeniem. Są też bilety rodzinne, dla dwojga ' +
        'dorosłych z jednym albo dwojgiem dzieci.',
      'Kolej działa przez cały rok, ale godziny zmieniają się z porą roku — ' +
        'zimą zamyka się wcześnie, latem jeździ do wieczora. Przed wyjazdem ' +
        'w konkretny dzień warto zerknąć na aktualny rozkład.',
    ],
    cena: 'Bilet normalny góra–dół od 32 do 39 zł, w jedną stronę od 25 do 32 zł — taniej w sklepie internetowym niż w kasie i taniej poza szczytem sezonu. Ulgowy (dzieci od 5 lat, młodzież, seniorzy) o kilka złotych mniej, bilety rodzinne od 79 zł.',
    doPotwierdzenia: true,
  },
  {
    slug: 'zjezdzalnia-grawitacyjna-palenica',
    nazwa: 'Zjeżdżalnia grawitacyjna na Palenicy',
    kategorie: ['rodziny'],
    podkategoria: 'rozrywka',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    skrot: 'Serpentyny na stoku Palenicy, wózki do 23 km/h — od 12 zł za przejazd.',
    opis: [
      'Tor grawitacyjny biegnący serpentynami po stoku Palenicy. Wózki rozpędzają ' +
        'się do dwudziestu trzech kilometrów na godzinę, a jedzie się na szynie, ' +
        'samodzielnie regulując prędkość dźwignią hamulca — więc zjazd da się ' +
        'dopasować i do dziecka, i do amatora mocnych wrażeń.',
      'Trasa prowadzi otwartym stokiem z panoramą doliny, co odróżnia ją od ' +
        'zjeżdżalni schowanych w lesie: widok jest częścią atrakcji, a nie tłem.',
      'Bilety liczy się na przejazdy, nie na czas, i opłata jest od osoby — także ' +
        'wtedy, gdy dziecko jedzie z opiekunem na jednym wózku. Im więcej ' +
        'przejazdów w pakiecie, tym taniej wychodzi jeden.',
      'Zjeżdżalnia działa od połowy kwietnia do końca listopada i tylko przy ' +
        'dobrej pogodzie — po deszczu bywa zamknięta, więc przy niepewnej aurze ' +
        'warto mieć plan zapasowy.',
    ],
    przewodnik: [
      {
        ikona: 'dziecko',
        tytul: 'Z dzieckiem',
        tekst:
          'Dzieci zjeżdżają pod opieką dorosłego i ze względów bezpieczeństwa ' +
          'zawsze siadają z przodu, przed opiekunem. Dzieci do 4 lat jadą ' +
          'bezpłatnie na bilecie opiekuna — wiek trzeba potwierdzić dokumentem. ' +
          'Dzieci w wieku 4–8 lat: bilet dziecka plus bilet opiekuna.',
      },
      {
        ikona: 'sezon',
        tytul: 'Kiedy czynna',
        tekst:
          'Od połowy kwietnia do końca listopada, wyłącznie przy dobrych warunkach ' +
          'pogodowych. Rozkład bywa zmieniany w trakcie sezonu — przed wyjazdem ' +
          'w konkretny dzień lepiej sprawdzić aktualny.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Bilety',
        tekst:
          'Jeden przejazd 12 zł, pakiet pięciu 45 zł, pakiet dziesięciu 65 zł. ' +
          'Opłata od osoby. Ceny orientacyjne — cennik operatora nie jest ofertą ' +
          'handlową i bywa aktualizowany.',
      },
      {
        ikona: 'trasa',
        tytul: 'Razem z koleją',
        tekst:
          'Zjeżdżalnia stoi obok dolnej stacji kolei na Palenicę, więc naturalnie ' +
          'domyka wyjazd na górę. Bilety na kolej kupuje się osobno.',
      },
    ],
    cena: 'Jeden przejazd 12 zł, pięć przejazdów 45 zł, dziesięć przejazdów 65 zł — od osoby. Dzieci do 4 lat bezpłatnie na bilecie opiekuna.',
    sezon: 'Od połowy kwietnia do końca listopada, tylko przy dobrej pogodzie.',
  },
  {
    slug: 'czorsztyn-ski-kluszkowce',
    nazwa: 'Czorsztyn-Ski w Kluszkowcach',
    kategorie: ['zima', 'rodziny'],
    podkategoria: 'narty',
    lokalizacja: 'kluszkowce',
    wyrozniona: true,
    skrot: 'Stok nad Jeziorem Czorsztyńskim — zimą trasy niebieskie i czerwona, latem tor saneczkowy.',
    opis: [
      'Ośrodek leży na stoku góry Wdżar nad Jeziorem Czorsztyńskim. Ma trzy ' +
        'urządzenia: kolej krzesełkową i wyciągi orczykowe, którymi na górę ' +
        'wjeżdża się w pięć minut. Trasy niebieskie są dla początkujących ' +
        'i uczących się, czerwona — dla tych, którzy już jeżdżą; wyznaczono też ' +
        'strefy dla snowboardzistów.',
      'Wszystkie trasy mają naśnieżanie i oświetlenie, więc sezon nie zależy ' +
        'wyłącznie od pogody, a jeździć można również po zmroku. To rzadkość ' +
        'w tak małym ośrodku i główny powód, dla którego Czorsztyn-Ski działa ' +
        'wtedy, gdy sąsiednie stoki stoją.',
      'Poza zimą ośrodek nie zamyka się na klucz. Latem działa tor saneczkowy, ' +
        'a kolej krzesełkowa wozi na górę dla samego widoku — z Wdżaru widać ' +
        'jednocześnie taflę jeziora, oba zamki i pasmo Pienin. Poza wakacjami ' +
        'kolej jeździ tylko w weekendy.',
      'Godziny zmieniają się w ciągu sezonu letniego: w maju i czerwcu tor ' +
        'saneczkowy czynny jest od 10:00 do 17:00, w wakacje do 18:00, ' +
        'we wrześniu znów do 17:00. Operator zastrzega, że godziny mogą ulec ' +
        'zmianie ze względu na natężenie ruchu albo warunki atmosferyczne.',
    ],
    godziny: 'Tor saneczkowy: maj–czerwiec i wrzesień 10:00–17:00, wakacje 10:00–18:00. Poza wakacjami kolej krzesełkowa czynna w weekendy.',
    doPotwierdzenia: true,
  },
  {
    slug: 'wyciag-w-jaworkach',
    nazwa: 'Wyciąg krzesełkowy w Jaworkach',
    kategorie: ['zima', 'rodziny'],
    podkategoria: 'narty',
    lokalizacja: 'jaworki',
    skrot: 'Wyjazd nad Jaworki, blisko wylotu Wąwozu Homole.',
    opis: [
      'Wyciąg wywozi na grzbiet nad Jaworkami. Blisko stąd do Wąwozu Homole ' +
        'i do szlaków w Małych Pieninach.',
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'jazda-konna',
    nazwa: 'Jazda konna',
    kategorie: ['aktywnie', 'rodziny'],
    podkategoria: 'jazda-konna',
    lokalizacja: 'pieniny',
    trasy: ['4B', '2C'],
    skrot: 'Stajnie w pienińskich dolinach — nauka jazdy, wyjazdy w teren i konie huculskie.',
    opis: [
      'W pienińskich dolinach działa kilka stajni: prowadzą naukę jazdy dla ' +
        'początkujących, wyjazdy w teren dla tych, którzy już siedzieli ' +
        'w siodle, i oprowadzanie dzieci na lonży. Wiele z nich trzyma konie ' +
        'huculskie — niewielką góralską rasę, odporną i pewną na stromiznach, ' +
        'wyhodowaną dokładnie do takiego terenu.',
      'W gminie Szczawnica polecamy stadninę Rajd w dolinie Białej Wody. ' +
        'Dojście jest samo w sobie przyjemne: z centrum Jaworek idzie się ' +
        'doliną obok pasterskich szałasów, a stadnina stoi przy drodze, ' +
        'naprzeciw Muzycznej Owczarni. Można więc połączyć jazdę z koncertem ' +
        'albo z wejściem w rezerwat Biała Woda, który zaczyna się kawałek dalej.',
      'Zimą, przy odpowiednim śniegu, część stajni zamienia bryczki na sanie ' +
        'i organizuje kuligi.',
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'przejazdzki-bryczka',
    nazwa: 'Przejażdżki bryczką',
    kategorie: ['rodziny', 'kultura'],
    podkategoria: 'bryczki',
    lokalizacja: 'szczawnica',
    miejscowosc: 'Szczawnica, ul. Zdrojowa',
    trasy: ['DP'],
    skrot: 'Uzdrowiskowa tradycja, która nie zniknęła — powozy czekają na ulicy Zdrojowej.',
    opis: [
      'Bryczka należy do szczawnickiego krajobrazu odkąd Szczawnica jest ' +
        'uzdrowiskiem. W dziewiętnastym wieku, gdy Józef Szalay budował tu ' +
        'zakład zdrojowy, powozy były po prostu środkiem transportu: woziły ' +
        'kuracjuszy z kolei, między pensjonatami i na punkty widokowe, do ' +
        'których nikt nie zamierzał iść pieszo w stroju wizytowym.',
      'Zwyczaj przetrwał zmianę epoki i dziś jest atrakcją samą w sobie. ' +
        'Woźnice w strojach góralskich czekają z powozami przy ulicy ' +
        'Zdrojowej — nie trzeba nic rezerwować, wystarczy podejść i się ' +
        'umówić.',
      'Najczęściej jeździ się promenadą wzdłuż Grajcarka i dalej Drogą ' +
        'Pienińską nad Dunajcem, tą samą, którą idą piesi i rowerzyści pod ' +
        'ścianami przełomu. Zimą, gdy spadnie dość śniegu, bryczki ustępują ' +
        'miejsca saniom.',
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'zamek-dunajec-w-niedzicy',
    nazwa: 'Zamek Dunajec w Niedzicy',
    kategorie: ['kultura'],
    podkategoria: 'zamki',
    lokalizacja: 'niedzica',
    wyrozniona: true,
    skrot: 'Najlepiej zachowany zamek nad Dunajcem, z muzeum i widokiem na jezioro.',
    opis: [
      'Zamek na skale nad Jeziorem Czorsztyńskim, zbudowany na początku XIV wieku ' +
        'jako warownia strzegąca granicy węgierskiej. Zachował się w bardzo dobrym ' +
        'stanie i mieści muzeum wnętrz.',
      'Z dziedzińców i tarasów widać taflę jeziora i ruiny Czorsztyna po drugiej ' +
        'stronie. Zamek obrósł legendami — najbardziej znana mówi o inkaskim ' +
        'skarbie ukrytym w jego murach.',
    ],
  },
  {
    slug: 'ruiny-zamku-czorsztyn',
    nazwa: 'Ruiny zamku Czorsztyn',
    kategorie: ['kultura'],
    podkategoria: 'zamki',
    lokalizacja: 'czorsztyn',
    wyrozniona: true,
    skrot: 'Królewska warownia naprzeciw Niedzicy, dziś trwała ruina z tarasem widokowym.',
    opis: [
      'Zamek strzegł polskiej strony granicy i szlaku handlowego wzdłuż Dunajca. ' +
        'Dziś jest trwałą ruiną udostępnioną do zwiedzania, z basztą, z której ' +
        'widać całe jezioro i zamek w Niedzicy.',
      'Dojście od parkingu jest krótkie, ale pod górę — w sam raz na spacer ' +
        'łączony z rejsem po jeziorze.',
    ],
  },
  {
    slug: 'muzeum-pieninskie-w-szlachtowej',
    nazwa: 'Muzeum Pienińskie im. Józefa Szalaya',
    kategorie: ['kultura'],
    podkategoria: 'muzea',
    lokalizacja: 'szlachtowa',
    skrot: 'Historia uzdrowiska i dawnej Rusi Szlachtowskiej pod jednym dachem.',
    opis: [
      'Muzeum w Szlachtowej opowiada o dwóch splecionych historiach: powstaniu ' +
        'szczawnickiego uzdrowiska pod ręką Józefa Szalaya oraz o dawnych ' +
        'mieszkańcach czterech wsi zwanych Rusią Szlachtowską, wysiedlonych ' +
        'po drugiej wojnie światowej.',
      'Dobre miejsce, żeby zrozumieć, dlaczego w Jaworkach i Szlachtowej stoją ' +
        'cerkwie, choć nikt już w nich nie odprawia nabożeństw w dawnym obrządku.',
    ],
  },
  {
    slug: 'plac-dietla-i-architektura-szalayowska',
    nazwa: 'Plac Dietla i architektura uzdrowiskowa',
    kategorie: ['kultura'],
    podkategoria: 'architektura',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    skrot: 'Drewniane wille z gankami i godła nad wejściami — serce dawnego uzdrowiska.',
    opis: [
      'Plac Dietla to centrum uzdrowiskowej Szczawnicy: drewniane budynki ' +
        'z ozdobnymi gankami, pensjonaty i Dworek Gościnny. Układ i charakter ' +
        'zabudowy pochodzą z czasów Szalayów.',
      'Osobliwością są godła szałasowe — malowane znaki nad wejściami do domów, ' +
        'które przed wprowadzeniem numeracji służyły za adres. Do dziś można ' +
        'wypatrzeć kilkadziesiąt takich godeł: pod Bucikiem, pod Kozicą, ' +
        'pod Trzema Koronami, pod Wodospadem.',
    ],
  },
  {
    slug: 'cerkwie-w-jaworkach-i-szlachtowej',
    nazwa: 'Cerkwie w Jaworkach i Szlachtowej',
    kategorie: ['kultura'],
    podkategoria: 'swiatynie',
    lokalizacja: 'jaworki',
    skrot: 'Pozostałość po dawnych mieszkańcach doliny Grajcarka.',
    opis: [
      'Jaworki, Szlachtowa, Biała Woda i Czarna Woda tworzyły Ruś Szlachtowską — ' +
        'najdalej na zachód wysuniętą wyspę osadnictwa rusińskiego w Karpatach. ' +
        'Po wysiedleniach po drugiej wojnie światowej zostały po nich cerkwie, ' +
        'dziś użytkowane jako kościoły rzymskokatolickie.',
    ],
  },
  {
    slug: 'wawoz-homole',
    nazwa: 'Wąwóz Homole',
    kategorie: ['przyroda'],
    podkategoria: 'wawozy',
    lokalizacja: 'jaworki',
    wyrozniona: true,
    trasy: ['5D', 'SZMARAGD'],
    skrot: 'Osiemset metrów wapiennej szczeliny, którą wyżłobiła Kamionka. Ściany do 120 metrów.',
    opis: [
      'Wąwóz ma osiemset metrów długości, a wyżłobił go potok Kamionka, ' +
        'który do dziś płynie jego dnem. Wapienne ściany sięgają miejscami ' +
        'stu dwudziestu metrów, a odległość między nimi spada do kilku — idzie ' +
        'się kładkami tuż nad wodą, z niebem widocznym jako wąski pas nad głową. ' +
        'Wejścia strzeże skalna baszta zwana Wapiennikiem.',
      'Rezerwat utworzono w 1963 roku na obszarze blisko sześćdziesięciu ' +
        'hektarów i nadano mu imię Jana Wiktora (1890–1967), pisarza, który ' +
        'rozsławił Pieniny w książkach. To najpopularniejszy wąwóz Małych ' +
        'Pienin: latem potrafi go odwiedzić ponad dwa tysiące osób dziennie, ' +
        'więc kto chce mieć go dla siebie, przychodzi rano albo poza sezonem.',
      'Jaworki, u których wylotu leży wąwóz, mają własną historię, widoczną ' +
        'od razu po wjeździe do wsi. Mieszkali tu Rusini, a po nich został ' +
        'murowany budynek cerkwi z XIX wieku, zamieniony po wojnie na kościół. ' +
        'Wieś leży u zbiegu dwóch dolin — Białej Wody i Homole — i obie ' +
        'prowadzą w rezerwaty.',
    ],
  },
  {
    slug: 'wodospad-zaskalnik',
    nazwa: 'Wodospad Zaskalnik',
    kategorie: ['przyroda', 'rodziny'],
    podkategoria: 'wodospady',
    // Sewerynówka to dzielnica Szczawnicy, nie Jaworek — wcześniejszy wpis
    // przypisywał wodospad do niewłaściwej miejscowości.
    lokalizacja: 'szczawnica',
    miejscowosc: 'Szczawnica, Sewerynówka',
    wyrozniona: true,
    trasy: ['1D', '5B', '1B', '3C'],
    skrot: 'Pięciometrowy próg na Potoku Sopotnickim, trzy kilometry od centrum Szczawnicy.',
    opis: [
      'Woda spada z wysokości drugiego piętra na wapienny próg i przez lata ' +
        'wybiła pod nim nieckę — na tyle głęboką, że w upał moczy się w niej ' +
        'nogi cała rodzina. Powyżej progu jest jasna łąka, na której da się ' +
        'rozłożyć koc.',
      'Wodospad zmienia się przez rok bardziej niż cokolwiek innego w okolicy. ' +
        'Najokazalszy jest wiosną, po roztopach. Zimą potrafi zamarznąć w lodową ' +
        'kolumnę. Latem bywa skromny — nie obiecuj dzieciom Niagary.',
      'Sewerynówka leży na uboczu, z dala od głównego ruchu, i to jest połowa ' +
        'jej uroku. Z centrum Szczawnicy idzie się tu około czterdziestu pięciu ' +
        'minut, prawie po płaskim; parking jest kilkanaście metrów od wodospadu, ' +
        'a obok zatrzymuje się szczawnicka ciuchcia. Droga mija drewniany ' +
        'kościółek z 1925 roku, w którym latem odprawiane są msze.',
    ],
  },
  {
    slug: 'rezerwat-biala-woda',
    nazwa: 'Rezerwat Biała Woda',
    kategorie: ['przyroda'],
    podkategoria: 'rezerwaty',
    lokalizacja: 'jaworki',
    trasy: ['4D', '4B'],
    skrot: 'Dolina wapiennych skałek nad potokiem, którym szło się do wsi, której już nie ma.',
    opis: [
      'Nazwa bierze się od dna potoku: jasny wapień prześwieca przez wodę tak, ' +
        'że wydaje się mleczna. Rezerwat utworzono w 1963 roku na trzydziestu ' +
        'kilku hektarach — nie w jednym kawałku, ale w czterech, rozdzielonych ' +
        'pastwiskami i polami. Idzie się doliną wygodnie, także z rowerem.',
      'Skały mają tu własne imiona i własne historie. Smolegowa Skała opada ' +
        'urwiskiem do potoku, a na jej północnej ścianie rosną rośliny, które ' +
        'w Polsce spotyka się jeszcze tylko w Tatrach — dębik ośmiopłatkowy, ' +
        'konietlica alpejska, pępawa Jacquina. Czerwona Skałka bywa nazywana ' +
        'Sfinksem, a naprzeciw niej Konowalskie Skały układają się w skalny ' +
        'amfiteatr. Kawałek za granicą rezerwatu stoi Bazaltowa Skałka: ' +
        'w tym jednym miejscu, jakieś sto milionów lat temu, magma przebiła ' +
        'się na powierzchnię i zastygła.',
      'Do 1947 roku była tu wieś. Mieszkali w niej Rusini, potomkowie ' +
        'wołoskich pasterzy, którzy przyszli w te doliny w XIV wieku; żyli ' +
        'z owiec, roli i drobnego rzemiosła — słynęli z naprawiania stłuczonych ' +
        'glinianych garnków, które sklejali i wzmacniali drutem. W ramach ' +
        'akcji „Wisła" wysiedlono ich, a zabudowania spalono. Po wsi zostały ' +
        'fundamenty pod trawą i zdziczałe drzewa owocowe, które nadal owocują ' +
        'przy ścieżce.',
    ],
  },
  {
    slug: 'pieninski-park-narodowy',
    nazwa: 'Pieniński Park Narodowy',
    kategorie: ['przyroda'],
    podkategoria: 'parki',
    // Park obejmuje Masyw Trzech Koron, Pieniny Czorsztyńskie, Pieninki
    // i przełom Dunajca — leży w kilku gminach naraz. W Krościenku jest tylko
    // dyrekcja, więc przypisanie go tam wprowadzałoby w błąd.
    lokalizacja: 'pieniny',
    miejscowosc: 'Pieniny Właściwe',
    wyrozniona: true,
    trasy: ['TK2', 'TK1', 'KP19', 'DP'],
    skrot: 'Pierwszy park narodowy w Polsce, utworzony w 1932 roku. Trzy Korony, Sokolica i przełom Dunajca.',
    opis: [
      'Powstał 1 czerwca 1932 roku jako pierwszy park narodowy w Polsce. ' +
        'W tym samym roku swój park utworzyli Czechosłowacy po drugiej stronie ' +
        'granicy — i tak Pieniny stały się pierwszym miejscem w Europie, gdzie ' +
        'dwa państwa objęły ochroną jedno pasmo z dwóch stron. Zaczęło się ' +
        'jedenaście lat wcześniej od siedmiu hektarów łąk wokół ruin zamku ' +
        'w Czorsztynie.',
      'Park obejmuje Masyw Trzech Koron, Pieniny Czorsztyńskie, Pieninki ' +
        'i przełom Dunajca — a na tym niewielkim obszarze rośnie ponad tysiąc ' +
        'gatunków roślin naczyniowych, w tym dwa, których nie ma nigdzie ' +
        'indziej na świecie: pszonak pieniński i mniszek pieniński. Motyli ' +
        'naliczono około tysiąca sześciuset. Najsłynniejszy z nich, niepylak ' +
        'apollo, ma tu własny program ochronny.',
      'Sporo tutejszej przyrody nie przetrwałoby bez koszenia. Pienińskie łąki ' +
        'powstały przez stulecia gospodarowania i zarosłyby lasem, gdyby ich ' +
        'nie kosić — więc park kosi je i wywozi siano, a na Hali Majerz wypasa ' +
        'owce. Wiosną pracownicy przenoszą przez drogę do Sromowiec żaby, ' +
        'żeby nie ginęły pod kołami.',
      'Dla turystów przygotowano trzydzieści pięć kilometrów szlaków oraz ' +
        'galerie widokowe na Trzech Koronach i Sokolicy. To jednocześnie ' +
        'najintensywniej odwiedzany park narodowy w Polsce w przeliczeniu na ' +
        'hektar — warto wiedzieć, zanim się stanie w kolejce na Okrąglicę ' +
        'w lipcową sobotę.',
    ],
  },
  {
    slug: 'kosciol-wszystkich-swietych-w-kroscienku',
    nazwa: 'Kościół Wszystkich Świętych',
    kategorie: ['kultura'],
    podkategoria: 'swiatynie',
    lokalizacja: 'kroscienko',
    skrot: 'Gotycki kościół z zachowanymi średniowiecznymi malowidłami.',
    opis: [
      'Najstarszy zabytek Krościenka. We wnętrzu zachowały się gotyckie ' +
        'polichromie — rzadkość na tę skalę w małych karpackich kościołach.',
      'Stoi przy rynku, którego układ pamięta średniowieczną lokację miasta.',
    ],
  },
  {
    slug: 'velo-dunajec',
    nazwa: 'Velo Dunajec',
    kategorie: ['aktywnie'],
    podkategoria: 'rowery',
    lokalizacja: 'pieniny',
    miejscowosc: 'wzdłuż Dunajca',
    wyrozniona: true,
    skrot: 'Dalekobieżna trasa rowerowa wzdłuż całego Dunajca. Przez Pieniny prowadzi brzegiem Jeziora Czorsztyńskiego i doliną rzeki.',
    opis: [
      'Velo Dunajec to jedna z małopolskich tras dalekobieżnych: prowadzi ' +
        'doliną Dunajca, od podnóża Tatr aż po ujście rzeki do Wisły. ' +
        'Powstaje etapami, więc jedne odcinki są gotowym asfaltem wydzielonym ' +
        'z ruchu, a inne prowadzą jeszcze bocznymi drogami — przed dłuższym ' +
        'wyjazdem warto sprawdzić stan budowy na aktualnej mapie trasy.',
      'W Pieninach trasa trzyma się wody. Wchodzi w rejon od strony Nowego ' +
        'Targu, obiega Jezioro Czorsztyńskie, mija zaporę w Niedzicy i schodzi ' +
        'doliną Dunajca przez Krościenko i Szczawnicę, a dalej biegnie ku ' +
        'Sądecczyźnie. To odcinek płaski w porównaniu z resztą okolicy — ' +
        'rzeka wyznacza trasę, więc podjazdy są krótkie i rzadkie.',
      'Najpopularniejsze połączenie w Pieninach jest takie: w dół rzeki ' +
        'tratwą albo pontonem, a z powrotem rowerem tą samą doliną, tylko ' +
        'po drugiej stronie wody. Wypożyczalnie działają w Szczawnicy ' +
        'i w miejscowościach nad jeziorem.',
      'Velo Dunajec nie jest tym samym co Velo Czorsztyn — ta druga to pętla ' +
        'wokół samego jeziora. Obie stykają się nad zbiornikiem i da się je ' +
        'łączyć w jeden dzień.',
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'velo-czorsztyn',
    nazwa: 'Velo Czorsztyn',
    kategorie: ['aktywnie', 'rodziny'],
    podkategoria: 'rowery',
    lokalizacja: 'czorsztyn',
    wyrozniona: true,
    trasy: ['R2'],
    skrot: 'Pętla dookoła Jeziora Czorsztyńskiego — 27 km asfaltu od zamku do zamku, domknięta promem.',
    opis: [
      'Dwa zamki patrzą na siebie przez jezioro, a Velo Czorsztyn łączy je ' +
        'dookoła wody: od zamku Dunajec w Niedzicy po ruiny w Czorsztynie. ' +
        'Dwadzieścia siedem kilometrów, asfalt na całej długości i niemal bez ' +
        'samochodów — z niecałymi dwustoma metrami podejść w sumie.',
      'Najtrudniejsze jest na początku. Pierwsze kilometry to krótki, ale ' +
        'ostry podjazd pod Falsztyn, miejscami do siedmiu procent; mniej ' +
        'wprawni prowadzą tam rower bez wstydu. Falsztyn leży na 621 metrach, ' +
        'najwyżej na całej trasie, i jest jedynym miejscem, z którego widać ' +
        'Tatry ponad taflą jeziora.',
      'Potem robi się łatwo. Zjazd do Frydmana nad zachodni kraniec jeziora — ' +
        'zabytkowy kościół, przystań jachtowa i ostatnie zaplecze przed długim ' +
        'odcinkiem. Kawałek dalej, 450 metrów od szlaku, stoi drewniany kościół ' +
        'św. Michała Archanioła w Dębnie: XV wiek, zachowana gotycka ' +
        'polichromia, Lista Światowego Dziedzictwa UNESCO. Warto zostawić rower ' +
        'i wejść.',
      'Środek trasy jest najbardziej „jeziorny": szlak wchodzi na korony wałów ' +
        'przeciwpowodziowych i prowadzi nimi kilometrami — płasko, bez ' +
        'skrzyżowań, z wodą po jednej stronie i Pieninami na horyzoncie. ' +
        'Za Maniowami kładka pieszo-rowerowa przenosi trasę na drugą stronę, ' +
        'a w Kluszkowcach czeka plaża, gastronomia i wypożyczalnie.',
      'Ostatnie półtora kilometra biegnie brzegiem pod ruiny Czorsztyna, skąd ' +
        'widać naraz Tatry, Pieniny i Niedzicę po drugiej stronie wody. Pętlę ' +
        'domyka prom odpływający spod zamku — kursuje od maja do października, ' +
        'więc poza sezonem trzeba wracać tą samą drogą albo naokoło przez zaporę.',
    ],
    sezon: 'prom domykający pętlę kursuje od maja do października',
  },
  {
    slug: 'muzeum-uzdrowiska',
    nazwa: 'Muzeum Uzdrowiska',
    kategorie: ['kultura'],
    podkategoria: 'muzea',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'park-dolny',
    nazwa: 'Park Dolny',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    skrot: 'Park zdrojowy ze stawem, altaną nad źródłem i darmowym ujęciem wody mineralnej.',
    opis: [
      'Park Dolny to zieleń zdrojowa w środku Szczawnicy: staw z liliami, wierzby ' +
        'przy brzegu, kaskada spływająca po kamieniach i drewniana altana ' +
        'postawiona na murowanym cokole nad ujęciem wody. Alejki są równe ' +
        'i po płaskim, więc idzie się tędy z wózkiem tak samo dobrze jak pieszo.',
      'Park ma też praktyczną funkcję, o której łatwo zapomnieć: to jedno ' +
        'z trzech miejsc w Szczawnicy, gdzie wodę mineralną nabiera się za darmo. ' +
        'Ujęcie znajduje się powyżej kapliczki. Z Parku Dolnego pochodzą dwie ' +
        'wody uzdrowiska — Wanda, znana od lat 60. XIX wieku, oraz odwiert Helena, ' +
        'najlżejsza z tutejszych szczaw.',
      'To miejsce na godzinę bez planu — usiąść na ławce, wypić nabraną wodę, ' +
        'przejść się wokół stawu. Dobrze sprawdza się jako przerwa między ' +
        'pijalnią a promenadą nad Grajcarkiem albo jako całość dnia, gdy w górach ' +
        'pada.',
    ],
  },
  {
    slug: 'inhalatorium',
    nazwa: 'Inhalatorium',
    kategorie: ['kultura'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'kosciol-swietego-wojciecha',
    nazwa: 'Kościół świętego Wojciecha',
    kategorie: ['kultura'],
    podkategoria: 'swiatynie',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'fontanna-kobieta',
    nazwa: 'Fontanna „Kobieta”',
    kategorie: ['kultura'],
    podkategoria: 'architektura',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'promenada-nad-grajcarkiem',
    nazwa: 'Grajcarek i promenada',
    kategorie: ['woda', 'rodziny'],
    podkategoria: 'grajcarek',
    lokalizacja: 'szczawnica',
    trasy: ['2D'],
    skrot: 'Potok w środku Szczawnicy i deptak wzdłuż niego — latem najprostszy sposób na popołudnie z dziećmi.',
    opis: [
      'Grajcarek płynie przez samo centrum Szczawnicy i wpada do Dunajca. ' +
        'Wzdłuż niego biegnie równa, brukowana promenada — bez podejść, bez ' +
        'samochodów, z ławkami po drodze. Idzie się nią wózkiem, na rowerze ' +
        'i na hulajnodze, więc jest to trasa, na którą nie trzeba się szykować.',
      'Latem to najprostszy pomysł na popołudnie z rodziną. Woda jest płytka ' +
        'i kamienista, brzegi łagodne, więc dzieci brodzą i budują tamy, ' +
        'a dorośli siedzą obok. W upał nad potokiem jest wyraźnie chłodniej ' +
        'niż w mieście.',
      'Promenada łączy centrum uzdrowiska z dolną stacją kolei na Palenicę ' +
        'i z drogą w stronę Jaworek, więc bywa też początkiem dłuższego dnia — ' +
        'i najwygodniejszym powrotem, gdy nogi mają już dość grani.',
    ],
  },
  {
    slug: 'palenica',
    nazwa: 'Palenica',
    kategorie: ['przyroda', 'rodziny', 'zima'],
    podkategoria: 'punkty-widokowe',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    // Trasy zaczynające się na szczycie albo przez niego przechodzące.
    // Pełną listę widać po kliknięciu — tu tylko te, które opisują sam wjazd
    // i najbliższe grzbietowe wyjścia.
    trasy: ['7D', 'KP23', 'KP20', '2A'],
    skrot: 'Szczyt nad Szczawnicą, na który wjeżdża się krzesełkiem. Widok, zjeżdżalnia i początek grzbietu Małych Pienin.',
    opis: [
      'Palenica jest najłatwiej dostępnym punktem widokowym w okolicy: ' +
        'krzesełko rusza z centrum uzdrowiska i po kilku minutach jest się ' +
        'na górze, bez podejścia. Ze szczytu widać Szczawnicę, dolinę Dunajca ' +
        'i pienińskie grzbiety, a przy dobrej widoczności także Tatry.',
      'To szczyt urządzony pod rodziny. Jest ogrodzony plac zabaw ze ' +
        'ściankami wspinaczkowymi i długą krętą zjeżdżalnią, jest ścieżka ' +
        'edukacyjna z wielkimi figurami zwierząt — niedźwiedź, ryś, borsuk, ' +
        'salamandra, bocian — i osobna Żmijowa Zjeżdżalnia po drodze. Stokiem ' +
        'biegnie tor grawitacyjny, na którym wózki rozpędzają się do ' +
        'dwudziestu trzech kilometrów na godzinę.',
      'Zimą Palenica zamienia się w ośrodek narciarski: około czterech ' +
        'kilometrów tras o różnym stopniu trudności, oświetlonych po zmroku, ' +
        'oraz szkółka, w której uczą jazdy na nartach i desce, a bardziej ' +
        'zaawansowanych zabierają na skitury i freeride.',
      'Dla idących dalej szczyt jest bramą na grzbiet Małych Pienin — stąd ' +
        'prowadzą szlaki na Szafranówkę, Wysoki Wierch i dalej ku Wąwozowi ' +
        'Homole. Na górze stoi schronisko „Groń", a przy dolnej stacji jest ' +
        'gdzie zjeść przed wyjściem albo po zejściu.',
    ],
  },
  {
    slug: 'trasy-narciarskie-palenica',
    nazwa: 'Trasy narciarskie na Palenicy',
    kategorie: ['zima'],
    podkategoria: 'narty',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'rafting-na-dunajcu',
    nazwa: 'Rafting na Dunajcu',
    kategorie: ['aktywnie'],
    podkategoria: 'splywy',
    lokalizacja: 'pieniny',
    miejscowosc: 'Sromowce — Szczawnica',
    wyrozniona: true,
    skrot: 'Przełom Dunajca pontonem, z wiosłem w ręku. Około 15 km i dwie–trzy godziny na wodzie.',
    opis: [
      'To ten sam przełom co przy tratwach flisackich, tylko przeżywany ' +
        'inaczej: siedzi się w pontonie, trzyma wiosło i samemu prowadzi łódź. ' +
        'Nurt robi resztę. Rzeka jest tu spokojna — w skali trudności to ' +
        'najłatwiejszy stopień — więc płyną rodziny z dziećmi, wycieczki ' +
        'szkolne i ludzie, którzy nigdy wcześniej nie mieli wiosła w ręku.',
      'Trasa liczy około piętnastu kilometrów i zajmuje dwie do trzech godzin. ' +
        'Startuje się w Sromowcach, kończy w Szczawnicy. Pontony mieszczą ' +
        'zwykle od dwóch do dwunastu osób, więc płynie się własną grupą, ' +
        'a nie ze wszystkimi naraz.',
      'Wypożyczenie jest proste, bo w cenie jest komplet: ponton, wiosła, ' +
        'kamizelka asekuracyjna, kask i wodoszczelny worek na telefon. ' +
        'Chłodniejszego dnia bywa do wzięcia pianka. Można płynąć ze sternikiem ' +
        'albo bez — przy większych grupach sternik zwykle wchodzi w cenę, przy ' +
        'mniejszych jest dopłatą.',
      'Trzeba pomyśleć o powrocie na start, bo samochód zostaje przy ' +
        'przystani startowej albo na parkingu w Szczawnicy. Organizatorzy ' +
        'dowożą busem — jazda zajmuje jakieś pół godziny. Da się też wrócić ' +
        'rowerem doliną, około półtorej do dwóch godzin, albo pieszo Drogą ' +
        'Pienińską, ale to już cały dzień.',
    ],
    cena: 'Orientacyjnie od około 80 do 130 zł za osobę dorosłą, zależnie od organizatora i tego, czy w cenie jest dojazd busem albo rowerem. Dzieci taniej, grupy po negocjacji.',
    sezon: 'zwykle od 1 kwietnia do 31 października',
    doPotwierdzenia: true,
  },
  {
    slug: 'kajaki-na-dunajcu',
    nazwa: 'Kajaki na Dunajcu',
    kategorie: ['aktywnie'],
    podkategoria: 'splywy',
    lokalizacja: 'pieniny',
    miejscowosc: 'Sromowce — Szczawnica lub dalej',
    wyrozniona: true,
    skrot: 'Przełom na własnych rękach — kajakiem jedno- lub dwuosobowym, od czternastu kilometrów w górę.',
    opis: [
      'Kajak to najbardziej samodzielny sposób na ten sam przełom, którym płyną ' +
        'tratwy i pontony. Siedzi się nisko, tuż nad wodą, i wiosłuje samemu — ' +
        'bez flisaka i bez sternika. Rzeka nie jest trudna, ale kajak wymaga ' +
        'więcej uwagi niż ponton, bo reaguje na każde pociągnięcie wiosłem.',
      'Do wyboru są kajaki jednoosobowe i dwuosobowe; część wypożyczalni ma ' +
        'w ofercie także pontony, gdy grupa jest większa albo dzieci za małe na ' +
        'własny kajak. W cenie idzie zwykle komplet: kajak, wiosła, atestowana ' +
        'kamizelka, kask i wodoszczelny worek na telefon.',
      'Tras jest kilka i różnią się tym, gdzie się kończą. Najkrótsze prowadzą ' +
        'ze Sromowiec do Szczawnicy — czternaście do osiemnastu kilometrów, ' +
        'około dwóch godzin na wodzie. Dłuższe idą dalej w dół rzeki, do ' +
        'Krościenka albo aż do Tylmanowej, i wtedy trzeba zarezerwować pół dnia ' +
        'albo więcej.',
      'Wymagania zależą od jednostki i od wypożyczalni, więc warto zapytać ' +
        'przed rezerwacją. Zwykle na kajak jednoosobowy wsiada się dopiero jako ' +
        'nastolatek i trzeba umieć wiosłować, a młodsze dzieci płyną z dorosłym ' +
        'w kajaku dwuosobowym albo w pontonie. Część firm wymaga umiejętności ' +
        'pływania, część nie.',
      'Powrót na start jest wliczony albo dopłacany — bus jedzie około pół ' +
        'godziny. Da się też wrócić rowerem doliną, w mniej więcej godzinę.',
    ],
    cena: 'Orientacyjnie od około 50 zł za osobę w kajaku jednoosobowym i od około 65 zł w dwuosobowym; pontony drożej. Dzieci taniej albo bezpłatnie, zależnie od wieku i organizatora.',
    sezon: 'zwykle od kwietnia do października',
    doPotwierdzenia: true,
  },
  {
    slug: 'wedkarstwo',
    nazwa: 'Wędkarstwo',
    kategorie: ['aktywnie'],
    podkategoria: 'wedkarstwo',
    lokalizacja: 'pieniny',
    miejscowosc: 'Dunajec i dopływy',
    wyrozniona: true,
    skrot: 'Jedenaście kilometrów łowiska specjalnego na Dunajcu, muchowe rzeki Podhala i łowiska komercyjne dla rodzin.',
    opis: [
      'Dunajec jest jedną z najbardziej znanych rzek muchowych w Polsce, ' +
        'a odcinek pieniński ściąga wędkarzy przez cały rok — także zza ' +
        'granicy. Powodem jest łowisko specjalne o zaostrzonych zasadach: ' +
        'ryb się z niego nie zabiera, więc jest ich tam po prostu więcej.',
      'Jeśli nie masz uprawnień, sprzętu ani ochoty na formalności, zostają ' +
        'łowiska komercyjne. To zupełnie inna forma wędkowania — bliżej ' +
        'popołudnia z dzieckiem niż sportu — i o niej też jest niżej.',
    ],
    przewodnik: [
      {
        ikona: 'ryba',
        tytul: 'Łowisko Specjalne Dunajec',
        tekst:
          'Około jedenastu kilometrów rzeki: od ujścia Krośniczanki w Krościenku ' +
          'nad Dunajcem do ujścia Ochotnicy w Tylmanowej. Do niemal każdego ' +
          'fragmentu da się podjechać samochodem, co przy wędkarstwie ' +
          'muchowym bywa rzadkim luksusem.',
      },
      {
        ikona: 'zasady',
        tytul: 'Zasady na łowisku specjalnym',
        tekst:
          'Na całym odcinku wolno łowić wyłącznie na haczyki bezzadziorowe, ' +
          'a złowionych ryb nie zabiera się ze sobą. Ten jeden zapis sprawia, ' +
          'że szansa na złowienie pstrąga jest tu wielokrotnie wyższa niż na ' +
          'sąsiednich odcinkach rzeki.',
      },
      {
        ikona: 'sprzet',
        tytul: 'Co tu pływa',
        tekst:
          'Pstrąg potokowy — najliczniejszy i najczęstszy cel. Poza nim ' +
          'głowacica, lipień, kleń, brzana i świnka. Na suchą muchę i na ' +
          'nimfę łowi się pstrągi i lipienie, na streamery poluje się ' +
          'na głowacicę.',
      },
      {
        ikona: 'mapa',
        tytul: 'Rzeki w zasięgu jednego dnia',
        tekst:
          'Poza Dunajcem w promieniu godziny jazdy są trzy rzeki o zupełnie ' +
          'różnym charakterze: Białka Tatrzańska — szybka i dzika, Biały ' +
          'Dunajec — z wodospadami w górnym biegu i głębokimi dołami niżej, ' +
          'oraz Czarny Dunajec, który na czterdziestu ośmiu kilometrach ' +
          'zmienia się z górskiego potoku w spokojną rzekę z meandrami.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Czego potrzeba na wodach ogólnodostępnych',
        tekst:
          'Do wędkowania na rzece potrzebna jest karta wędkarska i zezwolenie ' +
          'na dany obwód rybacki; łowisko specjalne ma dodatkowo własny ' +
          'regulamin i osobne zezwolenie. Zasady i ceny ustala gospodarz wód, ' +
          'więc kupuje się je u niego, a nie na miejscu nad wodą.',
      },
      {
        ikona: 'dziecko',
        tytul: 'Z dzieckiem — łowiska komercyjne',
        tekst:
          'Na łowisku komercyjnym, takim jak Łowisko Pstrąga, nie trzeba ani ' +
          'karty wędkarskiej, ani własnego sprzętu. Bierze się wędkę na ' +
          'miejscu, łowi pstrąga i można go od razu zjeść — rybę przygotowują ' +
          'na miejscu. Dla dziecka to zwykle pierwsze złowione w życiu ryby ' +
          'i cały pomysł na popołudnie.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'off-road',
    nazwa: 'Off-road',
    kategorie: ['aktywnie'],
    podkategoria: 'off-road',
    lokalizacja: 'pieniny',
    wyrozniona: true,
    skrot: 'Wyprawy 4x4, buggy i quadami z organizatorem albo trasy enduro i quadowe na własnym sprzęcie.',
    opis: [
      'W okolicy działa sporo firm, które organizują wyprawy w teren — ' +
        'terenowymi samochodami 4x4, buggy albo quadami. Nie trzeba mieć ' +
        'niczego swojego ani żadnego doświadczenia: sprzęt jest na miejscu, ' +
        'a przewodnik prowadzi grupę trasą, którą zna. Część ofert to jazda ' +
        'z kierowcą, część za kierownicą pod okiem instruktora, więc znajdzie ' +
        'się coś i dla rodziny z dziećmi, i dla szukających mocniejszych wrażeń.',
      'Dla przyjeżdżających z własnym sprzętem okolica ma drugą twarz. ' +
        'Wokół Pienin, w Gorcach i Beskidzie Sądeckim, ciągną się dziesiątki ' +
        'kilometrów dróg leśnych i gospodarczych, po których jeździ się enduro ' +
        'i quadem — od łagodnych przejazdów dolinami po odcinki wymagające ' +
        'wprawy.',
    ],
    przewodnik: [
      {
        ikona: 'sprzet',
        tytul: 'Z organizatorem',
        tekst:
          'Sprzęt, kask i przewodnik po stronie firmy. Wyprawy trwają zwykle ' +
          'od godziny do pół dnia, a trasa dobierana jest do grupy — inaczej ' +
          'wozi się rodzinę z dziećmi, inaczej wieczór kawalerski.',
      },
      {
        ikona: 'mapa',
        tytul: 'Własnym sprzętem',
        tekst:
          'Sieć dróg leśnych i gospodarczych wokół Pienin, w Gorcach ' +
          'i Beskidzie Sądeckim. Warto z góry sprawdzić przebieg trasy, bo ' +
          'część dróg leśnych bywa okresowo zamykana na czas wywózki drewna.',
      },
      {
        ikona: 'zasady',
        tytul: 'Gdzie jeździć nie wolno',
        tekst:
          'W Pienińskim Parku Narodowym i w rezerwatach jazda pojazdami ' +
          'silnikowymi poza drogami publicznymi jest zabroniona. To samo ' +
          'dotyczy szlaków pieszych i rowerowych. Wjazd do lasu wymaga zgody ' +
          'właściciela albo zarządcy terenu — brak zakazu na tabliczce nie ' +
          'znaczy, że wolno.',
      },
      {
        ikona: 'sezon',
        tytul: 'Kiedy',
        tekst:
          'Najwięcej wyjazdów odbywa się od wiosny do jesieni, ale część firm ' +
          'jeździ przez cały rok — zimą po śniegu, co bywa najciekawszym ' +
          'wariantem. Po dużych opadach trasy bywają zamykane.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'paintball',
    nazwa: 'Paintball',
    kategorie: ['aktywnie'],
    podkategoria: 'paintball',
    lokalizacja: 'pieniny',
    skrot: 'Gra w terenie dla grup — wieczory kawalerskie, panieńskie i wyjazdy firmowe.',
    opis: [
      'Paintball to atrakcja dla grupy, nie dla pojedynczej osoby, i właśnie ' +
        'dlatego trafia w trzy okazje: wieczór kawalerski, wieczór panieński ' +
        'i wyjazd integracyjny firmy. Dzieli ludzi na dwie drużyny, daje im ' +
        'wspólny cel i godzinę biegania po lesie — po czym wszyscy mają ' +
        'o czym opowiadać przy stole.',
      'Sprzęt jest po stronie organizatora: markery, maski, kombinezony ' +
        'i kulki. Prowadzący tłumaczy zasady i pilnuje bezpieczeństwa, więc ' +
        'nikt nie musi mieć wcześniejszego doświadczenia — wystarczy ubranie, ' +
        'którego nie szkoda, i buty do lasu.',
      'Pola gry urządza się w terenie leśnym albo na przygotowanych placach ' +
        'z przeszkodami. Gra się zwykle w kilku scenariuszach: zdobycie flagi, ' +
        'obrona punktu, eliminacja — im większa grupa, tym więcej wariantów ' +
        'ma sens.',
    ],
    przewodnik: [
      {
        ikona: 'sprzet',
        tytul: 'Co dostajesz na miejscu',
        tekst:
          'Marker, maskę ochronną, kombinezon i przydział kulek. Dokupienie ' +
          'kolejnych kulek to zwykle najczęstsza dopłata, bo pierwsza porcja ' +
          'kończy się szybciej, niż wszyscy się spodziewają.',
      },
      {
        ikona: 'dziecko',
        tytul: 'Od ilu lat',
        tekst:
          'Klasyczny paintball ma ograniczenie wiekowe i wymaga zgody ' +
          'opiekuna dla niepełnoletnich. Dla młodszych dzieci część ' +
          'organizatorów ma lżejszy wariant z mniejszym ciśnieniem — warto ' +
          'zapytać przy rezerwacji.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Rezerwacja z wyprzedzeniem',
        tekst:
          'Gra dla grupy wymaga umówienia terminu i podania liczby osób — ' +
          'nie jest to atrakcja, na którą wpada się z marszu. W sezonie ' +
          'weekendy bywają zajęte na kilka tygodni naprzód.',
      },
      {
        ikona: 'zasady',
        tytul: 'W co się ubrać',
        tekst:
          'Ubranie z długim rękawem i nogawką, którego nie szkoda — kulki ' +
          'barwią i zostawiają siniaki. Buty zakryte, najlepiej trekkingowe. ' +
          'Maski nie zdejmuje się na polu gry ani na chwilę.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'kuligi',
    nazwa: 'Kuligi',
    kategorie: ['zima', 'aktywnie', 'rodziny'],
    podkategoria: 'jazda-konna',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    skrot: 'Sanie za koniem po zaśnieżonych dolinach — także wieczorem, przy pochodniach.',
    opis: [
      'Kulig to ta sama okolica, tylko zimą i z innej wysokości: siedzi się ' +
        'nisko, tuż nad śniegiem, a konie idą doliną w tempie, które pozwala ' +
        'rozejrzeć się na boki. Trasy prowadzą zwykle bocznymi drogami wzdłuż ' +
        'potoków, z dala od ruchu.',
      'Kto organizuje. W samej Szczawnicy najprościej dogadać się z woźnicami, ' +
        'którzy latem stoją z bryczkami przy ulicy Zdrojowej — gdy spadnie ' +
        'dość śniegu, zamieniają powozy na sanie. W dolinie Białej Wody koło ' +
        'Jaworek kuligi organizuje stadnina Rajd, ta sama, która przez resztę ' +
        'roku prowadzi jazdę konną. Poza tym sanie wystawiają gospodarstwa ' +
        'agroturystyczne w okolicznych dolinach — często razem z noclegiem ' +
        'albo z ogniskiem na koniec.',
      'Wieczorna wersja jest osobną atrakcją: kulig z pochodniami, gdy trasę ' +
        'oświetla wyłącznie ogień niesiony przez jadących. Wygląda to zupełnie ' +
        'inaczej niż to samo popołudniu i zwykle kończy się przy ognisku ' +
        'z muzyką i poczęstunkiem.',
    ],
    przewodnik: [
      {
        ikona: 'sezon',
        tytul: 'Zależy od śniegu, nie od kalendarza',
        tekst:
          'Kulig wymaga pokrywy śnieżnej, więc sezon bywa krótszy albo dłuższy ' +
          'z roku na rok. Przy słabej zimie część gospodarstw podstawia bryczki ' +
          'na kołach — warto zapytać, co dostaniesz, gdy śniegu zabraknie.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Rezerwacja i wielkość grupy',
        tekst:
          'Sanie zabierają zwykle kilkanaście osób, więc kulig zamawia się dla ' +
          'grupy i z wyprzedzeniem. Weekendy w ferie schodzą najszybciej.',
      },
      {
        ikona: 'sprzet',
        tytul: 'Jak się ubrać',
        tekst:
          'Podczas jazdy nie ma jak się rozgrzać, a wiatr od sań jest ostrzejszy ' +
          'niż na spacerze. Ciepłe buty, czapka i rękawice; koce zwykle są ' +
          'w saniach, ale warto to potwierdzić.',
      },
      {
        ikona: 'dziecko',
        tytul: 'Z dziećmi',
        tekst:
          'Kulig sprawdza się z dziećmi w każdym wieku, bo nie wymaga niczego ' +
          'poza siedzeniem pod kocem. Wersję z pochodniami lepiej zostawić ' +
          'starszym — trwa dłużej i kończy się po ciemku.',
      },
    ],
    sezon: 'zima, przy odpowiedniej pokrywie śnieżnej',
    doPotwierdzenia: true,
  },
  {
    slug: 'warsztaty-lokalne',
    nazwa: 'Lokalne warsztaty',
    kategorie: ['aktywnie', 'kultura', 'rodziny'],
    podkategoria: 'warsztaty',
    lokalizacja: 'pieniny',
    wyrozniona: true,
    skrot: 'Malowanie góralskich wzorów na drewnie, szkle i glinie — zajęcia dla grup, od przedszkola po dorosłych.',
    opis: [
      'Warsztaty rękodzieła są tym, co zostaje z Pienin, gdy pogoda nie ' +
        'pozwala wyjść w góry — i tym, co da się zabrać do domu. Prowadzą je ' +
        'osoby z regionu, zwykle w pensjonatach w promieniu kilkunastu ' +
        'kilometrów od Krościenka, dla grup umówionych z wyprzedzeniem.',
      'Zajęcia zaczynają się zwykle od krótkiej prelekcji, a dopiero potem ' +
        'sięga się po pędzel. To nie jest przypadek: wzór góralski ma swoją ' +
        'gramatykę, a strój, z którego pochodzi, swoją historię — bez tego ' +
        'malowanie byłoby przerysowywaniem kształtów bez zrozumienia.',
      'Warianty dobiera się do wieku i wprawy grupy. Najprościej maluje się ' +
        'na sklejce brzozowej, trudniej na plastrze drewna albo na glinie, ' +
        'a najtrudniej na szkle — to ostatnie bywa zajęciem na pół dnia ' +
        'i wymaga wcześniejszego kontaktu z pędzlem.',
    ],
    przewodnik: [
      {
        ikona: 'sprzet',
        tytul: 'Malowanie góralskich wzorów',
        tekst:
          'Podstawowe zajęcia: prelekcja o strojach góralskich, potem godzina ' +
          'do półtorej malowania wzorów pienińskich albo podhalańskich. Do ' +
          'wyboru podłoże — sklejka brzozowa, plaster drewna albo glina.',
      },
      {
        ikona: 'dziecko',
        tytul: 'Zwierzęta chronione Pienin',
        tekst:
          'Wariant dla dzieci: prelekcja o ochronie przyrody i malowanie ' +
          'pienińskich zwierząt na sklejce. Półtorej do dwóch godzin. ' +
          'Przedszkolaki przyjmowane są na warsztaty drewniane.',
      },
      {
        ikona: 'sezon',
        tytul: 'Bombki choinkowe',
        tekst:
          'Zimowy wariant, bez sztywnych szablonów — maluje się bombkę ' +
          'medalion albo kulę. Osobno prowadzone są warsztaty bombek ' +
          'szklanych, dla młodzieży licealnej i dorosłych: trzy do czterech ' +
          'godzin i wymagana wcześniejsza wprawa.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Rezerwacja z wyprzedzeniem',
        tekst:
          'Warsztaty organizuje się dla grup, nie dla pojedynczych osób, ' +
          'a termin zamawia się od kilku dni do dwóch tygodni wcześniej, ' +
          'zależnie od wariantu i liczby uczestników.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'degustacje-regionalne',
    nazwa: 'Degustacje produktów regionalnych',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'warsztaty',
    lokalizacja: 'pieniny',
    wyrozniona: true,
    skrot: 'Oscypek, bryndza, bundz i żentyca — cała rodzina serów z owczego mleka, prosto z bacówki.',
    opis: [
      'Sery owcze są tym, co z pasterskiej przeszłości Pienin przetrwało ' +
        'w najbardziej dosłownej formie — nie jako eksponat w muzeum, tylko ' +
        'jako jedzenie robione tak samo jak dwieście lat temu. Próbuje się ich ' +
        'przy bacówkach, na kramach i w karczmach, a najciekawiej tam, gdzie ' +
        'baca sam opowiada, co trzyma w ręku.',
      'Wszystkie zaczynają się od jednego: od owczego mleka i podpuszczki. ' +
        'To, co dzieje się dalej — czy ser się wędzi, soli, formuje, czy pije ' +
        'to, co po nim zostało — daje cztery zupełnie różne rzeczy o czterech ' +
        'różnych nazwach, których turyści zwykle używają zamiennie i niesłusznie.',
      'Poza serami warto spróbować kwaśnicy, moskoli i pstrąga z pienińskich ' +
        'hodowli. W schroniskach i karczmach oscypek podaje się często ' +
        'z grilla, z żurawiną — to już wersja pod turystów, ale dobra.',
    ],
    przewodnik: [
      {
        ikona: 'ryba',
        tytul: 'Oscypek',
        tekst:
          'Wędzony, twardy, w kształcie wrzeciona, z charakterystycznym wzorem ' +
          'odciśniętym przez drewnianą formę. Robiony z owczego mleka ' +
          'w sezonie wypasu. Nazwa jest chroniona w Unii Europejskiej, więc ' +
          'to, co leży na kramie zimą, oscypkiem zwykle nie jest.',
      },
      {
        ikona: 'sprzet',
        tytul: 'Bryndza podhalańska',
        tekst:
          'Miękka, słona, rozsmarowywalna — powstaje z rozdrobnionego ' +
          'i osolonego bundzu. Była pierwszym polskim produktem objętym ' +
          'unijną ochroną nazwy pochodzenia.',
      },
      {
        ikona: 'dziecko',
        tytul: 'Bundz i redykołka',
        tekst:
          'Bundz to świeży, niesolony ser owczy o łagodnym smaku — najlepszy ' +
          'na pierwszy raz i dla dzieci. Redykołka to małe serki formowane ' +
          'w zwierzątka i serduszka, dawniej dawane w podarunku podczas ' +
          'jesiennego redyku.',
      },
      {
        ikona: 'zasady',
        tytul: 'Żentyca',
        tekst:
          'Serwatka, która zostaje po zrobieniu bundzu — pije się ją lekko ' +
          'kwaśną i podaje w bacówkach. Rzecz, po którą warto sięgnąć raz, ' +
          'choćby dla samej ciekawości.',
      },
      {
        ikona: 'sezon',
        tytul: 'Kiedy sery są prawdziwe',
        tekst:
          'Owce wypasa się od wiosny do jesieni i tylko wtedy powstają sery ' +
          'z owczego mleka. Poza sezonem sprzedaje się wyroby krowie ' +
          'o podobnym kształcie — smaczne, ale to nie to samo. Jeśli zależy ' +
          'ci na oryginale, pytaj wprost o mleko.',
      },
      {
        ikona: 'mapa',
        tytul: 'Gdzie próbować',
        tekst:
          'Najbliżej prawdy jest przy bacówkach w dolinach — w Pieninach ' +
          'wypas kulturowy prowadzi się między innymi na Hali Majerz ' +
          'w parku narodowym. Poza tym kramy w Szczawnicy i Krościenku, ' +
          'schroniska i karczmy regionalne.',
      },
    ],
    sezon: 'sery z owczego mleka — od wiosny do jesieni',
    doPotwierdzenia: true,
  },
  {
    slug: 'wypozyczalnie-rowerow',
    nazwa: 'Wypożyczalnie rowerów',
    kategorie: ['aktywnie', 'rodziny'],
    podkategoria: 'rowery',
    lokalizacja: 'szczawnica',
    wyrozniona: true,
    trasy: ['R1', 'R2'],
    skrot: 'Rower na godziny albo na cały dzień — w Szczawnicy jest w czym wybierać.',
    opis: [
      'Rower jest tu naturalnym wyborem, bo najciekawsze trasy w okolicy są ' +
        'płaskie i wydzielone z ruchu: Droga Pienińska przełomem Dunajca, ' +
        'Velo Dunajec doliną rzeki i pętla Velo Czorsztyn wokół jeziora. ' +
        'Wypożyczalni w Szczawnicy jest sporo — od punktów przy przystani ' +
        'i przy dolnej stacji kolei po sklepy rowerowe w centrum.',
      'Ze Szczawnicy polecamy wypożyczalnię Polaczyk, kilka kroków od ulicy ' +
        'Głównej — blisko wejścia na Drogę Pienińską, więc od odebrania roweru ' +
        'do wjazdu w przełom jest kilka minut.',
      'Rower bywa też drugą połową innego pomysłu na dzień: zjeżdża się ' +
        'tratwą albo pontonem w dół rzeki, a wraca się doliną na dwóch ' +
        'kółkach. Część wypożyczalni obsługuje ten wariant, dowożąc rowery ' +
        'na przystań startową.',
    ],
    przewodnik: [
      {
        ikona: 'sprzet',
        tytul: 'Co da się wypożyczyć',
        tekst:
          'Zwykle rowery górskie i trekkingowe, coraz częściej elektryczne — ' +
          'te ostatnie zmieniają wycieczkę na Wdżar albo pod Falsztyn ' +
          'w spokojną przejażdżkę. Dla rodzin: rowery dziecięce, przyczepki ' +
          'i foteliki. Kask zwykle wchodzi w cenę, ale warto to potwierdzić.',
      },
      {
        ikona: 'mapa',
        tytul: 'Dokąd stąd pojechać',
        tekst:
          'Droga Pienińska do Czerwonego Klasztoru — niecałe dziesięć ' +
          'kilometrów w jedną stronę, płasko, wzdłuż wody. Velo Czorsztyn to ' +
          'pełna pętla wokół jeziora, dwadzieścia siedem kilometrów na cały ' +
          'dzień. Obie trasy opisujemy osobno.',
      },
      {
        ikona: 'zasady',
        tytul: 'Na Drodze Pienińskiej ostrożnie',
        tekst:
          'Droga jest wspólna dla rowerzystów, pieszych i dorożek, a w sezonie ' +
          'bywa bardzo tłoczna. Jedź wolno i ustępuj pieszym — to nie jest ' +
          'trasa do kręcenia tempa.',
      },
      {
        ikona: 'sezon',
        tytul: 'Kiedy',
        tekst:
          'Wypożyczalnie działają zwykle od wiosny do jesieni, w szczycie ' +
          'sezonu od rana do wieczora. W lipcu i sierpniu w weekendy sprzęt ' +
          'potrafi się skończyć przed południem.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'rynek-w-kroscienku',
    nazwa: 'Rynek w Krościenku',
    kategorie: ['kultura'],
    podkategoria: 'architektura',
    lokalizacja: 'kroscienko',
    skrot: '',
    opis: [],
  },
  {
    slug: 'park-linowy-kroscienko',
    nazwa: 'Park linowy w Krościenku',
    kategorie: ['rodziny', 'aktywnie'],
    podkategoria: 'rozrywka',
    lokalizacja: 'kroscienko',
    miejscowosc: 'Krościenko nad Dunajcem, ul. Jagiellońska',
    wyrozniona: true,
    skrot: 'Sześć tras linowych, zjazd tyrolski nad parkiem i całoroczny Ninja Park — od trzylatka po dorosłych.',
    opis: [
      'Park rozrywki ABlandia leży w Krościenku, kawałek od Pienińskiego Parku ' +
        'Narodowego. Jest rozłożony na drzewach i zbudowany warstwami: od trasy ' +
        'pół metra nad ziemią dla trzylatków po odcinek jedenaście metrów wyżej ' +
        'dla tych, którym niestraszne. Dzięki temu na jedno wejście da się ' +
        'zabrać rodzinę o bardzo różnych ambicjach.',
      'Cały park pracuje w systemie asekuracji kategorii E — tak zwanym ' +
        'bezwypięciowym. Instruktor wpina uczestnika przed wejściem na trasę ' +
        'i wypina dopiero po jej przejściu, więc nie ma fizycznej możliwości ' +
        'wypięcia się po drodze. To jest ta różnica, przez którą rodzic może ' +
        'stać na dole i patrzeć, zamiast trzymać dziecko za karabinek.',
      'Poza trasami linowymi jest zjazd tyrolski nad parkiem, wieża z wahadłem, ' +
        'skok z hamowaniem magnetycznym, minigolf i całoroczna hala Ninja Park. ' +
        'Na miejscu są toalety, bezpłatny parking i strefa gastronomiczna.',
    ],
    przewodnik: [
      {
        ikona: 'dziecko',
        tytul: 'Trasa Smyk — od 3 lat',
        tekst:
          'Najłatwiejsza, na wysokości około pół metra nad ziemią. Dziecko ' +
          'idzie w uprzęży, a rodzic może iść obok i pomagać przy prowadzeniu ' +
          'haka. Pierwsze kroki na wysokości bez żadnego ryzyka.',
      },
      {
        ikona: 'trasa',
        tytul: 'Trasa Żółta — od 6 lat',
        tekst:
          'Ponad sto metrów na wysokości dwóch metrów, wymagany wzrost 110 cm. ' +
          'Bardzo łatwa, dla początkujących zdobywców parków linowych. ' +
          'Przejście zajmuje jakieś pół godziny.',
      },
      {
        ikona: 'trasa',
        tytul: 'Trasa Zielona — od 8 lat',
        tekst:
          'Ponad 250 metrów, 6–7 metrów nad ziemią, piętnaście przeszkód: ' +
          'ścianka wspinaczkowa, przejazd na deskorolce, tyrolki, siatki. ' +
          'Wymagany wzrost 130 cm. Około godziny z instruktażem.',
      },
      {
        ikona: 'trasa',
        tytul: 'Trasa Niebieska — uniwersalna',
        tekst:
          'Ponad 200 metrów, ta sama wysokość co zielona, czternaście ' +
          'przeszkód. Najbardziej wyważona z całego parku — dobra i dla ' +
          'dzieci, i dla dorosłych. Około godziny.',
      },
      {
        ikona: 'adrenalina',
        tytul: 'Trasa Czerwona — Extreme',
        tekst:
          'Ponad 350 metrów na wysokości 10–11 metrów i dwadzieścia przeszkód ' +
          'o podwyższonej trudności. Godzina do półtorej. Wymagany wzrost ' +
          '140 cm i ukończone 8 lat.',
      },
      {
        ikona: 'adrenalina',
        tytul: 'ZipLine i skoki',
        tekst:
          'Zjazd tyrolski z Wieży Mocy — ponad 120 metrów nad parkiem, ' +
          'z lądowaniem w pajęczynie na linach bungee, a w drodze powrotnej ' +
          'pięć kolejnych tyrolek. Do tego BigSwing Tandem (wahadło z 15 ' +
          'metrów, we dwoje) i QuickFlight — pionowy skok z 13 metrów ' +
          'z hamowaniem magnetycznym.',
      },
      {
        ikona: 'sezon',
        tytul: 'Ninja Park — cały rok, pod dachem',
        tekst:
          'Hala z torami przeszkód, basenem piankowym i kulkowym, ' +
          'trampolinami, ścianką i labiryntami w siatkach. Strefy od roczka ' +
          'do dorosłych, z osobną strefą dla rodziców. Ratunek na deszczowy ' +
          'dzień i na zimę. Poza tym Strefa Juniora na zewnątrz: trasa ' +
          'linowa w siatkach, tyrolka dla najmłodszych, dmuchana poduszka ' +
          'i łódki.',
      },
      {
        ikona: 'zasady',
        tytul: 'Zanim przyjedziesz',
        tekst:
          'Buty sportowe są wymagane. Maksymalna waga na trasach to 120 kg. ' +
          'Dzieci w wieku 6–8 lat wchodzą na wyższe trasy wyłącznie z osobą ' +
          'dorosłą (jedna osoba może prowadzić najwyżej dwoje dzieci), ' +
          'a wszystkim niepełnoletnim musi towarzyszyć opiekun.',
      },
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'plaza-nad-jeziorem-czorsztynskim',
    nazwa: 'Plaża nad Jeziorem Czorsztyńskim',
    kategorie: ['rodziny'],
    podkategoria: 'plaze',
    lokalizacja: 'czorsztyn',
    skrot: '',
    opis: [],
  },
  {
    slug: 'plaza-w-niedzicy',
    nazwa: 'Plaża w Niedzicy',
    kategorie: ['rodziny'],
    podkategoria: 'plaze',
    lokalizacja: 'niedzica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'czerwony-klasztor',
    nazwa: 'Czerwony Klasztor',
    kategorie: ['kultura'],
    podkategoria: 'muzea',
    lokalizacja: 'slowacja',
    skrot: '',
    opis: [],
  },
  {
    slug: 'muzyczna-owczarnia',
    nazwa: 'Muzyczna Owczarnia',
    kategorie: ['kultura'],
    podkategoria: 'muzyka',
    lokalizacja: 'jaworki',
    skrot: '',
    opis: [],
  },
  {
    slug: 'ogniska',
    nazwa: 'Ogniska',
    kategorie: ['zima', 'rodziny'],
    podkategoria: 'rozrywka',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'skutery-sniezne',
    nazwa: 'Skutery śnieżne',
    kategorie: ['zima', 'aktywnie'],
    podkategoria: 'skutery',
    lokalizacja: 'pieniny',
    skrot: 'Przejażdżki z organizatorem na wyznaczonych terenach — w parku narodowym jeździć nie wolno.',
    opis: [
      'Skuter śnieżny jest w Pieninach atrakcją zorganizowaną, a nie sposobem ' +
        'na samodzielne zwiedzanie okolicy. Powód jest prosty: większość ' +
        'najładniejszych terenów leży w Pienińskim Parku Narodowym albo ' +
        'w rezerwatach, gdzie poruszanie się pojazdami silnikowymi poza ' +
        'drogami publicznymi jest zabronione.',
      'Firmy działające w regionie organizują przejażdżki na terenach, na ' +
        'które mają zgodę — polanach, prywatnych gruntach, przygotowanych ' +
        'pętlach i stokach poza godzinami pracy wyciągu. Sprzęt, kask ' +
        'i instruktaż są po stronie organizatora, więc nie trzeba mieć ' +
        'niczego swojego.',
      'Warto pamiętać, że skuter jest głośny i zostawia ślad w terenie, ' +
        'w którym zimuje zwierzyna. Jazda w wyznaczonym miejscu to nie tylko ' +
        'kwestia przepisów, ale i tego, żeby okolica nadawała się do ' +
        'odwiedzenia także następnej zimy.',
    ],
    przewodnik: [
      {
        ikona: 'zasady',
        tytul: 'Gdzie jeździć nie wolno',
        tekst:
          'W Pienińskim Parku Narodowym i w rezerwatach — poza drogami ' +
          'publicznymi obowiązuje zakaz. To samo dotyczy szlaków turystycznych ' +
          'i tras narciarskich. Wjazd do lasu wymaga zgody właściciela lub ' +
          'zarządcy terenu.',
      },
      {
        ikona: 'sprzet',
        tytul: 'Z organizatorem',
        tekst:
          'Skuter, kask i krótkie przeszkolenie na miejscu. Część ofert to ' +
          'jazda samodzielna po wyznaczonej pętli, część — jako pasażer za ' +
          'kierowcą, co jest jedyną opcją dla dzieci.',
      },
      {
        ikona: 'sezon',
        tytul: 'Tylko przy śniegu',
        tekst:
          'Sezon zależy od pokrywy, nie od kalendarza — w słabsze zimy bywa ' +
          'krótki albo przerywany. Przed przyjazdem warto potwierdzić, czy ' +
          'w ogóle się jeździ.',
      },
      {
        ikona: 'zezwolenie',
        tytul: 'Uprawnienia',
        tekst:
          'Do jazdy po drogach publicznych skuterem potrzebne jest prawo ' +
          'jazdy. Na terenie prywatnym udostępnionym przez organizatora ' +
          'zasady ustala on sam — zapytaj przy rezerwacji, kto może usiąść ' +
          'za kierownicą.',
      },
    ],
    sezon: 'zima, przy odpowiedniej pokrywie śnieżnej',
    doPotwierdzenia: true,
  },
  {
    slug: 'trasy-skiturowe',
    nazwa: 'Trasy skiturowe',
    kategorie: ['zima', 'aktywnie'],
    podkategoria: 'skitury',
    lokalizacja: 'pieniny',
    wyrozniona: true,
    trasy: ['RUBIN', 'KP01', '3A'],
    skrot: 'Podejścia w Beskidzie Sądeckim i Gorcach — bo same Pieniny są na skitury za niskie i za chronione.',
    opis: [
      'Trzeba powiedzieć wprost: Pieniny właściwe nie są terenem skiturowym. ' +
        'Są niskie — Trzy Korony mają 982 metry — a najciekawsze partie leżą ' +
        'w parku narodowym, gdzie poza wyznaczonymi szlakami poruszać się nie ' +
        'wolno, także na nartach. Śnieg trzyma się tu krótko i nierówno.',
      'Prawdziwe skitury zaczynają się tuż obok. Ze Szczawnicy podchodzi się ' +
        'na grzbiet Beskidu Sądeckiego — Dzwonkówka, dalej Przehyba (1175 m) ' +
        'i Radziejowa (1266 m), czyli najwyższy szczyt pasma. To są długie, ' +
        'leśne podejścia z otwarciem widokowym dopiero na górze i zjazdami ' +
        'duktami oraz polanami. Po drugiej stronie Dunajca ciągną się Gorce ' +
        'z Turbaczem — teren łagodniejszy, bardziej rozległy, popularny ' +
        'wśród zaczynających.',
      'W Małych Pieninach da się podejść na Wysoką (1050 m) i grzbietem ku ' +
        'Wysokiemu Wierchowi — technicznie łatwo, ale to teren graniczny ' +
        'i częściowo chroniony, więc trzeba trzymać się szlaków.',
      'Najprostszy wariant na rozgrzewkę jest w samej Szczawnicy: podejście ' +
        'stokiem Palenicy poza godzinami pracy wyciągu, za zgodą operatora. ' +
        'Szkółka na Palenicy prowadzi też kursy skiturowe dla tych, którzy ' +
        'chcą zacząć z instruktorem.',
    ],
    przewodnik: [
      {
        ikona: 'zasady',
        tytul: 'Park narodowy — tylko szlakami',
        tekst:
          'W Pienińskim Parku Narodowym obowiązuje ruch po wyznaczonych ' +
          'szlakach, również zimą i również na nartach. Zejście z trasy nie ' +
          'jest kwestią interpretacji — to wykroczenie i realne zagrożenie ' +
          'dla zimującej zwierzyny.',
      },
      {
        ikona: 'trasa',
        tytul: 'Dokąd podchodzić',
        tekst:
          'Beskid Sądecki: Dzwonkówka, Przehyba, Radziejowa — długie leśne ' +
          'podejścia i zjazdy duktami. Gorce z Turbaczem: łagodniej ' +
          'i szerzej. Małe Pieniny: Wysoka i grzbiet ku Wysokiemu Wierchowi.',
      },
      {
        ikona: 'sprzet',
        tytul: 'Czego potrzeba',
        tekst:
          'Poza sprzętem skiturowym — lawinowe ABC (detektor, sonda, ' +
          'łopata) i umiejętność jego użycia. Zagrożenie lawinowe w tych ' +
          'pasmach jest mniejsze niż w Tatrach, ale strome, wylesione stoki ' +
          'i żleby potrafią zaskoczyć po obfitych opadach.',
      },
      {
        ikona: 'sezon',
        tytul: 'Kiedy jest sens',
        tekst:
          'Najpewniej od stycznia do marca, i to wyżej — na grzbietach ' +
          'Beskidu i w Gorcach. W dolinach śnieg bywa krótko. Przed wyjściem ' +
          'sprawdź komunikat lawinowy i warunki na szlaku.',
      },
    ],
    sezon: 'zwykle od stycznia do marca, zależnie od pokrywy',
    doPotwierdzenia: true,
  },
  {
    slug: 'szkolki-narciarskie',
    nazwa: 'Szkółki narciarskie',
    kategorie: ['zima', 'rodziny'],
    podkategoria: 'narty',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
]

export function znajdzAtrakcjeTurystyczna(slug: string): AtrakcjaTurystyczna | null {
  return ATRAKCJE_TURYSTYCZNE.find((atrakcja) => atrakcja.slug === slug) ?? null
}

/** Atrakcje w kategorii, wyróżnione na początku. */
export function atrakcjeWKategorii(kategoria: KategoriaAtrakcji): AtrakcjaTurystyczna[] {
  return ATRAKCJE_TURYSTYCZNE.filter((a) => a.kategorie.includes(kategoria)).sort(
    (a, b) => Number(b.wyrozniona ?? false) - Number(a.wyrozniona ?? false),
  )
}

/** Czy atrakcja ma cokolwiek do pokazania poza nazwą. */
export function maTresc(atrakcja: AtrakcjaTurystyczna): boolean {
  return atrakcja.skrot.length > 0 || atrakcja.opis.length > 0
}

/**
 * Miejsce atrakcji w formie do pokazania.
 *
 * `miejscowosc` jest doprecyzowaniem tam, gdzie sama nazwa gminy to za mało
 * („Sromowce Wyżne — Szczawnica" przy spływie). Gdy go nie ma, wystarczy nazwa
 * lokalizacji z filtra — nie powtarzamy jej w każdym rekordzie.
 */
export function miejsceAtrakcji(atrakcja: AtrakcjaTurystyczna): string {
  return atrakcja.miejscowosc ?? nazwaLokalizacji(atrakcja.lokalizacja)
}
