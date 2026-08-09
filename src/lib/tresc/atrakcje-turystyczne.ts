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
    miejscowosc: 'Sromowce — Szczawnica',
    wyrozniona: true,
    trasy: ['DP'],
    skrot: 'Przełom Dunajca z pokładu tratwy prowadzonej przez flisaka. Dwie przystanie początkowe, meta zawsze w Szczawnicy.',
    opis: [
      'Najbardziej znana atrakcja Pienin i jedyny sposób, żeby zobaczyć przełom ' +
        'Dunajca od strony wody. Tratwą steruje flisak, który po drodze ' +
        'opowiada o mijanych skałach i legendach — płynie się pod ścianami ' +
        'Trzech Koron i Sokolicy.',
      'Spływ zaczyna się na jednej z dwóch przystani: w Sromowcach Wyżnych — ' +
        'Kątach albo w Sromowcach Niżnych. Kąty leżą wyżej rzeki, więc ta trasa ' +
        'jest dłuższa; ze Sromowiec Niżnych płynie się krócej. Bilety kupuje ' +
        'się w kasach na obu przystaniach.',
      'Niezależnie od tego, skąd się wypływa, spływ kończy się w Szczawnicy, ' +
        'przy przystani z ozdobną drewnianą bramą. Tradycja flisacka na Dunajcu ' +
        'sięga XIX wieku i jest przekazywana w pienińskich rodzinach ' +
        'z pokolenia na pokolenie.',
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
    kategorie: ['aktywnie'],
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
    nazwa: 'Grajcarek i promenada',
    kategorie: ['woda', 'rodziny', 'aktywnie'],
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
    slug: 'wedkarstwo',
    nazwa: 'Wędkarstwo',
    kategorie: ['aktywnie'],
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
