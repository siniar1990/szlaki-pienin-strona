# Strona aplikacji Szlaki Pienin

To repozytorium to **statyczna strona WWW**. Kod aplikacji mobilnej leży
gdzie indziej — patrz niżej.

## Zasady pisania

- **Wszystko po polsku**: nazwy plików, klas CSS, zmiennych w JS, komentarze,
  komunikaty commitów. Bez wyjątków, tak samo jak w aplikacji.
- **Zero zależności zewnętrznych.** Brak frameworka, brak npm, brak CDN-ów.
  Czysty HTML, CSS i odrobina JavaScriptu. Strona ma działać za dziesięć lat
  i nie wymagać aktualizacji, gdy komuś skończy się wsparcie dla biblioteki.
- **Komentarze mówią DLACZEGO**, nie co robi kod. Wzorzec: „Kopiujemy, a nie
  robimy dowiązania, bo w maszynie budującej repozytorium aplikacji nie
  istnieje”.
- Barwy siedzą w `:root` w `styl.css` i pochodzą wprost z aplikacji
  (`lib/core/motyw.dart`). Tryb ciemny jest obsłużony — nie psuj go.

## Pliki

| plik | co to |
|---|---|
| `index.html` | strona główna |
| `trasy.html` | lista tras — czyta `dane/trasy/index.json` |
| `prywatnosc.html` | polityka prywatności — **adres podany w App Store Connect** |
| `wsparcie.html` | pomoc i kontakt — **adres podany w App Store Connect** |
| `styl.css` | wygląd, wspólny dla wszystkich stron |
| `narzedzia/synchronizuj-dane.sh` | przynosi dane tras z aplikacji |
| `dane/` | **kopia z aplikacji — nie edytuj ręcznie** |

Polityka prywatności i wsparcie nie są ozdobą: bez tych dwóch adresów Apple
nie wypuści aplikacji do sklepu. Zmieniając je, sprawdź, czy nadal opisują
prawdę o aplikacji.

## Dane z aplikacji

Katalog `dane/` to **kopia**, nie oryginał. Przynosi ją:

```bash
./narzedzia/synchronizuj-dane.sh
```

Kopiowanie idzie w jedną stronę: **aplikacja → strona**. Aplikacja jest
źródłem prawdy. Gdyby dało się edytować opis trasy po stronie WWW, po tygodniu
nikt by nie wiedział, która wersja jest właściwa.

Zawartość `dane/`:

- `trasy/index.json` — spis wszystkich tras ze skróconą metryką
- `trasy/<ID>.json` — pełny opis: punkty etapowe, segmenty, ostrzeżenia
- `slady/<ID>.geojson` — ślad trasy (LineString, ze wysokościami)
- `ilustracje/<ID>.webp` — malowany obrazek trasy (420×260)
- `wyzwania/` + `wyzwania.json` — odznaki PTTK

Jeśli potrzebujesz danych, których skrypt nie kopiuje, dopisz je **do skryptu**,
a nie kopiuj ręcznie — inaczej przy następnej synchronizacji zniknie ślad po
tym, skąd się wzięły.

## Publikacja

`git push` do `main` uruchamia GitHub Actions (`.github/workflows/publikuj.yml`),
które publikuje stronę na GitHub Pages. Nie ma etapu budowania.

Podgląd lokalny — **konieczny**, bo `trasy.html` czyta pliki przez `fetch()`,
a to nie działa po otwarciu pliku z dysku:

```bash
python3 -m http.server 8000
```

---

# Aplikacja mobilna — co warto o niej wiedzieć

Kod: `~/Desktop/Szczawnica/Aplikacja Szlaki` (repozytorium **prywatne**
`siniar1990/Aplikacja-Szlaki`).

Strona stoi osobno właśnie dlatego, że tamto repozytorium jest prywatne, a
GitHub Pages w darmowym planie publikuje wyłącznie z publicznych.

## Czym jest aplikacja

**Szlaki Pienin** — przewodnik po Pieninach i Beskidzie Sądeckim na iOS
i Androida. Flutter + Riverpod + MapLibre. Identyfikator:
`pl.szczawnica.szlakiPienin`. Wersja 1.0.1, w drodze do TestFlight.

Darmowa, bez konta, bez wersji premium i bez reklam firm. Nagrania tras
zostają w telefonie.

Robi ją jedna osoba — właściciel Frankowych Domków i Helenówki w Szczawnicy.
Opisy wielu tras powstały dzięki uprzejmości **PTTK Szczawnica** i są
inspirowane przewodnikiem „Szlaki pełne zdrowia”. **To trzeba oddawać** —
w aplikacji i na stronie.

## Co potrafi

- 53 trasy z opisem krok po kroku, profilem wysokościowym i wskazówkami
- mapa działająca **bez zasięgu** (wektorowa; Teren i Satelita wymagają sieci)
- oficjalne szlaki znakowane z OSM w pięciu barwach
- „Blisko mnie” — trasy wg odległości do **najbliższego punktu szlaku**,
  nie do jego początku
- nawigacja od bieżącej pozycji na szlak, potem szlakiem
- nagrywanie marszu z pauzą, profil wysokościowy, eksport **GPX**
- **Pienińskie wyzwania** — odznaki PTTK: Diament Pienin, Rubin Szczawnicy
  (Szmaragd Dunajca i Korona Pienin czekają na materiały)
- kategorie: krótkie, średnie, długie, niecodzienne, Trzy Korony, z dziećmi,
  rowerowe, Korony Pienin (24 szczyty), z psem

## Rzeczy, o które łatwo się potknąć

- **Metryki wyzwań pochodzą z regulaminów PTTK, nie z naszego pomiaru śladu.**
  Rozbieżności są udokumentowane w `dokumenty/rozbieznosci-wyzwania.md`
  w repozytorium aplikacji. Publikując liczby na stronie, bierz te
  z regulaminu — do nich turysta się porównuje.
- **Nie wymyślaj współrzędnych.** Wszystkie punkty pochodzą z OSM albo
  z pomiarów. Jeśli czegoś brakuje — poszukaj w danych, nie zgaduj.
- Trasa może **nie mieć śladu** (część szczytów Korony Pienin) ani
  **ilustracji**. Kod musi to znosić bez wywracania się.
- Ilustracje są malowane proceduralnie skryptem w aplikacji
  (`tools/ilustracje/sceny.py`), nie rysowane ręcznie.

## Gdzie co leży w aplikacji

```
assets/trasy/          opisy tras + index.json
assets/trasy/gpx/      ślady (GeoJSON)
assets/ilustracje/     malowane obrazki tras
assets/wyzwania/       odznaki PTTK + wyzwania.json
lib/data/models/       model trasy (Kategoria, KolorSzlaku…)
lib/core/motyw.dart    barwy — źródło palety także dla tej strony
CHANGELOG.md           historia wersji
sklep/                 teksty do App Store Connect
dokumenty/             notatki, m.in. rozbieżności w wyzwaniach
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
