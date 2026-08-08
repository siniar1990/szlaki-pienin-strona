import { nazwaLokalizacji } from './kategorie-atrakcji'
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
    wyrozniona: true,
    skrot: 'Przełom Dunajca z pokładu tratwy prowadzonej przez flisaka w stroju góralskim.',
    opis: [
      'Najbardziej znana atrakcja Pienin i jedyny sposób, żeby zobaczyć przełom ' +
        'Dunajca od strony wody. Tratwy wypływają z przystani w Kątach w Sromowcach ' +
        'Wyżnych i płyną przełomem pod ścianami Trzech Koron i Sokolicy.',
      'Spływ kończy się w Szczawnicy albo — na krótszym wariancie — w Krościenku. ' +
        'Tratwą steruje flisak, który po drodze opowiada o mijanych skałach i ' +
        'legendach; tradycja flisacka na Dunajcu sięga XIX wieku i jest ' +
        'przekazywana w pienińskich rodzinach z pokolenia na pokolenie.',
      'Powrót do samochodu zostawionego w Kątach organizują przewoźnicy busami; ' +
        'można też wrócić rowerem ścieżką wzdłuż rzeki.',
    ],
    sezon: 'od wiosny do jesieni, zależnie od stanu wody',
  },
  {
    slug: 'przystan-flisacka-katy',
    nazwa: 'Przystań flisacka w Kątach',
    kategorie: ['woda'],
    podkategoria: 'przystanie',
    lokalizacja: 'sromowce',
    skrot: 'Miejsce, w którym zaczyna się spływ przełomem Dunajca.',
    opis: [
      'Główna przystań flisacka. Stąd wypływają tratwy w przełom Dunajca. ' +
        'Przy przystani jest duży parking, punkty gastronomiczne i stragany.',
      'Warto przyjechać wcześnie rano — w szczycie sezonu kolejka do tratw ' +
        'potrafi być długa, a poranne światło w przełomie jest najładniejsze.',
    ],
  },
  {
    slug: 'przystan-flisacka-szczawnica',
    nazwa: 'Przystań flisacka w Szczawnicy',
    kategorie: ['woda'],
    podkategoria: 'przystanie',
    lokalizacja: 'szczawnica',
    skrot: 'Koniec spływu i początek promenady wzdłuż Dunajca.',
    opis: [
      'Miejsce, w którym tratwy dobijają do brzegu po przepłynięciu przełomu. ' +
        'Stąd blisko do centrum uzdrowiska i do dolnej stacji kolei na Palenicę.',
    ],
  },
  {
    slug: 'jezioro-czorsztynskie-rejsy',
    nazwa: 'Jezioro Czorsztyńskie i rejsy statkiem',
    kategorie: ['woda', 'rodziny'],
    podkategoria: 'rejsy',
    lokalizacja: 'czorsztyn',
    wyrozniona: true,
    skrot: 'Sztuczne jezioro między dwoma zamkami, z rejsami wzdłuż brzegów.',
    opis: [
      'Zbiornik powstał po spiętrzeniu Dunajca zaporą w Niedzicy. Z jego taflą ' +
        'sąsiadują dwa zamki stojące naprzeciw siebie: ruiny Czorsztyna po ' +
        'północnej stronie i zamek Dunajec w Niedzicy po południowej.',
      'Po jeziorze kursują statki i mniejsze jednostki, łączące przystanie po ' +
        'obu stronach. To najwygodniejszy sposób, żeby zobaczyć oba zamki ' +
        'jednego dnia bez objeżdżania jeziora samochodem.',
    ],
    sezon: 'sezon letni',
    doPotwierdzenia: true,
  },
  {
    slug: 'zapora-w-niedzicy',
    nazwa: 'Zapora w Niedzicy',
    kategorie: ['kultura', 'woda'],
    podkategoria: 'technika',
    lokalizacja: 'niedzica',
    skrot: 'Korona zapory z widokiem na jezioro z jednej i dolinę Dunajca z drugiej strony.',
    opis: [
      'Zapora spiętrzająca Dunajec, która utworzyła Jezioro Czorsztyńskie. ' +
        'Koroną prowadzi przejście — z jednej strony rozciąga się widok na taflę ' +
        'jeziora i zamki, z drugiej na dolinę Dunajca i Pieniny.',
    ],
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
    skrot: 'Wyjazd nad Szczawnicę w kilka minut — i początek kilku szlaków.',
    opis: [
      'Kolej wywozi z centrum uzdrowiska na Palenicę (722 m n.p.m.). Z góry ' +
        'rozciąga się widok na Szczawnicę, dolinę Dunajca i pienińskie grzbiety, ' +
        'a przy dobrej widoczności także na Tatry.',
      'Dla wielu tras opisanych w tym portalu Palenica jest punktem startowym — ' +
        'kolej pozwala oszczędzić pierwsze, najbardziej mozolne podejście ' +
        'i zacząć wędrówkę od razu na grzbiecie.',
    ],
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
      'Tor grawitacyjny biegnący stokiem Palenicy. Jedzie się w wózku na ' +
        'szynie, samodzielnie regulując prędkość dźwignią hamulca, więc zjazd ' +
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
    slug: 'jazda-konna-i-bryczki',
    nazwa: 'Jazda konna i przejażdżki bryczką',
    kategorie: ['aktywnie', 'rodziny'],
    podkategoria: 'jazda-konna',
    lokalizacja: 'szczawnica',
    skrot: 'Bryczki w uzdrowisku i stajnie oferujące jazdę w terenie.',
    opis: [
      'Przejażdżka bryczką po uzdrowisku należy do szczawnickiej tradycji — ' +
        'powozy zabierają na trasę wzdłuż promenady i dolinami. Zimą, przy ' +
        'odpowiednim śniegu, bryczki zastępują sanie.',
      'W okolicy działają też stajnie prowadzące jazdę konną w terenie ' +
        'i naukę jazdy, w tym z końmi rasy huculskiej — odpornej góralskiej ' +
        'rasie przystosowanej do stromego terenu.',
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
    skrot: 'Wapienna szczelina ze ścianami wysokimi na kilkadziesiąt metrów.',
    opis: [
      'Najbardziej efektowny wąwóz w Pieninach: potok wyżłobił w wapieniu ' +
        'wąską szczelinę, nad którą ściany wznoszą się na kilkadziesiąt metrów. ' +
        'Dnem prowadzi wygodna ścieżka z kładkami.',
      'Przejście jest krótkie i nadaje się dla dzieci, ale bywa mokro i ślisko — ' +
        'buty z porządną podeszwą są tu bardziej na miejscu niż sandały. ' +
        'Wąwóz leży w rezerwacie, więc obowiązuje ścieżka i cisza.',
    ],
  },
  {
    slug: 'wodospad-zaskalnik',
    nazwa: 'Wodospad Zaskalnik',
    kategorie: ['przyroda'],
    podkategoria: 'wodospady',
    lokalizacja: 'jaworki',
    wyrozniona: true,
    skrot: 'Kilkumetrowy wodospad w rezerwacie, kilkanaście minut od drogi.',
    opis: [
      'Wodospad na potoku w rezerwacie Zaskalskie-Bodnarówka, do którego ' +
        'prowadzi krótkie dojście od drogi na Jaworki. Najokazalszy po ' +
        'roztopach i po większych opadach.',
    ],
  },
  {
    slug: 'rezerwat-biala-woda',
    nazwa: 'Rezerwat Biała Woda',
    kategorie: ['przyroda'],
    podkategoria: 'rezerwaty',
    lokalizacja: 'jaworki',
    skrot: 'Dolina z wapiennymi ostańcami i śladami po nieistniejącej wsi.',
    opis: [
      'Dolina potoku Biała Woda z charakterystycznymi skalnymi ostańcami ' +
        'sterczącymi ponad łąkami. Trasa jest łagodna i szeroka, dobra ' +
        'z dziećmi i z wózkiem terenowym na pierwszym odcinku.',
      'W dolinie stała kiedyś wieś o tej samej nazwie — po jej mieszkańcach ' +
        'zostały fundamenty i zdziczałe drzewa owocowe.',
    ],
  },
  {
    slug: 'pieninski-park-narodowy',
    nazwa: 'Pieniński Park Narodowy',
    kategorie: ['przyroda'],
    podkategoria: 'parki',
    lokalizacja: 'kroscienko',
    wyrozniona: true,
    skrot: 'Park chroniący przełom Dunajca; pawilon wejściowy w Krościenku.',
    opis: [
      'Park narodowy obejmujący Pieniny Właściwe z przełomem Dunajca, Trzema ' +
        'Koronami i Sokolicą. Obowiązują w nim bilety wstępu, ruch wyłącznie ' +
        'po znakowanych szlakach i zakaz wprowadzania psów.',
      'W Krościenku działa Pawilon Wejściowy z wystawą o przyrodzie Pienin — ' +
        'warto zajrzeć przed wyjściem na Trzy Korony, żeby wiedzieć, na co patrzeć.',
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
    kategorie: ['aktywnie', 'woda'],
    podkategoria: 'rowery',
    lokalizacja: 'pieniny',
    skrot: 'Asfaltowa trasa rowerowa wzdłuż rzeki, bez ruchu samochodowego.',
    opis: [
      'Trasa rowerowa biegnąca doliną Dunajca, w dużej części wydzielona ' +
        'z ruchu samochodowego. Odcinek pieniński prowadzi wzdłuż Jeziora ' +
        'Czorsztyńskiego i dalej ku Szczawnicy.',
      'Najpopularniejsze połączenie: zjazd tratwą albo pontonem w dół rzeki ' +
        'i powrót rowerem tą samą doliną, ale po drugiej stronie wody.',
    ],
  },
  {
    slug: 'kladka-do-czerwonego-klasztoru',
    nazwa: 'Kładka pieszo-rowerowa do Czerwonego Klasztoru',
    kategorie: ['woda', 'aktywnie'],
    podkategoria: 'rowery',
    lokalizacja: 'sromowce',
    skrot: 'Przejście na słowacki brzeg przełomu, pieszo albo rowerem.',
    opis: [
      'Kładka nad Dunajcem łącząca polski brzeg ze słowackim Czerwonym ' +
        'Klasztorem. Po słowackiej stronie biegnie ścieżka wzdłuż przełomu — ' +
        'popularna trasa rowerowa z widokiem na ściany Trzech Koron.',
      'Granica jest otwarta, ale to nadal granica państwa: dowód osobisty ' +
        'albo paszport warto mieć przy sobie.',
    ],
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
    nazwa: 'Promenada nad Grajcarkiem',
    kategorie: ['rodziny', 'aktywnie'],
    podkategoria: 'spacery',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'palenica',
    nazwa: 'Palenica',
    kategorie: ['przyroda', 'rodziny'],
    podkategoria: 'punkty-widokowe',
    lokalizacja: 'szczawnica',
    skrot: '',
    opis: [],
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
    slug: 'przystan-flisacka-sromowce-nizne',
    nazwa: 'Przystań flisacka w Sromowcach Niżnych',
    kategorie: ['woda'],
    podkategoria: 'przystanie',
    lokalizacja: 'sromowce',
    skrot: '',
    opis: [],
  },
  {
    slug: 'rafting-na-dunajcu',
    nazwa: 'Rafting na Dunajcu',
    kategorie: ['woda', 'aktywnie'],
    podkategoria: 'splywy',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'kajaki-na-dunajcu',
    nazwa: 'Kajaki na Dunajcu',
    kategorie: ['woda', 'aktywnie'],
    podkategoria: 'splywy',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
  },
  {
    slug: 'przeprawa-przez-dunajec',
    nazwa: 'Przeprawa przez Dunajec',
    kategorie: ['woda'],
    podkategoria: 'przeprawy',
    lokalizacja: 'sromowce',
    skrot: '',
    opis: [],
  },
  {
    slug: 'wedkarstwo',
    nazwa: 'Wędkarstwo',
    kategorie: ['woda', 'aktywnie'],
    podkategoria: 'wedkarstwo',
    lokalizacja: 'pieniny',
    skrot: '',
    opis: [],
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
    kategorie: ['woda', 'aktywnie'],
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
    kategorie: ['woda', 'rodziny'],
    podkategoria: 'plaze',
    lokalizacja: 'czorsztyn',
    skrot: '',
    opis: [],
  },
  {
    slug: 'plaza-w-niedzicy',
    nazwa: 'Plaża w Niedzicy',
    kategorie: ['woda', 'rodziny'],
    podkategoria: 'plaze',
    lokalizacja: 'niedzica',
    skrot: '',
    opis: [],
  },
  {
    slug: 'elektrownia-wodna-niedzica',
    nazwa: 'Elektrownia wodna w Niedzicy',
    kategorie: ['kultura'],
    podkategoria: 'technika',
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
