# Szlaki Pienin — portal szlakipienin.pl

To repozytorium to **aplikacja Next.js na Vercelu**, nie zbiór plików HTML.
Portal zaczynał jako statyczna strona i tak był tu opisany do sierpnia 2026;
dziś ma bazę danych, panel administracyjny, system tabliczek QR i dział
aktualności. Kod aplikacji mobilnej leży gdzie indziej — patrz koniec pliku.

## Zasady pisania

- **Wszystko po polsku**: nazwy plików, katalogów, komponentów, zmiennych,
  typów, komentarze i komunikaty commitów. Bez wyjątków. Wyjątkiem z natury
  rzeczy są słowa kluczowe języka i nazwy z bibliotek (`useState`, `Metadata`).
- **Komentarze mówią DLACZEGO**, nie co robi kod. Wzorzec z tego repozytorium:
  „Kopiujemy, a nie robimy dowiązania, bo w maszynie budującej repozytorium
  aplikacji nie istnieje”. Kod tutaj jest gęsto opatrzony powodami decyzji
  i to jest celowe — po pół roku nikt nie pamięta, czemu coś jest tak, a nie
  inaczej. Dopisując kod, dopisuj też powód.
- **Zależności dokładamy niechętnie.** Reguła „zero zależności” padła wraz
  z przejściem na Next.js, ale duch został: lista w `package.json` jest krótka
  i każda pozycja robi coś, czego nie da się rozsądnie napisać samemu (Prisma,
  MapLibre, sharp, qrcode). Zanim dołożysz bibliotekę do rzeczy, którą da się
  zrobić w trzydziestu linijkach — napisz te trzydzieści linijek.
- **Barwy siedzą w `src/app/globals.css`** w bloku `@theme`, w OKLCH. Trzy
  rodziny: `las` (zieleń, kolor wiodący), `dunajec` (błękit), `kamien`
  (szarości wapienia). Kontrasty są sprawdzone pod WCAG 2.2 AA i opisane
  w komentarzu przy palecie — nie psuj tego doborem „na oko”.
- **Trybu ciemnego portal dziś nie ma.** Zmienne dla klasy `.dark` istnieją
  (mechanizm z shadcn), ale nikt tej klasy nie ustawia. To nie jest usterka
  do naprawienia przy okazji.

## Stos

| warstwa | co |
|---|---|
| framework | Next.js 16 (App Router, komponenty serwerowe), React 19 |
| język | TypeScript, `ignoreBuildErrors: false` — błąd typu zatrzymuje wdrożenie |
| wygląd | Tailwind 4 (konfiguracja w CSS, nie w `tailwind.config`), shadcn/ui, ikony lucide |
| baza | PostgreSQL na Neonie, Prisma z adapterem serverless |
| mapy | MapLibre GL, dane z `public/dane/` |
| obrazy | sharp — kadrowanie, WebP, kody QR, odznaki |
| model językowy | Claude przez API — wyłącznie w dziale aktualności |
| testy | Vitest (`npm test`) |
| hosting | Vercel, region `fra1` |

## Podsystemy

Portal to sześć w miarę niezależnych kawałków. Warto wiedzieć, w którym się
grzebie, bo mają różne wymagania.

**Portal treściowy** (`/`, `/szlaki`, `/atrakcje`, `/miejscowosci`,
`/wyzwania`) — strony budowane przy wdrożeniu z plików w `public/dane/`
i z list w `src/lib/tresc/`. Bez bazy danych, bez żądań w czasie rzeczywistym.
To jest rdzeń i większość ruchu.

**Dziś** (`/dzis`) — pogoda, jakość powietrza, stan wody na Dunajcu, wschód
i zachód słońca, propozycje tras na dzisiaj. Dane z open-meteo i IMGW,
pobierane przy żądaniu. Kod w `src/lib/dzis/`.

**Aktualności** (`/aktualnosci`) — dział prowadzony półautomatycznie. Obchód
źródeł co dwanaście godzin zbiera artykuły z lokalnych serwisów, model
językowy ocenia je i pisze szkic notki, a **publikuje wyłącznie człowiek
w panelu**. Trasa redakcyjna nigdy niczego nie wypuszcza sama — to nie jest
niedoróbka, tylko warunek, żeby portal mógł podpisać notkę „Redakcja”.
Kod w `src/lib/wiadomosci/`, model dobrany na dwa etapy: tańszy wybiera
artykuł, mocniejszy pisze.

**Tabliczki QR** (`/qr/[kod]`, `/panel/kody`) — kody na tabliczkach w terenie.
Skan trafia na `/qr/[kod]`, portal rozpoznaje urządzenie i kieruje do sklepu
albo na stronę trasy, po drodze zapisując skan. Boty są odfiltrowywane po
zakresach adresów centrów danych (`src/lib/qr/sieci-centrow.json`). Całość
uruchomienia opisuje `narzedzia/system-qr.md`. **To jedyny powód, dla którego
portal nie jest eksportem statycznym** — reszta by się wyeksportowała.

**Panel** (`/panel`) — logowanie hasłem, sesja w ciasteczku, osłona
w `src/middleware.ts` obejmująca całe gałęzie adresów naraz. Osłanianie
każdej strony osobno kończy się tym, że ktoś doda nową i zapomni.

**SEO i analityka** — mapy witryny, RSS, karty Open Graph generowane
z tych samych zdjęć, z których żyje portal (`/og/[rodzaj]/[slug]`), liczniki
odsłon we własnej bazie, dane z Search Console przez konto usługi.

## Gdzie co leży

```
src/app/              trasy portalu (App Router)
  api/cron/           zadania cykliczne — konserwacja, obchód, redakcja
  panel/              panel administracyjny (osłonięty middleware)
  qr/[kod]/           skan tabliczki
  og/[rodzaj]/[slug]/ obrazy do kart Open Graph, składane sharpem
src/components/       komponenty, w katalogach wg działu portalu
src/lib/
  dane/               czytanie `public/dane/`, typy tras, zdjęcia, kategorie
  tresc/              treści pisane ręcznie: atrakcje, miejscowości
  dzis/               pogoda, woda, powietrze, słońce
  wiadomosci/         obchód źródeł, ocena, pisanie notek
  qr/                 kody, skany, klasyfikacja botów, statystyki
  panel/              sesja, zadania panelu
  seo/                mapy witryny, Open Graph, daty zmian stron
  konfiguracja.ts     adresy, nazwy, sklepy — zmiany „w jednym miejscu”
narzedzia/            skrypty robocze (opis w nagłówku każdego pliku)
prisma/schema.prisma  model bazy
public/dane/          KOPIA Z APLIKACJI — nie edytuj ręcznie
public/marka/         nasze zasoby: zdjęcia, logo, ikony, obrazy OG
```

## Dane z aplikacji

Katalog `public/dane/` to **kopia**, nie oryginał. Przynosi ją:

```bash
npm run dane        # ./narzedzia/synchronizuj-dane.sh
```

Kopiowanie idzie w jedną stronę: **aplikacja → portal**. Aplikacja jest
źródłem prawdy. Gdyby dało się edytować opis trasy po stronie WWW, po tygodniu
nikt by nie wiedział, która wersja jest właściwa.

Zawartość:

- `trasy/index.json` — spis wszystkich pozycji ze skróconą metryką
  (dziś 51 tras i 3 wyzwania; nie przepisuj tej liczby do kodu, licz z pliku)
- `trasy/<ID>.json` — pełny opis: punkty etapowe, segmenty, ostrzeżenia
- `slady/<ID>.geojson` — ślad trasy (LineString, z wysokościami)
- `ilustracje/<ID>.webp` — malowany obrazek trasy (420 × 260)
- `wyzwania/` + `wyzwania.json` — odznaki PTTK
- `okolica/`, `szlaki/`, `zdjecia/`, `obrazy/` — warstwy mapy i fotografie

Synchronizacja używa `rsync --delete`. **Cokolwiek własnego położysz w
`public/dane/`, zniknie** przy najbliższym uruchomieniu. Jeśli potrzebujesz
danych, których skrypt nie kopiuje, dopisz je do skryptu, a nie kopiuj ręcznie.

## Zdjęcia

Rozdział jest prosty: `public/dane/` przychodzi z aplikacji i bywa kasowane,
`public/marka/` jest nasze i zostaje. Dlatego wszystkie fotografie, które
dokładamy sami, leżą w `marka/`, a mechanizm wszędzie jest ten sam — plik
o właściwej nazwie wygrywa z zasobem zapasowym, bez zmiany w kodzie:

| katalog | klucz nazwy pliku | zapasowo |
|---|---|---|
| `marka/trasy/` | identyfikator trasy (`4D.webp`) | malowana ilustracja z aplikacji |
| `marka/kategorie/` | slug kategorii | ilustracja wskazanej trasy |
| `marka/atrakcje/` | slug atrakcji | pole w barwach marki |
| `marka/miejscowosci/` | slug miejscowości | zdjęcie zastępcze z listy |

### Karty do druku

Każda trasa ma kartę A4 do wydrukowania i złożenia w kieszonkowy przewodnik:
przycisk „Wersja do druku" na stronie trasy, podgląd pod `/szlaki/<slug>/druk`,
plik pod `/szlaki/<slug>/pdf`. PDF-y powstają poleceniem `npm run karty`
i leżą gotowe w `public/druk/`, więc żadne żądanie nie uruchamia przeglądarki.
Opis w `narzedzia/karty-druku.md`. **Po `npm run dane` uruchom `npm run karty`** —
test przypomni, jeśli zapomnisz.

Sprawdzenie istnienia pliku dzieje się przy budowaniu (`src/lib/dane/zdjecia-*.ts`),
więc do przeglądarki trafia gotowy adres. Zdjęcia tras przygotowuje
`npm run zdjecia:trasy -- <katalog>` — opis w `narzedzia/zdjecia-tras.md`,
kafelków kategorii w `narzedzia/zdjecia-kategorii.md`.

## Praca lokalna

```bash
npm run dev          # podgląd na localhost:3000
npm test             # Vitest
npm run lint         # ESLint
npm run build        # to samo, co robi Vercel — łapie błędy typów
npm run dane         # przynosi dane z aplikacji
npm run karty        # składa karty tras do druku (po każdym `npm run dane`)
```

Portal uruchomi się bez bazy danych; padną wyłącznie panel, tabliczki QR
i aktualności. Do reszty wystarczy `public/dane/`.

Zmienne środowiskowe (`.env`, wzór w `.env.example`):

| zmienna | do czego |
|---|---|
| `DATABASE_URL` | Neon; bez niej panel i statystyki nie działają |
| `DIRECT_URL` | połączenie bez puli — do migracji Prismy |
| `HASLO_PANELU` | skrót hasła — wytwarza go `npm run haslo` |
| `SEKRET_SESJI` | podpis ciasteczka sesji panelu |
| `SEKRET_TRAFIEN` | podpis tokenu zliczania skanów tabliczek |
| `SEKRET_ZADAN` | uwierzytelnia zadania z GitHub Actions |
| `CRON_SECRET` | uwierzytelnia zadanie dobowe z Vercela |
| `KLUCZ_ANTHROPIC` | model językowy w dziale aktualności |
| `GOOGLE_KONTO_USLUGI_*`, `GOOGLE_WITRYNA` | dane z Search Console w panelu |
| `GOOGLE_WERYFIKACJA` | znacznik potwierdzający własność witryny |

## Publikacja

`git push` do `main` uruchamia wdrożenie na Vercelu. Nie ma osobnego
workflow publikującego — GitHub Actions robi tu dwie inne rzeczy:

- `daty-stron.yml` — po każdym pushu odświeża `src/lib/seo/daty-stron.json`,
  bo maszyna budująca na Vercelu nie ma historii gita, a mapa witryny
  potrzebuje daty zmiany osobno dla każdego adresu,
- `zadania.yml` — obchód źródeł co dwanaście godzin i redakcja co godzinę;
  darmowy plan Vercela dopuszcza jedno zadanie dobowe i zajmuje je już
  konserwacja statystyk (`vercel.json`).

`prebuild` w `package.json` scala ślady w jeden GeoJSON i przygotowuje odznaki.
To jedyne rzeczy generowane przy wdrożeniu.

## Rzeczy, o które łatwo się potknąć

- **`/prywatnosc` i `/wsparcie` są podane w App Store Connect.** Bez tych
  dwóch działających adresów Apple nie wypuści aktualizacji aplikacji.
  Stare adresy z `.html` żyją jako trwałe przekierowania w `next.config.ts` —
  nie usuwaj ich. Zmieniając treść, sprawdź, czy nadal opisuje prawdę.
- **Trasa może nie mieć śladu ani ilustracji.** Część szczytów Korony Pienin
  nie ma nagranego przebiegu. Kod musi to znosić bez wywracania się —
  i dziś znosi, więc nie zakładaj, że każde pole jest wypełnione.
- **Metryki wyzwań pochodzą z regulaminów PTTK**, nie z pomiaru naszego śladu.
  Rozbieżności opisuje `dokumenty/rozbieznosci-wyzwania.md` w repozytorium
  aplikacji. Publikując liczby, bierz te z regulaminu — do nich turysta
  się porównuje.
- **Nie wymyślaj współrzędnych.** Wszystkie punkty pochodzą z OSM albo
  z pomiarów. Brakuje czegoś — poszukaj w danych, nie zgaduj.
- **Dział aktualności nie publikuje sam.** Jeśli zmieniasz coś w redakcji,
  ta granica ma zostać.
- **Nie przepisuj liczb z tego pliku do kodu.** Liczba tras, wersja aplikacji,
  lista kategorii — wszystko to ma jedno źródło w danych i tam należy sięgać.
  Ten dokument opisywał statyczną stronę bez npm jeszcze długo po tym, jak
  portal dostał bazę danych i panel; liczby starzeją się pierwsze.

---

# Aplikacja mobilna — co warto o niej wiedzieć

Kod: `~/Desktop/Szczawnica/Aplikacja Szlaki` (repozytorium **prywatne**
`siniar1990/Aplikacja-Szlaki`). Portal stoi w osobnym, publicznym
repozytorium — początkowo dlatego, że GitHub Pages w darmowym planie
publikuje wyłącznie z publicznych; dziś dlatego, że to dwa różne projekty
o różnym tempie zmian.

## Czym jest

**Szlaki Pienin** — przewodnik po Pieninach i Beskidzie Sądeckim na iOS
i Androida. Flutter + Riverpod + MapLibre. Identyfikator
`pl.szczawnica.szlakiPienin`. Jest w App Store; wersja Androida jeszcze nie
(adres w `SKLEPY` w `src/lib/konfiguracja.ts` jest pusty, a przycisk sam
pokazuje wtedy „Wkrótce”). Aktualną wersję sprawdzaj w `pubspec.yaml`
aplikacji, nie tutaj.

Darmowa, bez konta, bez wersji premium i bez reklam firm. Nagrania tras
zostają w telefonie.

Robi ją jedna osoba — właściciel Frankowych Domków i Helenówki w Szczawnicy.
Opisy wielu tras powstały dzięki uprzejmości **PTTK Szczawnica** i są
inspirowane przewodnikiem „Szlaki pełne zdrowia”. **To trzeba oddawać** —
w aplikacji i na portalu.

## Co potrafi

- trasy z opisem krok po kroku, profilem wysokościowym i wskazówkami
- mapa działająca **bez zasięgu** (wektorowa; Teren i Satelita wymagają sieci)
- oficjalne szlaki znakowane z OSM w pięciu barwach
- „Blisko mnie” — trasy wg odległości do **najbliższego punktu szlaku**,
  nie do jego początku
- nawigacja od bieżącej pozycji na szlak, potem szlakiem
- nagrywanie marszu z pauzą, profil wysokościowy, eksport **GPX**
- **Pienińskie wyzwania** — odznaki PTTK
- kategorie: krótkie, średnie, długie, niecodzienne, Trzy Korony, z dziećmi,
  rowerowe, Korony Pienin, z psem

Ilustracje tras są malowane proceduralnie skryptem w aplikacji
(`tools/ilustracje/sceny.py`), nie rysowane ręcznie. Na portalu ustępują
miejsca fotografii wszędzie tam, gdzie ją mamy.

## Gdzie co leży w aplikacji

```
assets/trasy/          opisy tras + index.json
assets/trasy/gpx/      ślady (GeoJSON)
assets/ilustracje/     malowane obrazki tras
assets/wyzwania/       odznaki PTTK + wyzwania.json
lib/data/models/       model trasy (Kategoria, KolorSzlaku…)
lib/core/motyw.dart    barwy — pierwowzór palety portalu
CHANGELOG.md           historia wersji
sklep/                 teksty do App Store Connect
dokumenty/             notatki, m.in. rozbieżności w wyzwaniach
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
