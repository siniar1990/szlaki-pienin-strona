/**
 * Katalog atrakcji turystycznych Pienin.
 *
 * To jedyna treść w portalu, która NIE pochodzi z danych aplikacji — tam są
 * szlaki i punkty na nich, a nie spływ Dunajcem czy pijalnia wód. Dlatego
 * mieszka w osobnym pliku: gdy pojawi się CMS, ten katalog przenosi się do
 * niego jako pierwszy, bez ruszania warstwy tras.
 *
 * Zasada przy pisaniu opisów: wyłącznie to, co się nie zmienia z sezonu na
 * sezon. Żadnych cen, godzin otwarcia ani numerów telefonu — takie dane
 * starzeją się w kilka miesięcy, a portal, który podaje nieaktualną cenę
 * biletu, traci zaufanie szybciej, niż je zbudował. Od aktualiów są strony
 * operatorów.
 *
 * Wpisy oznaczone `doPotwierdzenia` opisują rzeczy, których nie da się
 * sprawdzić zdalnie — trzeba je potwierdzić na miejscu.
 */

export type GrupaAtrakcji =
  | 'dunajec'
  | 'jeziora'
  | 'wody'
  | 'przyroda'
  | 'zamki'
  | 'muzea'
  | 'swiatynie'
  | 'rodzinne'

export type AtrakcjaTurystyczna = {
  slug: string
  nazwa: string
  /** Gdzie to jest — nazwa miejscowości pokazywana na kafelku. */
  miejscowosc: string
  grupa: GrupaAtrakcji
  /** Jedno zdanie na kafelek. */
  skrot: string
  /** Pełny opis na stronę atrakcji. */
  opis: string[]
  sezon?: string
  /** Wymaga potwierdzenia na miejscu — szczegóły bywają zmienne. */
  doPotwierdzenia?: boolean
}

/**
 * Kategorie atrakcji.
 *
 * Osiem zamiast wcześniejszych siedmiu rozjeżdżających się grup. Zasada
 * porządkowania: nazwa kategorii ma odpowiadać na pytanie „co to za miejsce",
 * a nie „do której szuflady wpadło". Dlatego „Zamki" i „Wąwozy, wodospady
 * i rezerwaty" — a nie „Zabytki" i „Przyroda", pod którymi mieści się wszystko
 * i nic.
 */
export const GRUPY_ATRAKCJI: { klucz: GrupaAtrakcji; nazwa: string; opis: string }[] = [
  {
    klucz: 'dunajec',
    nazwa: 'Dunajec i spływ',
    opis: 'Przełom widziany z tratwy, przystanie flisackie, trasa rowerowa i kładka na słowacki brzeg.',
  },
  {
    klucz: 'przyroda',
    nazwa: 'Wąwozy, wodospady i rezerwaty',
    opis: 'Najbardziej efektowne miejsca, do których dojdziesz na własnych nogach.',
  },
  {
    klucz: 'zamki',
    nazwa: 'Zamki',
    opis: 'Dwie warownie stojące naprzeciw siebie nad Jeziorem Czorsztyńskim.',
  },
  {
    klucz: 'jeziora',
    nazwa: 'Jezioro i zapora',
    opis: 'Zbiornik między zamkami, rejsy i przejście koroną zapory.',
  },
  {
    klucz: 'wody',
    nazwa: 'Wody mineralne',
    opis: 'Szczawy, dla których w XIX wieku powstało uzdrowisko.',
  },
  {
    klucz: 'rodzinne',
    nazwa: 'Wyciągi i atrakcje rodzinne',
    opis: 'Wyjazd na górę bez wysiłku, zjazd, który dzieci zapamiętają, i przejażdżki konne.',
  },
  {
    klucz: 'muzea',
    nazwa: 'Muzea i zabytki',
    opis: 'Historia uzdrowiska i dawnych mieszkańców doliny Grajcarka.',
  },
  {
    klucz: 'swiatynie',
    nazwa: 'Kościoły i cerkwie',
    opis: 'Gotyckie polichromie i pozostałości po Rusi Szlachtowskiej.',
  },
]

export const ATRAKCJE_TURYSTYCZNE: AtrakcjaTurystyczna[] = [
  /* ── Dunajec i woda ──────────────────────────────────────────────────── */
  {
    slug: 'splyw-dunajcem-tratwami',
    nazwa: 'Spływ Dunajcem tratwami flisackimi',
    miejscowosc: 'Sromowce Wyżne — Szczawnica',
    grupa: 'dunajec',
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
    miejscowosc: 'Sromowce Wyżne',
    grupa: 'dunajec',
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
    miejscowosc: 'Szczawnica',
    grupa: 'dunajec',
    skrot: 'Koniec spływu i początek promenady wzdłuż Dunajca.',
    opis: [
      'Miejsce, w którym tratwy dobijają do brzegu po przepłynięciu przełomu. ' +
        'Stąd blisko do centrum uzdrowiska i do dolnej stacji kolei na Palenicę.',
    ],
  },
  {
    slug: 'jezioro-czorsztynskie-rejsy',
    nazwa: 'Jezioro Czorsztyńskie i rejsy statkiem',
    miejscowosc: 'Czorsztyn — Niedzica',
    grupa: 'jeziora',
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
    miejscowosc: 'Niedzica',
    grupa: 'jeziora',
    skrot: 'Korona zapory z widokiem na jezioro z jednej i dolinę Dunajca z drugiej strony.',
    opis: [
      'Zapora spiętrzająca Dunajec, która utworzyła Jezioro Czorsztyńskie. ' +
        'Koroną prowadzi przejście — z jednej strony rozciąga się widok na taflę ' +
        'jeziora i zamki, z drugiej na dolinę Dunajca i Pieniny.',
    ],
  },

  /* ── Wody mineralne ──────────────────────────────────────────────────── */
  {
    slug: 'pijalnia-wod-mineralnych',
    nazwa: 'Pijalnia wód mineralnych',
    miejscowosc: 'Szczawnica',
    grupa: 'wody',
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
    miejscowosc: 'Szczawnica',
    grupa: 'wody',
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

  /* ── Koleje i zjeżdżalnie ────────────────────────────────────────────── */
  {
    slug: 'kolej-na-palenice',
    nazwa: 'Kolej krzesełkowa na Palenicę',
    miejscowosc: 'Szczawnica',
    grupa: 'rodzinne',
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
    miejscowosc: 'Szczawnica',
    grupa: 'rodzinne',
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
    miejscowosc: 'Kluszkowce',
    grupa: 'rodzinne',
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
    miejscowosc: 'Jaworki',
    grupa: 'rodzinne',
    skrot: 'Wyjazd nad Jaworki, blisko wylotu Wąwozu Homole.',
    opis: [
      'Wyciąg wywozi na grzbiet nad Jaworkami. Blisko stąd do Wąwozu Homole ' +
        'i do szlaków w Małych Pieninach.',
    ],
    doPotwierdzenia: true,
  },

  /* ── Konie ───────────────────────────────────────────────────────────── */
  {
    slug: 'jazda-konna-i-bryczki',
    nazwa: 'Jazda konna i przejażdżki bryczką',
    miejscowosc: 'Szczawnica i okolice',
    grupa: 'rodzinne',
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

  /* ── Zamki, muzea, zabytki ───────────────────────────────────────────── */
  {
    slug: 'zamek-dunajec-w-niedzicy',
    nazwa: 'Zamek Dunajec w Niedzicy',
    miejscowosc: 'Niedzica',
    grupa: 'zamki',
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
    miejscowosc: 'Czorsztyn',
    grupa: 'zamki',
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
    miejscowosc: 'Szlachtowa',
    grupa: 'muzea',
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
    miejscowosc: 'Szczawnica',
    grupa: 'muzea',
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
    miejscowosc: 'Jaworki, Szlachtowa',
    grupa: 'swiatynie',
    skrot: 'Pozostałość po dawnych mieszkańcach doliny Grajcarka.',
    opis: [
      'Jaworki, Szlachtowa, Biała Woda i Czarna Woda tworzyły Ruś Szlachtowską — ' +
        'najdalej na zachód wysuniętą wyspę osadnictwa rusińskiego w Karpatach. ' +
        'Po wysiedleniach po drugiej wojnie światowej zostały po nich cerkwie, ' +
        'dziś użytkowane jako kościoły rzymskokatolickie.',
    ],
  },

  /* ── Przyroda ────────────────────────────────────────────────────────── */
  {
    slug: 'wawoz-homole',
    nazwa: 'Wąwóz Homole',
    miejscowosc: 'Jaworki',
    grupa: 'przyroda',
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
    miejscowosc: 'Jaworki',
    grupa: 'przyroda',
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
    miejscowosc: 'Jaworki',
    grupa: 'przyroda',
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
    miejscowosc: 'Krościenko nad Dunajcem',
    grupa: 'przyroda',
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
    miejscowosc: 'Krościenko nad Dunajcem',
    grupa: 'swiatynie',
    skrot: 'Gotycki kościół z zachowanymi średniowiecznymi malowidłami.',
    opis: [
      'Najstarszy zabytek Krościenka. We wnętrzu zachowały się gotyckie ' +
        'polichromie — rzadkość na tę skalę w małych karpackich kościołach.',
      'Stoi przy rynku, którego układ pamięta średniowieczną lokację miasta.',
    ],
  },

  /* ── Rower i kładki ──────────────────────────────────────────────────── */
  {
    slug: 'velo-dunajec',
    nazwa: 'Velo Dunajec',
    miejscowosc: 'wzdłuż Dunajca',
    grupa: 'dunajec',
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
    miejscowosc: 'Sromowce Niżne',
    grupa: 'dunajec',
    skrot: 'Przejście na słowacki brzeg przełomu, pieszo albo rowerem.',
    opis: [
      'Kładka nad Dunajcem łącząca polski brzeg ze słowackim Czerwonym ' +
        'Klasztorem. Po słowackiej stronie biegnie ścieżka wzdłuż przełomu — ' +
        'popularna trasa rowerowa z widokiem na ściany Trzech Koron.',
      'Granica jest otwarta, ale to nadal granica państwa: dowód osobisty ' +
        'albo paszport warto mieć przy sobie.',
    ],
  },
]

export function znajdzAtrakcjeTurystyczna(slug: string): AtrakcjaTurystyczna | null {
  return ATRAKCJE_TURYSTYCZNE.find((atrakcja) => atrakcja.slug === slug) ?? null
}

export function atrakcjeWGrupie(grupa: GrupaAtrakcji): AtrakcjaTurystyczna[] {
  return ATRAKCJE_TURYSTYCZNE.filter((atrakcja) => atrakcja.grupa === grupa)
}
