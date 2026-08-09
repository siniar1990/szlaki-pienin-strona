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
    skrot: 'Szczawy, dla których w XIX wieku powstało całe uzdrowisko.',
    opis: [
      'Szczawnica wzięła nazwę od szczaw — wód mineralnych nasyconych dwutlenkiem ' +
        'węgla, wypływających w dolinie Grajcarka. To dla nich Józef Szalay ' +
        'zbudował w XIX wieku uzdrowisko, które do dziś wyznacza charakter miasta.',
      'W pijalni można spróbować wód z kilku ujęć — mają różny smak i różny skład ' +
        'mineralny, od łagodnych po wyraźnie słone. Kubek do wód kupisz na miejscu; ' +
        'tradycją jest picie ich powoli, spacerując po parku.',
      'Wody różnią się na tyle, że warto spróbować kilku i wybrać swoją — ' +
        'to jedna z niewielu atrakcji w Pieninach, która nie zależy od pogody.',
    ],
  },
  {
    slug: 'zdroje-szczawnicy',
    nazwa: 'Zdroje w parkach zdrojowych',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    skrot: 'Ujęcia wód rozsiane po Parku Dolnym i Górnym, każde z własnym imieniem.',
    opis: [
      'Poszczególne źródła noszą imiona — Magdalena, Stefan, Wanda, Józefina, ' +
        'Szymon — nadane w czasach Szalayów. Część ujęć znajduje się przy ' +
        'promenadzie i w parkach zdrojowych, gdzie łatwo trafić na nie spacerem.',
      'Spacer między zdrojami to dobry pomysł na dzień, w którym w górach wisi ' +
        'mgła: całość mieści się w granicach uzdrowiska i jest po płaskim.',
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
    skrot: 'Tor saneczkowy obok kolei krzesełkowej — zjazd sterowany hamulcem.',
    opis: [
      'Tor grawitacyjny biegnący serpentynami po stoku Palenicy; wózki ' +
        'rozpędzają się do dwudziestu trzech kilometrów na godzinę. Jedzie się ' +
        'na szynie, samodzielnie regulując prędkość dźwignią hamulca, więc zjazd ' +
        'da się dopasować i do dziecka, i do amatora mocnych wrażeń.',
      'To najczęściej wskazywana atrakcja na deszczowe popołudnie z dziećmi ' +
        'i naturalne dopełnienie wyjazdu koleją.',
    ],
    doPotwierdzenia: true,
  },
  {
    slug: 'czorsztyn-ski-kluszkowce',
    nazwa: 'Czorsztyn-Ski w Kluszkowcach',
    kategorie: ['zima', 'rodziny'],
    podkategoria: 'narty',
    lokalizacja: 'kluszkowce',
    skrot: 'Kolej krzesełkowa na Wdżar i całoroczny tor saneczkowy nad jeziorem.',
    opis: [
      'Ośrodek na stoku góry Wdżar nad Jeziorem Czorsztyńskim. Zimą stok ' +
        'narciarski, poza sezonem — kolej krzesełkowa i tor saneczkowy ' +
        'z widokiem na jezioro i zamki.',
      'Z góry widać jednocześnie taflę jeziora, oba zamki i pasmo Pienin, ' +
        'więc sam wyjazd koleją ma sens także bez zjeżdżania.',
    ],
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
    skrot: '',
    opis: [],
  },
  {
    slug: 'park-gorny',
    nazwa: 'Park Górny',
    kategorie: ['kultura', 'rodziny'],
    podkategoria: 'uzdrowisko',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
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
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'paintball',
    nazwa: 'Paintball',
    kategorie: ['aktywnie'],
    podkategoria: 'paintball',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'kuligi',
    nazwa: 'Kuligi',
    kategorie: ['aktywnie', 'zima'],
    podkategoria: 'jazda-konna',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'warsztaty-lokalne',
    nazwa: 'Lokalne warsztaty',
    kategorie: ['aktywnie', 'kultura'],
    podkategoria: 'warsztaty',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'degustacje-regionalne',
    nazwa: 'Degustacje produktów regionalnych',
    kategorie: ['aktywnie', 'kultura'],
    podkategoria: 'warsztaty',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'wypozyczalnie-rowerow',
    nazwa: 'Wypożyczalnie rowerów',
    kategorie: ['aktywnie'],
    podkategoria: 'rowery',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
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
    slug: 'przystan-kajakowa-kroscienko',
    nazwa: 'Przystań kajakowa w Krościenku',
    kategorie: ['aktywnie'],
    podkategoria: 'przystanie',
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
    skrot: '',
    opis: [],
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
    slug: 'bacowki-regionalne',
    nazwa: 'Bacówki regionalne',
    kategorie: ['kultura', 'aktywnie'],
    podkategoria: 'warsztaty',
    lokalizacja: 'pieniny',
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
    skrot: '',
    opis: [],
  },
  {
    slug: 'trasy-skiturowe',
    nazwa: 'Trasy skiturowe',
    kategorie: ['zima', 'aktywnie'],
    podkategoria: 'skitury',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
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
